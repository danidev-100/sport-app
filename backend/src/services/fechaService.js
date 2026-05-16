const prisma = require('../config/database');

const getAll = async () => {
  return prisma.fecha.findMany({
    include: {
      ingresos: { orderBy: { createdAt: 'desc' } },
      gastos: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
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
  return prisma.fecha.create({
    data: { titulo: data.titulo },
    include: { ingresos: true, gastos: true },
  });
};

const update = async (id, data) => {
  const existing = await prisma.fecha.findUnique({ where: { id } });
  if (!existing) throw new Error('Fecha no encontrada');
  return prisma.fecha.update({
    where: { id },
    data: { titulo: data.titulo },
  });
};

const remove = async (id) => {
  await prisma.fecha.delete({ where: { id } });
  return { message: 'Fecha eliminada correctamente' };
};

module.exports = { getAll, getById, create, update, remove };
