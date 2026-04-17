# Zero-Knowledge Vault API Endpoints

This document outlines the backend API endpoints exposed by the Zero-Knowledge Vault application. The API is designed so that the server never has access to plaintext file contents, original filenames, search keywords, or the unencrypted master key.

## Base URL
All API requests are expected to be prefixed with `/api`.

---

## 1. Health & Server Status

### `GET /api/health`
Checks the server health and returns vault statistics.
- **Response:**
  ```json
  {
    "status": "ok",
    "service": "Zero-Knowledge Vault",
    "uptime": 123.45,
    "vault": {
      "totalFiles": 10,
      "totalTrapdoors": 50,
      /* other stats */
    }
  }
  ```

---

## 2. Authentication & Key Management (Mounted at `/api/keys`)

### `POST /api/keys/generate`
Initializes a new vault session. Generates an RSA key pair and a Master Key (Km). Wraps Km with the public key and stores the wrapped key on the server.
- **Request Body:** None
- **Response:** Returns the `sessionId`, `privateKey` (for client only), `masterKey` (hex), `wrappedKm`, and `publicKey`.

### `GET /api/keys/session/:id`
Verifies if a specific session exists.
- **Path Parameters:**
  - `id`: The session identifier (`sessionId`).
- **Response:** Returns session creation time and whether it has a wrapped key.

---

## 3. File Operations (Mounted at `/api/files`)

### `POST /api/files/upload`
Uploads an encrypted file along with trapdoor tokens (multipart/form-data).
- **Request Body (FormData):** 
  - `file`: The encrypted file buffer.
  - `encryptedName`: AES-encrypted original filename.
  - `iv`: IV used for file encryption.
  - `authTag`: GCM auth tag.
  - `trapdoors`: JSON array of HMAC trapdoor tokens.
  - `sessionId`: The session identifier.
- **Response:** Returns file `id`, `uploadedAt`, and `trapdoorCount`.

### `POST /api/files/upload-json`
Uploads an encrypted file as a JSON payload (simpler for demo environments).
- **Request Body (JSON):** Contains `encryptedData` (base64 or string), `encryptedName`, `iv`, `authTag`, `trapdoors` array, `sessionId`, and `originalSize`.
- **Response:** Same details as `/upload`.

### `GET /api/files`
Lists metadata for all encrypted files in a session.
- **Query Parameters:**
  - `sessionId`: Filter the list to files belonging to this session.
- **Response:** JSON object with `data` containing an array of file metadata, and the `count` of files.

### `GET /api/files/:id`
Downloads the encrypted file contents along with encryption metadata.
- **Path Parameters:**
  - `id`: The file identifier.
- **Response:** Returns `id`, `encryptedName`, `encryptedData`, `iv`, `authTag`, `originalSize`, and `uploadedAt`.

### `DELETE /api/files/:id`
Deletes an encrypted file and cleans up its associated trapdoor index entries.
- **Path Parameters:**
  - `id`: The file identifier.
- **Response:** Success message upon deletion.

---

## 4. Search Operations (Mounted at `/api/search`)

### `POST /api/search`
Searches the encrypted index with a single trapdoor token. The server evaluates the match against its inverted index without learning the plaintext keyword.
- **Request Body:**
  - `trapdoor`: HMAC token representing the keyword.
  - `sessionId`: The session identifier.
- **Response:** Returns the matching file metadata in `matches`, a `count`, the `searchTimeMs`, and partial `trapdoorUsed`.

### `POST /api/search/multi`
Searches using multiple trapdoor tokens, returning only files that contain ALL terms (Boolean AND operation).
- **Request Body:**
  - `trapdoors`: Array of HMAC tokens representing keywords.
  - `sessionId`: The session identifier.
- **Response:** Returns intersection of matched file metadata in `matches`, `count`, `searchTimeMs`, and `trapdoorsUsed` count.
