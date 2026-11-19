import type { CarBrand } from '../types';
import { pluralize } from '../utils/format';

interface RoadSceneProps {
  compact?: boolean;
  brands?: CarBrand[];
  loading?: boolean;
}

export function RoadScene({ compact = false, brands = [], loading = false }: RoadSceneProps) {
  const modelCount = brands.reduce((sum, brand) => sum + brand.models.length, 0);
  const brandList = brands.map((brand) => brand.name).join(' · ');

  return (
    <div className={`road-scene ${compact ? 'road-scene--compact' : ''}`.trim()} aria-hidden="true">
      <div className="road-scene__top">
        <span className="road-scene__tag">тест-драйв</span>
        <span className="road-scene__time">15 минут за рулём</span>
      </div>

      <div className="road-scene__stage">
        <svg className="road-scene__art" viewBox="0 0 360 190" role="presentation">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M62 122c0-9 5-14 14-16l19-21c5-6 11-9 18-9h57c8 0 14 3 20 9l17 19 85 4c10 1 16 7 16 15v9c0 5-3 8-7 8H69c-3 0-7-3-7-8v-9Z" />
            <path
              d="M93 104l17-18c3-4 8-6 13-6h38c5 0 9 2 13 6l17 18H93Z"
              fill="currentColor"
              fillOpacity=".1"
            />
            <path d="M142 81v23" opacity=".35" />
            <circle cx="105" cy="139" r="17" />
            <circle cx="105" cy="139" r="6" fill="currentColor" stroke="none" />
            <circle cx="265" cy="139" r="17" />
            <circle cx="265" cy="139" r="6" fill="currentColor" stroke="none" />
            <path d="M286 113h18" />
          </g>
          <g className="road-scene__speed-lines" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round">
            <path d="M28 94h24" />
            <path d="M14 108h38" />
            <path d="M34 122h18" />
          </g>
          <line className="road-scene__dash" x1="42" y1="178" x2="328" y2="178" />
        </svg>
      </div>

      <div className="road-scene__caption">
        <span>
          {loading ? 'Каталог загружается…' : brandList || 'Каталог пуст'}
        </span>
        <strong>
          {loading
            ? '—'
            : `${modelCount} ${pluralize(modelCount, ['модель', 'модели', 'моделей'])}`}
        </strong>
      </div>
    </div>
  );
}
