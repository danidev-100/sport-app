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

  return prisma.ingreso.findMany({
    where,
    orderBy: { fecha: 'desc' }
  });
};

const getById = async (id) => {
  const ingreso = await prisma.ingreso.findUnique({ where: { id } });
  if (!ingreso) throw new Error('Ingreso no encontrado');
  return ingreso;
};

const create = async (data) => {
  const payload = { ...data };
  if (payload.fecha) payload.fecha = new Date(payload.fecha);
  return prisma.ingreso.create({ data: payload });
};

const update = async (id, data) => {
  const existing = await prisma.ingreso.findUnique({ where: { id } });
  if (!existing) throw new Error('Ingreso no encontrado');

  const payload = { ...data };
  if (payload.fecha) payload.fecha = new Date(payload.fecha);

  return prisma.ingreso.update({ where: { id }, data: payload });
};

const remove = async (id) => {
  await prisma.ingreso.delete({ where: { id } });
  return { message: 'Ingreso eliminado correctamente' };
};

const getTotal = async () => {
  const result = await prisma.ingreso.aggregate({ _sum: { monto: true } });
  return Number(result._sum.monto || 0);
};

module.exports = { getAll, getById, create, update, remove, getTotal };
