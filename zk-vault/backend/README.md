# Zero-Knowledge Vault — Backend

Express.js API server for the Zero-Knowledge Vault prototype. Handles encrypted file storage and trapdoor-based searchable encryption.

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env if needed (defaults work out of the box)
```

### 3. Run the Server

```bash
# Standard start
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

The server will start on `http://localhost:3001` by default.

### 4. Verify It's Running

Open your browser or use curl:
```bash
curl http://localhost:3001/api/health
```

## Running from Project Root

If you prefer running from the project root (e.g., VS Code terminal defaults to the root):

```bash
# From zk-vault/ root directory
node backend/server.js
```

This works because the server resolves `.env` relative to its own directory (`__dirname`), not your current working directory.

## Running Frontend + Backend Together

You need **two terminals**:

| Terminal | Directory         | Command        |
| -------- | ----------------- | -------------- |
| 1        | `zk-vault/backend`| `npm run dev`  |
| 2        | `zk-vault/`       | `npm run dev`  |

## Environment Variables

| Variable      | Default                                          | Description                     |
| ------------- | ------------------------------------------------ | ------------------------------- |
| `PORT`        | `3001`                                           | Server port                     |
| `CORS_ORIGIN` | `http://localhost:5173,http://localhost:3000`     | Allowed frontend origins (CSV)  |
| `NODE_ENV`    | `development`                                    | Environment mode                |

## API Endpoints

| Method | Endpoint             | Description                            |
| ------ | -------------------- | -------------------------------------- |
| POST   | `/api/keys/generate` | Initialize vault session (RSA + Km)    |
| GET    | `/api/keys/session/:id` | Verify session exists               |
| POST   | `/api/files/upload`  | Upload encrypted file (multipart)      |
| POST   | `/api/files/upload-json` | Upload encrypted file (JSON body)  |
| GET    | `/api/files`         | List encrypted file metadata           |
| GET    | `/api/files/:id`     | Download encrypted file                |
| DELETE | `/api/files/:id`     | Delete file + cleanup index            |
| POST   | `/api/search`        | Search by trapdoor token               |
| POST   | `/api/search/multi`  | Multi-trapdoor search (Boolean AND)    |
| GET    | `/api/health`        | Health check + vault stats             |
