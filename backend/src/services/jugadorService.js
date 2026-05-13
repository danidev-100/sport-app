const prisma = require('../config/database');
const historialService = require('./historialService');

const getAll = async (filters = {}) => {
  const where = {};

  if (filters.busqueda) {
    where.OR = [
      { nombre: { contains: filters.busqueda, mode: 'insensitive' } },
      { email: { contains: filters.busqueda, mode: 'insensitive' } },
      { telefono: { contains: filters.busqueda, mode: 'insensitive' } }
    ];
  }

  if (filters.posicion) {
    where.posicion = filters.posicion;
  }

  if (filters.categoria) {
    where.categoria = filters.categoria;
  }

  if (filters.activo !== undefined) {
    where.activo = filters.activo === 'true';
  }

  return prisma.jugador.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      cuotas: {
        select: { id: true, mes: true, anio: true, monto: true, vencida: true }
      }
    }
  });
};

const getById = async (id) => {
  const jugador = await prisma.jugador.findUnique({
    where: { id },
    include: {
      cuotas: {
        include: {
          pagos: true
        }
      }
    }
  });
  if (!jugador) throw new Error('Jugador no encontrado');
  return jugador;
};

const create = async (data, userId) => {
  const jugador = await prisma.jugador.create({
    data: {
      nombre: data.nombre,
      categoria: data.categoria || 'SENIOR',
      edad: data.edad,
      telefono: data.telefono,
      email: data.email,
      fotoUrl: data.fotoUrl
    }
  });

  await historialService.create(userId, 'Jugador', jugador.id, 'creacion', null, JSON.stringify(jugador));
  return jugador;
};

const update = async (id, data, userId) => {
  const existing = await prisma.jugador.findUnique({ where: { id } });
  if (!existing) throw new Error('Jugador no encontrado');

  const updates = {};
  const fields = ['nombre', 'categoria', 'edad', 'telefono', 'email', 'fotoUrl', 'activo'];

  for (const field of fields) {
    if (data[field] !== undefined && data[field] !== existing[field]) {
      updates[field] = data[field];
      await historialService.create(userId, 'Jugador', id, field, String(existing[field]), String(data[field]));
    }
  }

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  const jugador = await prisma.jugador.update({
    where: { id },
    data: updates
  });

  return jugador;
};

const remove = async (id) => {
  const jugador = await prisma.jugador.findUnique({ where: { id } });
  if (!jugador) throw new Error('Jugador no encontrado');

  await prisma.jugador.delete({ where: { id } });
  return { message: 'Jugador eliminado correctamente' };
};

const getHistorial = async (id) => {
  const jugador = await prisma.jugador.findUnique({ where: { id } });
  if (!jugador) throw new Error('Jugador no encontrado');

  return prisma.historialCambios.findMany({
    where: { entidad: 'Jugador', entidadId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { nombre: true } } }
  });
};

const getRecientes = async (limit = 5) => {
  return prisma.jugador.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

module.exports = { getAll, getById, create, update, remove, getHistorial, getRecientes };