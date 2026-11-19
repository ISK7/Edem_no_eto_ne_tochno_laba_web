import { Router } from 'express';
import * as catalogController from '../controllers/catalog.controller';

export const catalogRoutes = Router();

catalogRoutes.get('/cars', catalogController.listCars);
