import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { PasswordInput } from '../components/PasswordInput';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { displayName } from '../utils/format';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useToast();

  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const interacted = useRef(false);

  const from = (location.state as LocationState | null)?.from;

  useEffect(() => {
    // Браузер может автоматически подставить сохранённые логин и пароль.
    // Если пользователь ещё не взаимодействовал с формой — очищаем поля.
    const timer = window.setTimeout(() => {
      if (interacted.current) return;
      setLoginValue('');
      setPassword('');
    }, 600);

    return () => window.clearTimeout(timer);
  }, []);

  const markInteraction = () => {
    interacted.current = true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    const nextErrors: Record<string, string> = {};
    if (!loginValue.trim()) nextErrors.login = 'Введите логин';
    if (!password) nextErrors.password = 'Введите пароль';
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await login(loginValue.trim().toLowerCase(), password);
      notify(`Добро пожаловать, ${displayName(user.fullName)}!`, 'success');
      const fallback = user.role === 'ADMIN' ? '/admin' : '/requests';
      navigate(from && from !== '/login' ? from : fallback, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        setErrors(error.fields);
        notify(error.message, 'error');
      } else {
        setFormError('Не удалось выполнить вход. Попробуйте ещё раз.');
        notify('Не удалось выполнить вход', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Вход в систему"
      title="С возвращением"
      lead="Введите логин и пароль, чтобы управлять заявками на тест-драйв."
      footer={
        <p>
          Ещё нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      }
    >
      <form
        className="auth-form"
        onSubmit={handleSubmit}
        autoComplete="off"
        onPointerDown={markInteraction}
        onKeyDown={markInteraction}
        noValidate
      >
        {formError && (
          <div className="form-alert" role="alert">
            <Icon name="info" size={18} />
            <span>{formError}</span>
          </div>
        )}

        <Field label="Логин" htmlFor="login" error={errors.login} required>
          <input
            id="login"
            name="login"
            className="input"
            type="text"
            value={loginValue}
            onChange={(event) => {
              setLoginValue(event.target.value);
              setErrors((current) => ({ ...current, login: '' }));
              setFormError('');
            }}
            placeholder="Ваш логин"
            autoComplete="off"
            aria-invalid={Boolean(errors.login)}
            autoFocus
          />
        </Field>

        <Field
          label="Пароль"
          htmlFor="password"
          error={errors.password}
          required
          hint="Минимум 6 символов"
        >
          <PasswordInput
            id="password"
            name="password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setErrors((current) => ({ ...current, password: '' }));
              setFormError('');
            }}
            placeholder="Введите пароль"
            autoComplete="new-password"
            invalid={Boolean(errors.password)}
          />
        </Field>

        <Button type="submit" size="lg" block loading={submitting}>
          Войти в систему
        </Button>
      </form>
    </AuthShell>
  );
}
