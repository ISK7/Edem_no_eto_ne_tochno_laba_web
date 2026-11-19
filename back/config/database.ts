import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Абсолютный путь к SQLite-файлу не зависит от того, откуда запущен процесс.
const databaseUrl = `file:${env.dbFile.replace(/\\/g, '/')}`;

export const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
  log: env.isProduction ? ['error'] : ['warn', 'error'],
});
