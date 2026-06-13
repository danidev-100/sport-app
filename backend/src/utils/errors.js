class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(404, 'NOT_FOUND', message);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Datos inválidos') {
    super(400, 'VALIDATION_ERROR', message);
  }
}

class AuthError extends AppError {
  constructor(message = 'No autorizado') {
    super(401, 'AUTH_ERROR', message);
  }
}

module.exports = { AppError, NotFoundError, ValidationError, AuthError };
