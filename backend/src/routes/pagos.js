const express = require('express');
const mercadoPagoService = require('../services/mercadoPagoService');
const authJugador = require('../middleware/authJugador');
const prisma = require('../config/database');

const router = express.Router();

router.post('/crear-preferencia', authJugador, async (req, res) => {
  try {
    const { cuotaId } = req.body;
    const jugadorId = req.jugadorId;

    const cuota = await prisma.cuota.findFirst({
      where: { id: cuotaId, jugadorId },
      include: { jugador: true }
    });

    if (!cuota) {
      return res.status(404).json({ message: 'Cuota no encontrada' });
    }

    const preference = await mercadoPagoService.createPaymentPreference(cuota, cuota.jugador);
    res.json({ preferenceId: preference.id, initPoint: preference.init_point });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    await mercadoPagoService.processWebhook(req.body);
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/mis-cuotas', authJugador, async (req, res) => {
  try {
    const cuotas = await prisma.cuota.findMany({
      where: { jugadorId: req.jugadorId },
      include: { pagos: true },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }]
    });
    res.json(cuotas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;