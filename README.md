# Face Recognition App

A full-stack face detection app built with React, Node/Express, and PostgreSQL.

Face detection runs **entirely in the browser** using [`@vladmandic/face-api`](https://github.com/vladmandic/face-api) — no third-party API keys or credits required. Images never leave the user's device for analysis.

---

## Architecture overview

```
┌─────────────────────────────────────────────────────┐
│  Browser (React)                                    │
│                                                     │
│  @vladmandic/face-api  ←  model weights (jsDelivr) │
│         ↓ runs TinyFaceDetector locally             │
│  bounding boxes drawn on image                      │
│                                                     │
│  POST /proxy/image  →  Express server               │
│    (fetch cross-origin images without CORS issues)  │
│                                                     │
│  PUT  /user/score   →  Express server  →  Postgres  │
└─────────────────────────────────────────────────────┘
```

### Why no Clarifai?

The app originally used the Clarifai face-detection API. Clarifai removed their free tier — all API calls now require paid credits. The app was migrated to `@vladmandic/face-api`, a maintained, webpack-5 compatible fork of face-api.js that runs TensorFlow.js in the browser:

- **Free** — no API key, no credits, no usage limits
- **Private** — images are processed locally, never sent to a third-party server
- **Offline-capable** — model weights are cached by the browser after first load (~190 KB)

---

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

The server reads config from `Face-Recognition-Server/.env`. Required variables:

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
```

> No Clarifai variables are needed anymore.

---

### 3. Start the client

```bash
cd Face-Recognition-Client
npm install       # first time only
npm start         # runs React dev server on port 3001
```

The client proxies all API calls to `http://127.0.0.1:5000` (configured in `package.json`).

Open [http://localhost:3001](http://localhost:3001) in your browser.

On first load the TinyFaceDetector model weights (~190 KB) are fetched from jsDelivr CDN and cached by the browser. Subsequent loads are instant.

---

## How face detection works

1. User submits an image URL or uploads a file
2. **URL path:** the server proxies the image via `POST /proxy/image` (bypasses browser CORS restrictions on cross-origin images), returning raw bytes
3. **File path:** the file is read directly from disk via the File API
4. The client creates an `<img>` element from a local blob URL
5. `faceapi.detectAllFaces()` runs the TinyFaceDetector model on the image element
6. Detected bounding boxes are scaled to the 500 px display width and drawn as overlays
7. If faces are found, `PUT /user/score` updates the user's score in the database

---

## Project Structure

```
Face-Recognition-App/
├── Face-Recognition-Client/       # React frontend (port 3001)
│   └── src/
│       ├── App.js                 # Main logic, face detection orchestration
│       ├── helpers/
│       │   └── clarifai.js        # localStorage dedup helpers (Clarifai-free)
│       └── components/
│           └── FaceRecognition/   # Bounding box overlay renderer
└── Face-Recognition-Server/       # Express API server (port 5000)
    ├── index.js                   # All routes: auth, user CRUD, image proxy
    └── .env                       # DB credentials and secrets (not committed)
```

