import { fileURLToPath } from 'node:url';

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  dbFile: process.env.DB_FILE || fileURLToPath(new URL('../data.sqlite', import.meta.url)),
};
