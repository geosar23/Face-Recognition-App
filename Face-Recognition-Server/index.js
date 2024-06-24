const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require('knex');
const morgan = require('morgan');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const favicon = require('serve-favicon');
const path = require('path');
require('dotenv').config()
const _ = require('lodash');
const CryptoJS = require("crypto-js");

//SYMMETRIC ENCRYPTION
const secretKey = process.env.SECRET_KEY || "fallbackKey123";

//jwt secret key
const jwtKey = process.env.JWT_SECRET_KEY;

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

// Serve static content from frontend
// app.use(favicon(path.join(__dirname, '../Face-Recognition-Client/public', 'favicon.ico')))
app.use(express.static(path.join(__dirname, '../Face-Recognition-Client/build')))

//Middlewares
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use((req, res, next) => {
    // res.setHeader(
    //     "Content-Security-Policy",
    //     "default-src 'self'; img-src * data:; connect-src *; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    // );
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    next();
});

const tokenChecker = (req, res, next) => {
    // let validToken = false;
    // let userAuthenticated = false;
    const incomingToken = req.headers.authorization;
    jwt.verify(incomingToken, jwtKey, async (err, decoded) => {
        if (err || !decoded) {
            return res.status(401).json('Unauthorized');
        }

        // Token is valid, user is already authenticated 
        // let validToken = true;
        //Check if token is from the same user that is loged in 
        // const tokenUserId = decoded.id;
        // const bodyUserId = req.body.userId;
        // const userAuthenticated = (tokenUserId === bodyUserId);
        return next();
    });
}

//Init Server
app.listen(process.env.SERVER_PORT, '0.0.0.0', () => {
    console.log(`Server online on port ${process.env.SERVER_PORT}`)
});

//Get requests
app.get("/", (req, res) => {
    res.send(`Server is running on port ${process.env.SERVER_PORT}`);
});

app.get("/serverKeys", tokenChecker, async (req, res) => {
    try {
        const keys = {
            CLARIFAI_PAT: process.env.CLARIFAI_PAT,
            CLARIFAI_USER_ID: process.env.CLARIFAI_USER_ID,
            CLARIFAI_APP_ID: process.env.CLARIFAI_APP_ID,
            CLARIFAI_MODEL_ID: process.env.CLARIFAI_MODEL_ID,
            CLARIFAI_MODEL_VERSION_ID: process.env.CLARIFAI_MODEL_VERSION_ID
        }

        const encryptedData = encrypt(keys, secretKey);

        return res.json({ success: true, data: encryptedData });
    } catch (error) {
        console.error(error);
        return res.send({ success: false, message: error.message });
    }
});

app.get("/users", tokenChecker, async (req, res) => {
    try {
        const users = await DB.select('*').from('users');

        if (!users) {
            throw new Error("Users not found");
        }

        return res.json(users)

    } catch (error) {
        console.error(error);
        return res.send({ success: false, message: error.message });
    }
});

app.get("/user/:id", tokenChecker, async (req, res) => {
    try {

        const { id } = req.params;

        const user = await DB.select('*').from('users').where('id', id).first();

        if (!user) {
            throw new Error("User not found");
        }

        return res.json(user)

    } catch (error) {
        console.error(error);
        return res.send({ success: false, message: error.message });
    }
});

// Post requests
app.post("/signin", async (req, res) => {
    try {
        // Check if a token is present in the headers
        const incomingToken = req.headers.authorization;
        if (incomingToken) {
            // Verify the incoming token
            jwt.verify(incomingToken, jwtKey, async (err, decoded) => {
                if (err) {
                    // Token is not valid
                    return res.json({
                        success: false,
                        message: 'Invalid token'
                    });
                }

                // Token is valid, user is already authenticated 
                const userId = decoded.id
                //Fetch user from DB

                const user = await DB.select('*').from('users').where('id', userId).first();

                return res.json({
                    user: user,
                    success: true
                });
            });
        } else {
            // No token in headers, perform regular sign-in logic

            if (!req.body || !req.body.email || !req.body.password) {
                throw new Error("Request parameters are missing");
            }

            const email = req.body.email;
            const password = req.body.password;

            // Check if the user and login entry with the provided email exists in the database
            const user = await DB('users').where({ email }).first();
            const login = await DB('login').where({ email }).first();

            if (!user || !login) {
                return res.json({
                    success: false,
                    message: "Incorrect credentials"
                });
            }

            bcrypt.compare(password, login.hash, async function (err, answer) {
                if (!answer) {
                    return res.json({
                        success: false,
                        message: "Incorrect credentials"
                    });
                }

                // Update the user's entries count
                const updatedUser = { ...user, entries: parseInt(user.entries) + 1 };

                // Update the user's entries count in the database
                await DB('users').where({ email }).update(updatedUser);

                // JWT token sign
                const userId = updatedUser.id
                const newToken = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, { expiresIn: '3h' });

                return res.json({
                    user: updatedUser,
                    token: newToken,
                    success: true
                });
            });
        }

    } catch (error) {
        console.error(error);
        res.send({ success: false, message: error.message });
    }
});

app.post("/register", async (req, res) => {

    try {

        if (!req.body || !req.body.email || !req.body.password || !req.body.name) {
            return res.json({
                success: false,
                message: "Incorrect parameters"
            });
        }

        const { email, name, password } = req.body;

        const userWithEmail = await DB('users').where({ email }).first();
        const userWithName = await DB('users').where({ name }).first();

        if (userWithEmail || userWithName) {
            return res.json({
                success: false,
                message: userWithEmail ? "Email already in use" : "Name already in use"
            });
        }

        const hashedPassword = await hashPassword(password);
        if (!hashedPassword) {
            throw new Error("Password hashing failed");
        }

        let newUser = {
            name: name,
            email: email,
            joined: new Date()
        }

        const newLogin = {
            hash: hashedPassword,
            email: email
        }

        //Knex transactions make sure that if one DB operation fails, 
        //others fail as well so we do not add non completed entries in our database
        await DB.transaction(trx => {

            //Insert new login entry
            trx.insert(newLogin).into('login').returning('email').then((email) => {

                //Insert new user entry
                return trx('users').returning('*').insert(newUser);
            }).then(trx.commit).catch(trx.rollback);
        })

        //Fetch new User and return;
        newUser = await DB('users').where({ email }).first();

        const userId = newUser.id
        const newToken = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, { expiresIn: '3h' });


        return res.json({
            success: true,
            user: newUser,
            token: newToken
        });

    } catch (error) {
        console.error(error);
        return res.send({ success: false, message: error.message });
    }
});

//Put requests
app.put("/user/score", tokenChecker, async (req, res) => {
    try {

        const { id, score } = req.body;

        const user = await DB.select('*').from('users').where('id', id).first();

        if (!user) {
            throw new Error("User not found");
        }

        const updatedScore = parseInt(user.score) + score;

        const updatedUser = { ...user, score: updatedScore };

        // Update the user's entries count in the database
        await DB('users').where({ id }).update(updatedUser);

        return res.json({
            success: true,
            score: updatedScore
        });

    } catch (error) {
        console.error(error);
        return res.send({ success: false, message: error.message });
    }
});

app.put("/user/:id", tokenChecker, async (req, res) => {
    try {

        const { id } = req.params;
        const { name, email, joined, entries, score } = req.body;

        const user = await DB.select('*').from('users').where('id', id).first();

        if (!user) {
            throw new Error("User not found");
        }

        const updatedUser = _.cloneDeep(user);;

        if (name) {
            updatedUser.name = name;
        }

        if (email) {
            updatedUser.email = email;
        }

        if (joined) {
            updatedUser.joined = joined;
        }

        if (entries) {
            updatedUser.entries = entries;
        }

        if (score) {
            updatedUser.score = score;
        }

        await DB('users').where({ id }).update(updatedUser);

        return res.json({
            success: true,
        });

    } catch (error) {
        console.error(error, error.stack, req.body);
        return res.send({ success: false, message: error.message });
    }
});

//Delete Requests
app.delete("/user/:id", tokenChecker, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the user with the given ID exists in the database
        const user = await DB('users').where({ id }).first();

        if (!user) {
            return res.status(404).json("User not found");
        }

        // Delete the user and his login from the database
        await DB('users').where('email', user.email).del();
        await DB('login').where('email', user.email).del();

        return res.json({ success: true });

    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: error.message });
    }
});

// It is important to have this after the rest of the endpoints
if (process.env.NODE_ENV !== 'development') {
    // Fixes react router issue https://ui.dev/react-router-cannot-get-url-refresh/
    app.get('/*', (req, res) => {
        res.sendFile(path.join(__dirname, '../Face-Recognition-Client/build/index.html'), function (err) {
            if (err) {
                throw new Error(err)
            }
        })
    })
}

app.on('error', (error) => {
    console.error(error)
});


//Helper functions
function hashPassword(password) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, null, null, (err, hash) => {
            if (err) {
                reject(err);
            } else {
                resolve(hash);
            }
        });
    });
}

function encrypt(data, secretKey) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
}

const sanitizeUserEmail = (email) => {

}

// //---------------------------------------------------------
// bcrypt.hash("bacon", null, null, function(err, hash) {
//     // Store hash in your password DB.
// });

// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });