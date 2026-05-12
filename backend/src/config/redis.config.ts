import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD ?? undefined,
  db: parseInt(process.env.REDIS_DB ?? '0', 10),
  ttlSeconds: parseInt(process.env.REDIS_TTL_SECONDS ?? '3600', 10),
  queueHost: process.env.QUEUE_REDIS_HOST ?? process.env.REDIS_HOST ?? 'localhost',
  queuePort: parseInt(process.env.QUEUE_REDIS_PORT ?? process.env.REDIS_PORT ?? '6379', 10),
  queuePassword: process.env.QUEUE_REDIS_PASSWORD ?? process.env.REDIS_PASSWORD ?? undefined,
}));
