import { useState } from 'react';
import { Icon } from './Icon';

interface PasswordInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  invalid?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
}

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = 'Минимум 6 символов',
  autoComplete = 'current-password',
  invalid = false,
  disabled = false,
  onBlur,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-affix">
      <input
        id={id}
        name={name}
        className="input input--affix"
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        disabled={disabled}
      />
      <button
        type="button"
        className="input-affix__button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
        title={visible ? 'Скрыть пароль' : 'Показать пароль'}
      >
        <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
      </button>
    </div>
  );
}
