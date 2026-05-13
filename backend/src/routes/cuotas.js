const express = require('express');
const { body } = require('express-validator');
const cuotaController = require('../controllers/cuotaController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

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
