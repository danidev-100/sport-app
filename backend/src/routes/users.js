const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

router.use(auth);

router.get('/', authorize('ADMIN'), userController.getAll);

router.post('/', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Password debe tener al menos 6 caracteres'),
  body('nombre').notEmpty().withMessage('Nombre es requerido')
], authorize('ADMIN'), userController.create);

router.put('/:id', [
  body('rol').optional().isIn(['ADMIN', 'EDITOR']).withMessage('Rol inválido'),
  body('activo').optional().isBoolean().withMessage('Activo debe ser booleano')
], authorize('ADMIN'), userController.update);

router.delete('/:id', authorize('ADMIN'), userController.remove);

module.exports = router;