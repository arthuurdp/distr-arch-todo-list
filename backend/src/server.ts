import { createApp } from './app.js';
import { config } from './config.js';
import { createPrismaClient } from './database.js';

const prisma = createPrismaClient(config.databaseUrl);
const app = createApp(prisma);

const server = app.listen(config.port, () => {
  console.log(`API rodando em http://localhost:${config.port}/api`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
