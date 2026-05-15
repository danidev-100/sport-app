const gastoService = require('../services/gastoService');
const { validationResult } = require('express-validator');

const getAll = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, partidoId } = req.query;
    const gastos = await gastoService.getAll({ fechaDesde, fechaHasta, partidoId });
    res.json({ gastos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const gasto = await gastoService.getById(req.params.id);
    res.json({ gasto });
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

    const gasto = await gastoService.create(req.body);
    res.status(201).json({ gasto });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const gasto = await gastoService.update(req.params.id, req.body);
    res.json({ gasto });
  } catch (error) {
    if (error.message === 'Gasto no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await gastoService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
