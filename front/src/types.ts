export type Role = 'USER' | 'ADMIN';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

export type PaymentType = 'CASH' | 'CARD';

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'soon'
  | 'late'
  | 'brand-asc'
  | 'brand-desc';

export interface User {
  id: number;
  login: string;
  fullName: string;
  phone: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface CarModel {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface CarBrand {
  id: number;
  name: string;
  models: CarModel[];
}

export interface RequestCustomer {
  id: number;
  login: string;
  fullName: string;
  phone: string;
  email: string;
}

export interface TestDriveRequest {
  id: number;
  status: RequestStatus;
  rejectionReason: string | null;
  address: string;
  contactPhone: string;
  scheduledAt: string;
  paymentType: PaymentType;
  licenseSeries: string;
  licenseNumber: string;
  licenseIssuedAt: string;
  createdAt: string;
  updatedAt: string;
  car: {
    brandId: number;
    brand: string;
    modelId: number;
    model: string;
    price: number;
  };
  customer: RequestCustomer;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
}

export interface AdminListResponse {
  items: TestDriveRequest[];
  pagination: Pagination;
  stats: AdminStats;
}

export interface CreateRequestPayload {
  address: string;
  contactPhone: string;
  scheduledAt: string;
  licenseSeries: string;
  licenseNumber: string;
  licenseIssuedAt: string;
  carModelId: number;
  paymentType: PaymentType;
  agreement: boolean;
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: 'На рассмотрении',
  APPROVED: 'Одобрено',
  COMPLETED: 'Выполнено',
  REJECTED: 'Отклонено',
};

export const PAYMENT_LABELS: Record<PaymentType, string> = {
  CASH: 'Наличные',
  CARD: 'Банковская карта',
};

export const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Сначала новые',
  oldest: 'Сначала старые',
  soon: 'Ранние по дате',
  late: 'Поздние по дате',
  'brand-asc': 'Марка: А — Я',
  'brand-desc': 'Марка: Я — А',
};

export const STATUS_ORDER: RequestStatus[] = [
  'PENDING',
  'APPROVED',
  'COMPLETED',
  'REJECTED',
];
