require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CATEGORIAS = ['C7', 'C11', 'C13', 'C15', 'C17', 'C20', 'PRIMERA', 'SENIOR', 'VETERANO'];
const POSICIONES = ['PORTERO', 'DEFENSA', 'CENTROCAMPISTA', 'DELANTERO'];
const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO'];

const MONTO_CUOTA = 20000;

const nombres = [
  'Lautaro Martínez', 'Matías Gómez', 'Facundo Pérez', 'Ignacio Rodríguez', 'Santiago López',
  'Benjamín Torres', 'Joaquín Fernández', 'Nicolás Álvarez', 'Tomás Silva', 'Franco Díaz',
  'Valentino Romero', 'Bautista Morales', 'Thiago Castillo', 'Santino Ortiz', 'Bruno Vargas',
  'Mateo Mendoza', 'Felipe Ríos', 'Juan Cruz Navarro', 'Lucas Campos', 'Emiliano Vega',
  'Maximiliano Herrera', 'Gonzalo Medina', 'Alejandro Guerrero', 'Manuel Aguirre', 'Agustín Paz',
  'Rodrigo Farías', 'Julián Acosta', 'Luciano Benítez', 'Federico Delgado', 'Esteban Paredes',
  'Cristian Fuentes', 'Diego Carrasco', 'Marcos Ramos', 'Pablo Sosa', 'Leonardo Molina',
  'Hugo Roldán', 'Adrián Vega', 'Mauro Correa', 'Claudio Muñoz', 'Germán Navarro',
  'Luis Peralta', 'Ramiro Godoy', 'Alan Bustos', 'Enzo Ferreyra', 'Sebastián Miranda',
  'Iván Cáceres', 'Brian Domínguez', 'Kevin Olivera', 'Alexis Villar', 'Darío Ponce',
  'Gabriel Rivas', 'Héctor Luna', 'Ricardo Rey', 'Francisco Peña', 'Daniel Quiroga',
  'Oscar Suárez', 'Víctor Escobar', 'Raúl Beltrán', 'Alberto Ferreyra', 'Jorge Corvalán',
  'Miguel Ángel Ríos', 'Pedro Figueroa', 'Andrés Ibáñez', 'Carlos Vera', 'Eduardo Méndez',
  'Sergio Ojeda', 'Fernando Carmona', 'Humberto Lagos', 'Rafael Pereira', 'Mauricio Cárdenas',
  'Patricio Godoy', 'Rolando Valenzuela', 'Arturo Contreras', 'Ismael Rozas', 'Nelson Avendaño',
  'Simón Bravo', 'Mariano Sepúlveda', 'Ángel Vergara', 'David Cancino', 'Renato Farías',
  'Damián Riquelme', 'Jonathan Gutiérrez', 'Leandro Montero', 'Gustavo Campos', 'Javier Cruz',
  'César Medina', 'Luciano Farías', 'Emilio Valdés', 'José Luis Vega', 'Hernán Pizarro',
  'Alonso Salinas', 'Ignacio Ardiles', 'Salvador Toledo', 'Cristóbal Galván', 'Aarón Peñaloza',
];

function randomEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const args = process.argv.slice(2);
  const jugadoresPorCategoria = parseInt(args[0]) || 8;
  const mesesAcrear = parseInt(args[1]) || 5;
  const probabilidadPago = parseFloat(args[2]) || 0.6; // 60% de las cuotas pagas
  const anio = parseInt(args[3]) || new Date().getFullYear();

  console.log('═══════════════════════════════════');
  console.log('  🏟️  SEED DE DATOS DE PRUEBA');
  console.log('═══════════════════════════════════');
  console.log(`  Jugadores por categoría: ${jugadoresPorCategoria}`);
  console.log(`  Meses a crear:           ${mesesAcrear}`);
  console.log(`  Probabilidad de pago:    ${Math.round(probabilidadPago * 100)}%`);
  console.log(`  Año:                     ${anio}`);
  console.log(`  Monto por cuota:         $${MONTO_CUOTA.toLocaleString('es-AR')}`);
  console.log('───────────────────────────────────');

  console.log('\n🧹 Limpiando datos existentes...');
  await prisma.pago.deleteMany();
  await prisma.cuota.deleteMany();
  await prisma.jugador.deleteMany();
  console.log('✅ Limpiado\n');

  let idxNombre = 0;
  let totalCuotas = 0;
  let totalPagos = 0;

  for (const cat of CATEGORIAS) {
    console.log(`📋 ${cat} — creando ${jugadoresPorCategoria} jugadores...`);

    for (let i = 0; i < jugadoresPorCategoria; i++) {
      const nombre = idxNombre < nombres.length
        ? nombres[idxNombre++]
        : `Jugador ${cat} #${i + 1}`;

      const edad =
        cat === 'C7' ? randomEntre(6, 8) :
        cat === 'C11' ? randomEntre(10, 12) :
        cat === 'C13' ? randomEntre(12, 14) :
        cat === 'C15' ? randomEntre(14, 16) :
        cat === 'C17' ? randomEntre(16, 18) :
        cat === 'C20' ? randomEntre(18, 21) :
        cat === 'PRIMERA' ? randomEntre(20, 30) :
        cat === 'SENIOR' ? randomEntre(32, 40) :
        randomEntre(40, 55);

      const jugador = await prisma.jugador.create({
        data: {
          nombre,
          posicion: randomChoice(POSICIONES),
          categoria: cat,
          edad,
          activo: Math.random() > 0.08,
        },
      });

      for (let m = 1; m <= mesesAcrear; m++) {
        // Si "está pagada" → creamos Cuota + Pago
        // Si "está impaga" → NO creamos nada (así se puede generar después)
        if (Math.random() < probabilidadPago) {
          const fechaVto = new Date(anio, m - 1, 15);
          const yaPaso = new Date() > fechaVto;

          const cuota = await prisma.cuota.create({
            data: {
              jugadorId: jugador.id,
              mes: m,
              anio,
              monto: MONTO_CUOTA,
              vencida: yaPaso,
              fechaVencimiento: fechaVto,
              numeroIdentificacion: `${cat}-${i + 1}-${m}-${anio}`,
            },
          });
          totalCuotas++;

          const diasAntesVto = randomEntre(1, 14);
          const fechaPago = new Date(anio, m - 1, Math.min(14, Math.max(1, 15 - diasAntesVto)));

          await prisma.pago.create({
            data: {
              cuotaId: cuota.id,
              monto: MONTO_CUOTA,
              fechaPago,
              metodoPago: randomChoice(METODOS_PAGO),
            },
          });
          totalPagos++;
        }
        // Impaga: no se crea nada — el mes queda libre para generar después
      }
    }
  }

  const totalJugadores = jugadoresPorCategoria * CATEGORIAS.length;
  const totalMesesPosibles = totalJugadores * mesesAcrear;

  console.log('\n═══════════════════════════════════');
  console.log('  ✅ SEED COMPLETADO');
  console.log('───────────────────────────────────');
  console.log(`  Jugadores:        ${totalJugadores}`);
  console.log(`  Cuotas (pagas):   ${totalCuotas} (× $${MONTO_CUOTA.toLocaleString('es-AR')})`);
  console.log(`  Pagos:            ${totalPagos}`);
  console.log(`  Meses libres:     ${totalMesesPosibles - totalCuotas} (sin cuota — disponible para generar)`);
  console.log('═══════════════════════════════════\n');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
