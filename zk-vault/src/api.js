/**
 * Zero-Knowledge Vault — Client-Side Crypto & API Layer
 *
 * All encryption/decryption happens HERE in the browser.
 * The server NEVER receives plaintext data or the master key.
 *
 * Uses the Web Crypto API for:
 *   - AES-256-GCM file encryption
 *   - HMAC-SHA256 trapdoor generation
 */

const API_BASE = 'http://localhost:3001/api';

// ─── Utility: hex string ↔ ArrayBuffer ───
function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── Import Master Key for Web Crypto ───
async function importMasterKey(hexKey) {
  const keyBuffer = hexToBuffer(hexKey);
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

async function importHmacKey(hexKey) {
  const keyBuffer = hexToBuffer(hexKey);
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

// ─── Client-Side AES-256-GCM Encryption ───
async function encryptFile(fileBuffer, masterKeyHex) {
  const key = await importMasterKey(masterKeyHex);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBuffer
  );

  // GCM appends auth tag to ciphertext — last 16 bytes
  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16);
  const authTag = encryptedArray.slice(encryptedArray.length - 16);

  return {
    encryptedData: bufferToBase64(ciphertext.buffer),
    iv: bufferToBase64(iv.buffer),
    authTag: bufferToBase64(authTag.buffer),
  };
}

// ─── Client-Side AES-256-GCM Decryption ───
async function decryptFile(encryptedBase64, ivBase64, authTagBase64, masterKeyHex) {
  if (!masterKeyHex) throw new Error('Master key is missing — cannot decrypt');
  if (!encryptedBase64) throw new Error('No encrypted data received from server');
  if (!ivBase64) throw new Error('No IV received from server');
  if (!authTagBase64) throw new Error('No auth tag received from server');

  console.log('[ZK-Vault] Decrypting file client-side...');
  console.log('[ZK-Vault] Ciphertext length (base64):', encryptedBase64.length);
  console.log('[ZK-Vault] IV length (base64):', ivBase64.length);
  console.log('[ZK-Vault] AuthTag length (base64):', authTagBase64.length);

  const key = await importMasterKey(masterKeyHex);
  const iv = new Uint8Array(base64ToBuffer(ivBase64));
  const ciphertext = new Uint8Array(base64ToBuffer(encryptedBase64));
  const authTag = new Uint8Array(base64ToBuffer(authTagBase64));

  console.log('[ZK-Vault] Ciphertext bytes:', ciphertext.length);
  console.log('[ZK-Vault] IV bytes:', iv.length);
  console.log('[ZK-Vault] AuthTag bytes:', authTag.length);

  // Reconstruct: ciphertext + authTag
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext);
  combined.set(authTag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    combined.buffer
  );

  console.log('[ZK-Vault] ✓ Decryption successful. Plaintext bytes:', decrypted.byteLength);
  return decrypted;
}

// ─── Client-Side HMAC Trapdoor Generation ───
async function generateTrapdoor(masterKeyHex, keyword) {
  const key = await importHmacKey(masterKeyHex);
  const encoder = new TextEncoder();
  const data = encoder.encode(keyword.toLowerCase().trim());

  const signature = await crypto.subtle.sign('HMAC', key, data);
  return bufferToHex(signature);
}

// ─── Extract keywords from filename ───
function extractKeywords(filename) {
  const name = filename.replace(/\.[^.]+$/, '');
  const words = name
    .split(/[_\-\s.]+/)
    .map(w => w.toLowerCase().trim())
    .filter(w => w.length > 1);
  return [...new Set(words)];
}

// ─── Encrypt a string (for filename encryption) ───
async function encryptString(text, masterKeyHex) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  return await encryptFile(data, masterKeyHex);
}

// ─── Decrypt a string ───
async function decryptString(encryptedBase64, ivBase64, authTagBase64, masterKeyHex) {
  const decrypted = await decryptFile(encryptedBase64, ivBase64, authTagBase64, masterKeyHex);
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// ═══════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════

// ─── Initialize vault (generate keys) ───
export async function initializeVault() {
  const res = await fetch(`${API_BASE}/keys/generate`, { method: 'POST' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

// ─── Upload file (client-side encryption → server storage) ───
export async function uploadFile(file, masterKeyHex, sessionId) {
  // 1. Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();

  // 2. Encrypt file content client-side
  const { encryptedData, iv, authTag } = await encryptFile(fileBuffer, masterKeyHex);

  // 3. Encrypt filename
  const encryptedNameResult = await encryptString(file.name, masterKeyHex);

  // 4. Extract keywords and generate trapdoors
  const keywords = extractKeywords(file.name);
  const trapdoors = await Promise.all(
    keywords.map(kw => generateTrapdoor(masterKeyHex, kw))
  );

  // 5. Send encrypted data to server
  const res = await fetch(`${API_BASE}/files/upload-json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      encryptedData,
      iv,
      authTag,
      encryptedName: JSON.stringify(encryptedNameResult),
      trapdoors,
      sessionId,
      originalSize: file.size,
    }),
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error);

  return {
    ...json.data,
    fileName: file.name,
    keywords,
  };
}

// ─── Search files (client generates trapdoor → server matches) ───
export async function searchFiles(keyword, masterKeyHex, sessionId) {
  // 1. Client generates trapdoor from keyword
  const trapdoor = await generateTrapdoor(masterKeyHex, keyword);

  // 2. Send trapdoor to server (server never sees the keyword)
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trapdoor, sessionId }),
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

// ─── List all encrypted files ───
export async function listFiles(sessionId) {
  const res = await fetch(`${API_BASE}/files?sessionId=${sessionId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

// ─── Download & decrypt a file ───
export async function downloadFile(fileId, masterKeyHex) {
  console.log('[ZK-Vault] === DOWNLOAD START ===');
  console.log('[ZK-Vault] File ID:', fileId);
  console.log('[ZK-Vault] Master key present:', !!masterKeyHex);

  // 1. Get encrypted file from server
  const res = await fetch(`${API_BASE}/files/${fileId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);

  const { encryptedData, iv, authTag, encryptedName } = json.data;
  console.log('[ZK-Vault] Received encrypted payload from server');
  console.log('[ZK-Vault] encryptedData present:', !!encryptedData, 'length:', encryptedData?.length);
  console.log('[ZK-Vault] iv present:', !!iv, 'authTag present:', !!authTag);

  // 2. Decrypt file content client-side (server never sees plaintext)
  const decryptedBuffer = await decryptFile(encryptedData, iv, authTag, masterKeyHex);
  console.log('[ZK-Vault] ✓ File content decrypted, size:', decryptedBuffer.byteLength, 'bytes');

  // 3. Decrypt filename (also encrypted client-side)
  let originalName = 'decrypted_file';
  try {
    const nameData = JSON.parse(encryptedName);
    originalName = await decryptString(
      nameData.encryptedData,
      nameData.iv,
      nameData.authTag,
      masterKeyHex
    );
    console.log('[ZK-Vault] ✓ Filename decrypted:', originalName);
  } catch (e) {
    console.warn('[ZK-Vault] Filename decryption failed, using fallback:', e.message);
  }

  console.log('[ZK-Vault] === DOWNLOAD COMPLETE === Returning decrypted:', originalName);
  return { buffer: decryptedBuffer, filename: originalName };
}

// ─── Download encrypted file WITHOUT decrypting ───
export async function downloadFileRaw(fileId) {
  console.log('[ZK-Vault] === RAW DOWNLOAD START (no decryption) ===');
  console.log('[ZK-Vault] File ID:', fileId);

  const res = await fetch(`${API_BASE}/files/${fileId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);

  const { encryptedData, iv, authTag, encryptedName } = json.data;

  // Package the encrypted payload as a JSON blob so it can be re-imported later
  const payload = JSON.stringify({ encryptedData, iv, authTag, encryptedName });
  const blob = new Blob([payload], { type: 'application/json' });

  console.log('[ZK-Vault] === RAW DOWNLOAD COMPLETE === Returning encrypted payload');
  return { blob, filename: `${fileId.substring(0, 12)}.enc.json` };
}

// ─── Delete a file ───
export async function deleteFile(fileId) {
  const res = await fetch(`${API_BASE}/files/${fileId}`, { method: 'DELETE' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json;
}

// ─── Health check ───
export async function healthCheck() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const json = await res.json();
    return { online: true, ...json };
  } catch {
    return { online: false };
  }
}

// Re-export crypto utils for direct use
export { generateTrapdoor, encryptFile, decryptFile, extractKeywords };
