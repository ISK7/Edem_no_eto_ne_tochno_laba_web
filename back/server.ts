import { createApp } from './app';
import { prisma } from './config/database';
import { env } from './config/env';

async function start() {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('');
    console.error('Не удалось подключиться к базе данных SQLite.');
    console.error(`Файл базы: ${env.dbFile}`);
    console.error('Выполните: npm run db:setup');
    console.error(error);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log('');
    console.log('  «Едем, но это не точно» — сервер запущен');
    console.log(`  API:    http://localhost:${env.port}/api`);
    console.log(
      env.isProduction
        ? `  Сайт:   http://localhost:${env.port}`
        : '  Сайт:   http://localhost:5173 (Vite)',
    );
    console.log('');
  });

  let closing = false;
  const shutdown = async (signal: string) => {
    if (closing) return;
    closing = true;
    console.log(`\nПолучен ${signal}. Останавливаем сервер…`);

    const forceExit = setTimeout(() => {
      console.error('Сервер не остановился за 10 секунд, завершаем принудительно.');
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void start();
