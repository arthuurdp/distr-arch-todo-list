import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || '5D9YXeYjGIvdzUJiUS6Wf9cajYbRQOPqx9QAKq7w1w7',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS) || 7,
  cookieSecure: process.env.COOKIE_SECURE === 'true',
};

export type AuthConfig = Pick<
  typeof config,
  'jwtSecret' | 'jwtExpiresIn' | 'refreshTokenDays' | 'cookieSecure'
>;
