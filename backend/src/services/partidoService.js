const prisma = require('../config/database');

const getAll = async () => {
  return prisma.partido.findMany({
    include: {
      ingresos: { orderBy: { createdAt: 'desc' } },
      gastos: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getById = async (id) => {
  const partido = await prisma.partido.findUnique({
    where: { id },
    include: {
      ingresos: { orderBy: { createdAt: 'desc' } },
      gastos: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!partido) throw new Error('Partido no encontrado');
  return partido;
};

const create = async (data) => {
  return prisma.partido.create({
    data: { titulo: data.titulo },
    include: { ingresos: true, gastos: true },
  });
};

const update = async (id, data) => {
  const existing = await prisma.partido.findUnique({ where: { id } });
  if (!existing) throw new Error('Partido no encontrado');
  return prisma.partido.update({
    where: { id },
    data: { titulo: data.titulo },
  });
};

const remove = async (id) => {
  await prisma.partido.delete({ where: { id } });
  return { message: 'Partido eliminado correctamente' };
};

module.exports = { getAll, getById, create, update, remove };
