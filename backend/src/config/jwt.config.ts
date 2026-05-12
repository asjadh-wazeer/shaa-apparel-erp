import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'fallback-access-secret-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'fallback-refresh-secret-change-in-production',
  accessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
}));
