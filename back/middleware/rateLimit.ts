import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

interface RateLimitOptions {
  name: string;
  windowMs: number;
  max: number;
  message: string;
}

export function rateLimit({ name, windowMs, max, message }: RateLimitOptions) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = `${name}:${req.ip ?? 'unknown'}`;
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (buckets.size > 2000) {
      for (const [bucketKey, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(bucketKey);
      }
    }

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      next(new AppError(429, `${message} Повторите через ${retryAfter} с.`, undefined, 'RATE_LIMITED'));
      return;
    }

    next();
  };
}
