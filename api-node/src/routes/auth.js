'use strict';

const express = require('express');
const jwt     = require('jsonwebtoken');

const router = express.Router();

// credenciales de demo, en produccion esto estaria en una base de datos
const VALID_CREDENTIALS = {
  admin: 'password123',
};

/**
 * POST /auth/login
 * Body: { "username": "admin", "password": "password123" }
 * Devuelve un token JWT valido por 24 horas
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // los dos campos son requeridos
  if (!username || !password) {
    return res.status(400).json({ error: 'el usuario y la contraseña son obligatorios' });
  }

  // verificamos que las credenciales sean correctas
  if (VALID_CREDENTIALS[username] !== password) {
    return res.status(401).json({ error: 'credenciales incorrectas' });
  }

  const secret = process.env.JWT_SECRET || 'interseguro-secret-2024';
  const token  = jwt.sign({ sub: username, username }, secret, { expiresIn: '24h' });

  return res.json({ token, message: 'Login successful' });
});

module.exports = router;
