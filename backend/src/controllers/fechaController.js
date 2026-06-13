const fechaService = require('../services/fechaService');
const { NotFoundError, ValidationError } = require('../utils/errors');

const getAll = async (req, res, next) => {
  try {
    const fechas = await fechaService.getAll();
    res.json({ fechas });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const fecha = await fechaService.getById(req.params.id);
    res.json({ fecha });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.body.titulo) {
      return res.status(400).json({ message: 'El título es requerido' });
    }
    const fecha = await fechaService.create({ titulo: req.body.titulo });
    res.status(201).json({ fecha });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const fecha = await fechaService.update(req.params.id, req.body);
    res.json({ fecha });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await fechaService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
