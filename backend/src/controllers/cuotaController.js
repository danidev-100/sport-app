const cuotaService = require('../services/cuotaService');
const { validationResult } = require('express-validator');

const getAll = async (req, res) => {
  try {
    const { jugadorId, anio, vencida } = req.query;
    const cuotas = await cuotaService.getAll({ jugadorId, anio, vencida });
    res.json({ cuotas });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMorosos = async (req, res) => {
  try {
    const morosos = await cuotaService.getMorosos();
    res.json(morosos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const cuota = await cuotaService.getById(req.params.id);
    res.json({ cuota });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const cuota = await cuotaService.create(req.body);
    res.status(201).json({ cuota });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const cuota = await cuotaService.update(req.params.id, req.body);
    res.json({ cuota });
  } catch (error) {
    if (error.message === 'Cuota no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await cuotaService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const generarMensuales = async (req, res) => {
  try {
    const { mes, anio, monto } = req.body;
    const cuotas = await cuotaService.generarMensuales(mes, anio, monto);
    res.status(201).json({ message: `Se generaron ${cuotas.length} cuotas`, cuotas });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const generarParaJugador = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jugadorId, mes, anio, monto } = req.body;
    const result = await cuotaService.crearParaJugador(jugadorId, mes, anio, monto);
    // result contains { cuota, pago }
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getAll, getMorosos, getById, create, update, remove, generarMensuales, generarParaJugador };
