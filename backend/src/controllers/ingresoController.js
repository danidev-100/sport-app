const ingresoService = require('../services/ingresoService');
const { validationResult } = require('express-validator');

const getAll = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, partidoId } = req.query;
    const ingresos = await ingresoService.getAll({ fechaDesde, fechaHasta, partidoId });
    res.json({ ingresos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const ingreso = await ingresoService.getById(req.params.id);
    res.json({ ingreso });
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

    const ingreso = await ingresoService.create(req.body);
    res.status(201).json({ ingreso });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const ingreso = await ingresoService.update(req.params.id, req.body);
    res.json({ ingreso });
  } catch (error) {
    if (error.message === 'Ingreso no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await ingresoService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
