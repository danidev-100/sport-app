const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.pago.count();
    console.log('Pago count:', count);
    
    const sample = await prisma.pago.findMany({ take: 5 });
    console.log('Sample pagos:', JSON.stringify(sample, null, 2));
    
    // Also check Ingreso table
    const ingCount = await prisma.ingreso.count();
    console.log('Ingreso count:', ingCount);
    const ingSample = await prisma.ingreso.findMany({ take: 5 });
    console.log('Sample ingresos:', JSON.stringify(ingSample, null, 2));
    
  } catch(err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
check();
