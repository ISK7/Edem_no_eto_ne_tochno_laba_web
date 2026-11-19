import type { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/http';

export const listCars = asyncHandler(async (_req: Request, res: Response) => {
  const brands = await prisma.carBrand.findMany({
    orderBy: { name: 'asc' },
    include: {
      models: {
        orderBy: { name: 'asc' },
        select: { id: true, name: true, price: true, quantity: true },
      },
    },
  });

  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json({ brands });
});
