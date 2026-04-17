/**
 * Auth Routes — Key Generation & Session Init
 *
 * POST /api/keys/generate
 *   Generates RSA key pair + Master Key (Km).
 *   Wraps Km with public key and stores it on server.
 *   Returns privateKey + wrappedKm to client.
 *   Server NEVER has access to Km or the private key after this.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateKeyPair, generateMasterKey, wrapKey } from '../lib/crypto.js';
import storage from '../lib/storage.js';

const router = express.Router();

// POST /api/keys/generate — Initialize a new vault session
router.post('/generate', (req, res) => {
  try {
    // 1. Generate RSA key pair
    const { publicKey, privateKey } = generateKeyPair();

    // 2. Generate Master Key (Km) — 256-bit
    const masterKey = generateMasterKey();

    // 3. Wrap Km with public key (RSA-OAEP)
    const wrappedKm = wrapKey(masterKey, publicKey);

    // 4. Create session — server stores ONLY the wrapped Km and public key
    const sessionId = uuidv4();
    storage.createSession(sessionId, wrappedKm, publicKey);

    // 5. Return to client:
    //    - privateKey (client stores locally, never sent to server again)
    //    - masterKey as hex (client uses for encryption, never sent to server)
    //    - wrappedKm (for verification)
    //    - sessionId (for subsequent API calls)
    res.json({
      success: true,
      data: {
        sessionId,
        privateKey,
        masterKey: masterKey.toString('hex'),
        wrappedKm,
        publicKey,
      },
      message: 'Vault initialized. Private key and master key are client-side only.',
    });
  } catch (err) {
    console.error('Key generation error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate keys' });
  }
});

// GET /api/keys/session/:id — Verify session exists
router.get('/session/:id', (req, res) => {
  const session = storage.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  res.json({
    success: true,
    data: {
      createdAt: session.createdAt,
      hasWrappedKey: !!session.wrappedKm,
    },
  });
});

export default router;
