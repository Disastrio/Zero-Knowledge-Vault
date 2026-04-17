/**
 * Search Routes — Trapdoor-Based Encrypted Search
 *
 * The client generates a trapdoor: HMAC(Km, keyword)
 * and sends it to the server. The server matches the trapdoor
 * against the inverted index WITHOUT ever learning the keyword.
 *
 * POST /api/search       — Search by single trapdoor token
 * POST /api/search/multi — Search by multiple trapdoors (AND)
 */

import express from 'express';
import storage from '../lib/storage.js';

const router = express.Router();

// POST /api/search — Search encrypted index with trapdoor
router.post('/', (req, res) => {
  try {
    const { trapdoor, sessionId } = req.body;

    if (!trapdoor) {
      return res.status(400).json({ success: false, error: 'Trapdoor token required' });
    }

    const startTime = performance.now();

    // Server-side: match trapdoor against inverted index
    // Server does NOT know what keyword this trapdoor maps to
    let results = storage.searchByTrapdoor(trapdoor);

    // Filter by session if provided
    if (sessionId) {
      results = results.filter(f => {
        const full = storage.getFile(f.id);
        return full && full.sessionId === sessionId;
      });
    }

    const elapsed = (performance.now() - startTime).toFixed(2);

    res.json({
      success: true,
      data: {
        matches: results,
        count: results.length,
        searchTimeMs: parseFloat(elapsed),
        trapdoorUsed: trapdoor.substring(0, 16) + '...', // Show partial trapdoor for demo
      },
      message: results.length > 0
        ? `Found ${results.length} match(es). Server learned nothing about the search keyword.`
        : 'No matches. The trapdoor did not map to any indexed files.',
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// POST /api/search/multi — Search with multiple trapdoors (Boolean AND)
router.post('/multi', (req, res) => {
  try {
    const { trapdoors, sessionId } = req.body;

    if (!trapdoors || !Array.isArray(trapdoors) || trapdoors.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of trapdoor tokens required' });
    }

    const startTime = performance.now();

    // Find files matching ALL trapdoors (intersection)
    const resultSets = trapdoors.map(t => {
      const matches = storage.searchByTrapdoor(t);
      return new Set(matches.map(m => m.id));
    });

    // Intersect all sets
    let intersection = resultSets[0] || new Set();
    for (let i = 1; i < resultSets.length; i++) {
      intersection = new Set([...intersection].filter(id => resultSets[i].has(id)));
    }

    // Get full metadata for matching files
    const results = [...intersection].map(id => {
      const file = storage.getFile(id);
      if (sessionId && file.sessionId !== sessionId) return null;
      return {
        id: file.id,
        encryptedName: file.encryptedName,
        originalSize: file.originalSize,
        uploadedAt: file.uploadedAt,
      };
    }).filter(Boolean);

    const elapsed = (performance.now() - startTime).toFixed(2);

    res.json({
      success: true,
      data: {
        matches: results,
        count: results.length,
        searchTimeMs: parseFloat(elapsed),
        trapdoorsUsed: trapdoors.length,
      },
    });
  } catch (err) {
    console.error('Multi-search error:', err);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

export default router;
