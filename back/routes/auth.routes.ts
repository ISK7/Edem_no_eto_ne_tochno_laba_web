import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  rateLimit({
    name: 'register',
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: 'Слишком много попыток регистрации.',
  }),
  authController.register,
);

authRoutes.post(
  '/login',
  rateLimit({
    name: 'login',
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: 'Слишком много попыток входа.',
  }),
  authController.login,
);

authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/logout', authController.logout);
authRoutes.get('/me', requireAuth, authController.me);
