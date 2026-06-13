const jugadorService = require('../services/jugadorService');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { validationResult } = require('express-validator');
const { NotFoundError } = require('../utils/errors');

const getAll = async (req, res, next) => {
  try {
    const { busqueda, activo, categoria } = req.query;
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const { jugadores, total } = await jugadorService.getAll({ busqueda, activo, categoria }, skip, take);
    res.json(paginatedResponse(jugadores, total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const jugador = await jugadorService.getById(req.params.id);
    res.json({ jugador });
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

    const jugador = await jugadorService.create(req.body, req.user.id);
    res.status(201).json({ jugador });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const jugador = await jugadorService.update(req.params.id, req.body, req.user.id);
    res.json({ jugador });
  } catch (error) {
    if (error.message === 'Jugador no encontrado') {
      return next(new NotFoundError(error.message));
    }
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await jugadorService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getHistorial = async (req, res, next) => {
  try {
    const cambios = await jugadorService.getHistorial(req.params.id);
    res.json({ cambios });
  } catch (error) {
    next(error);
  }
};

const getRecientes = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const jugadores = await jugadorService.getRecientes(limit);
    res.json(jugadores);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove, getHistorial, getRecientes };
