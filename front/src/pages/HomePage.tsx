import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogApi } from '../api/client';
import { RoadScene } from '../components/RoadScene';
import { Icon } from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import type { CarBrand } from '../types';
import { pluralize } from '../utils/format';

const steps = [
  {
    number: '01',
    icon: 'user' as const,
    title: 'Создайте аккаунт',
    text: 'Заполните профиль один раз — данные подставятся в новую заявку.',
  },
  {
    number: '02',
    icon: 'car' as const,
    title: 'Выберите автомобиль',
    text: 'Марка, модель, дата и время визита. Плюс удобный способ оплаты.',
  },
  {
    number: '03',
    icon: 'check' as const,
    title: 'Дождитесь решения',
    text: 'Администратор одобрит заявку или укажет причину отклонения в кабинете.',
  },
];

export function HomePage() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    let active = true;
    catalogApi
      .cars()
      .then((data) => {
        if (active) setBrands(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const modelCount = brands.reduce((sum, brand) => sum + brand.models.length, 0);
  const fleetCount = brands.reduce(
    (sum, brand) => sum + brand.models.reduce((brandSum, model) => brandSum + model.quantity, 0),
    0,
  );

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow eyebrow--accent">
            <span className="eyebrow__dot" />
            Портал записи на тест-драйв
          </span>
          <h1>
            Едем.
            <br />
            <em>Но это не точно.</em>
          </h1>
          <p className="hero__lead">
            Выберите автомобиль, удобную дату и оставьте заявку. Администратор подтвердит
            тест-драйв, а статус всегда будет виден в личном кабинете.
          </p>

          <div className="hero__actions">
            {user ? (
              <Link className="btn btn--primary btn--lg" to="/requests/new">
                Новая заявка
                <Icon name="arrow-right" size={18} />
              </Link>
            ) : (
              <Link className="btn btn--primary btn--lg" to="/register">
                Создать аккаунт
                <Icon name="arrow-right" size={18} />
              </Link>
            )}
            <Link className="btn btn--secondary btn--lg" to={user ? '/requests' : '/login'}>
              {user ? 'Мои заявки' : 'У меня есть аккаунт'}
            </Link>
          </div>

          <ul className="hero__facts">
            <li>
              <strong>{catalogLoading ? '—' : brands.length}</strong>
              <span>{pluralize(brands.length, ['марка', 'марки', 'марок'])}</span>
            </li>
            <li>
              <strong>{catalogLoading ? '—' : modelCount}</strong>
              <span>{pluralize(modelCount, ['модель', 'модели', 'моделей'])}</span>
            </li>
            <li>
              <strong>{catalogLoading ? '—' : fleetCount}</strong>
              <span>
                {pluralize(fleetCount, [
                  'автомобиль в парке',
                  'автомобиля в парке',
                  'автомобилей в парке',
                ])}
              </span>
            </li>
            <li>
              <strong>15</strong>
              <span>минут</span>
            </li>
          </ul>
        </div>

        <RoadScene brands={brands} loading={catalogLoading} />
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Как это работает</span>
          <h2>Три шага до первой поездки</h2>
          <p>Без звонков и переписок: всё происходит в личном кабинете портала.</p>
        </div>

        <div className="steps">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <div className="step-card__top">
                <span className="step-card__number">{step.number}</span>
                <span className="step-card__icon">
                  <Icon name={step.icon} size={22} />
                </span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head section-head--row">
          <div>
            <span className="eyebrow">Каталог</span>
            <h2>Автомобили для тест-драйва</h2>
            <p>
              {catalogLoading
                ? 'Загружаем актуальные данные каталога…'
                : `${brands.length} ${pluralize(brands.length, [
                    'марка',
                    'марки',
                    'марок',
                  ])} и ${modelCount} ${pluralize(modelCount, [
                    'модель',
                    'модели',
                    'моделей',
                  ])} в каталоге.`}
            </p>
          </div>
          {user && (
            <Link className="btn btn--ghost" to="/requests/new">
              Записаться
              <Icon name="arrow-right" size={17} />
            </Link>
          )}
        </div>

        <div className="brand-grid">
          {catalogLoading
            ? Array.from({ length: 4 }, (_, index) => (
                <div className="brand-card brand-card--skeleton" key={index} aria-hidden="true">
                  <span className="skeleton skeleton--title" />
                  <span className="skeleton skeleton--line" />
                  <span className="skeleton skeleton--line skeleton--short" />
                </div>
              ))
            : brands.map((brand) => {
                const brandFleet = brand.models.reduce(
                  (sum, model) => sum + model.quantity,
                  0,
                );

                return (
                  <article className="brand-card" key={brand.id}>
                    <div className="brand-card__head">
                      <span className="brand-card__mark">
                        <Icon name="car" size={22} />
                      </span>
                      <h3>{brand.name}</h3>
                      <span className="brand-card__count">{brand.models.length}</span>
                    </div>
                    <ul className="brand-card__models">
                      {brand.models.map((model) => (
                        <li key={model.id}>{model.name}</li>
                      ))}
                    </ul>
                    <p className="brand-card__fleet">
                      {brandFleet}{' '}
                      {pluralize(brandFleet, [
                        'автомобиль',
                        'автомобиля',
                        'автомобилей',
                      ])}{' '}
                      в парке
                    </p>
                  </article>
                );
              })}
        </div>
      </section>

      <section className="cta-band">
        <div>
          <span className="eyebrow eyebrow--light">Готовы сесть за руль?</span>
          <h2>Заявка занимает меньше времени, чем прогрев двигателя.</h2>
        </div>
        <Link className="btn btn--light btn--lg" to={user ? '/requests/new' : '/register'}>
          {user ? 'Оставить заявку' : 'Зарегистрироваться'}
          <Icon name="arrow-right" size={18} />
        </Link>
      </section>
    </div>
  );
}
