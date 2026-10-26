import { useId } from 'react';
import { Check } from 'lucide-react';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  legend: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

// Radios nativos por baixo: teclado (setas) e leitor de tela funcionam sem código extra
export function ChoiceGroup<T extends string>({ legend, options, value, onChange }: Props<T>) {
  const name = useId();
  return (
    <fieldset className="choice-group">
      <legend>{legend}</legend>
      <div className="choice-options">
        {options.map((o) => (
          <label key={o.value} className={`choice${o.value === value ? ' selected' : ''}`}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            {o.value === value ? <Check size={20} aria-hidden /> : null}
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
