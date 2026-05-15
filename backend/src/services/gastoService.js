const prisma = require('../config/database');

const getAll = async (filters = {}) => {
  const where = {};

  if (filters.fechaDesde || filters.fechaHasta) {
    where.fecha = {};
    if (filters.fechaDesde) where.fecha.gte = new Date(filters.fechaDesde);
    if (filters.fechaHasta) where.fecha.lte = new Date(filters.fechaHasta);
  }

  if (filters.partidoId) {
    where.partidoId = filters.partidoId;
  }

  return prisma.gasto.findMany({
    where,
    orderBy: { fecha: 'desc' }
  });
};

const getById = async (id) => {
  const gasto = await prisma.gasto.findUnique({ where: { id } });
  if (!gasto) throw new Error('Gasto no encontrado');
  return gasto;
};

const create = async (data) => {
  const payload = { ...data };
  if (payload.fecha) payload.fecha = new Date(payload.fecha);
  return prisma.gasto.create({ data: payload });
};

const update = async (id, data) => {
  const existing = await prisma.gasto.findUnique({ where: { id } });
  if (!existing) throw new Error('Gasto no encontrado');

  const payload = { ...data };
  if (payload.fecha) payload.fecha = new Date(payload.fecha);

  return prisma.gasto.update({ where: { id }, data: payload });
};

const remove = async (id) => {
  await prisma.gasto.delete({ where: { id } });
  return { message: 'Gasto eliminado correctamente' };
};

const getTotal = async () => {
  const result = await prisma.gasto.aggregate({ _sum: { monto: true } });
  return Number(result._sum.monto || 0);
};

module.exports = { getAll, getById, create, update, remove, getTotal };
