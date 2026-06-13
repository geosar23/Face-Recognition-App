const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const knex = require('knex');
const morgan = require('morgan');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const path = require('path');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const secretKey = process.env.SECRET_KEY;
const jwtKey = process.env.JWT_SECRET_KEY;

// Crash on startup if required secrets are not set
if (!secretKey || !jwtKey) {
    console.error("FATAL: SECRET_KEY and JWT_SECRET_KEY environment variables must be set.");
    process.exit(1);
}

//Connect to DB
const DB = knex({
    client: 'pg',
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    }
});

const app = express();

// Trust the first proxy (needed for express-rate-limit when behind a proxy / dev server)
app.set('trust proxy', 1);

// Serve static content from frontend
app.use(express.static(path.join(__dirname, '../Face-Recognition-Client/build')));

// Rate limiter for auth endpoints (20 requests per 15 min)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

const isProduction = process.env.NODE_ENV === 'production';
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

// Middlewares
app.use(helmet());
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(bodyParser.json({ limit: '10mb' })); // 10mb allows base64 image uploads
app.use(cookieParser());
app.use(morgan('dev'));

// httpOnly cookie options — tokens are never accessible from JS
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 3 * 60 * 60 * 1000 // 3 hours
};

// Auth middleware — reads JWT from httpOnly cookie, attaches userId to request
const tokenChecker = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
    jwt.verify(token, jwtKey, (err, decoded) => {
        if (err || !decoded) return res.status(401).json({ success: false, message: 'Unauthorized' });
        req.userId = decoded.id;
        return next();
    });
};

//Init Server
app.listen(process.env.SERVER_PORT, '0.0.0.0', () => {
    console.log(`Server online on port ${process.env.SERVER_PORT}`);
});

//Get requests
app.get("/", (req, res) => {
    res.send(`Server is running`);
});

// GET /users — password excluded from response (TODO: restrict to admin role)
app.get("/users", tokenChecker, async (req, res) => {
    try {
        const users = await DB.select('id', 'name', 'email', 'entries', 'score', 'joined').from('users');
        return res.json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /user/:id — users can only fetch their own profile
app.get("/user/:id", tokenChecker, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (req.userId !== id) return res.status(403).json({ success: false, message: 'Forbidden' });

        const user = await DB
            .select('id', 'name', 'email', 'entries', 'score', 'joined')
            .from('users')
            .where('id', id)
            .first();

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /signin — cookie-based auth; re-auth from existing cookie or standard credential login
app.post("/signin", authLimiter, async (req, res) => {
    try {
        // Re-authenticate from existing httpOnly cookie
        const existingToken = req.cookies.token;
        if (existingToken) {
            return jwt.verify(existingToken, jwtKey, async (err, decoded) => {
                if (err || !decoded) {
                    res.clearCookie('token', COOKIE_OPTIONS);
                    return res.json({ success: false, message: 'Invalid token' });
                }
                const user = await DB
                    .select('id', 'name', 'email', 'entries', 'score', 'joined')
                    .from('users')
                    .where('id', decoded.id)
                    .first();
                return res.json({ user, success: true });
            });
        }

        // Regular credential sign-in
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Request parameters are missing' });
        }

        if (typeof email !== 'string' || email.length > 254 ||
            typeof password !== 'string' || password.length > 128) {
            return res.status(400).json({ success: false, message: 'Invalid input' });
        }

        const user = await DB('users').where({ email }).first();
        const login = await DB('login').where({ email }).first();

        if (!user || !login) {
            return res.json({ success: false, message: 'Incorrect credentials' });
        }

        const match = await bcrypt.compare(password, login.hash);
        if (!match) {
            return res.json({ success: false, message: 'Incorrect credentials' });
        }

        const updatedEntries = parseInt(user.entries) + 1;
        await DB('users').where({ email }).update({ entries: updatedEntries });

        const newToken = jwt.sign({ id: user.id }, jwtKey, { expiresIn: '3h' });
        res.cookie('token', newToken, COOKIE_OPTIONS);

        const { password: _pw, ...safeUser } = { ...user, entries: updatedEntries };
        return res.json({ user: safeUser, success: true });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /signout — clears the auth cookie
app.post("/signout", (req, res) => {
    res.clearCookie('token', COOKIE_OPTIONS);
    return res.json({ success: true });
});

// POST /register — server-side validation + cookie on success
app.post("/register", authLimiter, async (req, res) => {
    try {
        const { email, name, password } = req.body || {};

        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Input length limits
        if (typeof email !== 'string' || email.length > 254 ||
            typeof name !== 'string' || name.length < 2 || name.length > 100 ||
            typeof password !== 'string' || password.length > 128) {
            return res.status(400).json({ success: false, message: 'Invalid input' });
        }

        // Email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        // Password complexity (mirrors client-side validation)
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters with uppercase, lowercase, and a number'
            });
        }

        const userWithEmail = await DB('users').where({ email }).first();
        const userWithName = await DB('users').where({ name }).first();

        if (userWithEmail || userWithName) {
            return res.json({
                success: false,
                message: userWithEmail ? 'Email already in use' : 'Name already in use'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = { name, email, joined: new Date() };
        const newLogin = {
            hash: hashedPassword,
            email: email
        }

        //Knex transactions ensure both inserts succeed or both fail
        await DB.transaction(async trx => {
            await trx.insert(newLogin).into('login');
            await trx('users').insert(newUser);
        });

        const createdUser = await DB
            .select('id', 'name', 'email', 'entries', 'score', 'joined')
            .from('users')
            .where({ email })
            .first();

        const newToken = jwt.sign({ id: createdUser.id }, jwtKey, { expiresIn: '3h' });
        res.cookie('token', newToken, COOKIE_OPTIONS);

        return res.json({ success: true, user: createdUser });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//Put requests
// PUT /user/score — users can only update their own score
app.put("/user/score", tokenChecker, async (req, res) => {
    try {
        const { id, score } = req.body;
        if (req.userId !== parseInt(id, 10)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const user = await DB.select('score').from('users').where('id', id).first();
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const updatedScore = parseInt(user.score) + score;
        await DB('users').where({ id }).update({ score: updatedScore });

        return res.json({ success: true, score: updatedScore });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /user/:id — users can only edit their own account
app.put("/user/:id", tokenChecker, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (req.userId !== id) return res.status(403).json({ success: false, message: 'Forbidden' });

        const { name, email, joined, entries, score } = req.body;

        const user = await DB.select('*').from('users').where('id', id).first();
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const updatedUser = { ...user };
        if (name !== undefined) updatedUser.name = name;
        if (email !== undefined) updatedUser.email = email;
        if (joined !== undefined) updatedUser.joined = joined;
        if (entries !== undefined) updatedUser.entries = entries;
        if (score !== undefined) updatedUser.score = score;

        await DB('users').where({ id }).update(updatedUser);
        return res.json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//Delete Requests
// DELETE /user/:id — users can only delete their own account
app.delete("/user/:id", tokenChecker, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (req.userId !== id) return res.status(403).json({ success: false, message: 'Forbidden' });

        const user = await DB('users').where({ id }).first();
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await DB('users').where('email', user.email).del();
        await DB('login').where('email', user.email).del();

        res.clearCookie('token', COOKIE_OPTIONS);
        return res.json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /predict/url — proxy Clarifai call server-side (keeps API keys off the client)
app.post("/predict/url", tokenChecker, async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl || typeof imageUrl !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid image URL' });
        }

        const raw = JSON.stringify({
            user_app_id: {
                user_id: process.env.CLARIFAI_USER_ID,
                app_id: process.env.CLARIFAI_APP_ID
            },
            inputs: [{ data: { image: { url: imageUrl } } }]
        });

        const response = await fetch('https://api.clarifai.com/v2/models/face-detection/outputs', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Key ' + process.env.CLARIFAI_PAT
            },
            body: raw
        });

        const data = await response.json();
        return res.json(data);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /predict/file — proxy Clarifai call server-side (keeps API keys off the client)
app.post("/predict/file", tokenChecker, async (req, res) => {
    try {
        const { imageBytes } = req.body;
        if (!imageBytes || typeof imageBytes !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid image data' });
        }

        const raw = JSON.stringify({
            user_app_id: {
                user_id: process.env.CLARIFAI_USER_ID,
                app_id: process.env.CLARIFAI_APP_ID
            },
            inputs: [{ data: { image: { base64: imageBytes } } }]
        });

        const response = await fetch('https://api.clarifai.com/v2/models/face-detection/outputs', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Key ' + process.env.CLARIFAI_PAT
            },
            body: raw
        });

        const data = await response.json();
        return res.json(data);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Catch-all for React Router — must be after all API routes
if (process.env.NODE_ENV !== 'development') {
    app.get('/*', (req, res) => {
        res.sendFile(path.join(__dirname, '../Face-Recognition-Client/build/index.html'), function (err) {
            if (err) res.status(500).send('Server error: client build not found. Run `npm run build` in the client directory.');
        });
    });
}

app.on('error', (error) => {
    console.error(error);
});