import type { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import { buildRequestSearchIndex } from '../utils/search';
import { toRequestDto } from '../utils/serializers';
import type { RequestInput } from '../utils/validation';

const requestInclude = {
  user: true,
  carModel: { include: { brand: true } },
} satisfies Prisma.TestDriveRequestInclude;

export async function listUserRequests(userId: number) {
  const rows = await prisma.testDriveRequest.findMany({
    where: { userId },
    include: requestInclude,
    orderBy: { createdAt: 'desc' },
  });

  return rows.map(toRequestDto);
}

export async function createRequest(userId: number, input: RequestInput) {
  const [user, carModel] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.carModel.findUnique({
      where: { id: input.carModelId },
      include: { brand: true },
    }),
  ]);

  if (!user) throw new AppError(401, 'Пользователь не найден', undefined, 'UNAUTHORIZED');
  if (!carModel) {
    throw new AppError(400, 'Выбранный автомобиль не найден', {
      carModelId: 'Выберите автомобиль из списка',
    });
  }

  const row = await prisma.testDriveRequest.create({
    data: {
      userId,
      carModelId: carModel.id,
      address: input.address,
      contactPhone: input.contactPhone,
      scheduledAt: input.scheduledAt,
      licenseSeries: input.licenseSeries,
      licenseNumber: input.licenseNumber,
      licenseIssuedAt: input.licenseIssuedAt,
      paymentType: input.paymentType,
      status: 'PENDING',
      searchIndex: buildRequestSearchIndex([
        user.fullName,
        user.login,
        user.phone,
        user.email,
        input.address,
        carModel.brand.name,
        carModel.name,
      ]),
    },
    include: requestInclude,
  });

  return toRequestDto(row);
}
