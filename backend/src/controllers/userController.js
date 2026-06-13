const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { NotFoundError, ValidationError } = require('../utils/errors');

const getAll = async (req, res, next) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const select = {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      activo: true,
      createdAt: true,
      updatedAt: true
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count(),
    ]);
    res.json(paginatedResponse(users, total, page, limit));
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { email, password, nombre, rol } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'El email ya está en uso' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        rol: rol || 'EDITOR'
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true
      }
    });
    
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rol, activo } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (id === req.user.id) {
      return res.status(400).json({ message: 'No puedes modificarte a ti mismo' });
    }

    const updates = {};
    if (rol && rol !== existingUser.rol) updates.rol = rol;
    if (activo !== undefined && activo !== existingUser.activo) updates.activo = activo;

    if (Object.keys(updates).length === 0) {
      return res.json({ user: existingUser });
    }

    const user = await prisma.user.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, update, remove };
