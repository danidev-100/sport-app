const ingresoService = require('../services/ingresoService');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { validationResult } = require('express-validator');
const { NotFoundError } = require('../utils/errors');

const getAll = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, partidoId } = req.query;
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const { ingresos, total } = await ingresoService.getAll({ fechaDesde, fechaHasta, partidoId }, skip, take);
    res.json(paginatedResponse(ingresos, total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const ingreso = await ingresoService.getById(req.params.id);
    res.json({ ingreso });
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

    const ingreso = await ingresoService.create(req.body);
    res.status(201).json({ ingreso });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const ingreso = await ingresoService.update(req.params.id, req.body);
    res.json({ ingreso });
  } catch (error) {
    if (error.message === 'Ingreso no encontrado') {
      return next(new NotFoundError(error.message));
    }
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await ingresoService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
