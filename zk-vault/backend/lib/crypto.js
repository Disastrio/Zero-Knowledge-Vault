/**
 * Zero-Knowledge Vault — Cryptographic Utilities
 *
 * Real implementations using Node.js built-in crypto module:
 *   - RSA-OAEP key pair generation & key wrapping
 *   - AES-256-GCM symmetric file encryption
 *   - HMAC-SHA256 trapdoor generation for SSE
 */

import crypto from 'crypto';

// ─── RSA Key Pair Generation ───
export function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

// ─── Master Key (Km) Generation ───
export function generateMasterKey() {
  return crypto.randomBytes(32); // 256-bit AES key
}

// ─── Wrap Km with RSA public key (RSA-OAEP) ───
export function wrapKey(masterKey, publicKeyPem) {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    masterKey
  );
  return encrypted.toString('base64');
}

// ─── Unwrap Km with RSA private key ───
export function unwrapKey(wrappedKeyBase64, privateKeyPem) {
  const wrappedBuffer = Buffer.from(wrappedKeyBase64, 'base64');
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    wrappedBuffer
  );
  return decrypted;
}

// ─── AES-256-GCM File Encryption ───
export function encryptData(dataBuffer, masterKey) {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(dataBuffer),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

// ─── AES-256-GCM File Decryption ───
export function decryptData(encryptedBase64, ivBase64, authTagBase64, masterKey) {
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const encryptedData = Buffer.from(encryptedBase64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);
  return decrypted;
}

// ─── HMAC-SHA256 Trapdoor Generation (SSE) ───
export function generateTrapdoor(masterKey, keyword) {
  const normalizedKeyword = keyword.toLowerCase().trim();
  return crypto
    .createHmac('sha256', masterKey)
    .update(normalizedKeyword)
    .digest('hex');
}

// ─── Extract keywords from filename ───
export function extractKeywords(filename) {
  // Remove extension, split by common delimiters
  const name = filename.replace(/\.[^.]+$/, '');
  const words = name
    .split(/[_\-\s.]+/)
    .map(w => w.toLowerCase().trim())
    .filter(w => w.length > 1);
  return [...new Set(words)];
}
