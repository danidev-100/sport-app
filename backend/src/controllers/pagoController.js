const prisma = require('../config/database');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { validationResult } = require('express-validator');
const { NotFoundError } = require('../utils/errors');

const getAll = async (req, res, next) => {
  try {
    const { cuotaId, fechaDesde, fechaHasta } = req.query;
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};

    if (cuotaId) where.cuotaId = cuotaId;
    if (fechaDesde || fechaHasta) {
      where.fechaPago = {};
      if (fechaDesde) where.fechaPago.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaPago.lte = new Date(fechaHasta);
    }

    const [pagos, total] = await Promise.all([
      prisma.pago.findMany({
        where,
        skip,
        take,
        orderBy: { fechaPago: 'desc' },
        include: {
          cuota: {
            include: {
              jugador: { select: { id: true, nombre: true } }
            }
          }
        }
      }),
      prisma.pago.count({ where }),
    ]);
    res.json(paginatedResponse(pagos, total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const pago = await prisma.pago.findUnique({
      where: { id: req.params.id },
      include: { cuota: { include: { jugador: true } } }
    });
    if (!pago) throw new NotFoundError('Pago no encontrado');
    res.json({ pago });
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

    const { cuotaId, monto, metodoPago, observacion } = req.body;

    const cuota = await prisma.cuota.findUnique({
      where: { id: cuotaId },
      include: { pagos: true }
    });
    if (!cuota) throw new NotFoundError('Cuota no encontrada');

    const totalPagado = cuota.pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const totalPagar = parseFloat(cuota.monto);

    const pago = await prisma.pago.create({
      data: {
        cuotaId,
        monto,
        metodoPago,
        observacion
      }
    });

    const nuevoTotalPagado = totalPagado + monto;
    const vencida = nuevoTotalPagado >= totalPagar;

    await prisma.cuota.update({
      where: { id: cuotaId },
      data: { vencida }
    });

    const cuotaActualizada = await prisma.cuota.findUnique({
      where: { id: cuotaId },
      include: { jugador: true }
    });

    res.status(201).json({ pago, cuota: cuotaActualizada });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const pago = await prisma.pago.findUnique({
      where: { id: req.params.id }
    });
    if (!pago) throw new NotFoundError('Pago no encontrado');

    await prisma.pago.delete({ where: { id: req.params.id } });

    const cuota = await prisma.cuota.findUnique({
      where: { id: pago.cuotaId },
      include: { pagos: true }
    });

    const totalPagado = cuota.pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const vencida = totalPagado < parseFloat(cuota.monto);

    await prisma.cuota.update({
      where: { id: pago.cuotaId },
      data: { vencida }
    });

    res.json({ message: 'Pago eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, remove };
