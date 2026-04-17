/**
 * Zero-Knowledge Vault — In-Memory Storage Layer
 *
 * Simulates a database for the hackathon prototype.
 * Stores encrypted files and maintains an inverted index
 * mapping trapdoors → file IDs for searchable encryption.
 *
 * IMPORTANT: The server NEVER sees plaintext data, keywords, or
 * the master key. It only stores:
 *   - Encrypted file blobs (AES-256-GCM ciphertext)
 *   - Trapdoor tokens (HMAC-SHA256 hashes)
 *   - Encrypted file metadata
 */

import { v4 as uuidv4 } from 'uuid';

class VaultStorage {
  constructor() {
    // Map<fileId, FileRecord>
    this.files = new Map();

    // Inverted index: Map<trapdoor, Set<fileId>>
    this.index = new Map();

    // Session keys: Map<sessionId, { wrappedKm, publicKey }>
    // Server stores wrapped Km but CANNOT decrypt it (no private key)
    this.sessions = new Map();
  }

  // ─── Session Management ───

  createSession(sessionId, wrappedKm, publicKey) {
    this.sessions.set(sessionId, {
      wrappedKm,
      publicKey,
      createdAt: new Date().toISOString(),
    });
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  // ─── File Storage ───

  addFile({ encryptedData, iv, authTag, encryptedName, originalSize, trapdoors, sessionId }) {
    const fileId = uuidv4();
    const record = {
      id: fileId,
      encryptedName,     // Encrypted original filename
      encryptedData,     // AES-256-GCM ciphertext (base64)
      iv,                // Initialization vector (base64)
      authTag,           // GCM authentication tag (base64)
      originalSize,      // Original file size in bytes
      sessionId,
      uploadedAt: new Date().toISOString(),
    };

    this.files.set(fileId, record);

    // Update inverted index with trapdoors
    if (trapdoors && Array.isArray(trapdoors)) {
      for (const trapdoor of trapdoors) {
        if (!this.index.has(trapdoor)) {
          this.index.set(trapdoor, new Set());
        }
        this.index.get(trapdoor).add(fileId);
      }
    }

    return { id: fileId, uploadedAt: record.uploadedAt };
  }

  getFile(fileId) {
    return this.files.get(fileId) || null;
  }

  listFiles(sessionId) {
    const files = [];
    for (const [, record] of this.files) {
      if (!sessionId || record.sessionId === sessionId) {
        files.push({
          id: record.id,
          encryptedName: record.encryptedName,
          originalSize: record.originalSize,
          uploadedAt: record.uploadedAt,
        });
      }
    }
    return files;
  }

  deleteFile(fileId) {
    const record = this.files.get(fileId);
    if (!record) return false;

    // Remove from inverted index
    for (const [trapdoor, fileIds] of this.index) {
      fileIds.delete(fileId);
      if (fileIds.size === 0) {
        this.index.delete(trapdoor);
      }
    }

    this.files.delete(fileId);
    return true;
  }

  // ─── Searchable Encryption Index ───

  searchByTrapdoor(trapdoor) {
    const fileIds = this.index.get(trapdoor);
    if (!fileIds || fileIds.size === 0) return [];

    const results = [];
    for (const fileId of fileIds) {
      const record = this.files.get(fileId);
      if (record) {
        results.push({
          id: record.id,
          encryptedName: record.encryptedName,
          originalSize: record.originalSize,
          uploadedAt: record.uploadedAt,
        });
      }
    }
    return results;
  }

  // ─── Stats ───

  getStats() {
    return {
      totalFiles: this.files.size,
      totalTrapdoors: this.index.size,
      totalSessions: this.sessions.size,
    };
  }
}

// Singleton instance
const storage = new VaultStorage();
export default storage;
