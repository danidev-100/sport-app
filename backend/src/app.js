require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const jugadorRoutes = require('./routes/jugadores');
const jugadorAuthRoutes = require('./routes/jugadoresAuth');
const cuotaRoutes = require('./routes/cuotas');
const pagoRoutes = require('./routes/pagos');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors());

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.mercadopago.com"],
    },
  },
}));

// Global rate limit — 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes, intentá de nuevo más tarde', code: 'RATE_LIMIT' },
});
app.use(globalLimiter);

app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));

// Helper: mount routes under both /path and /api/path
// (Vercel strips /api in prod, local dev keeps it via proxy)
const mount = (prefix, router) => {
  app.use(prefix, router);
  app.use('/api' + prefix, router);
};

mount('/auth', authRoutes);
mount('/jugadores/auth', jugadorAuthRoutes);
mount('/jugadores', jugadorRoutes);
mount('/cuotas', cuotaRoutes);
mount('/pagos', pagoRoutes);
mount('/dashboard', dashboardRoutes);
mount('/users', userRoutes);
mount('/partidos', require('./routes/partidos'));
mount('/ingresos', require('./routes/ingresos'));
mount('/gastos', require('./routes/gastos'));
mount('/contabilidad', require('./routes/contabilidad'));
mount('/fechas', require('./routes/fechas'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Club Deportivo API' });
});

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;