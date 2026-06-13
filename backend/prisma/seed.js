const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.pago.deleteMany();
  await prisma.cuota.deleteMany();
  await prisma.historialCambios.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.gasto.deleteMany();
  await prisma.ingreso.deleteMany();
  await prisma.partido.deleteMany();
  await prisma.jugador.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@club.com',
      password: adminPassword,
      nombre: 'Admin',
      rol: 'ADMIN',
    },
  });
  console.log(`  ✅ Admin user: admin@club.com / admin123`);

  // Create editor user
  const editorPassword = await bcrypt.hash('editor123', 10);
  await prisma.user.create({
    data: {
      email: 'editor@club.com',
      password: editorPassword,
      nombre: 'Editor',
      rol: 'EDITOR',
    },
  });
  console.log(`  ✅ Editor user: editor@club.com / editor123`);

  // Create jugadores with categories
  const categorias = ['C7', 'C11', 'C13', 'C15', 'C17', 'C20', 'PRIMERA', 'SENIOR', 'VETERANO'];
  const jugadores = [];
  for (let i = 0; i < 10; i++) {
    const cat = categorias[i % categorias.length];
    const jugador = await prisma.jugador.create({
      data: {
        nombre: `Jugador ${i + 1}`,
        categoria: cat,
        edad: 15 + i,
        telefono: `+54 11 5555-${String(1000 + i).slice(1)}`,
        email: `jugador${i + 1}@email.com`,
        activo: true,
      },
    });
    jugadores.push(jugador);
  }
  console.log(`  ✅ 10 jugadores creados`);

  // Create cuotas for current year (last 3 months)
  const now = new Date();
  const year = now.getFullYear();
  for (let m = 1; m <= 3; m++) {
    const mes = now.getMonth() - m + 1;
    if (mes <= 0) continue;

    for (const jugador of jugadores) {
      await prisma.cuota.create({
        data: {
          jugadorId: jugador.id,
          mes,
          anio: year,
          monto: 25000,
          fechaVencimiento: new Date(year, mes, 15),
        },
      });
    }
  }
  console.log(`  ✅ Cuotas creadas para últimos 3 meses`);

  // Create a partido with ingresos and gastos
  const partido = await prisma.partido.create({
    data: { titulo: 'Partido amistoso vs Club Vecino' },
  });

  await prisma.ingreso.createMany({
    data: [
      { descripcion: 'Entradas generales', monto: 45000, partidoId: partido.id },
      { descripcion: 'Cantina', monto: 12000, partidoId: partido.id },
    ],
  });

  await prisma.gasto.createMany({
    data: [
      { descripcion: 'Alquiler de cancha', monto: 20000, partidoId: partido.id },
      { descripcion: 'Árbitro', monto: 8000, partidoId: partido.id },
    ],
  });
  console.log(`  ✅ Partido con ingresos/gastos creado`);

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
