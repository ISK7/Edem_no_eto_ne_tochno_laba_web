import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.get('/requests', adminController.listRequests);
adminRoutes.get('/schedule', adminController.listSchedule);
adminRoutes.patch('/requests/:id/status', adminController.updateStatus);
