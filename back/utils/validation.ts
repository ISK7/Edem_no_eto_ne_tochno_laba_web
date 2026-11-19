import type { PaymentType, RequestStatus } from '../config/constants';
import { PAYMENT_TYPES, REQUEST_STATUSES } from '../config/constants';
import type { FieldErrors } from './errors';
import { asRawString, asRecord, asTrimmedString } from './http';

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; fields: FieldErrors };

export const PHONE_PATTERN = /^\+7\(\d{3}\)-\d{3}-\d{2}-\d{2}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const LOGIN_PATTERN = /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё0-9_-]{2,31}$/;
export const FULL_NAME_PATTERN = /^[А-Яа-яЁё]+(?: [А-Яа-яЁё]+){1,4}$/;

const collapseSpaces = (value: string) => value.replace(/\s+/g, ' ').trim();

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export interface RegistrationInput {
  login: string;
  password: string;
  fullName: string;
  phone: string;
  email: string;
}

export function parseRegistration(body: unknown): ValidationResult<RegistrationInput> {
  const data = asRecord(body);
  const fields: FieldErrors = {};

  const login = asTrimmedString(data.login).toLowerCase();
  const password = asRawString(data.password);
  const fullName = collapseSpaces(asTrimmedString(data.fullName));
  const phone = asTrimmedString(data.phone);
  const email = asTrimmedString(data.email).toLowerCase();

  if (!login) {
    fields.login = 'Введите логин';
  } else if (!LOGIN_PATTERN.test(login)) {
    fields.login = '3–32 символа: латиница или кириллица, цифры, «_» или «-», первая — буква';
  }

  if (!password) {
    fields.password = 'Введите пароль';
  } else if (password.trim().length < 6) {
    fields.password = 'Пароль должен содержать минимум 6 символов';
  } else if (password.length > 72) {
    fields.password = 'Пароль не должен превышать 72 символа';
  }

  if (!fullName) {
    fields.fullName = 'Введите ФИО';
  } else if (!FULL_NAME_PATTERN.test(fullName)) {
    fields.fullName = 'Только кириллица и пробелы, минимум имя и фамилия';
  }

  if (!phone) {
    fields.phone = 'Введите телефон';
  } else if (!PHONE_PATTERN.test(phone)) {
    fields.phone = 'Формат телефона: +7(XXX)-XXX-XX-XX';
  }

  if (!email) {
    fields.email = 'Введите электронную почту';
  } else if (!EMAIL_PATTERN.test(email)) {
    fields.email = 'Введите корректный адрес электронной почты';
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, value: { login, password, fullName, phone, email } };
}

export interface LoginInput {
  login: string;
  password: string;
}

export function parseLogin(body: unknown): ValidationResult<LoginInput> {
  const data = asRecord(body);
  const fields: FieldErrors = {};
  const login = asTrimmedString(data.login).toLowerCase();
  const password = asRawString(data.password);

  if (!login) fields.login = 'Введите логин';
  if (!password) fields.password = 'Введите пароль';

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, value: { login, password } };
}

export interface RequestInput {
  address: string;
  contactPhone: string;
  scheduledAt: Date;
  licenseSeries: string;
  licenseNumber: string;
  licenseIssuedAt: Date;
  carModelId: number;
  paymentType: PaymentType;
}

export function parseRequest(body: unknown): ValidationResult<RequestInput> {
  const data = asRecord(body);
  const fields: FieldErrors = {};

  const address = collapseSpaces(asTrimmedString(data.address));
  const contactPhone = asTrimmedString(data.contactPhone);
  const scheduledRaw = asTrimmedString(data.scheduledAt);
  const licenseSeries = asTrimmedString(data.licenseSeries);
  const licenseNumber = asTrimmedString(data.licenseNumber);
  const licenseIssuedRaw = asTrimmedString(data.licenseIssuedAt);
  const paymentType = asTrimmedString(data.paymentType) as PaymentType;
  const carModelId = Number(data.carModelId);

  if (!address) {
    fields.address = 'Введите адрес';
  } else if (address.length < 5 || address.length > 200) {
    fields.address = 'Адрес должен содержать от 5 до 200 символов';
  }

  if (!contactPhone) {
    fields.contactPhone = 'Введите контактный телефон';
  } else if (!PHONE_PATTERN.test(contactPhone)) {
    fields.contactPhone = 'Формат телефона: +7(XXX)-XXX-XX-XX';
  }

  const scheduledAt = parseDate(scheduledRaw);
  if (!scheduledRaw) {
    fields.scheduledAt = 'Выберите дату и время';
  } else if (!scheduledAt) {
    fields.scheduledAt = 'Некорректная дата и время';
  } else if (scheduledAt.getTime() <= Date.now()) {
    fields.scheduledAt = 'Дата и время тест-драйва должны быть в будущем';
  }

  if (!/^\d{4}$/.test(licenseSeries)) {
    fields.licenseSeries = 'Серия — 4 цифры';
  }

  if (!/^\d{6}$/.test(licenseNumber)) {
    fields.licenseNumber = 'Номер — 6 цифр';
  }

  const licenseIssuedAt = parseDate(licenseIssuedRaw);
  const earliestLicense = new Date('1950-01-01T00:00:00.000Z');
  if (!licenseIssuedRaw) {
    fields.licenseIssuedAt = 'Укажите дату выдачи';
  } else if (!licenseIssuedAt) {
    fields.licenseIssuedAt = 'Некорректная дата выдачи';
  } else if (licenseIssuedAt.getTime() > Date.now()) {
    fields.licenseIssuedAt = 'Дата выдачи не может быть в будущем';
  } else if (licenseIssuedAt.getTime() < earliestLicense.getTime()) {
    fields.licenseIssuedAt = 'Проверьте дату выдачи удостоверения';
  }

  if (!Number.isInteger(carModelId) || carModelId < 1) {
    fields.carModelId = 'Выберите марку и модель автомобиля';
  }

  if (!PAYMENT_TYPES.includes(paymentType)) {
    fields.paymentType = 'Выберите тип оплаты';
  }

  if (data.agreement !== true) {
    fields.agreement = 'Подтвердите согласие с правилами тест-драйва';
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields };

  return {
    ok: true,
    value: {
      address,
      contactPhone,
      scheduledAt: scheduledAt as Date,
      licenseSeries,
      licenseNumber,
      licenseIssuedAt: licenseIssuedAt as Date,
      carModelId,
      paymentType,
    },
  };
}

export type AdminStatus = Extract<RequestStatus, 'APPROVED' | 'COMPLETED' | 'REJECTED'>;

export interface StatusUpdateInput {
  status: AdminStatus;
  rejectionReason: string | null;
}

export function parseStatusUpdate(body: unknown): ValidationResult<StatusUpdateInput> {
  const data = asRecord(body);
  const fields: FieldErrors = {};
  const status = asTrimmedString(data.status) as AdminStatus;
  const allowed: AdminStatus[] = ['APPROVED', 'COMPLETED', 'REJECTED'];

  if (!REQUEST_STATUSES.includes(status) || !allowed.includes(status)) {
    fields.status = 'Недопустимый статус заявки';
    return { ok: false, fields };
  }

  let rejectionReason: string | null = null;
  if (status === 'REJECTED') {
    const reason = collapseSpaces(asTrimmedString(data.rejectionReason));
    if (reason.length < 5) {
      fields.rejectionReason = 'Укажите причину отклонения (минимум 5 символов)';
    } else if (reason.length > 300) {
      fields.rejectionReason = 'Причина не должна превышать 300 символов';
    } else {
      rejectionReason = reason;
    }
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, value: { status, rejectionReason } };
}
