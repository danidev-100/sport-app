require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const jugadorRoutes = require('./routes/jugadores');
const jugadorAuthRoutes = require('./routes/jugadoresAuth');
const cuotaRoutes = require('./routes/cuotas');
const pagoRoutes = require('./routes/pagos');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors());
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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Club Deportivo API' });
});

app.use((err, req, res, next) => {
  console.error('ERROR:', err.stack);
  res.status(500).json({ message: 'Error interno del servidor', error: err.message });
});

module.exports = app;