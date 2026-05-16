const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // Check if Pago table has data
    const count = await prisma.pago.count();
    console.log('Pago count:', count);

    // Try the raw query
    const resultados = await prisma.$queryRawUnsafe(`
      SELECT
        EXTRACT(YEAR FROM "fechaPago")::int AS anio,
        EXTRACT(MONTH FROM "fechaPago")::int AS mes,
        SUM(monto)::numeric(10,2) AS total
      FROM "Pago"
      GROUP BY anio, mes
      ORDER BY anio DESC, mes DESC
    `);
    console.log('Resultados:', JSON.stringify(resultados, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
