/**
 * File Routes — Upload, List, Download, Delete
 *
 * All file data arrives already encrypted by the client.
 * The server stores ciphertext blobs and never has access to plaintext.
 *
 * POST   /api/files/upload      — Store encrypted file + trapdoors
 * POST   /api/files/upload-json — Store encrypted file as JSON
 * GET    /api/files             — List encrypted file metadata
 * GET    /api/files/:id         — Download encrypted file
 * DELETE /api/files/:id         — Delete file + cleanup index
 */

import express from 'express';
import multer from 'multer';
import storage from '../lib/storage.js';

const router = express.Router();

// Multer config — store in memory since files arrive encrypted
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

// POST /api/files/upload — Upload an encrypted file
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    const {
      encryptedName,   // AES-encrypted original filename (base64)
      iv,              // IV used for file encryption (base64)
      authTag,         // GCM auth tag (base64)
      trapdoors,       // JSON array of HMAC trapdoor tokens
      sessionId,       // Session identifier
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID required' });
    }

    // Verify session exists
    const session = storage.getSession(sessionId);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    // The file data is either in req.file (multipart) or req.body.encryptedData (JSON)
    let encryptedData;
    if (req.file) {
      encryptedData = req.file.buffer.toString('base64');
    } else if (req.body.encryptedData) {
      encryptedData = req.body.encryptedData;
    } else {
      return res.status(400).json({ success: false, error: 'No file data provided' });
    }

    // Parse trapdoors
    let parsedTrapdoors = [];
    if (trapdoors) {
      try {
        parsedTrapdoors = typeof trapdoors === 'string' ? JSON.parse(trapdoors) : trapdoors;
      } catch (e) {
        console.error('Failed to parse trapdoors:', e);
        return res.status(400).json({ success: false, error: 'Invalid trapdoors format' });
      }
    }

    // Store the encrypted file
    const result = storage.addFile({
      encryptedData,
      iv,
      authTag,
      encryptedName: encryptedName || 'encrypted_file',
      originalSize: req.file ? req.file.size : Buffer.byteLength(encryptedData, 'base64'),
      trapdoors: parsedTrapdoors,
      sessionId,
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.id,
        uploadedAt: result.uploadedAt,
        trapdoorCount: parsedTrapdoors.length,
      },
      message: 'Encrypted file stored. Server has zero knowledge of contents.',
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// POST /api/files/upload-json — Upload encrypted file as JSON (simpler for demo)
router.post('/upload-json', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const {
      encryptedData,
      encryptedName,
      iv,
      authTag,
      trapdoors,
      sessionId,
      originalSize,
    } = req.body;

    if (!sessionId || !encryptedData) {
      return res.status(400).json({ success: false, error: 'sessionId and encryptedData required' });
    }

    const session = storage.getSession(sessionId);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    const result = storage.addFile({
      encryptedData,
      iv,
      authTag,
      encryptedName: encryptedName || 'encrypted_file',
      originalSize: originalSize || 0,
      trapdoors: trapdoors || [],
      sessionId,
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.id,
        uploadedAt: result.uploadedAt,
        trapdoorCount: (trapdoors || []).length,
      },
      message: 'Encrypted file stored successfully.',
    });
  } catch (err) {
    console.error('Upload JSON error:', err);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// GET /api/files — List all encrypted files (metadata only)
router.get('/', (req, res) => {
  const { sessionId } = req.query;
  const files = storage.listFiles(sessionId);
  res.json({
    success: true,
    data: files,
    count: files.length,
  });
});

// GET /api/files/:id — Download encrypted file
router.get('/:id', (req, res) => {
  const file = storage.getFile(req.params.id);
  if (!file) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }

  res.json({
    success: true,
    data: {
      id: file.id,
      encryptedName: file.encryptedName,
      encryptedData: file.encryptedData,
      iv: file.iv,
      authTag: file.authTag,
      originalSize: file.originalSize,
      uploadedAt: file.uploadedAt,
    },
  });
});

// DELETE /api/files/:id — Delete file and cleanup index
router.delete('/:id', (req, res) => {
  const deleted = storage.deleteFile(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }

  res.json({
    success: true,
    message: 'File and associated index entries deleted.',
  });
});

export default router;
