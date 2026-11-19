import fs from 'node:fs';
import path from 'node:path';

const envFile = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  try {
    process.loadEnvFile(envFile);
  } catch {
    // Если файл .env недоступен, используются значения по умолчанию.
  }
}

function numberFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const isProduction = process.env.NODE_ENV === 'production';
const accessSecret = process.env.ACCESS_TOKEN_SECRET ?? 'dev-access-secret-change-me';
const refreshSecret = process.env.REFRESH_TOKEN_SECRET ?? 'dev-refresh-secret-change-me';

if (isProduction && (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET)) {
  throw new Error('В production необходимо задать ACCESS_TOKEN_SECRET и REFRESH_TOKEN_SECRET');
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction,
  port: numberFromEnv('PORT', 4000),
  accessSecret,
  refreshSecret,
  accessTtl: numberFromEnv('ACCESS_TOKEN_TTL', 15 * 60),
  refreshTtl: numberFromEnv('REFRESH_TOKEN_TTL', 7 * 24 * 60 * 60),
  dbFile: path.resolve(process.cwd(), 'back/prisma/dev.db'),
  frontDist: path.resolve(process.cwd(), 'front/dist'),
  refreshCookieName: 'edem_refresh',
} as const;
