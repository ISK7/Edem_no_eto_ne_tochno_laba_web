import type { Response } from 'express';
import { env } from '../config/env';

const baseOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.isProduction,
  path: '/api/auth',
};

export function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(env.refreshCookieName, token, { ...baseOptions, expires: expiresAt });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(env.refreshCookieName, baseOptions);
}
