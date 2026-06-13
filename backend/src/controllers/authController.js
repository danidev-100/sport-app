const authService = require('../services/authService');
const { validationResult } = require('express-validator');
const { AuthError, ValidationError } = require('../utils/errors');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, nombre } = req.body;
    const result = await authService.register(email, password, nombre, 'ADMIN');
    res.status(201).json(result);
  } catch (error) {
    next(new ValidationError(error.message));
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(new AuthError(error.message));
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AuthError('Refresh token requerido');
    const result = await authService.refreshTokens(refreshToken);
    res.json(result);
  } catch (error) {
    next(new AuthError(error.message));
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await authService.logout(refreshToken);
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, me, refresh, logout };
