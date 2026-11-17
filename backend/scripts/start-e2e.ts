import { startTestDatabase } from '../tests/support/test-database.js';

const database = await startTestDatabase();
process.env.DATABASE_URL = database.url;

await import('../src/server.js');
