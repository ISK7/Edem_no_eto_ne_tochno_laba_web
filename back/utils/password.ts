import crypto from 'node:crypto';

const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 20_000;
const PBKDF2_DIGEST = 'sha256';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST)
    .toString('hex');
  return `pbkdf2-sha256:${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, ...parts] = stored.split(':');

  if (scheme === 'pbkdf2-sha256') {
    const [iterationsRaw, salt, hash] = parts;
    const iterations = Number(iterationsRaw);
    if (!iterations || !salt || !hash) return false;

    const candidate = crypto.pbkdf2Sync(
      password,
      salt,
      iterations,
      Buffer.from(hash, 'hex').length,
      PBKDF2_DIGEST,
    );
    const expected = Buffer.from(hash, 'hex');
    return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
  }

  // Старые хеши, созданные до перехода на PBKDF2, продолжают работать.
  if (scheme === 'scrypt') {
    const [salt, hash] = parts;
    if (!salt || !hash) return false;

    const expected = Buffer.from(hash, 'hex');
    const candidate = crypto.scryptSync(password, salt, expected.length);
    return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
  }

  return false;
}

// Хеш-заглушка выравнивает время ответа для несуществующего логина.
export const DUMMY_PASSWORD_HASH = hashPassword('dummy-password-for-timing');
