import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

export function notFoundApi(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: 'API-метод не найден', code: 'NOT_FOUND' } });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: 'Страница не найдена', code: 'NOT_FOUND' } });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.status).json({
      error: {
        message: error.message,
        fields: error.fields,
        code: error.code,
      },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = String(error.meta?.target ?? '');
    const fields: Record<string, string> = {};
    if (target.includes('login')) fields.login = 'Этот логин уже занят';
    if (target.includes('email')) fields.email = 'Эта почта уже используется';

    res.status(409).json({
      error: {
        message: 'Запись с такими данными уже существует',
        fields: Object.keys(fields).length > 0 ? fields : undefined,
        code: 'CONFLICT',
      },
    });
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      error: { message: 'Некорректный формат JSON', code: 'INVALID_JSON' },
    });
    return;
  }

  console.error('[api] Необработанная ошибка:', error);
  res.status(500).json({
    error: {
      message: env.isProduction
        ? 'Внутренняя ошибка сервера'
        : error instanceof Error
          ? error.message
          : 'Внутренняя ошибка сервера',
      code: 'INTERNAL_ERROR',
    },
  });
}
