const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.code || 'UNKNOWN'} - ${err.message}`);

  // Known AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, code: err.code });
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(400).json({ message: 'El valor ya existe', code: 'DUPLICATE' });
  }

  // Prisma not found
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Recurso no encontrado', code: 'NOT_FOUND' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token inválido o expirado', code: 'TOKEN_ERROR' });
  }

  // Default
  res.status(500).json({ message: 'Error interno del servidor', code: 'INTERNAL_ERROR' });
};

module.exports = errorHandler;
