'use strict';

const jwt = require('jsonwebtoken');

/**
 * Middleware de Express que valida el token Bearer JWT en el header Authorization.
 * Usa el mismo JWT_SECRET que la api de Go, asi los tokens de servicio
 * generados por api-go tambien son aceptados aca.
 */
module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // verificamos que venga el header con el formato correcto
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'no se encontro el token' });
  }

  // quitamos el "Bearer " del principio para quedarnos solo con el token
  const token  = authHeader.slice(7);
  const secret = process.env.JWT_SECRET || 'interseguro-secret-2024';

  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'token invalido o expirado' });
  }
};
