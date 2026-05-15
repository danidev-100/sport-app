const express = require('express');
const ingresoService = require('../services/ingresoService');
const gastoService = require('../services/gastoService');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

router.use(auth);
router.use(authorize('ADMIN'));

router.get('/balance', async (req, res) => {
  try {
    const totalIngresos = await ingresoService.getTotal();
    const totalGastos = await gastoService.getTotal();
    const balance = totalIngresos - totalGastos;
    res.json({ totalIngresos, totalGastos, balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
