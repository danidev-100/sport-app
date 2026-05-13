const prisma = require('../config/database');
const { validationResult } = require('express-validator');

const getAll = async (req, res) => {
  try {
    const { cuotaId, fechaDesde, fechaHasta } = req.query;
    const where = {};

    if (cuotaId) where.cuotaId = cuotaId;
    if (fechaDesde || fechaHasta) {
      where.fechaPago = {};
      if (fechaDesde) where.fechaPago.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaPago.lte = new Date(fechaHasta);
    }

    const pagos = await prisma.pago.findMany({
      where,
      orderBy: { fechaPago: 'desc' },
      include: {
        cuota: {
          include: {
            jugador: { select: { id: true, nombre: true } }
          }
        }
      }
    });
    res.json({ pagos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const pago = await prisma.pago.findUnique({
      where: { id: req.params.id },
      include: { cuota: { include: { jugador: true } } }
    });
    if (!pago) throw new Error('Pago no encontrado');
    res.json({ pago });
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

    const { cuotaId, monto, metodoPago, observacion } = req.body;

    const cuota = await prisma.cuota.findUnique({
      where: { id: cuotaId },
      include: { pagos: true }
    });
    if (!cuota) throw new Error('Cuota no encontrada');

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
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const pago = await prisma.pago.findUnique({
      where: { id: req.params.id }
    });
    if (!pago) throw new Error('Pago no encontrado');

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
    res.status(404).json({ message: error.message });
  }
};

module.exports = { getAll, getById, create, remove };