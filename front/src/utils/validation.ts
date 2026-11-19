export type FieldErrors = Record<string, string>;

export const PHONE_PATTERN = /^\+7\(\d{3}\)-\d{3}-\d{2}-\d{2}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const LOGIN_PATTERN = /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё0-9_-]{2,31}$/;
export const FULL_NAME_PATTERN = /^[А-Яа-яЁё]+(?: [А-Яа-яЁё]+){1,4}$/;

export interface RegisterFormValues {
  login: string;
  password: string;
  fullName: string;
  phone: string;
  email: string;
}

export interface RequestFormValues {
  brandId: string;
  carModelId: string;
  address: string;
  contactPhone: string;
  scheduledAt: string;
  licenseSeries: string;
  licenseNumber: string;
  licenseIssuedAt: string;
  paymentType: string;
  agreement: boolean;
}

export function validateRegister(values: RegisterFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const login = values.login.trim().toLowerCase();
  const fullName = values.fullName.replace(/\s+/g, ' ').trim();
  const phone = values.phone.trim();
  const email = values.email.trim();

  if (!login) errors.login = 'Введите логин';
  else if (!LOGIN_PATTERN.test(login)) {
    errors.login = '3–32 символа: латиница или кириллица, цифры, «_» или «-», первая — буква';
  }

  if (!values.password) errors.password = 'Введите пароль';
  else if (values.password.trim().length < 6) {
    errors.password = 'Пароль должен содержать минимум 6 символов';
  } else if (values.password.length > 72) {
    errors.password = 'Пароль не должен превышать 72 символа';
  }

  if (!fullName) errors.fullName = 'Введите ФИО';
  else if (!FULL_NAME_PATTERN.test(fullName)) {
    errors.fullName = 'Только кириллица и пробелы, минимум имя и фамилия';
  }

  if (!phone) errors.phone = 'Введите телефон';
  else if (!PHONE_PATTERN.test(phone)) errors.phone = 'Формат телефона: +7(XXX)-XXX-XX-XX';

  if (!email) errors.email = 'Введите электронную почту';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Введите корректный адрес электронной почты';

  return errors;
}

export function validateRequestForm(values: RequestFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const address = values.address.replace(/\s+/g, ' ').trim();

  if (!values.carModelId) errors.carModelId = 'Выберите марку и модель автомобиля';

  if (!address) errors.address = 'Введите адрес';
  else if (address.length < 5 || address.length > 200) {
    errors.address = 'Адрес должен содержать от 5 до 200 символов';
  }

  if (!values.contactPhone) errors.contactPhone = 'Введите контактный телефон';
  else if (!PHONE_PATTERN.test(values.contactPhone)) {
    errors.contactPhone = 'Формат телефона: +7(XXX)-XXX-XX-XX';
  }

  if (!values.scheduledAt) errors.scheduledAt = 'Выберите дату и время';
  else {
    const scheduled = new Date(values.scheduledAt);
    if (Number.isNaN(scheduled.getTime())) errors.scheduledAt = 'Некорректная дата и время';
    else if (scheduled.getTime() <= Date.now()) {
      errors.scheduledAt = 'Дата и время тест-драйва должны быть в будущем';
    }
  }

  if (!/^\d{4}$/.test(values.licenseSeries)) errors.licenseSeries = 'Серия — 4 цифры';
  if (!/^\d{6}$/.test(values.licenseNumber)) errors.licenseNumber = 'Номер — 6 цифр';

  if (!values.licenseIssuedAt) errors.licenseIssuedAt = 'Укажите дату выдачи';
  else {
    const issued = new Date(values.licenseIssuedAt);
    if (Number.isNaN(issued.getTime())) errors.licenseIssuedAt = 'Некорректная дата выдачи';
    else if (issued.getTime() > Date.now()) {
      errors.licenseIssuedAt = 'Дата выдачи не может быть в будущем';
    } else if (issued.getTime() < new Date('1950-01-01T00:00:00.000Z').getTime()) {
      errors.licenseIssuedAt = 'Проверьте дату выдачи удостоверения';
    }
  }

  if (!values.paymentType) errors.paymentType = 'Выберите тип оплаты';
  if (!values.agreement) errors.agreement = 'Подтвердите согласие с правилами тест-драйва';

  return errors;
}

export function firstErrorField(errors: FieldErrors): string | null {
  return Object.keys(errors)[0] ?? null;
}
