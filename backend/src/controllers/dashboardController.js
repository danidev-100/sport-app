const prisma = require('../config/database');

const getMetricas = async (req, res) => {
  try {
    const totalJugadores = await prisma.jugador.count();
    const jugadoresActivos = await prisma.jugador.count({ where: { activo: true } });

    const ingresos = await prisma.pago.findMany({
      select: { monto: true }
    });
    const totalIngresos = ingresos.reduce((sum, p) => sum + parseFloat(p.monto), 0);

    // Cuotas vencidas sin pagar → morosos reales
    const cuotasVencidas = await prisma.cuota.findMany({
      where: { vencida: true },
      include: { pagos: { select: { id: true } } }
    });
    const cuotasSinPago = cuotasVencidas.filter(c => c.pagos.length === 0);
    const totalMorosos = [...new Set(cuotasSinPago.map(c => c.jugadorId))].length;

    res.json({
      totalJugadores,
      jugadoresActivos,
      totalIngresos: parseFloat(totalIngresos.toFixed(2)),
      totalMorosos
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCuotasGrafico = async (req, res) => {
  try {
    const anio = parseInt(req.query.anio) || new Date().getFullYear();

    const meses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const pagadas = [];
    const pendientes = [];

    for (const mes of meses) {
      const cuotas = await prisma.cuota.findMany({
        where: { mes, anio },
        include: { pagos: { select: { id: true } } }
      });

      const pagadasCount = cuotas.filter(c => c.pagos.length > 0).length;
      const pendientesCount = cuotas.filter(c => c.vencida && c.pagos.length === 0).length;

      pagadas.push(pagadasCount);
      pendientes.push(pendientesCount);
    }

    res.json({
      meses: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dec'],
      pagadas,
      pendientes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecientes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const jugadores = await prisma.jugador.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        nombre: true,
        posicion: true,
        edad: true,
        createdAt: true
      }
    });

    res.json({ jugadores });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMorosos = async (req, res) => {
  try {
    // Cuotas vencidas SIN pago asociado
    const cuotasAdeudadas = await prisma.cuota.findMany({
      where: { vencida: true },
      include: {
        jugador: { select: { id: true, nombre: true } },
        pagos: { select: { id: true } }
      }
    });

    const morososMap = {};

    for (const cuota of cuotasAdeudadas) {
      if (cuota.pagos.length > 0) continue; // ya fue pagada, saltar

      const jugadorId = cuota.jugadorId;
      if (!morososMap[jugadorId]) {
        morososMap[jugadorId] = {
          jugador: cuota.jugador,
          cuotasPendientes: 0,
          totalAdeudado: 0
        };
      }
      morososMap[jugadorId].cuotasPendientes += 1;
      morososMap[jugadorId].totalAdeudado += parseFloat(cuota.monto);
    }

    const morosos = Object.values(morososMap).map(m => ({
      ...m,
      totalAdeudado: parseFloat(m.totalAdeudado.toFixed(2))
    }));

    res.json({ morosos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMetricas, getCuotasGrafico, getRecientes, getMorosos };
