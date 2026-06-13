const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');
const cuotaController = require('../controllers/cuotaController');
const cuotaService = require('../services/cuotaService');
const prisma = require('../config/database');

const router = express.Router();

// Revertir pago de una cuota (admin)
router.post('/:id/revertir-pago', auth, authorize('ADMIN'), async (req, res, next) => {
  try {
    const cuota = await prisma.cuota.findUnique({
      where: { id: req.params.id },
      include: { pagos: true, jugador: true }
    });
    if (!cuota) return res.status(404).json({ message: 'Cuota no encontrada' });

    // Eliminar todos los pagos asociados
    await prisma.pago.deleteMany({ where: { cuotaId: cuota.id } });

    // Marcar como impaga
    await prisma.cuota.update({
      where: { id: cuota.id },
      data: { vencida: false }
    });

    res.json({ message: 'Pago revertido correctamente', cuota });
  } catch (error) {
    next(error);
  }
});

router.get('/', cuotaController.getAll);
router.get('/morosos', cuotaController.getMorosos);

router.use(auth);

router.get('/:id', cuotaController.getById);

// Generar cuota para un jugador (protected)
router.post('/generar-jugador', [
  body('jugadorId').isUUID().withMessage('ID de jugador inválido'),
  body('mes').isInt({ min: 1, max: 12 }).withMessage('Mes debe estar entre 1 y 12'),
  body('anio').isInt({ min: 2000 }).withMessage('Año inválido'),
  body('monto').isFloat({ min: 0 }).withMessage('Monto debe ser mayor a 0')
], authorize('ADMIN'), cuotaController.generarParaJugador);

router.post('/generar-masivas', auth, authorize('ADMIN'), cuotaController.generarMasivas);

router.post('/', [
  body('jugadorId').isUUID().withMessage('ID de jugador inválido'),
  body('mes').isInt({ min: 1, max: 12 }).withMessage('Mes debe estar entre 1 y 12'),
  body('anio').isInt({ min: 2000 }).withMessage('Año inválido'),
  body('monto').isFloat({ min: 0 }).withMessage('Monto debe ser mayor a 0'),
  body('fechaVencimiento').isISO8601().withMessage('Fecha de vencimiento inválida')
], authorize('ADMIN'), cuotaController.create);

router.put('/:id', [
  body('monto').optional().isFloat({ min: 0 }).withMessage('Monto debe ser mayor a 0'),
  body('pagada').optional().isBoolean().withMessage('Estado de pago inválido')
], authorize('ADMIN'), cuotaController.update);

router.delete('/:id', authorize('ADMIN'), cuotaController.remove);

module.exports = router;
