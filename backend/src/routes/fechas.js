const express = require('express');
const { body } = require('express-validator');
const fechaController = require('../controllers/fechaController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

router.use(auth);
router.use(authorize('ADMIN'));

router.get('/', fechaController.getAll);
router.get('/:id', fechaController.getById);
router.post('/', [
  body('titulo').notEmpty().withMessage('El título es requerido'),
], fechaController.create);
router.put('/:id', fechaController.update);
router.delete('/:id', fechaController.remove);

module.exports = router;
