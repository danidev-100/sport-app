const prisma = require('../config/database');

const create = async (userId, entidad, entidadId, campo, valorAnterior, valorNuevo) => {
  return prisma.historialCambios.create({
    data: {
      entidad,
      entidadId,
      campo,
      valorAnterior,
      valorNuevo,
      userId
    }
  });
};

const getByEntidad = async (entidad, entidadId) => {
  return prisma.historialCambios.findMany({
    where: { entidad, entidadId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { nombre: true } } }
  });
};

const getByUser = async (userId, limit = 50) => {
  return prisma.historialCambios.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

module.exports = { create, getByEntidad, getByUser };