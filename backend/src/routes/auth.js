const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos, intentá de nuevo en 15 minutos', code: 'RATE_LIMIT' },
});

router.post('/register', authLimiter, [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Password debe tener al menos 6 caracteres'),
  body('nombre').notEmpty().withMessage('Nombre es requerido')
], authController.register);

router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Password es requerido')
], authController.login);

router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.get('/me', require('../middleware/auth'), authController.me);

module.exports = router;