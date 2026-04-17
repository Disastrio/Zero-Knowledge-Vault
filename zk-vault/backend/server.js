/**
 * Zero-Knowledge Vault — Express Server
 *
 * API server that handles encrypted file storage and
 * trapdoor-based searchable encryption.
 *
 * The server NEVER has access to:
 *   - Plaintext file contents
 *   - Original filenames (encrypted by client)
 *   - Search keywords (only HMAC trapdoors)
 *   - Master key Km (only the RSA-wrapped version)
 *   - Private key (sent to client once, never stored)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import storage from './lib/storage.js';
import authRouter from './routes/auth.js';
import filesRouter from './routes/files.js';
import searchRouter from './routes/search.js';

// Reconstruct __dirname (not available in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env relative to this file, regardless of cwd
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

// ─── Middleware ───
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Routes ───
app.use('/api/keys', authRouter);
app.use('/api/files', filesRouter);
app.use('/api/search', searchRouter);

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  const stats = storage.getStats();
  res.json({
    status: 'ok',
    service: 'Zero-Knowledge Vault',
    uptime: process.uptime(),
    vault: stats,
  });
});

// ─── 404 Handler ───
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// ─── Error Handler ───
app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start Server ───
const server = app.listen(PORT, () => {
  console.log(`\n🔐 Zero-Knowledge Vault Backend`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   Health check:     http://localhost:${PORT}/api/health`);
  console.log(`\n   The server has ZERO knowledge of:`);
  console.log(`   • Plaintext file contents`);
  console.log(`   • Original filenames`);
  console.log(`   • Search keywords`);
  console.log(`   • Master encryption key\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use.`);
    console.error(`Try setting a different PORT in your .env file.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// ─── Graceful Shutdown ───
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Zero-Knowledge Vault...');
  server.close(() => {
    console.log('   Server closed. Goodbye!\n');
    process.exit(0);
  });
});

export default app;
