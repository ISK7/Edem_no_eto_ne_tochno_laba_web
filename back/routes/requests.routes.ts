import { Router } from 'express';
import * as requestsController from '../controllers/requests.controller';
import { requireAuth } from '../middleware/auth';

export const requestsRoutes = Router();

requestsRoutes.use(requireAuth);
requestsRoutes.get('/', requestsController.listMine);
requestsRoutes.post('/', requestsController.create);
