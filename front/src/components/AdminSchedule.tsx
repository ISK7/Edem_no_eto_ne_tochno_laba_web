import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, adminApi } from '../api/client';
import {
  STATUS_LABELS,
  STATUS_ORDER,
  type RequestStatus,
  type TestDriveRequest,
} from '../types';
import { formatTime, pluralize, toDateKey, todayValue } from '../utils/format';
import { Button } from './Button';
import { Icon } from './Icon';
import { InlineLoader } from './Loader';

const HOUR_HEIGHT = 44;
const DAY_HEIGHT = 24 * HOUR_HEIGHT;
const CHIP_HEIGHT = 24;
const CHIP_GAP = 4;
const LANE_WIDTH = 134;
const BASE_WIDTH = 244;
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const STATUS_PRIORITY: Record<RequestStatus, number> = {
  PENDING: 4,
  APPROVED: 3,
  REJECTED: 2,
  COMPLETED: 1,
};

const monthFormatter = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
});

const dayFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildMonthCells(year: number, month: number): Array<string | null> {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: Array<string | null> = Array.from({ length: offset }, () => null);

  for (let day = 1; day <= days; day += 1) {
    cells.push(toDateKey(new Date(year, month, day)));
  }

  while (cells.length < 42) cells.push(null);
  return cells;
}

interface AdminScheduleProps {
  refreshKey?: number;
}

export function AdminSchedule({ refreshKey = 0 }: AdminScheduleProps) {
  const [requests, setRequests] = useState<TestDriveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localReload, setLocalReload] = useState(0);

  const [selectedDate, setSelectedDate] = useState(todayValue);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [now, setNow] = useState(() => new Date());
  const [scrollHints, setScrollHints] = useState({ left: false, right: false });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    adminApi
      .schedule()
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : 'Не удалось загрузить расписание.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, localReload]);

  const busyDates = useMemo(() => {
    const map = new Map<string, number>();
    for (const request of requests) {
      const key = toDateKey(request.scheduledAt);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [requests]);

  const selectedRequests = useMemo(
    () =>
      requests
        .filter((request) => toDateKey(request.scheduledAt) === selectedDate)
        .sort(
          (left, right) =>
            new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
        ),
    [requests, selectedDate],
  );

  const layout = useMemo(() => {
    const prepared = selectedRequests.map((request) => {
      const date = new Date(request.scheduledAt);
      const minutes = date.getHours() * 60 + date.getMinutes();
      const top = (minutes / (24 * 60)) * DAY_HEIGHT;
      const chipTop = top >= 34 ? top - 32 : top + 12;
      return { request, top, chipTop, lane: 0 };
    });

    prepared.sort((left, right) => left.chipTop - right.chipTop);

    const laneEnds: number[] = [];
    for (const event of prepared) {
      let lane = laneEnds.findIndex((end) => end <= event.chipTop);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(0);
      }
      event.lane = lane;
      laneEnds[lane] = event.chipTop + CHIP_HEIGHT + CHIP_GAP;
    }

    return {
      events: prepared,
      maxLane: Math.max(0, laneEnds.length - 1),
    };
  }, [selectedRequests]);

  const contentWidth = BASE_WIDTH + layout.maxLane * LANE_WIDTH;
  const todayKey = todayValue();
  const isToday = selectedDate === todayKey;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes / (24 * 60)) * DAY_HEIGHT;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || loading) return;

    const current = new Date();
    const currentTop =
      ((current.getHours() * 60 + current.getMinutes()) / (24 * 60)) * DAY_HEIGHT;
    const today = selectedDate === todayValue();

    element.scrollLeft = element.scrollWidth;
    element.scrollTop = Math.max(0, today ? currentTop - 120 : 7 * HOUR_HEIGHT);

    const updateHints = () => {
      setScrollHints({
        left: element.scrollLeft > 2,
        right: element.scrollLeft + element.clientWidth < element.scrollWidth - 2,
      });
    };

    updateHints();
    element.addEventListener('scroll', updateHints, { passive: true });
    window.addEventListener('resize', updateHints);

    return () => {
      element.removeEventListener('scroll', updateHints);
      window.removeEventListener('resize', updateHints);
    };
  }, [selectedDate, loading, selectedRequests.length, layout.maxLane]);

  const cells = useMemo(
    () => buildMonthCells(monthCursor.year, monthCursor.month),
    [monthCursor],
  );

  const monthLabel = capitalize(
    monthFormatter.format(new Date(monthCursor.year, monthCursor.month, 1)),
  );
  const selectedLabel = capitalize(dayFormatter.format(dateFromKey(selectedDate)));

  const shiftMonth = (delta: number) => {
    setMonthCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const goToday = () => {
    const next = new Date();
    setSelectedDate(todayKey);
    setMonthCursor({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <aside className="schedule" aria-label="Расписание заявок">
      <header className="schedule__head">
        <div>
          <h3>Расписание</h3>
          <p>{selectedLabel}</p>
        </div>
        <button type="button" className="schedule__today" onClick={goToday}>
          Сегодня
        </button>
      </header>

      <div className="schedule-calendar">
        <div className="schedule-calendar__head">
          <button
            type="button"
            className="schedule-calendar__nav"
            onClick={() => shiftMonth(-1)}
            aria-label="Предыдущий месяц"
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <strong>{monthLabel}</strong>
          <button
            type="button"
            className="schedule-calendar__nav"
            onClick={() => shiftMonth(1)}
            aria-label="Следующий месяц"
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </div>

        <div className="schedule-calendar__weekdays" aria-hidden="true">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="schedule-calendar__grid">
          {cells.map((key, index) => {
            if (!key) {
              return <span className="schedule-calendar__blank" key={`blank-${index}`} />;
            }

            const count = busyDates.get(key) ?? 0;
            const day = Number(key.slice(-2));
            const classes = [
              'schedule-calendar__day',
              key === todayKey ? 'is-today' : '',
              key === selectedDate ? 'is-selected' : '',
              count > 0 ? 'is-busy' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                type="button"
                key={key}
                className={classes}
                onClick={() => setSelectedDate(key)}
                aria-pressed={key === selectedDate}
                aria-label={`${key}, ${count} ${pluralize(count, [
                  'заявка',
                  'заявки',
                  'заявок',
                ])}`}
                title={
                  count > 0
                    ? `${count} ${pluralize(count, ['заявка', 'заявки', 'заявок'])}`
                    : undefined
                }
              >
                <span>{day}</span>
                {count > 0 && <i className="schedule-calendar__dot" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="schedule__legend">
        {STATUS_ORDER.map((status) => (
          <span key={status}>
            <i className={`schedule__legend-dot schedule__legend-dot--${status.toLowerCase()}`} />
            {STATUS_LABELS[status]}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="schedule__state">
          <InlineLoader /> Загружаем расписание…
        </div>
      ) : error ? (
        <div className="schedule__state schedule__state--error">
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={() => setLocalReload((value) => value + 1)}>
            Повторить
          </Button>
        </div>
      ) : selectedRequests.length === 0 ? (
        <div className="schedule__state">
          <Icon name="calendar" size={22} />
          <p>На этот день заявок нет</p>
        </div>
      ) : (
        <div className="schedule__viewport">
          {scrollHints.left && <span className="schedule__fade schedule__fade--left" />}
          {scrollHints.right && <span className="schedule__fade schedule__fade--right" />}

          <div className="schedule__scroll" ref={scrollRef}>
            <div
              className="schedule__inner"
              style={{ width: `${contentWidth}px`, minWidth: '100%' }}
            >
              {Array.from({ length: 25 }, (_, hour) => (
                <div className="schedule-hour" key={hour} style={{ top: hour * HOUR_HEIGHT }}>
                  <span>{String(hour).padStart(2, '0')}:00</span>
                </div>
              ))}

              {layout.events.map(({ request, top, chipTop, lane }) => (
                <div
                  className="schedule-event"
                  key={request.id}
                  style={{ top: chipTop, zIndex: 10 + STATUS_PRIORITY[request.status] }}
                >
                  <span
                    className={`schedule-chip schedule-chip--${request.status.toLowerCase()}`}
                    style={{ right: 52 + lane * LANE_WIDTH }}
                    title={`${request.car.brand} ${request.car.model} · ${formatTime(
                      request.scheduledAt,
                    )} · ${STATUS_LABELS[request.status]} · ${request.customer.fullName}`}
                  >
                    <span className="schedule-chip__model">{request.car.brand}</span>
                    <span className="schedule-chip__model">{request.car.model}</span>
                    <span className="schedule-chip__time">
                      {formatTime(request.scheduledAt)}
                    </span>
                  </span>
                  <span
                    className={`schedule-bar schedule-bar--${request.status.toLowerCase()}`}
                    style={{ top: top - chipTop, right: 52 }}
                  />
                </div>
              ))}

              {isToday && (
                <div className="schedule-now" style={{ top: nowTop }} aria-hidden="true">
                  <span>сейчас {formatTime(now.toISOString())}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}