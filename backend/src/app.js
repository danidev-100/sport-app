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

app.use('/api/auth', authRoutes);
app.use('/api/jugadores/auth', jugadorAuthRoutes);
app.use('/api/jugadores', jugadorRoutes);
app.use('/api/cuotas', cuotaRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ingresos', require('./routes/ingresos'));
app.use('/api/gastos', require('./routes/gastos'));
app.use('/api/contabilidad', require('./routes/contabilidad'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Club Deportivo API' });
});

app.use((err, req, res, next) => {
  console.error('ERROR:', err.stack);
  res.status(500).json({ message: 'Error interno del servidor', error: err.message });
});

module.exports = app;