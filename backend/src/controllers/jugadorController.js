const jugadorService = require('../services/jugadorService');
const { validationResult } = require('express-validator');

const getAll = async (req, res) => {
  try {
    const { busqueda, posicion, activo, categoria } = req.query;
    const jugadores = await jugadorService.getAll({ busqueda, posicion, activo, categoria });
    res.json({ jugadores });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const jugador = await jugadorService.getById(req.params.id);
    res.json({ jugador });
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

    const jugador = await jugadorService.create(req.body, req.user.id);
    res.status(201).json({ jugador });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const jugador = await jugadorService.update(req.params.id, req.body, req.user.id);
    res.json({ jugador });
  } catch (error) {
    if (error.message === 'Jugador no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await jugadorService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const getHistorial = async (req, res) => {
  try {
    const cambios = await jugadorService.getHistorial(req.params.id);
    res.json({ cambios });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const getRecientes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const jugadores = await jugadorService.getRecientes(limit);
    res.json(jugadores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, getHistorial, getRecientes };