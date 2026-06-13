const cuotaService = require('../services/cuotaService');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { validationResult } = require('express-validator');
const { NotFoundError, ValidationError } = require('../utils/errors');

const getAll = async (req, res, next) => {
  try {
    const { jugadorId, anio, vencida } = req.query;
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const { cuotas, total } = await cuotaService.getAll({ jugadorId, anio, vencida }, skip, take);
    res.json(paginatedResponse(cuotas, total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getMorosos = async (req, res, next) => {
  try {
    const morosos = await cuotaService.getMorosos();
    res.json(morosos);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const cuota = await cuotaService.getById(req.params.id);
    res.json({ cuota });
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

    const cuota = await cuotaService.create(req.body);
    res.status(201).json({ cuota });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const cuota = await cuotaService.update(req.params.id, req.body);
    res.json({ cuota });
  } catch (error) {
    if (error.message === 'Cuota no encontrada') {
      return next(new NotFoundError(error.message));
    }
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await cuotaService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const generarMensuales = async (req, res, next) => {
  try {
    const { mes, anio, monto } = req.body;
    const cuotas = await cuotaService.generarMensuales(mes, anio, monto);
    res.status(201).json({ message: `Se generaron ${cuotas.length} cuotas`, cuotas });
  } catch (error) {
    next(error);
  }
};

const generarParaJugador = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jugadorId, mes, anio, monto } = req.body;
    const result = await cuotaService.crearParaJugador(jugadorId, mes, anio, monto);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const generarMasivas = async (req, res, next) => {
  try {
    const { mes, anio, montosPorCategoria } = req.body;
    if (!mes || !anio) throw new ValidationError('Mes y año son requeridos');

    const result = await cuotaService.generarMasivas(parseInt(mes), parseInt(anio), montosPorCategoria);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getMorosos, getById, create, update, remove, generarMensuales, generarParaJugador, generarMasivas };
