const express = require('express');
const googleService = require('../services/googleService');
const authMiddleware = require('../middleware/authJugador');

const router = express.Router();

router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ message: 'Token de Google requerido' });
    }

    const result = await googleService.verifyGoogleCredential(credential);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const prisma = require('../config/database');
    const jugador = await prisma.jugador.findUnique({
      where: { id: req.jugadorId },
      select: { id: true, nombre: true, email: true, categoria: true, telefono: true, fotoUrl: true }
    });

    if (!jugador) {
      return res.status(404).json({ message: 'Jugador no encontrado' });
    }

    res.json(jugador);
  } catch (error) {
    next(error);
  }
});

module.exports = router;