import { useEffect, useState, type ReactNode } from 'react';
import { catalogApi } from '../api/client';
import type { CarBrand } from '../types';
import { pluralize } from '../utils/format';
import { Icon } from './Icon';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ eyebrow, title, lead, children, footer }: AuthShellProps) {
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
    <section className="auth-layout">
      <aside className="auth-aside">
        <div>
          <span className="eyebrow eyebrow--light">Портал «Едем, но это не точно»</span>
          <h2>
            Сначала заявка.
            <br />
            <em>Потом — дорога.</em>
          </h2>
          <p>
            Выберите автомобиль и удобное время. Администратор подтвердит заявку, а статус
            появится в личном кабинете.
          </p>
          <ul className="auth-aside__list">
            <li>
              <Icon name="check" size={17} />
              {catalogLoading
                ? 'Загружаем актуальный каталог…'
                : `${brands.length} ${pluralize(brands.length, [
                    'марка',
                    'марки',
                    'марок',
                  ])}, ${modelCount} ${pluralize(modelCount, [
                    'модель',
                    'модели',
                    'моделей',
                  ])} и ${fleetCount} ${pluralize(fleetCount, [
                    'автомобиль',
                    'автомобиля',
                    'автомобилей',
                  ])} в парке`}
            </li>
            <li>
              <Icon name="check" size={17} />
              Прозрачные статусы заявки
            </li>
            <li>
              <Icon name="check" size={17} />
              Наличные или банковская карта
            </li>
          </ul>
        </div>
        <div className="auth-aside__mark">
          <Icon name="car" size={30} />
          <span>
            тест-драйв
            <br />
            без обязательств
          </span>
        </div>
      </aside>

      <div className="auth-card">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="auth-card__lead">{lead}</p>
        {children}
        {footer && <div className="auth-card__foot">{footer}</div>}
      </div>
    </section>
  );
}
