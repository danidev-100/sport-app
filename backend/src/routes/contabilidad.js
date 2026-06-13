const express = require('express');
const ingresoService = require('../services/ingresoService');
const gastoService = require('../services/gastoService');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

router.use(auth);
router.use(authorize('ADMIN'));

router.get('/balance', async (req, res, next) => {
  try {
    const totalIngresos = await ingresoService.getTotal();
    const totalGastos = await gastoService.getTotal();
    const balance = totalIngresos - totalGastos;
    res.json({ totalIngresos, totalGastos, balance });
  } catch (error) {
    next(error);
  }
});

router.get('/balance-por-fecha', async (req, res, next) => {
  try {
    const ingresos = await ingresoService.getAll();
    const gastos = await gastoService.getAll();

    // Group by date (YYYY-MM-DD) with items
    const porFecha = {};

    for (const ingreso of ingresos) {
      const fechaKey = new Date(ingreso.fecha).toISOString().split('T')[0];
      if (!porFecha[fechaKey]) {
        porFecha[fechaKey] = { ingresos: [], gastos: [], totalIngresos: 0, totalGastos: 0 };
      }
      porFecha[fechaKey].ingresos.push(ingreso);
      porFecha[fechaKey].totalIngresos += Number(ingreso.monto);
    }

    for (const gasto of gastos) {
      const fechaKey = new Date(gasto.fecha).toISOString().split('T')[0];
      if (!porFecha[fechaKey]) {
        porFecha[fechaKey] = { ingresos: [], gastos: [], totalIngresos: 0, totalGastos: 0 };
      }
      porFecha[fechaKey].gastos.push(gasto);
      porFecha[fechaKey].totalGastos += Number(gasto.monto);
    }

    // Build result sorted by date desc
    const balancePorFecha = Object.entries(porFecha)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([fecha, data]) => ({
        fecha,
        ...data,
        balance: data.totalIngresos - data.totalGastos,
      }));

    res.json({ balancePorFecha });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
