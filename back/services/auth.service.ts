import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from '../utils/password';
import { toPublicUser, type PublicUser } from '../utils/serializers';
import type { LoginInput, RegistrationInput } from '../utils/validation';
import {
  cleanupExpiredTokens,
  createAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
} from './token.service';

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

async function createSession(user: {
  id: number;
  role: string;
  login: string;
  fullName: string;
  phone: string;
  email: string;
  createdAt: Date;
}): Promise<AuthSession> {
  const accessToken = createAccessToken(user);
  const refresh = await issueRefreshToken(user.id);

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken: refresh.token,
    refreshExpiresAt: refresh.expiresAt,
  };
}

export async function register(input: RegistrationInput): Promise<AuthSession> {
  const [loginTaken, emailTaken] = await Promise.all([
    prisma.user.findUnique({ where: { login: input.login }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: input.email }, select: { id: true } }),
  ]);

  if (loginTaken) {
    throw new AppError(409, 'Пользователь с таким логином уже существует', {
      login: 'Этот логин уже занят',
    });
  }

  if (emailTaken) {
    throw new AppError(409, 'Пользователь с такой почтой уже существует', {
      email: 'Эта почта уже используется',
    });
  }

  const user = await prisma.user.create({
    data: {
      login: input.login,
      passwordHash: hashPassword(input.password),
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      role: 'USER',
    },
  });

  return createSession(user);
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const user = await prisma.user.findUnique({ where: { login: input.login } });

  // Для несуществующего логина всё равно проверяем хеш, чтобы время ответа
  // не позволяло определить наличие аккаунта.
  const passwordMatches = user
    ? verifyPassword(input.password, user.passwordHash)
    : verifyPassword(input.password, DUMMY_PASSWORD_HASH);

  if (!user || !passwordMatches) {
    throw new AppError(401, 'Неверный логин или пароль', undefined, 'INVALID_CREDENTIALS');
  }

  void cleanupExpiredTokens().catch(() => undefined);
  return createSession(user);
}

export async function rotateSession(refreshToken: string): Promise<AuthSession> {
  const rotated = await rotateRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: rotated.userId } });

  if (!user) {
    throw new AppError(401, 'Пользователь не найден', undefined, 'SESSION_INVALID');
  }

  return {
    user: toPublicUser(user),
    accessToken: createAccessToken(user),
    refreshToken: rotated.refreshToken,
    refreshExpiresAt: rotated.refreshExpiresAt,
  };
}

export async function getCurrentUser(userId: number): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(401, 'Пользователь не найден', undefined, 'UNAUTHORIZED');
  return toPublicUser(user);
}
