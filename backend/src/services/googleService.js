const prisma = require('../config/database');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const verifyGoogleCredential = async (credential) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    let jugador = await prisma.jugador.findUnique({
      where: { googleId: payload.sub }
    });

    if (!jugador) {
      jugador = await prisma.jugador.create({
        data: {
          nombre: payload.name || 'Jugador',
          email: payload.email,
          googleId: payload.sub,
          edad: 18,
          activo: true
        }
      });
    }

    const token = jwt.sign(
      { jugadorId: jugador.id, email: jugador.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { jugador, token };
  } catch (error) {
    throw new Error('Token de Google inválido');
  }
};

const registerOrLoginWithGoogle = async (googleToken) => {
  return verifyGoogleCredential(googleToken);
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { registerOrLoginWithGoogle, verifyToken, verifyGoogleCredential };