'use strict';

const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const authRoutes    = require('./routes/auth');
const statsRoutes   = require('./routes/stats');
const authMiddleware = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ruta de salud, la usa docker para saber si el contenedor esta listo
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-node' }));

// ruta publica de login, no requiere token
app.use('/auth', authRoutes);

// rutas protegidas, todas pasan por el middleware de autenticacion
app.use('/api', authMiddleware, statsRoutes);

// solo levantamos el servidor si este archivo es el punto de entrada (no en tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Interseguro Node.js Statistics API running on port ${PORT}`);
  });
}

module.exports = app;
