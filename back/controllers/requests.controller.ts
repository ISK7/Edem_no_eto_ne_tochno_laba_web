import type { Request, Response } from 'express';
import * as requestService from '../services/request.service';
import { AppError } from '../utils/errors';
import { asyncHandler } from '../utils/http';
import { parseRequest } from '../utils/validation';

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const requests = await requestService.listUserRequests(req.auth!.sub);
  res.json({ requests });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const parsed = parseRequest(req.body);
  if (!parsed.ok) {
    throw new AppError(400, 'Проверьте правильность заполнения полей', parsed.fields, 'VALIDATION');
  }

  const request = await requestService.createRequest(req.auth!.sub, parsed.value);
  res.status(201).json({ request });
});
