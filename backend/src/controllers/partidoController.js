const partidoService = require('../services/partidoService');

const getAll = async (req, res) => {
  try {
    const partidos = await partidoService.getAll();
    res.json({ partidos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const partido = await partidoService.getById(req.params.id);
    res.json({ partido });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.titulo) {
      return res.status(400).json({ message: 'El título es requerido' });
    }
    const partido = await partidoService.create({ titulo: req.body.titulo });
    res.status(201).json({ partido });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const partido = await partidoService.update(req.params.id, req.body);
    res.json({ partido });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await partidoService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
