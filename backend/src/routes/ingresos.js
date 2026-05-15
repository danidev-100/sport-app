const express = require('express');
const { body } = require('express-validator');
const ingresoController = require('../controllers/ingresoController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

// All routes require auth + ADMIN role
router.use(auth);
router.use(authorize('ADMIN'));

router.get('/', ingresoController.getAll);
router.get('/:id', ingresoController.getById);
router.post('/', [
  body('descripcion').notEmpty().withMessage('Descripción es requerida'),
  body('monto').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('partidoId').optional().isUUID().withMessage('ID de partido inválido'),
  body('fecha').optional().isISO8601().withMessage('Fecha inválida')
], ingresoController.create);
router.put('/:id', ingresoController.update);
router.delete('/:id', ingresoController.remove);

module.exports = router;
