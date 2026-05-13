const express = require('express');
const { body } = require('express-validator');
const mercadoPagoService = require('../services/mercadoPagoService');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');
const authJugador = require('../middleware/authJugador');
const pagoController = require('../controllers/pagoController');
const prisma = require('../config/database');

const router = express.Router();

// ── Admin: create a payment for a cuota ─────────────────
router.post('/', auth, authorize('ADMIN'), [
  body('cuotaId').isUUID().withMessage('ID de cuota inválido'),
  body('monto').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('metodoPago').optional().isString(),
  body('observacion').optional().isString(),
], pagoController.create);

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