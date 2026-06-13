import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  // The actual DB is used — tests run against a real PostgreSQL
  // In CI, you'd use a separate test database
  process.env.DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URL;
});

afterAll(async () => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});
