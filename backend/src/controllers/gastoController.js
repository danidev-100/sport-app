const gastoService = require('../services/gastoService');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { validationResult } = require('express-validator');
const { NotFoundError } = require('../utils/errors');

const getAll = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, partidoId } = req.query;
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const { gastos, total } = await gastoService.getAll({ fechaDesde, fechaHasta, partidoId }, skip, take);
    res.json(paginatedResponse(gastos, total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const gasto = await gastoService.getById(req.params.id);
    res.json({ gasto });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const gasto = await gastoService.create(req.body);
    res.status(201).json({ gasto });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const gasto = await gastoService.update(req.params.id, req.body);
    res.json({ gasto });
  } catch (error) {
    if (error.message === 'Gasto no encontrado') {
      return next(new NotFoundError(error.message));
    }
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await gastoService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
