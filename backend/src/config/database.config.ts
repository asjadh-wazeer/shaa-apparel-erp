import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '3306', 10),
  name: process.env.DATABASE_NAME ?? 'shaa_erp_db',
  user: process.env.DATABASE_USER ?? 'erp_user',
  password: process.env.DATABASE_PASSWORD,
}));
