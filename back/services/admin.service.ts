import type { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import type { RequestStatus, SortOption } from '../config/constants';
import { AppError } from '../utils/errors';
import { toRequestDto } from '../utils/serializers';
import type { StatusUpdateInput } from '../utils/validation';

const requestInclude = {
  user: true,
  carModel: { include: { brand: true } },
} satisfies Prisma.TestDriveRequestInclude;

export interface AdminListParams {
  page: number;
  pageSize: number;
  status: RequestStatus | 'ALL';
  search: string;
  sort: SortOption;
}

const orderByMap: Record<SortOption, Prisma.TestDriveRequestOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  soon: [{ scheduledAt: 'asc' }],
  late: [{ scheduledAt: 'desc' }],
  'brand-asc': [
    { carModel: { brand: { name: 'asc' } } },
    { carModel: { name: 'asc' } },
    { createdAt: 'desc' },
  ],
  'brand-desc': [
    { carModel: { brand: { name: 'desc' } } },
    { carModel: { name: 'asc' } },
    { createdAt: 'desc' },
  ],
};

export async function listAdminRequests(params: AdminListParams) {
  const where: Prisma.TestDriveRequestWhereInput = {};

  if (params.status !== 'ALL') {
    where.status = params.status;
  }

  if (params.search) {
    const search = params.search.toLowerCase();
    const or: Prisma.TestDriveRequestWhereInput[] = [{ searchIndex: { contains: search } }];
    if (/^\d+$/.test(params.search)) {
      or.push({ id: Number(params.search) });
    }
    where.OR = or;
  }

  const [rows, total, grouped] = await Promise.all([
    prisma.testDriveRequest.findMany({
      where,
      include: requestInclude,
      orderBy: orderByMap[params.sort],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.testDriveRequest.count({ where }),
    prisma.testDriveRequest.groupBy({
      by: ['status'],
      orderBy: { status: 'asc' },
      _count: { _all: true },
    }),
  ]);

  const stats = {
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
  };

  for (const group of grouped) {
    const count = group._count._all;
    stats.total += count;
    if (group.status === 'PENDING') stats.pending = count;
    if (group.status === 'APPROVED') stats.approved = count;
    if (group.status === 'COMPLETED') stats.completed = count;
    if (group.status === 'REJECTED') stats.rejected = count;
  }

  return {
    items: rows.map(toRequestDto),
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    },
    stats,
  };
}

export async function listAdminSchedule() {
  const rows = await prisma.testDriveRequest.findMany({
    include: requestInclude,
    orderBy: { scheduledAt: 'asc' },
  });

  return rows.map(toRequestDto);
}

export async function updateRequestStatus(requestId: number, input: StatusUpdateInput) {
  const existing = await prisma.testDriveRequest.findUnique({
    where: { id: requestId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'Заявка не найдена');
  }

  const row = await prisma.testDriveRequest.update({
    where: { id: requestId },
    data: {
      status: input.status,
      rejectionReason: input.status === 'REJECTED' ? input.rejectionReason : null,
    },
    include: requestInclude,
  });

  return toRequestDto(row);
}
