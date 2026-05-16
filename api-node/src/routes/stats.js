'use strict';

const express = require('express');
const { calculateMatrixStats, calculateCombinedStats } = require('../services/stats');

const router = express.Router();

/**
 * POST /api/stats
 * Body: { "Q": [[...], ...], "R": [[...], ...] }
 *
 * Recibe las matrices Q y R desde la api de go y devuelve:
 *  - estadisticas por matriz (max, min, promedio, suma, es_diagonal)
 *  - estadisticas combinadas de ambas matrices juntas
 */
router.post('/stats', (req, res) => {
  const { Q, R } = req.body;

  // ambas matrices son obligatorias
  if (!Q || !R) {
    return res.status(400).json({ error: 'se necesitan las matrices Q y R' });
  }

  if (!Array.isArray(Q) || !Array.isArray(R)) {
    return res.status(400).json({ error: 'Q y R deben ser arrays' });
  }

  if (Q.length === 0 || R.length === 0) {
    return res.status(400).json({ error: 'Q y R no pueden estar vacias' });
  }

  const q_stats        = calculateMatrixStats(Q);
  const r_stats        = calculateMatrixStats(R);
  const combined_stats = calculateCombinedStats([Q, R]);

  return res.json({ q_stats, r_stats, combined_stats });
});

module.exports = router;
