import path from 'node:path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export default {
  earlyAccess: true,
  schema: path.join(import.meta.dirname, 'schema.prisma'),
  migrate: {
    adapter: async () => adapter,
  },
  client: {
    adapter: () => adapter,
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};