import type { Prisma } from '@prisma/client';

export interface PublicUser {
  id: number;
  login: string;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  createdAt: Date;
}

export function toPublicUser(user: {
  id: number;
  login: string;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    login: user.login,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export type RequestRecord = Prisma.TestDriveRequestGetPayload<{
  include: { user: true; carModel: { include: { brand: true } } };
}>;

export function toRequestDto(row: RequestRecord) {
  return {
    id: row.id,
    status: row.status,
    rejectionReason: row.rejectionReason,
    address: row.address,
    contactPhone: row.contactPhone,
    scheduledAt: row.scheduledAt.toISOString(),
    paymentType: row.paymentType,
    licenseSeries: row.licenseSeries,
    licenseNumber: row.licenseNumber,
    licenseIssuedAt: row.licenseIssuedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    car: {
      brandId: row.carModel.brandId,
      brand: row.carModel.brand.name,
      modelId: row.carModelId,
      model: row.carModel.name,
      price: row.carModel.price,
    },
    customer: {
      id: row.user.id,
      login: row.user.login,
      fullName: row.user.fullName,
      phone: row.user.phone,
      email: row.user.email,
    },
  };
}
