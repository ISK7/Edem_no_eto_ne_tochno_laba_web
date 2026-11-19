import { Router } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/http';
import { adminRoutes } from './admin.routes';
import { authRoutes } from './auth.routes';
import { catalogRoutes } from './catalog.routes';
import { requestsRoutes } from './requests.routes';

export const apiRoutes = Router();

apiRoutes.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),
);

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/catalog', catalogRoutes);
apiRoutes.use('/requests', requestsRoutes);
apiRoutes.use('/admin', adminRoutes);
