# Zero-Knowledge Vault: Technology Stack Architecture

## Overview
The **Zero-Knowledge Vault** is built on a modern, robust, and highly secure technology stack. The architecture is explicitly designed to support the **Zero-Knowledge Architecture** principles, fundamentally ensuring that the server acts simply as a dumb storage mechanism and query evaluator—never having access to plaintext keys, files, or search intents. 

Below is an overview of the tools, libraries, and frameworks utilized across the Frontend and Backend layers, alongside the cryptographic strategies we employed.

---

## 1. Cryptographic Principles (Node.js Native `crypto`)
To maximize footprint efficiency and security, we deliberately avoided third-party cryptographic libraries and instead utilized Node.js's native `crypto` module. This provides highly optimized, low-level cryptographic functions via OpenSSL.

- **Asymmetric Encryption (RSA-OAEP):** 
  - Used for the initial key exchange. We generate a 2048-bit RSA key pair during session initialization. The private key never leaves the client's local memory, and the public key wraps the symmetric Master Key (Km) to securely store its encrypted state on the server.
- **Symmetric Encryption (AES-256-GCM):**
  - Used for encrypting the actual file contents and filenames. AES-GCM (Galois/Counter Mode) provides Authenticated Encryption with Associated Data (AEAD), ensuring the confidentiality and integrity of the data. Even a single bit-flip is detected.
- **Trapdoor Generation (HMAC-SHA256):**
  - Used for Searchable Symmetric Encryption (SSE). Instead of sending plaintext keywords, the client derives deterministic Hash-based Message Authentication Codes (HMACs) using the master key. The server stores these "trapdoors" in an inverted index to filter matching file structures blindly.

---

## 2. Backend Infrastructure

The backend is engineered for high performance, statelessness, and explicit lack-of-knowledge.

- **Runtime:** Node.js using ES Modules (`type: "module"`)
  - Ensures a modern, standardized module system across the server.
- **Framework:** Express.js (`express ^4.22`)
  - A minimalist web framework chosen to handle RESTful APIs, routing, and HTTP middleware securely without unnecessary overhead.
- **File Parsing:** Multer (`multer ^1.4.5-lts`)
  - Handled via `multer.memoryStorage()`. Since files arrive entirely encrypted via the browser, we parse the blobs safely in memory to inject them into our storage engine without writing vulnerable temp files to the disk.
- **Middleware & Utility:** 
  - `cors`: strict Cross-Origin Resource Sharing rules.
  - `morgan`: API request logging.
  - `uuid`: Collision-free unique identifiers for vault sessions (`v4`).
  - `dotenv`: Environment variable and configuration management.

---

## 3. Frontend Application

The frontend client acts as the central execution engine for all the cryptographic logic. By shifting encryption overhead to the client, we achieve end-to-end true Zero-Knowledge infrastructure. 

- **Framework:** React 19 (`react ^19.2`, `react-dom ^19.2`)
  - Utilized for dynamic rendering and managing the complex UI state involved in holding temporary private keys, master keys, and file processing logic.
- **Build Tooling:** Vite (`vite ^8.0`)
  - Selected over legacy bundlers for its instant Hot Module Replacement (HMR) and significantly faster bundling, enabling rapid development of complex cryptographic browser interactions.
- **Styling:** Vanilla CSS (`index.css`)
  - Implemented cleanly via custom CSS variables without bloated aesthetic frameworks. We maintain maximum control over our cybersecurity-themed aesthetics (dark modes, glassmorphism, glowing accents) explicitly tailored for presentation impact.
- **Linting & Code Quality:** ESLint (`eslint ^9`)
  - Maintained with strict, modern React specific configurations to ensure bug-free, safe Javascript compilation.

---

## 4. API Architecture

The backend exposes a secure REST API explicitly designed to enforce the zero-knowledge constraint. It never receives plaintext content or keys.

- **Authentication (`/api/keys`):** 
  - Bootstraps vault sessions. Generates RSA keypairs and the AES Master Key. The backend mathematically wraps the Master Key with the RSA public key before saving it, returning the private key to the client exclusively.
- **File Management (`/api/files`):** 
  - Ingests and serves symmetrically encrypted file fragments (via multipart or JSON). It stores the AES-GCM ciphertext, initialization vectors (IVs), and authentication tags alongside trapdoor arrays.
- **Encrypted Search (`/api/search`):** 
  - Evaluates search queries using HMAC trapdoors. The server matches these trapdoors (single tokens or multi-token Boolean AND operations) against its inverted index, finding matching files without ever learning the underlying plaintext keyword.

---

## Summary for the Judges
Our technology stack was specifically selected not just for development speed, but to strictly enforce the rules of a **True Zero-Knowledge Protocol**. 
- We keep the **Frontend entirely stateful regarding keys**, performing computationally heavy AES/RSA encryptions in the browser. 
- We keep the **Backend absolutely stateless regarding knowledge**, functioning only as a fast Express.js inverted-index graph and raw cipher-blob storage. 

This separation of concerns guarantees mathematically proven data privacy by design.
