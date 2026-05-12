import { registerAs } from '@nestjs/config';

export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL_SECONDS ?? '60', 10) * 1000,
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  authTtl: parseInt(process.env.AUTH_THROTTLE_TTL_SECONDS ?? '60', 10) * 1000,
  authLimit: parseInt(process.env.AUTH_THROTTLE_LIMIT ?? '10', 10),
}));
