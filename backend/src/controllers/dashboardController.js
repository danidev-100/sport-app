const prisma = require('../config/database');
const { paginate, paginatedResponse } = require('../utils/helpers');

const getMetricas = async (req, res, next) => {
  try {
    const totalJugadores = await prisma.jugador.count();
    const jugadoresActivos = await prisma.jugador.count({ where: { activo: true } });

    const ingresos = await prisma.pago.findMany({
      select: { monto: true }
    });
    const totalIngresos = ingresos.reduce((sum, p) => sum + parseFloat(p.monto), 0);

    // Cuotas impagas (con o sin vencimiento)
    const cuotasImpagas = await prisma.cuota.findMany({
      where: { pagos: { none: {} } },
      include: { pagos: { select: { id: true } } }
    });
    const totalMorosos = [...new Set(cuotasImpagas.map(c => c.jugadorId))].length;

    res.json({
      totalJugadores,
      jugadoresActivos,
      totalIngresos: parseFloat(totalIngresos.toFixed(2)),
      totalMorosos
    });
  } catch (error) {
    next(error);
  }
};

const getCuotasGrafico = async (req, res, next) => {
  try {
    const anio = parseInt(req.query.anio) || new Date().getFullYear();

    // Single query: fetch all cuotas for the year with their payments
    const cuotas = await prisma.cuota.findMany({
      where: { anio },
      include: { pagos: { select: { id: true } } },
    });

    const meses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const pagadas = [];
    const pendientes = [];

    // Process in-memory instead of 12 DB queries
    for (const mes of meses) {
      const cuotasDelMes = cuotas.filter(c => c.mes === mes);
      const pagadasCount = cuotasDelMes.filter(c => c.pagos.length > 0).length;
      const pendientesCount = cuotasDelMes.filter(c => c.pagos.length === 0).length;
      pagadas.push(pagadasCount);
      pendientes.push(pendientesCount);
    }

    res.json({
      meses: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dec'],
      pagadas,
      pendientes
    });
  } catch (error) {
    next(error);
  }
};

const getRecientes = async (req, res, next) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit || 5);

    const [jugadores, total] = await Promise.all([
      prisma.jugador.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nombre: true,
          edad: true,
          createdAt: true
        }
      }),
      prisma.jugador.count(),
    ]);

    res.json(paginatedResponse(jugadores, total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getMorosos = async (req, res, next) => {
  try {
    // Cuotas impagas (sin pago registrado, estén vencidas o no)
    const cuotasAdeudadas = await prisma.cuota.findMany({
      where: { pagos: { none: {} } },
      include: {
        jugador: { select: { id: true, nombre: true, categoria: true } },
        pagos: { select: { id: true } }
      }
    });

    const morososMap = {};
    const CAT_ORDER = ['C7', 'C11', 'C13', 'C15', 'C17', 'C20', 'PRIMERA', 'SENIOR', 'VETERANO'];

    for (const cuota of cuotasAdeudadas) {
      const jugadorId = cuota.jugadorId;
      if (!morososMap[jugadorId]) {
        morososMap[jugadorId] = {
          jugador: cuota.jugador,
          cuotasPendientes: 0,
          totalAdeudado: 0,
          cuotas: []
        };
      }
      morososMap[jugadorId].cuotasPendientes += 1;
      morososMap[jugadorId].totalAdeudado += parseFloat(cuota.monto);
      morososMap[jugadorId].cuotas.push({
        mes: cuota.mes,
        anio: cuota.anio,
        monto: parseFloat(cuota.monto),
        vence: cuota.fechaVencimiento,
      });
    }

    const morosos = Object.values(morososMap).map(m => ({
      ...m,
      totalAdeudado: parseFloat(m.totalAdeudado.toFixed(2))
    }));

    // Agrupar por categoría
    const porCategoria = {};
    for (const m of morosos) {
      const cat = m.jugador.categoria || 'SIN CATEGORIA';
      if (!porCategoria[cat]) porCategoria[cat] = [];
      porCategoria[cat].push(m);
    }

    // Ordenar categorías
    const categorias = CAT_ORDER.filter(c => porCategoria[c]).map(c => ({
      categoria: c,
      jugadores: porCategoria[c],
      total: porCategoria[c].reduce((s, j) => s + j.totalAdeudado, 0),
      cantidad: porCategoria[c].length,
    }));

    res.json({ morosos, porCategoria: categorias });
  } catch (error) {
    next(error);
  }
};

const getIngresosMensuales = async (req, res, next) => {
  try {
    const pagos = await prisma.pago.findMany({
      select: { monto: true, fechaPago: true }
    });

    // Group by year/month in JS
    const grupos = {};
    for (const p of pagos) {
      const d = new Date(p.fechaPago);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!grupos[key]) {
        grupos[key] = { anio: d.getFullYear(), mes: d.getMonth() + 1, total: 0 };
      }
      grupos[key].total += parseFloat(p.monto);
    }

    const resultados = Object.values(grupos).sort((a, b) =>
      b.anio - a.anio || b.mes - a.mes
    );

    // Round totals
    resultados.forEach(r => { r.total = parseFloat(r.total.toFixed(2)); });

    res.json(resultados);
  } catch (error) {
    next(error);
  }
};

module.exports = { getMetricas, getCuotasGrafico, getRecientes, getMorosos, getIngresosMensuales };
