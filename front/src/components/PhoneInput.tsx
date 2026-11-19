interface PhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoComplete?: string;
  invalid?: boolean;
  disabled?: boolean;
}

export function formatPhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, '');

  if (!digits) return '';
  if (digits[0] === '8') digits = `7${digits.slice(1)}`;
  if (digits[0] !== '7') digits = `7${digits}`;
  digits = digits.slice(0, 11);

  let result = '+7';
  if (digits.length > 1) result += `(${digits.slice(1, 4)}`;
  if (digits.length >= 5) result += `)-${digits.slice(4, 7)}`;
  if (digits.length >= 8) result += `-${digits.slice(7, 9)}`;
  if (digits.length >= 10) result += `-${digits.slice(9, 11)}`;
  return result;
}

export function PhoneInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = '+7(___)___-__-__',
  autoComplete = 'tel',
  invalid = false,
  disabled = false,
}: PhoneInputProps) {
  return (
    <input
      id={id}
      name={name}
      className="input"
      type="tel"
      inputMode="tel"
      value={value}
      onChange={(event) => onChange(formatPhoneInput(event.target.value))}
      onBlur={onBlur}
      placeholder={placeholder}
      autoComplete={autoComplete}
      aria-invalid={invalid}
      disabled={disabled}
    />
  );
}
