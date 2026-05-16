const fechaService = require('../services/fechaService');

const getAll = async (req, res) => {
  try {
    const fechas = await fechaService.getAll();
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
    if (!req.body.titulo) {
      return res.status(400).json({ message: 'El título es requerido' });
    }
    const fecha = await fechaService.create({ titulo: req.body.titulo });
    res.status(201).json({ fecha });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const fecha = await fechaService.update(req.params.id, req.body);
    res.json({ fecha });
  } catch (error) {
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
