import crypto from 'node:crypto';
import { prisma } from '../config/database';
import { env } from '../config/env';
import type { Role } from '../config/constants';
import { AppError } from '../utils/errors';
import { signJwt, verifyJwt } from '../utils/jwt';

export interface AccessPayload {
  sub: number;
  role: Role;
  login: string;
  type: 'access';
  iat: number;
  exp: number;
}

interface RefreshPayload {
  sub: number;
  jti: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

export interface RefreshIssue {
  token: string;
  expiresAt: Date;
  jti: string;
}

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export function createAccessToken(user: { id: number; role: string; login: string }): string {
  return signJwt(
    { sub: user.id, role: user.role, login: user.login, type: 'access' },
    env.accessSecret,
    env.accessTtl,
  );
}

function buildRefreshToken(userId: number, jti: string): { token: string; expiresAt: Date } {
  const token = signJwt({ sub: userId, jti, type: 'refresh' }, env.refreshSecret, env.refreshTtl);
  return { token, expiresAt: new Date(Date.now() + env.refreshTtl * 1000) };
}

export async function issueRefreshToken(userId: number): Promise<RefreshIssue> {
  const jti = crypto.randomUUID();
  const { token, expiresAt } = buildRefreshToken(userId, jti);

  await prisma.refreshToken.create({
    data: { jti, userId, tokenHash: hashToken(token), expiresAt },
  });

  return { token, expiresAt, jti };
}

export function verifyAccessToken(token: string): AccessPayload | null {
  const result = verifyJwt<AccessPayload>(token, env.accessSecret);
  if (!result.ok) return null;
  const payload = result.payload;
  if (payload.type !== 'access' || typeof payload.sub !== 'number' || !payload.role) return null;
  return payload;
}

export function isAccessTokenExpired(token: string): boolean {
  const result = verifyJwt<AccessPayload>(token, env.accessSecret);
  return !result.ok && result.reason === 'expired';
}

export interface RotatedSession {
  userId: number;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export async function rotateRefreshToken(token: string): Promise<RotatedSession> {
  const result = verifyJwt<RefreshPayload>(token, env.refreshSecret);
  if (!result.ok || result.payload.type !== 'refresh' || typeof result.payload.jti !== 'string') {
    throw new AppError(401, 'Сессия истекла. Войдите снова.', undefined, 'SESSION_EXPIRED');
  }

  const payload = result.payload;
  const record = await prisma.refreshToken.findUnique({ where: { jti: payload.jti } });

  if (!record || record.userId !== payload.sub || record.tokenHash !== hashToken(token)) {
    throw new AppError(401, 'Сессия недействительна. Войдите снова.', undefined, 'SESSION_INVALID');
  }

  if (record.revokedAt) {
    throw new AppError(401, 'Сессия уже завершена. Войдите снова.', undefined, 'SESSION_REVOKED');
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await prisma.refreshToken.delete({ where: { jti: record.jti } }).catch(() => undefined);
    throw new AppError(401, 'Сессия истекла. Войдите снова.', undefined, 'SESSION_EXPIRED');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    await prisma.refreshToken.update({
      where: { jti: record.jti },
      data: { revokedAt: new Date() },
    });
    throw new AppError(401, 'Пользователь не найден.', undefined, 'SESSION_INVALID');
  }

  const nextJti = crypto.randomUUID();
  const next = buildRefreshToken(user.id, nextJti);

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.refreshToken.updateMany({
      where: { jti: record.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Параллельный запрос уже использовал этот refresh-токен.
    if (claimed.count !== 1) {
      throw new AppError(401, 'Сессия уже обновлена. Повторите запрос.', undefined, 'SESSION_REVOKED');
    }

    await tx.refreshToken.create({
      data: {
        jti: nextJti,
        userId: user.id,
        tokenHash: hashToken(next.token),
        expiresAt: next.expiresAt,
      },
    });
  });

  return {
    userId: user.id,
    refreshToken: next.token,
    refreshExpiresAt: next.expiresAt,
  };
}

export async function revokeRefreshToken(token: string | undefined): Promise<void> {
  if (!token) return;
  const result = verifyJwt<RefreshPayload>(token, env.refreshSecret);
  if (!result.ok) return;

  await prisma.refreshToken.updateMany({
    where: { jti: result.payload.jti, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function cleanupExpiredTokens(): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}
