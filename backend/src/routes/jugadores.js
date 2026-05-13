const express = require('express');
const { body } = require('express-validator');
const jugadorController = require('../controllers/jugadorController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

router.use(auth);

router.get('/', jugadorController.getAll);
router.get('/recientes', jugadorController.getRecientes);
router.get('/:id', jugadorController.getById);
router.get('/:id/historial', jugadorController.getHistorial);

router.post('/', [
  body('nombre').notEmpty().withMessage('Nombre es requerido'),
  body('categoria').optional().isIn(['C7', 'C11', 'C13', 'C15', 'C17', 'C20', 'PRIMERA', 'SENIOR', 'VETERANO']).withMessage('Categoría inválida'),
  body('edad').isInt({ min: 1 }).withMessage('Edad debe ser mayor a 0')
], authorize('ADMIN', 'EDITOR'), jugadorController.create);

router.put('/:id', authorize('ADMIN', 'EDITOR'), jugadorController.update);
router.delete('/:id', authorize('ADMIN'), jugadorController.remove);

module.exports = router;