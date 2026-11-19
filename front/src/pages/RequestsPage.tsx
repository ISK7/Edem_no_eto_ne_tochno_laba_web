import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, requestsApi } from '../api/client';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { SkeletonCards } from '../components/Loader';
import { RequestInfo } from '../components/RequestInfo';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  PAYMENT_LABELS,
  SORT_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  type RequestStatus,
  type SortOption,
  type TestDriveRequest,
} from '../types';
import {
  displayName,
  formatDateTime,
  formatDay,
  formatMonth,
  formatTime,
  pluralize,
} from '../utils/format';

type FilterValue = RequestStatus | 'ALL';

function RequestCard({ request }: { request: TestDriveRequest }) {
  return (
    <article className={`request-card request-card--${request.status.toLowerCase()}`}>
      <div className="request-card__date" aria-hidden="true">
        <strong>{formatDay(request.scheduledAt)}</strong>
        <span>{formatMonth(request.scheduledAt)}</span>
        <small>{formatTime(request.scheduledAt)}</small>
      </div>

      <div className="request-card__body">
        <div className="request-card__top">
          <div>
            <p className="request-card__id">Заявка #{request.id}</p>
            <h3>
              {request.car.brand} {request.car.model}
            </h3>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="request-card__meta">
          <span>
            <Icon name="calendar" size={16} />
            {formatDateTime(request.scheduledAt)}
          </span>
          <span>
            <Icon name={request.paymentType === 'CARD' ? 'card' : 'cash'} size={16} />
            {PAYMENT_LABELS[request.paymentType]}
          </span>
          <span>
            <Icon name="map" size={16} />
            {request.address}
          </span>
        </div>

        {request.status === 'REJECTED' && request.rejectionReason && (
          <div className="callout callout--danger callout--compact">
            <span className="callout__icon">
              <Icon name="info" size={16} />
            </span>
            <p>{request.rejectionReason}</p>
          </div>
        )}

        <details className="request-card__details">
          <summary>
            Подробности заявки
            <Icon name="chevron-right" size={17} className="details-arrow" />
          </summary>
          <RequestInfo request={request} />
        </details>
      </div>
    </article>
  );
}

const FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: 'ALL', label: 'Все' },
  ...STATUS_ORDER.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
];

export function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TestDriveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterValue>('ALL');
  const [sort, setSort] = useState<SortOption>('newest');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRequests(await requestsApi.mine());
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : 'Не удалось загрузить заявки. Попробуйте ещё раз.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const result: Record<FilterValue, number> = {
      ALL: requests.length,
      PENDING: 0,
      APPROVED: 0,
      COMPLETED: 0,
      REJECTED: 0,
    };
    for (const request of requests) result[request.status] += 1;
    return result;
  }, [requests]);

  const sorted = useMemo(() => {
    const items =
      filter === 'ALL'
        ? [...requests]
        : requests.filter((request) => request.status === filter);

    items.sort((left, right) => {
      switch (sort) {
        case 'oldest':
          return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        case 'soon':
          return new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime();
        case 'late':
          return new Date(right.scheduledAt).getTime() - new Date(left.scheduledAt).getTime();
        case 'brand-asc':
        case 'brand-desc': {
          const direction = sort === 'brand-asc' ? 1 : -1;
          const byBrand = left.car.brand.localeCompare(right.car.brand, 'ru');
          if (byBrand !== 0) return byBrand * direction;

          const byModel = left.car.model.localeCompare(right.car.model, 'ru');
          if (byModel !== 0) return byModel;

          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        }
        case 'newest':
        default:
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }
    });

    return items;
  }, [requests, filter, sort]);

  const firstName = user ? displayName(user.fullName) : '';

  return (
    <section className="cabinet">
      <header className="page-head">
        <div>
          <span className="eyebrow">Личный кабинет</span>
          <h1>Мои заявки</h1>
          <p>
            {firstName ? `Здравствуйте, ${firstName}. ` : ''}Здесь собрана история ваших
            тест-драйвов и текущие статусы.
          </p>
        </div>
        <div className="page-head__actions">
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon name="refresh" size={17} />}
            onClick={() => void load()}
            loading={loading}
          >
            Обновить
          </Button>
          <Link className="btn btn--primary btn--sm" to="/requests/new">
            <Icon name="plus" size={16} />
            Новая заявка
          </Link>
        </div>
      </header>

      <div className="cabinet-stats">
        <article className="cabinet-stat cabinet-stat--total">
          <span>Всего заявок</span>
          <strong>{counts.ALL}</strong>
          <small>{pluralize(counts.ALL, ['заявка', 'заявки', 'заявок'])}</small>
        </article>
        <article className="cabinet-stat cabinet-stat--pending">
          <span>На рассмотрении</span>
          <strong>{counts.PENDING}</strong>
          <small>ожидают решения</small>
        </article>
        <article className="cabinet-stat cabinet-stat--approved">
          <span>Одобрено</span>
          <strong>{counts.APPROVED + counts.COMPLETED}</strong>
          <small>подтверждено администратором</small>
        </article>
        <article className="cabinet-stat cabinet-stat--rejected">
          <span>Отклонено</span>
          <strong>{counts.REJECTED}</strong>
          <small>с указанием причины</small>
        </article>
      </div>

      <div className="panel">
        <div className="panel__head">
          <div>
            <h2>История заявок</h2>
            <p>
              Найдено {sorted.length}{' '}
              {pluralize(sorted.length, ['заявка', 'заявки', 'заявок'])}.
            </p>
          </div>
        </div>

        <div className="panel__toolbar">
          <div className="filter-chips" role="group" aria-label="Фильтр по статусу">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`filter-chip ${filter === item.value ? 'is-active' : ''}`}
                onClick={() => setFilter(item.value)}
                aria-pressed={filter === item.value}
              >
                {item.label}
                <span>{counts[item.value]}</span>
              </button>
            ))}
          </div>

          <label className="sort-field" htmlFor="requests-sort">
            <span>Сортировка</span>
            <select
              id="requests-sort"
              className="input select"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((value) => (
                <option key={value} value={value}>
                  {SORT_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <SkeletonCards count={3} />
        ) : error ? (
          <div className="callout callout--danger">
            <span className="callout__icon">
              <Icon name="info" size={18} />
            </span>
            <div>
              <strong>Не удалось загрузить заявки</strong>
              <p>{error}</p>
              <Button variant="secondary" size="sm" onClick={() => void load()}>
                Повторить
              </Button>
            </div>
          </div>
        ) : sorted.length > 0 ? (
          <div className="request-list">
            {sorted.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon="car"
            title="Пока ни одной заявки"
            text="Выберите автомобиль и удобное время — заявка появится здесь сразу после отправки."
            action={
              <Link className="btn btn--primary btn--sm" to="/requests/new">
                <Icon name="plus" size={16} />
                Создать заявку
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon="filter"
            title="В этом статусе заявок нет"
            text="Попробуйте выбрать другой фильтр — остальные заявки останутся на месте."
            action={
              <Button variant="secondary" onClick={() => setFilter('ALL')}>
                Показать все
              </Button>
            }
          />
        )}
      </div>
    </section>
  );
}
