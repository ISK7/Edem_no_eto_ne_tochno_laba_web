import { useEffect, useState } from 'react';
import { ApiError, adminApi } from '../api/client';
import { AdminSchedule } from '../components/AdminSchedule';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { InlineLoader, SkeletonTable } from '../components/Loader';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { RequestInfo } from '../components/RequestInfo';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import {
  PAYMENT_LABELS,
  SORT_LABELS,
  STATUS_LABELS,
  type AdminListResponse,
  type RequestStatus,
  type SortOption,
  type TestDriveRequest,
} from '../types';
import { formatDateTime, formatPhone, pluralize } from '../utils/format';

type StatusFilter = RequestStatus | 'ALL';

const PAGE_SIZE = 6;

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'Все' },
  { value: 'PENDING', label: 'На рассмотрении' },
  { value: 'APPROVED', label: 'Одобрено' },
  { value: 'COMPLETED', label: 'Выполнено' },
  { value: 'REJECTED', label: 'Отклонено' },
];

export function AdminPage() {
  const { notify } = useToast();

  const [data, setData] = useState<AdminListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [detail, setDetail] = useState<TestDriveRequest | null>(null);
  const [rejecting, setRejecting] = useState<TestDriveRequest | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    adminApi
      .list({
        page,
        pageSize: PAGE_SIZE,
        status,
        search: debouncedSearch,
        sort,
      })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        if (page > result.pagination.totalPages) {
          setPage(result.pagination.totalPages);
        }
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : 'Не удалось загрузить список заявок.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, status, sort, debouncedSearch, reloadKey]);

  const stats = data?.stats ?? {
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
  };

  const applyStatus = async (
    request: TestDriveRequest,
    nextStatus: 'APPROVED' | 'COMPLETED' | 'REJECTED',
    rejectionReason?: string,
  ) => {
    setBusyId(request.id);
    try {
      const updated = await adminApi.updateStatus(
        request.id,
        nextStatus,
        rejectionReason,
      );
      notify(
        `Заявка #${request.id}: ${STATUS_LABELS[updated.status].toLowerCase()}`,
        'success',
      );
      setDetail((current) => (current?.id === updated.id ? updated : current));
      setRejecting(null);
      setReason('');
      setReasonError('');
      setReloadKey((current) => current + 1);
    } catch (actionError) {
      if (actionError instanceof ApiError) {
        notify(actionError.message, 'error');
        if (actionError.fields.rejectionReason) {
          setReasonError(actionError.fields.rejectionReason);
        }
      } else {
        notify('Не удалось изменить статус заявки', 'error');
      }
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (request: TestDriveRequest) => {
    setRejecting(request);
    setReason('');
    setReasonError('');
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setReasonError('Укажите причину отклонения (минимум 5 символов)');
      return;
    }
    await applyStatus(rejecting, 'REJECTED', trimmed);
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setSort('newest');
    setPage(1);
  };

  const start = data && data.pagination.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const end = data ? Math.min(page * PAGE_SIZE, data.pagination.total) : 0;

  return (
    <section className="admin">
      <header className="page-head">
        <div>
          <span className="eyebrow">Администрирование</span>
          <h1>Заявки на тест-драйв</h1>
          <p>
            Все заявки с контактами и данными клиента. Меняйте статус, фильтруйте список и
            контролируйте загрузку.
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<Icon name="refresh" size={17} />}
          loading={loading}
          onClick={() => setReloadKey((current) => current + 1)}
        >
          Обновить данные
        </Button>
      </header>

      <div className="admin-stats">
        <button
          type="button"
          className={`admin-stat admin-stat--total ${status === 'ALL' ? 'is-active' : ''}`}
          onClick={() => setStatus('ALL')}
        >
          <span>Всего</span>
          <strong>{stats.total}</strong>
          <small>{pluralize(stats.total, ['заявка', 'заявки', 'заявок'])}</small>
        </button>
        <button
          type="button"
          className={`admin-stat admin-stat--pending ${status === 'PENDING' ? 'is-active' : ''}`}
          onClick={() => setStatus('PENDING')}
        >
          <span>На рассмотрении</span>
          <strong>{stats.pending}</strong>
          <small>ждут решения</small>
        </button>
        <button
          type="button"
          className={`admin-stat admin-stat--approved ${status === 'APPROVED' ? 'is-active' : ''}`}
          onClick={() => setStatus('APPROVED')}
        >
          <span>Одобрено</span>
          <strong>{stats.approved}</strong>
          <small>подтверждены</small>
        </button>
        <button
          type="button"
          className={`admin-stat admin-stat--completed ${status === 'COMPLETED' ? 'is-active' : ''}`}
          onClick={() => setStatus('COMPLETED')}
        >
          <span>Выполнено</span>
          <strong>{stats.completed}</strong>
          <small>поездки состоялись</small>
        </button>
        <button
          type="button"
          className={`admin-stat admin-stat--rejected ${status === 'REJECTED' ? 'is-active' : ''}`}
          onClick={() => setStatus('REJECTED')}
        >
          <span>Отклонено</span>
          <strong>{stats.rejected}</strong>
          <small>с причиной</small>
        </button>
      </div>

      <div className="panel panel--admin">
        <div className="admin-toolbar">
          <label className="search-field" htmlFor="admin-search">
            <Icon name="search" size={18} />
            <input
              id="admin-search"
              type="search"
              className="search-field__input"
              placeholder="ФИО, телефон, логин, авто или № заявки"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="sort-field" htmlFor="admin-sort">
            <span>Сортировка</span>
            <select
              id="admin-sort"
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

          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Сбросить
          </Button>
        </div>

        <div className="filter-chips filter-chips--admin" role="group" aria-label="Фильтр заявок">
          {STATUS_FILTERS.map((item) => {
            const count =
              item.value === 'ALL'
                ? stats.total
                : item.value === 'PENDING'
                  ? stats.pending
                  : item.value === 'APPROVED'
                    ? stats.approved
                    : item.value === 'COMPLETED'
                      ? stats.completed
                      : stats.rejected;

            return (
              <button
                key={item.value}
                type="button"
                className={`filter-chip ${status === item.value ? 'is-active' : ''}`}
                onClick={() => setStatus(item.value)}
                aria-pressed={status === item.value}
              >
                {item.label}
                <span>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="admin-workspace">
          <div className="admin-workspace__orders">
            {loading && !data ? (
              <SkeletonTable rows={5} />
            ) : error && !data ? (
          <div className="callout callout--danger">
            <span className="callout__icon">
              <Icon name="info" size={18} />
            </span>
            <div>
              <strong>Не удалось загрузить заявки</strong>
              <p>{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReloadKey((current) => current + 1)}
              >
                Повторить
              </Button>
            </div>
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className={`admin-table ${loading ? 'is-refreshing' : ''}`} aria-busy={loading}>
              <div className="admin-table__head" aria-hidden="true">
                <span>Клиент</span>
                <span>Автомобиль</span>
                <span>Визит</span>
                <span>Статус</span>
                <span>Действия</span>
              </div>

              {data.items.map((request) => (
                <article className="admin-row" key={request.id}>
                  <span className="admin-row__number">#{request.id}</span>
                  <div className="admin-row__client" data-label="Клиент">
                    <strong>{request.customer.fullName}</strong>
                    <span>@{request.customer.login}</span>
                    <a href={`tel:${request.customer.phone}`}>
                      {formatPhone(request.customer.phone)}
                    </a>
                    <a href={`mailto:${request.customer.email}`}>{request.customer.email}</a>
                  </div>

                  <div className="admin-row__car" data-label="Автомобиль">
                    <strong>
                      {request.car.brand} {request.car.model}
                    </strong>
                    <span>{PAYMENT_LABELS[request.paymentType]}</span>
                    <span>Тел.: {formatPhone(request.contactPhone)}</span>
                  </div>

                  <div className="admin-row__visit" data-label="Визит">
                    <strong>{formatDateTime(request.scheduledAt)}</strong>
                    <span>{request.address}</span>
                    <small>создана {formatDateTime(request.createdAt)}</small>
                  </div>

                  <div className="admin-row__status" data-label="Статус">
                    <StatusBadge status={request.status} />
                    {request.rejectionReason && (
                      <small title={request.rejectionReason}>{request.rejectionReason}</small>
                    )}
                  </div>

                  <div className="admin-row__actions" data-label="Действия">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetail(request)}
                    >
                      Детали
                    </Button>
                    {request.status !== 'APPROVED' && (
                      <Button
                        variant="soft"
                        size="sm"
                        loading={busyId === request.id}
                        onClick={() => void applyStatus(request, 'APPROVED')}
                      >
                        Одобрить
                      </Button>
                    )}
                    {request.status !== 'COMPLETED' && (
                      <Button
                        variant="soft"
                        size="sm"
                        loading={busyId === request.id}
                        onClick={() => void applyStatus(request, 'COMPLETED')}
                      >
                        Выполнить
                      </Button>
                    )}
                    {request.status !== 'REJECTED' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openReject(request)}
                      >
                        Отклонить
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="admin-table__foot">
              <span>
                Показано {start}–{end} из {data.pagination.total}
                {loading && (
                  <span className="admin-refreshing">
                    <InlineLoader /> обновляем
                  </span>
                )}
              </span>
              <Pagination
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                onChange={setPage}
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon="filter"
            title="Заявок по фильтру не найдено"
            text="Измените поисковый запрос или сбросьте фильтры — данные заявок останутся в системе."
            action={
              <Button variant="secondary" onClick={resetFilters}>
                Сбросить фильтры
              </Button>
            }
          />
            )}
          </div>

          <AdminSchedule refreshKey={reloadKey} />
        </div>
      </div>

      <Modal
        open={Boolean(detail)}
        title={`Заявка #${detail?.id ?? ''}`}
        size="lg"
        onClose={() => setDetail(null)}
        footer={<Button onClick={() => setDetail(null)}>Закрыть</Button>}
      >
        {detail && <RequestInfo request={detail} showCustomer />}
      </Modal>

      <Modal
        open={Boolean(rejecting)}
        title={`Отклонить заявку #${rejecting?.id ?? ''}`}
        onClose={() => {
          if (!busyId) setRejecting(null);
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setRejecting(null)}
              disabled={busyId !== null}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              loading={busyId === rejecting?.id}
              disabled={reason.trim().length < 5}
              onClick={() => void confirmReject()}
            >
              Отклонить заявку
            </Button>
          </>
        }
      >
        <p className="modal__lead">
          Причина будет видна заказчику в личном кабинете. Без причины отклонить заявку
          нельзя.
        </p>
        <Field
          label="Причина отклонения"
          htmlFor="rejectionReason"
          error={reasonError}
          required
          hint="От 5 до 300 символов"
        >
          <textarea
            id="rejectionReason"
            className="input textarea"
            rows={4}
            maxLength={300}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError('');
            }}
            placeholder="Например: в выбранное время автомобиль занят на другом тест-драйве."
            aria-invalid={Boolean(reasonError)}
          />
        </Field>
        <div className="char-counter">{reason.length} / 300</div>
      </Modal>
    </section>
  );
}
