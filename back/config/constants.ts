export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const REQUEST_STATUSES = ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const PAYMENT_TYPES = ['CASH', 'CARD'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const ADMIN_LOGIN = 'avto2024';
export const ADMIN_PASSWORD = 'poehali';

export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 6,
  maxPageSize: 50,
} as const;

export const SORT_OPTIONS = [
  'newest',
  'oldest',
  'soon',
  'late',
  'brand-asc',
  'brand-desc',
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
