import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, catalogApi, requestsApi } from '../api/client';
import { Button } from '../components/Button';
import { CarPicker } from '../components/CarPicker';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { InlineLoader } from '../components/Loader';
import { Modal } from '../components/Modal';
import { PhoneInput } from '../components/PhoneInput';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  PAYMENT_LABELS,
  type CarBrand,
  type CreateRequestPayload,
  type PaymentType,
} from '../types';
import {
  formatDateTime,
  formatPrice,
  minScheduledValue,
  pluralize,
  todayValue,
} from '../utils/format';
import {
  validateRequestForm,
  type FieldErrors,
  type RequestFormValues,
} from '../utils/validation';

const PAYMENT_OPTIONS: Array<{
  value: PaymentType;
  icon: 'cash' | 'card';
  title: string;
  text: string;
}> = [
  {
    value: 'CASH',
    icon: 'cash',
    title: 'Наличными',
    text: 'Оплата на месте после тест-драйва',
  },
  {
    value: 'CARD',
    icon: 'card',
    title: 'Банковской картой',
    text: 'Оплата картой после тест-драйва',
  },
];

export function NewRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();

  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [values, setValues] = useState<RequestFormValues>(() => ({
    brandId: '',
    carModelId: '',
    address: '',
    contactPhone: user?.phone ?? '',
    scheduledAt: '',
    licenseSeries: '',
    licenseNumber: '',
    licenseIssuedAt: '',
    paymentType: '',
    agreement: false,
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const minDate = useMemo(() => minScheduledValue(), []);
  const maxLicenseDate = useMemo(() => todayValue(), []);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError('');
    try {
      setBrands(await catalogApi.cars());
    } catch (error) {
      setCatalogError(
        error instanceof ApiError
          ? error.message
          : 'Не удалось загрузить каталог автомобилей.',
      );
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const selectedBrand = brands.find((brand) => String(brand.id) === values.brandId);
  const selectedModel = selectedBrand?.models.find(
    (model) => String(model.id) === values.carModelId,
  );

  const update = <K extends keyof RequestFormValues>(
    key: K,
    value: RequestFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setFormError('');
  };

  const validateField = (key: keyof RequestFormValues) => {
    const next = validateRequestForm(values);
    setErrors((current) => {
      const copy = { ...current };
      if (next[key]) copy[key] = next[key];
      else delete copy[key];
      return copy;
    });
  };

  const focusFirstError = () => {
    window.setTimeout(() => {
      document
        .querySelector<HTMLElement>(
          '.car-picker--error button, [aria-invalid="true"], .field--error input, .field--error select',
        )
        ?.focus();
    }, 0);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!values.agreement) return;

    const nextErrors = validateRequestForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFormError('Проверьте отмеченные поля — в них есть ошибки.');
      focusFirstError();
      return;
    }

    setFormError('');
    setSubmitting(true);

    const payload: CreateRequestPayload = {
      address: values.address.replace(/\s+/g, ' ').trim(),
      contactPhone: values.contactPhone.trim(),
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      licenseSeries: values.licenseSeries,
      licenseNumber: values.licenseNumber,
      licenseIssuedAt: new Date(`${values.licenseIssuedAt}T00:00:00`).toISOString(),
      carModelId: Number(values.carModelId),
      paymentType: values.paymentType as PaymentType,
      agreement: true,
    };

    try {
      const created = await requestsApi.create(payload);
      notify(
        `Заявка #${created.id} отправлена. Статус появится в личном кабинете.`,
        'success',
      );
      navigate('/requests');
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        setErrors(error.fields);
        notify(error.message, 'error');
      } else {
        setFormError('Не удалось отправить заявку. Попробуйте ещё раз.');
        notify('Не удалось отправить заявку', 'error');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const summaryCar =
    selectedBrand && selectedModel
      ? `${selectedBrand.name} ${selectedModel.name}`
      : 'Автомобиль не выбран';
  const summaryDate = values.scheduledAt
    ? formatDateTime(new Date(values.scheduledAt).toISOString())
    : 'Дата не выбрана';
  const summaryPayment = values.paymentType
    ? PAYMENT_LABELS[values.paymentType as PaymentType]
    : 'Не выбрана';
  const summaryPrice = selectedModel ? formatPrice(selectedModel.price) : 'Выберите автомобиль';

  return (
    <section className="new-request">
      <header className="page-head">
        <div>
          <span className="eyebrow">Формирование заявки</span>
          <h1>Новая заявка на тест-драйв</h1>
          <p>Заполните все поля. Кнопка отправки станет активной после подтверждения правил.</p>
        </div>
        <Link className="btn btn--ghost" to="/requests">
          <Icon name="chevron-left" size={18} />
          К моим заявкам
        </Link>
      </header>

      <form className="request-form" onSubmit={handleSubmit} noValidate>
        <div className="request-form__main">
          {formError && (
            <div className="form-alert" role="alert">
              <Icon name="info" size={18} />
              <span>{formError}</span>
            </div>
          )}

          <section className="form-section">
            <header className="form-section__head">
              <span className="form-section__number">01</span>
              <div>
                <h2>Автомобиль</h2>
                <p>Выберите марку и модель — стоимость фиксирована для каждой модели.</p>
              </div>
            </header>

            <Field
              label="Марка и модель"
              error={errors.carModelId}
              required
              hint={
                brands.length > 0
                  ? `${brands.length} марки · ${brands.reduce(
                      (sum, brand) => sum + brand.models.length,
                      0,
                    )} моделей`
                  : undefined
              }
            >
              {catalogLoading ? (
                <div className="form-loading">
                  <InlineLoader />
                  <span>Загружаем каталог автомобилей…</span>
                </div>
              ) : catalogError ? (
                <div className="callout callout--danger callout--compact">
                  <span className="callout__icon">
                    <Icon name="info" size={16} />
                  </span>
                  <div>
                    <p>{catalogError}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void loadCatalog()}
                      icon={<Icon name="refresh" size={15} />}
                    >
                      Повторить
                    </Button>
                  </div>
                </div>
              ) : (
                <CarPicker
                  brands={brands}
                  brandId={values.brandId}
                  modelId={values.carModelId}
                  onBrandChange={(brandId) => {
                    setValues((current) => ({ ...current, brandId, carModelId: '' }));
                    setErrors((current) => {
                      const next = { ...current };
                      delete next.carModelId;
                      return next;
                    });
                  }}
                  onModelChange={(modelId) => update('carModelId', modelId)}
                  error={errors.carModelId}
                />
              )}
            </Field>
          </section>

          <section className="form-section">
            <header className="form-section__head">
              <span className="form-section__number">02</span>
              <div>
                <h2>Контакты</h2>
                <p>Адрес и телефон, по которым с вами свяжутся.</p>
              </div>
            </header>

            <div className="form-grid">
              <Field
                label="Адрес"
                htmlFor="address"
                error={errors.address}
                required
                className="form-grid__full"
              >
                <input
                  id="address"
                  name="address"
                  className="input"
                  type="text"
                  value={values.address}
                  onChange={(event) => update('address', event.target.value)}
                  onBlur={() => validateField('address')}
                  placeholder="г. Москва, ул. Тверская, д. 12, кв. 5"
                  autoComplete="street-address"
                  aria-invalid={Boolean(errors.address)}
                />
              </Field>

              <Field label="Контактный телефон" htmlFor="contactPhone" error={errors.contactPhone} required>
                <PhoneInput
                  id="contactPhone"
                  name="contactPhone"
                  value={values.contactPhone}
                  onChange={(value) => update('contactPhone', value)}
                  onBlur={() => validateField('contactPhone')}
                  autoComplete="tel"
                  invalid={Boolean(errors.contactPhone)}
                />
              </Field>
            </div>
          </section>

          <section className="form-section">
            <header className="form-section__head">
              <span className="form-section__number">03</span>
              <div>
                <h2>Водительское удостоверение</h2>
                <p>Данные нужны для допуска к тест-драйву.</p>
              </div>
            </header>

            <div className="form-grid">
              <Field label="Серия" htmlFor="licenseSeries" error={errors.licenseSeries} required>
                <input
                  id="licenseSeries"
                  name="licenseSeries"
                  className="input"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={values.licenseSeries}
                  onChange={(event) =>
                    update('licenseSeries', event.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  onBlur={() => validateField('licenseSeries')}
                  placeholder="7712"
                  aria-invalid={Boolean(errors.licenseSeries)}
                />
              </Field>

              <Field label="Номер" htmlFor="licenseNumber" error={errors.licenseNumber} required>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  className="input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={values.licenseNumber}
                  onChange={(event) =>
                    update('licenseNumber', event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  onBlur={() => validateField('licenseNumber')}
                  placeholder="345678"
                  aria-invalid={Boolean(errors.licenseNumber)}
                />
              </Field>

              <Field label="Дата выдачи" htmlFor="licenseIssuedAt" error={errors.licenseIssuedAt} required>
                <input
                  id="licenseIssuedAt"
                  name="licenseIssuedAt"
                  className="input"
                  type="date"
                  max={maxLicenseDate}
                  value={values.licenseIssuedAt}
                  onChange={(event) => update('licenseIssuedAt', event.target.value)}
                  onBlur={() => validateField('licenseIssuedAt')}
                  aria-invalid={Boolean(errors.licenseIssuedAt)}
                />
              </Field>
            </div>
          </section>

          <section className="form-section">
            <header className="form-section__head">
              <span className="form-section__number">04</span>
              <div>
                <h2>Дата, время и оплата</h2>
                <p>Выберите удобное время визита и способ оплаты.</p>
              </div>
            </header>

            <div className={`price-banner ${selectedModel ? '' : 'price-banner--empty'}`.trim()}>
              <span className="price-banner__icon">
                <Icon name="cash" size={20} />
              </span>
              <div className="price-banner__text">
                <span>Фиксированная стоимость услуги</span>
                <strong>
                  {selectedBrand && selectedModel
                    ? `${selectedBrand.name} ${selectedModel.name}`
                    : 'Автомобиль ещё не выбран'}
                </strong>
              </div>
              <b className="price-banner__value">
                {selectedModel ? formatPrice(selectedModel.price) : '—'}
              </b>
            </div>

            <div className="form-grid">
              <Field
                label="Дата и время тест-драйва"
                htmlFor="scheduledAt"
                error={errors.scheduledAt}
                required
                className="form-grid__full"
                hint="Доступны даты не раньше чем через 15 минут"
              >
                <input
                  id="scheduledAt"
                  name="scheduledAt"
                  className="input"
                  type="datetime-local"
                  min={minDate}
                  value={values.scheduledAt}
                  onChange={(event) => update('scheduledAt', event.target.value)}
                  onBlur={() => validateField('scheduledAt')}
                  aria-invalid={Boolean(errors.scheduledAt)}
                />
              </Field>

              <Field label="Тип оплаты" error={errors.paymentType} required className="form-grid__full">
                <div className="payment-grid" role="radiogroup" aria-label="Тип оплаты">
                  {PAYMENT_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`payment-card ${
                        values.paymentType === option.value ? 'is-active' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentType"
                        value={option.value}
                        checked={values.paymentType === option.value}
                        onChange={() => update('paymentType', option.value)}
                      />
                      <span className="payment-card__icon">
                        <Icon name={option.icon} size={22} />
                      </span>
                      <span className="payment-card__text">
                        <strong>{option.title}</strong>
                        <small>{option.text}</small>
                      </span>
                      <span className="payment-card__check">
                        <Icon name="check" size={14} />
                      </span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </section>

          <label className={`agreement ${errors.agreement ? 'agreement--error' : ''}`.trim()}>
            <input
              type="checkbox"
              name="agreement"
              checked={values.agreement}
              onChange={(event) => update('agreement', event.target.checked)}
            />
            <span className="agreement__box" aria-hidden="true">
              <Icon name="check" size={14} />
            </span>
            <span className="agreement__text">
              Я ознакомлен(а) с{' '}
              <button
                type="button"
                className="link-button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setRulesOpen(true);
                }}
              >
                правилами предоставления услуги тест-драйва
              </button>{' '}
              и подтверждаю, что все предоставленные данные верны.
            </span>
          </label>
          {errors.agreement && (
            <p className="field__error" role="alert">
              {errors.agreement}
            </p>
          )}

          <div className="form-actions">
            <Link className="btn btn--ghost" to="/requests">
              Отмена
            </Link>
            <Button type="submit" size="lg" disabled={!values.agreement} loading={submitting}>
              Отправить заявку
            </Button>
          </div>
          {!values.agreement && (
            <p className="form-note">
              <Icon name="info" size={16} />
              Отметьте согласие с правилами, чтобы активировать кнопку отправки.
            </p>
          )}
        </div>

        <aside className="form-summary" aria-label="Краткая информация о заявке">
          <div className="form-summary__head">
            <span className="eyebrow">Ваша заявка</span>
            <span className="form-summary__status">Черновик</span>
          </div>

          <div className="form-summary__car">
            <span className="form-summary__car-icon">
              <Icon name="car" size={30} />
            </span>
            <div>
              <span>Автомобиль</span>
              <strong>{summaryCar}</strong>
            </div>
          </div>

          <dl className="form-summary__list">
            <div>
              <dt>
                <Icon name="calendar" size={16} /> Дата и время
              </dt>
              <dd>{summaryDate}</dd>
            </div>
            <div>
              <dt>
                <Icon name="cash" size={16} /> Стоимость услуги
              </dt>
              <dd className="form-summary__price">{summaryPrice}</dd>
            </div>
            <div>
              <dt>
                <Icon name="card" size={16} /> Оплата
              </dt>
              <dd>{summaryPayment}</dd>
            </div>
            <div>
              <dt>
                <Icon name="map" size={16} /> Адрес
              </dt>
              <dd>{values.address || 'Не указан'}</dd>
            </div>
            <div>
              <dt>
                <Icon name="phone" size={16} /> Телефон
              </dt>
              <dd>{values.contactPhone || 'Не указан'}</dd>
            </div>
          </dl>

          <div className="form-summary__note">
            <Icon name="shield" size={18} />
            <p>Ваши данные защищены, служебные данные не хранятся в открытом виде.</p>
          </div>
        </aside>
      </form>

      <Modal
        open={rulesOpen}
        title="Правила тест-драйва"
        onClose={() => setRulesOpen(false)}
        footer={
          <Button onClick={() => setRulesOpen(false)}>Понятно</Button>
        }
      >
        <div className="rules">
          <p>
            Тест-драйв — платная услуга с фиксированной стоимостью для каждой модели.
            Услуга не связана с покупкой автомобиля и не создаёт обязательств по его
            приобретению.
          </p>
          <ol>
            <li>Стоимость услуги указана при выборе автомобиля и не меняется при оформлении заявки.</li>
            <li>К участию допускаются водители старше 18 лет с действующим удостоверением.</li>
            <li>Перед поездкой администратор проверяет серию, номер и дату выдачи удостоверения.</li>
            <li>Автомобиль предоставляется на согласованное время; опоздание может сократить поездку.</li>
            <li>Во время тест-драйва необходимо соблюдать ПДД и указания сопровождающего.</li>
            <li>Оплата производится после поездки наличными или банковской картой.</li>
            <li>Данные заявки используются только для организации тест-драйва.</li>
          </ol>
          <p className="rules__note">
            {`В каталоге ${brands.length} ${pluralize(brands.length, [
              'марка',
              'марки',
              'марок',
            ])} и ${brands.reduce((sum, brand) => sum + brand.models.length, 0)} ${pluralize(
              brands.reduce((sum, brand) => sum + brand.models.length, 0),
              ['модель', 'модели', 'моделей'],
            )}.`}
          </p>
        </div>
      </Modal>
    </section>
  );
}
