import { Icon } from './Icon';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

function buildPages(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visible = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...visible]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const result: Array<number | 'gap'> = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) result.push('gap');
    result.push(value);
    previous = value;
  }
  return result;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Постраничная навигация">
      <button
        type="button"
        className="pagination__arrow"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Предыдущая страница"
      >
        <Icon name="chevron-left" size={18} />
      </button>

      <div className="pagination__pages">
        {buildPages(page, totalPages).map((item, index) =>
          item === 'gap' ? (
            <span className="pagination__gap" key={`gap-${index}`} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              type="button"
              key={item}
              className={`pagination__page ${item === page ? 'is-active' : ''}`}
              onClick={() => onChange(item)}
              aria-label={`Страница ${item}`}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        className="pagination__arrow"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Следующая страница"
      >
        <Icon name="chevron-right" size={18} />
      </button>

      <span className="pagination__meta">
        {page} из {totalPages}
      </span>
    </nav>
  );
}
