const prisma = require('../config/database');

const getAll = async (filters = {}, skip = 0, take = 25) => {
  const where = {};

  if (filters.jugadorId) {
    where.jugadorId = filters.jugadorId;
  }

  if (filters.anio) {
    where.anio = parseInt(filters.anio);
  }

  if (filters.vencida !== undefined) {
    where.vencida = filters.vencida === 'true';
  }

  const [cuotas, total] = await Promise.all([
    prisma.cuota.findMany({
      where,
      skip,
      take,
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
      include: {
        jugador: { select: { id: true, nombre: true } },
        pagos: true
      }
    }),
    prisma.cuota.count({ where }),
  ]);

  return { cuotas, total };
};

const getById = async (id) => {
  const cuota = await prisma.cuota.findUnique({
    where: { id },
    include: {
      jugador: true,
      pagos: true
    }
  });
  if (!cuota) throw new Error('Cuota no encontrada');
  return cuota;
};

const create = async (data) => {
  const jugador = await prisma.jugador.findUnique({ where: { id: data.jugadorId } });
  if (!jugador) throw new Error('Jugador no encontrado');

  const existing = await prisma.cuota.findUnique({
    where: {
      jugadorId_mes_anio: {
        jugadorId: data.jugadorId,
        mes: data.mes,
        anio: data.anio
      }
    }
  });

  if (existing) {
    // Actualizar cuota existente (auto-creada como placeholder con monto=0)
    return prisma.cuota.update({
      where: { id: existing.id },
      data: {
        monto: data.monto,
        fechaVencimiento: new Date(data.fechaVencimiento)
      }
    });
  }

  return prisma.cuota.create({
    data: {
      jugadorId: data.jugadorId,
      mes: data.mes,
      anio: data.anio,
      monto: data.monto,
      fechaVencimiento: new Date(data.fechaVencimiento)
    }
  });
};

const update = async (id, data) => {
  const existing = await prisma.cuota.findUnique({ where: { id } });
  if (!existing) throw new Error('Cuota no encontrada');

  const updates = {};
  if (data.monto !== undefined) updates.monto = data.monto;
  if (data.fechaVencimiento !== undefined) updates.fechaVencimiento = new Date(data.fechaVencimiento);

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  return prisma.cuota.update({
    where: { id },
    data: updates
  });
};

const remove = async (id) => {
  const cuota = await prisma.cuota.findUnique({ where: { id } });
  if (!cuota) throw new Error('Cuota no encontrada');

  await prisma.cuota.delete({ where: { id } });
  return { message: 'Cuota eliminada correctamente' };
};

const generarMensuales = async (mes, anio, monto) => {
  const jugadores = await prisma.jugador.findMany({
    where: { activo: true }
  });

  const fechaVencimiento = new Date(anio, mes - 1, 5);

  const cuotas = [];
  for (const jugador of jugadores) {
    const existing = await prisma.cuota.findUnique({
      where: {
        jugadorId_mes_anio: {
          jugadorId: jugador.id,
          mes,
          anio
        }
      }
    });

    if (existing) {
      // Actualizar cuota placeholder (monto=0) con el monto real
      const cuota = await prisma.cuota.update({
        where: { id: existing.id },
        data: { monto, fechaVencimiento }
      });
      cuotas.push(cuota);
    } else {
      const cuota = await prisma.cuota.create({
        data: {
          jugadorId: jugador.id,
          mes,
          anio,
          monto,
          fechaVencimiento
        }
      });
      cuotas.push(cuota);
    }
  }

  return cuotas;
};

const crearParaJugador = async (jugadorId, mes, anio, monto) => {
  const jugador = await prisma.jugador.findUnique({ where: { id: jugadorId } });
  if (!jugador) throw new Error('Jugador no encontrado');

  const fechaVencimiento = new Date(anio, mes - 1, 5);

  // Buscar si ya existe una cuota auto-creada (placeholder con monto=0)
  let cuota = await prisma.cuota.findUnique({
    where: {
      jugadorId_mes_anio: {
        jugadorId,
        mes,
        anio
      }
    }
  });

  if (cuota) {
    // Actualizar monto de la cuota existente
    cuota = await prisma.cuota.update({
      where: { id: cuota.id },
      data: { monto, fechaVencimiento }
    });
  } else {
    cuota = await prisma.cuota.create({
      data: { jugadorId, mes, anio, monto, fechaVencimiento }
    });
  }

  // Crear pago para marcarla como pagada
  const pago = await prisma.pago.create({
    data: {
      cuotaId: cuota.id,
      monto,
      fechaPago: new Date(),
      metodoPago: 'GENERADA_ADMIN',
      observacion: 'Pago automático al generar cuota'
    }
  });

  // Actualizar estado vencida según total pagado
  const pagos = await prisma.pago.findMany({ where: { cuotaId: cuota.id } });
  const totalPagado = pagos.reduce((s, p) => s + parseFloat(p.monto), 0);
  const vencida = totalPagado >= parseFloat(cuota.monto || 0);

  await prisma.cuota.update({ where: { id: cuota.id }, data: { vencida } });

  // Devolver la cuota junto al pago creado
  return {
    cuota: await prisma.cuota.findUnique({
      where: { id: cuota.id },
      include: { pagos: true, jugador: true }
    }),
    pago
  };
};

const getMorosos = async () => {
  const cuotasVencidas = await prisma.cuota.findMany({
    where: {
      vencida: true,
      pagos: { none: {} }
    },
    include: {
      jugador: true
    }
  });

  const jugadorMap = {};
  for (const cuota of cuotasVencidas) {
    if (!jugadorMap[cuota.jugadorId]) {
      jugadorMap[cuota.jugadorId] = {
        jugador: cuota.jugador,
        cuotasPendientes: 0,
        totalAdeudado: 0
      };
    }
    jugadorMap[cuota.jugadorId].cuotasPendientes += 1;
    jugadorMap[cuota.jugadorId].totalAdeudado += parseFloat(cuota.monto);
  }

  return Object.values(jugadorMap);
};

const generarMasivas = async (mes, anio, montosPorCategoria = {}) => {
  const jugadores = await prisma.jugador.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      categoria: true,
      cuotas: {
        where: { mes, anio },
        select: { id: true }
      }
    }
  });

  const resultado = { generadas: 0, omitidas: 0, errores: [] };

  const data = [];
  for (const jugador of jugadores) {
    // Skip if they already have a cuota for this period
    if (jugador.cuotas.length > 0) {
      resultado.omitidas++;
      continue;
    }

    // Get monto for this category, or default
    const monto = montosPorCategoria[jugador.categoria] || 25000;

    data.push({
      jugadorId: jugador.id,
      mes,
      anio,
      monto,
      fechaVencimiento: new Date(anio, mes - 1, 15), // 15th of the month
    });
  }

  if (data.length > 0) {
    await prisma.cuota.createMany({ data });
    resultado.generadas = data.length;
  }

  return resultado;
};

module.exports = { getAll, getById, create, update, remove, generarMensuales, crearParaJugador, getMorosos, generarMasivas };
