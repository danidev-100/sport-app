const crypto = require('crypto');
const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

async function storeRefreshToken(token, userId) {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { token, userId, expiresAt }
  });
}

async function verifyRefreshToken(token) {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored) throw new Error('Refresh token inválido');
  if (stored.revoked) {
    // Theft detected! Revoke ALL tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revoked: false },
      data: { revoked: true }
    });
    throw new Error('Refresh token reutilizado — todos los tokens fueron revocados');
  }
  if (new Date() > stored.expiresAt) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new Error('Refresh token expirado');
  }
  return stored;
}

async function revokeRefreshToken(token) {
  await prisma.refreshToken.update({
    where: { token },
    data: { revoked: true }
  });
}

const register = async (email, password, nombre, rol = 'EDITOR') => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('El email ya está registrado');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      nombre,
      rol
    },
    select: { id: true, email: true, nombre: true, rol: true, activo: true, createdAt: true }
  });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();
  await storeRefreshToken(refreshToken, user.id);

  return { user, token: accessToken, refreshToken };
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.activo) {
    throw new Error('Credenciales inválidas');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Credenciales inválidas');
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();
  await storeRefreshToken(refreshToken, user.id);

  return {
    user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol, activo: user.activo },
    token: accessToken,
    refreshToken
  };
};

const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, nombre: true, rol: true, activo: true, createdAt: true }
  });
  if (!user) throw new Error('Usuario no encontrado');
  return user;
};

async function refreshTokens(oldRefreshToken) {
  const stored = await verifyRefreshToken(oldRefreshToken);

  // Revoke old
  await revokeRefreshToken(oldRefreshToken);

  // Issue new pair
  const accessToken = generateAccessToken(stored.userId);
  const newRefreshToken = generateRefreshToken();
  await storeRefreshToken(newRefreshToken, stored.userId);

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
    select: { id: true, email: true, nombre: true, rol: true, activo: true }
  });

  return { user, token: accessToken, refreshToken: newRefreshToken };
}

async function logout(refreshToken) {
  await revokeRefreshToken(refreshToken);
}

module.exports = { register, login, getCurrentUser, refreshTokens, logout };