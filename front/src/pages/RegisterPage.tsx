import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { PasswordInput } from '../components/PasswordInput';
import { PhoneInput } from '../components/PhoneInput';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { displayName } from '../utils/format';
import {
  validateRegister,
  type FieldErrors,
  type RegisterFormValues,
} from '../utils/validation';

const initialValues: RegisterFormValues = {
  login: '',
  password: '',
  fullName: '',
  phone: '',
  email: '',
};

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();

  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof RegisterFormValues>(key: K, value: RegisterFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setFormError('');
  };

  const validateField = (key: keyof RegisterFormValues) => {
    const next = validateRegister(values);
    setErrors((current) => {
      const copy = { ...current };
      if (next[key]) copy[key] = next[key];
      else delete copy[key];
      return copy;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const first = Object.keys(nextErrors)[0];
      document.getElementById(first)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const fullName = values.fullName.replace(/\s+/g, ' ').trim();
      const user = await register({
        login: values.login.trim().toLowerCase(),
        password: values.password,
        fullName,
        phone: values.phone.trim(),
        email: values.email.trim(),
      });
      notify(`Аккаунт создан. Здравствуйте, ${displayName(user.fullName)}!`, 'success');
      navigate('/requests', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        setErrors(error.fields);
        notify(error.message, 'error');
      } else {
        setFormError('Не удалось зарегистрироваться. Попробуйте ещё раз.');
        notify('Не удалось зарегистрироваться', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Регистрация"
      title="Создайте аккаунт"
      lead="Один аккаунт — все заявки на тест-драйв и их статусы в одном месте."
      footer={
        <p>
          Уже зарегистрированы? <Link to="/login">Войти</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="form-alert" role="alert">
            <Icon name="info" size={18} />
            <span>{formError}</span>
          </div>
        )}

        <div className="auth-form__row">
          <Field
            label="Логин"
            htmlFor="login"
            error={errors.login}
            hint="Латиница или кириллица, от 3 символов"
            required
          >
            <input
              id="login"
              name="login"
              className="input"
              type="text"
              value={values.login}
              onChange={(event) => update('login', event.target.value)}
              onBlur={() => validateField('login')}
              placeholder="например, ivan_2026"
              autoComplete="username"
              aria-invalid={Boolean(errors.login)}
              autoFocus
            />
          </Field>

          <Field
            label="Пароль"
            htmlFor="password"
            error={errors.password}
            hint="Минимум 6 символов"
            required
          >
            <PasswordInput
              id="password"
              name="password"
              value={values.password}
              onChange={(value) => update('password', value)}
              onBlur={() => validateField('password')}
              placeholder="Придумайте пароль"
              autoComplete="new-password"
              invalid={Boolean(errors.password)}
            />
          </Field>
        </div>

        <Field label="ФИО" htmlFor="fullName" error={errors.fullName} required>
          <input
            id="fullName"
            name="fullName"
            className="input"
            type="text"
            value={values.fullName}
            onChange={(event) => update('fullName', event.target.value)}
            onBlur={() => validateField('fullName')}
            placeholder="Иванов Иван Иванович"
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
          />
        </Field>

        <div className="auth-form__row">
          <Field label="Телефон" htmlFor="phone" error={errors.phone} required>
            <PhoneInput
              id="phone"
              name="phone"
              value={values.phone}
              onChange={(value) => update('phone', value)}
              onBlur={() => validateField('phone')}
              autoComplete="tel"
              invalid={Boolean(errors.phone)}
            />
          </Field>

          <Field label="Электронная почта" htmlFor="email" error={errors.email} required>
            <input
              id="email"
              name="email"
              className="input"
              type="email"
              value={values.email}
              onChange={(event) => update('email', event.target.value)}
              onBlur={() => validateField('email')}
              placeholder="mail@example.ru"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
            />
          </Field>
        </div>

        <p className="auth-form__note">Все поля обязательны для заполнения.</p>

        <Button type="submit" size="lg" block loading={submitting}>
          Зарегистрироваться
        </Button>
      </form>
    </AuthShell>
  );
}
