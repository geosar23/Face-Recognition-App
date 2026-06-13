# Face Recognition App
API key is deprecated
app is too simple to bother, used to be cool in the early days of AI and image recognition models. Now seems kinda dumb 
A full-stack face detection app built with React, Node/Express, and PostgreSQL.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) (for DB tunnel)
- A Fly.io account with access to the `face-recognition-pg` app

---

## Running Locally

### 1. Tunnel the production database

The database runs on Fly.io's private network and is not publicly accessible. Open a dedicated terminal and keep this running the entire time you develop:

```bash
fly proxy 5432 -a face-recognition-pg
```

This forwards `localhost:5432` → `face-recognition-pg.flycast:5432` through Fly's WireGuard tunnel.

---

### 2. Start the server

```bash
cd Face-Recognition-Server
npm install       # first time only
npm start         # runs nodemon index.js on port 5000
```

The server reads config from `Face-Recognition-Server/.env`. Ensure it contains:

```
SERVER_PORT = 5000
NODE_ENV = development

DB_HOST = '127.0.0.1'
DB_PORT = 5432
DB_USER = 'postgres'
DB_PASSWORD = <password>
DB_NAME = 'postgres'

JWT_SECRET_KEY = <secret>
SECRET_KEY = <secret>
CLARIFAI_PAT = <pat>
```

---

### 3. Start the client

```bash
cd Face-Recognition-Client
npm install       # first time only
npm start         # runs React dev server on port 3000
```

The client proxies all API calls to `http://127.0.0.1:5000` (configured in `package.json`).

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
Face-Recognition-App/
├── Face-Recognition-Client/   # React frontend (port 3000)
└── Face-Recognition-Server/   # Express API server (port 5000)
```

