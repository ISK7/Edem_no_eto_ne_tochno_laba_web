import type { NextFunction, Request, Response } from 'express';
import type { AccessPayload } from '../services/token.service';
import { isAccessTokenExpired, verifyAccessToken } from '../services/token.service';
import { AppError } from '../utils/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'Требуется авторизация', undefined, 'UNAUTHORIZED'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  const payload = verifyAccessToken(token);

  if (!payload) {
    const expired = isAccessTokenExpired(token);
    next(
      new AppError(
        401,
        expired ? 'Срок действия сессии истёк' : 'Недействительный токен доступа',
        undefined,
        expired ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED',
      ),
    );
    return;
  }

  req.auth = payload;
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.auth?.role !== 'ADMIN') {
    next(new AppError(403, 'Недостаточно прав для выполнения операции', undefined, 'FORBIDDEN'));
    return;
  }

  next();
}
