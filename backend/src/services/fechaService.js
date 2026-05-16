const prisma = require('../config/database');

const getAll = async (filters = {}) => {
  const where = {};

  if (filters.fechaDesde || filters.fechaHasta) {
    where.fecha = {};
    if (filters.fechaDesde) where.fecha.gte = new Date(filters.fechaDesde);
    if (filters.fechaHasta) where.fecha.lte = new Date(filters.fechaHasta);
  }

  return prisma.fecha.findMany({
    where,
    include: {
      ingresos: { orderBy: { createdAt: 'desc' } },
      gastos: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { fecha: 'desc' },
  });
};

const getById = async (id) => {
  const fecha = await prisma.fecha.findUnique({
    where: { id },
    include: {
      ingresos: { orderBy: { createdAt: 'desc' } },
      gastos: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!fecha) throw new Error('Fecha no encontrada');
  return fecha;
};

const create = async (data) => {
  const payload = {
    titulo: data.titulo,
    fecha: data.fecha ? new Date(data.fecha) : new Date(),
  };
  return prisma.fecha.create({ data: payload });
};

const update = async (id, data) => {
  const existing = await prisma.fecha.findUnique({ where: { id } });
  if (!existing) throw new Error('Fecha no encontrada');

  const payload = {};
  if (data.titulo) payload.titulo = data.titulo;
  if (data.fecha) payload.fecha = new Date(data.fecha);

  return prisma.fecha.update({ where: { id }, data: payload });
};

const remove = async (id) => {
  await prisma.fecha.delete({ where: { id } });
  return { message: 'Fecha eliminada correctamente' };
};

module.exports = { getAll, getById, create, update, remove };
