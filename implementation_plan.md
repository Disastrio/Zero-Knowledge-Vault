# Zero-Knowledge Vault — Backend Implementation

Backend for the ZK Vault hackathon prototype. Real cryptographic operations (RSA, AES-256-GCM, HMAC trapdoors) with in-memory storage to keep dependencies minimal.

## Proposed Changes

### Backend Server (`backend/`)

#### [NEW] `backend/package.json`
Express + Node crypto. Dependencies: `express`, `cors`, `multer` (file uploads), `uuid`.

#### [NEW] `backend/server.js`
Express entry point. CORS enabled for frontend at `:5173`. Mounts route modules.

#### [NEW] `backend/lib/crypto.js`
Core cryptographic utilities using Node's built-in `crypto` module:
- **RSA Key Pair Generation** — `generateKeyPair()` → `{ publicKey, privateKey }`
- **Master Key (Km)** — `generateMasterKey()` → random 256-bit AES key
- **Km Wrapping** — `wrapKey(Km, publicKey)` / `unwrapKey(wrappedKm, privateKey)` via RSA-OAEP
- **File Encryption** — `encryptFile(buffer, Km)` / `decryptFile(encrypted, Km)` via AES-256-GCM
- **Trapdoor Generation** — `generateTrapdoor(Km, keyword)` → `HMAC-SHA256(Km, keyword)`

#### [NEW] `backend/lib/storage.js`
In-memory store simulating a database:
- `files` Map — stores `{ id, encryptedName, encryptedData, iv, authTag, size, uploadedAt }`
- `index` Map — inverted index mapping `trapdoor → Set<fileId>`
- CRUD methods: `addFile()`, `deleteFile()`, `searchByTrapdoor()`, `getFile()`

#### [NEW] `backend/routes/auth.js`
- `POST /api/keys/generate` — Generate RSA pair + Km, wrap Km, return `{ publicKey, wrappedKm }` (private key returned to client, never stored on server)

#### [NEW] `backend/routes/files.js`
- `POST /api/files/upload` — Accept encrypted file + trapdoors, store in vault
- `GET /api/files` — List all encrypted file metadata (no plaintext)
- `GET /api/files/:id` — Download encrypted file
- `DELETE /api/files/:id` — Remove file + update index

#### [NEW] `backend/routes/search.js`
- `POST /api/search` — Accept trapdoor token, match against inverted index, return matching file IDs

---

### Frontend Integration (`src/`)

#### [MODIFY] `App.jsx`
- Connect demo section to real backend APIs
- Add key generation flow on "Get Started"
- Wire upload button to actual encrypted file upload
- Replace mock search with real trapdoor-based API calls

## Verification Plan

### Automated Tests
- Start backend with `node server.js`
- Test key generation: `POST /api/keys/generate`
- Test file upload with encryption
- Test trapdoor search returns correct matches
- Test file deletion removes from index
