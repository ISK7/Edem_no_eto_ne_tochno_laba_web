import type { Request, Response } from 'express';
import { env } from '../config/env';
import * as authService from '../services/auth.service';
import { revokeRefreshToken } from '../services/token.service';
import { clearRefreshCookie, setRefreshCookie } from '../utils/cookies';
import { AppError } from '../utils/errors';
import { asyncHandler } from '../utils/http';
import { parseLogin, parseRegistration } from '../utils/validation';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = parseRegistration(req.body);
  if (!parsed.ok) {
    throw new AppError(400, 'Проверьте правильность заполнения полей', parsed.fields, 'VALIDATION');
  }

  const session = await authService.register(parsed.value);
  setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);
  res.status(201).json({ user: session.user, accessToken: session.accessToken });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = parseLogin(req.body);
  if (!parsed.ok) {
    throw new AppError(400, 'Проверьте правильность заполнения полей', parsed.fields, 'VALIDATION');
  }

  const session = await authService.login(parsed.value);
  setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);
  res.json({ user: session.user, accessToken: session.accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[env.refreshCookieName] as string | undefined;
  if (!token) {
    throw new AppError(401, 'Сессия не найдена. Войдите снова.', undefined, 'SESSION_MISSING');
  }

  try {
    const session = await authService.rotateSession(token);
    setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);
    res.json({ user: session.user, accessToken: session.accessToken });
  } catch (error) {
    clearRefreshCookie(res);
    throw error;
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[env.refreshCookieName] as string | undefined;
  await revokeRefreshToken(token);
  clearRefreshCookie(res);
  res.status(204).end();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.auth!.sub);
  res.json({ user });
});
