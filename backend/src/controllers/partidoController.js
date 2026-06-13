const partidoService = require('../services/partidoService');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { NotFoundError, ValidationError } = require('../utils/errors');

const getAll = async (req, res, next) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const { partidos, total } = await partidoService.getAll(skip, take);
    res.json(paginatedResponse(partidos, total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const partido = await partidoService.getById(req.params.id);
    res.json({ partido });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.body.titulo) {
      return res.status(400).json({ message: 'El título es requerido' });
    }
    const partido = await partidoService.create({ titulo: req.body.titulo });
    res.status(201).json({ partido });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const partido = await partidoService.update(req.params.id, req.body);
    res.json({ partido });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await partidoService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
