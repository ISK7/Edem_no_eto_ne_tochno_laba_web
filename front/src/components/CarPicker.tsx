import type { CarBrand } from '../types';
import { formatPrice } from '../utils/format';
import { Icon } from './Icon';

interface CarPickerProps {
  brands: CarBrand[];
  brandId: string;
  modelId: string;
  onBrandChange: (brandId: string) => void;
  onModelChange: (modelId: string) => void;
  error?: string;
}

export function CarPicker({
  brands,
  brandId,
  modelId,
  onBrandChange,
  onModelChange,
  error,
}: CarPickerProps) {
  const selectedBrand = brands.find((brand) => String(brand.id) === brandId);

  return (
    <div className={`car-picker ${error ? 'car-picker--error' : ''}`.trim()}>
      <div className="car-picker__brands" role="group" aria-label="Марка автомобиля">
        {brands.map((brand) => (
          <button
            key={brand.id}
            type="button"
            className={`brand-chip ${String(brand.id) === brandId ? 'is-active' : ''}`}
            aria-pressed={String(brand.id) === brandId}
            onClick={() => onBrandChange(String(brand.id))}
          >
            <span>{brand.name}</span>
            <small>{brand.models.length}</small>
          </button>
        ))}
      </div>

      <div className="car-picker__models" role="group" aria-label="Модель автомобиля">
        {selectedBrand ? (
          selectedBrand.models.map((model) => {
            const active = String(model.id) === modelId;
            return (
              <button
                key={model.id}
                type="button"
                className={`model-card ${active ? 'is-active' : ''}`}
                aria-pressed={active}
                onClick={() => onModelChange(String(model.id))}
              >
                <span className="model-card__icon">
                  <Icon name="car" size={20} />
                </span>
                <span className="model-card__body">
                  <span className="model-card__name">{model.name}</span>
                  <span className="model-card__price">{formatPrice(model.price)}</span>
                </span>
                {active && <Icon name="check" size={16} className="model-card__check" />}
              </button>
            );
          })
        ) : (
          <p className="car-picker__hint">Сначала выберите марку — затем модель.</p>
        )}
      </div>

      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
