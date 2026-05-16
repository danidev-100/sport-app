const fechaService = require('../services/fechaService');

const getAll = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const fechas = await fechaService.getAll({ fechaDesde, fechaHasta });
    res.json({ fechas });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const fecha = await fechaService.getById(req.params.id);
    res.json({ fecha });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { titulo, fecha } = req.body;
    if (!titulo) {
      return res.status(400).json({ message: 'El título es requerido' });
    }
    const fechaRecord = await fechaService.create({ titulo, fecha });
    res.status(201).json({ fecha: fechaRecord });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const fecha = await fechaService.update(req.params.id, req.body);
    res.json({ fecha });
  } catch (error) {
    if (error.message === 'Fecha no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await fechaService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
