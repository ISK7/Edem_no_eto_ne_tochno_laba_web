import crypto from 'node:crypto';

interface TokenHeader {
  alg: 'HS256';
  typ: 'JWT';
}

export type VerifyResult<T> =
  | { ok: true; payload: T }
  | { ok: false; reason: 'expired' | 'invalid' };

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signature(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

export function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  ttlSeconds: number,
): string {
  const now = Math.floor(Date.now() / 1000);
  const header: TokenHeader = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const unsigned = `${encode(header)}.${encode(body)}`;
  return `${unsigned}.${signature(unsigned, secret)}`;
}

export function verifyJwt<T>(token: string, secret: string): VerifyResult<T> {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'invalid' };

  const [headerPart, payloadPart, providedSignature] = parts;
  const expectedSignature = signature(`${headerPart}.${payloadPart}`, secret);

  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return { ok: false, reason: 'invalid' };
  }

  try {
    const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8')) as TokenHeader;
    if (header.alg !== 'HS256' || header.typ !== 'JWT') return { ok: false, reason: 'invalid' };

    const payload = JSON.parse(
      Buffer.from(payloadPart, 'base64url').toString('utf8'),
    ) as T & { exp?: number };

    if (typeof payload.exp !== 'number') return { ok: false, reason: 'invalid' };
    if (payload.exp <= Math.floor(Date.now() / 1000)) return { ok: false, reason: 'expired' };

    return { ok: true, payload };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
