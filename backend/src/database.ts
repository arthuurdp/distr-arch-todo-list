import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

export function createPrismaClient(connectionString: string | undefined): PrismaClient {
  if (!connectionString) {
    throw new Error('DATABASE_URL não definida. Copie .env.example para .env.');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export type { PrismaClient };
