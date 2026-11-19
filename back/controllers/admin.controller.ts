import type { Request, Response } from 'express';
import {
  PAGINATION,
  REQUEST_STATUSES,
  SORT_OPTIONS,
  type RequestStatus,
  type SortOption,
} from '../config/constants';
import * as adminService from '../services/admin.service';
import { AppError } from '../utils/errors';
import { asyncHandler, parsePositiveInt } from '../utils/http';
import { parseStatusUpdate } from '../utils/validation';

export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  const page = parsePositiveInt(req.query.page, PAGINATION.defaultPage);
  const pageSize = parsePositiveInt(
    req.query.pageSize,
    PAGINATION.defaultPageSize,
    PAGINATION.maxPageSize,
  );

  const statusRaw = String(req.query.status ?? 'ALL').toUpperCase();
  const status: RequestStatus | 'ALL' = REQUEST_STATUSES.includes(statusRaw as RequestStatus)
    ? (statusRaw as RequestStatus)
    : 'ALL';

  const sortRaw = String(req.query.sort ?? 'newest');
  const sort: SortOption = SORT_OPTIONS.includes(sortRaw as SortOption)
    ? (sortRaw as SortOption)
    : 'newest';

  const search = String(req.query.search ?? '').trim().slice(0, 100);

  const result = await adminService.listAdminRequests({ page, pageSize, status, search, sort });
  res.json(result);
});

export const listSchedule = asyncHandler(async (_req: Request, res: Response) => {
  const requests = await adminService.listAdminSchedule();
  res.json({ requests });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId) || requestId < 1) {
    throw new AppError(400, 'Некорректный идентификатор заявки');
  }

  const parsed = parseStatusUpdate(req.body);
  if (!parsed.ok) {
    throw new AppError(400, 'Проверьте данные о статусе заявки', parsed.fields, 'VALIDATION');
  }

  const request = await adminService.updateRequestStatus(requestId, parsed.value);
  res.json({ request });
});
