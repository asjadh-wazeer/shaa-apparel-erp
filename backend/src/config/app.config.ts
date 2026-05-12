import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT ?? '3001', 10),
  name: process.env.APP_NAME ?? 'SHAA Apparel ERP',
  version: process.env.APP_VERSION ?? '1.0.0',
  frontendUrl: process.env.APP_FRONTEND_URL ?? 'http://localhost:3000',
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(','),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  logLevel: process.env.LOG_LEVEL ?? 'debug',
  logPrettyPrint: process.env.LOG_PRETTY_PRINT === 'true',
}));
