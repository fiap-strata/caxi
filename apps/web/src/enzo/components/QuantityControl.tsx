import { useEffect, useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

type Props = {
  unit: 'kg' | 'un';
  value: number;
  onChange: (value: number) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
};

const textos = {
  kg: { label: 'Quilos para vender', hint: 'Ex.: 1 kg ou 1,5 kg', passo: 0.5, nome: 'quilo' },
  un: { label: 'Unidades para vender', hint: 'Só números inteiros', passo: 1, nome: 'unidade' },
};

export const formatarQuantidade = (n: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });

/** Aceita vírgula ou ponto; devolve null quando o texto não é um número válido para a unidade. */
export function lerQuantidade(texto: string, unit: 'kg' | 'un'): number | null {
  const n = Number(texto.trim().replace(',', '.'));
  if (texto.trim() === '' || !Number.isFinite(n) || n < 0) return null;
  if (unit === 'un' && !Number.isInteger(n)) return null;
  if (unit === 'kg' && !Number.isInteger(n * 2)) return null;
  return n;
}

export function QuantityControl({ unit, value, onChange, label, hint, disabled = false }: Props) {
  const t = textos[unit];
  const id = useId();
  const [texto, setTexto] = useState(formatarQuantidade(value));

  // Mantém o campo em sincronia quando o valor muda pelos botões ou por fora
  useEffect(() => setTexto(formatarQuantidade(value)), [value]);

  const mudar = (n: number) => onChange(Math.max(0, Math.round(n * 1000) / 1000));

  return (
    <div className="quantity">
      <label htmlFor={id}>{label ?? t.label}</label>
      <div className="quantity-row">
        <button
          type="button"
          className="quantity-step"
          aria-label={`Diminuir ${formatarQuantidade(t.passo)} ${t.nome}`}
          disabled={disabled || value <= 0}
          onClick={() => mudar(value - t.passo)}
        >
          <Minus size={24} aria-hidden />
        </button>
        <input
          id={id}
          type="text"
          inputMode={unit === 'kg' ? 'decimal' : 'numeric'}
          value={texto}
          disabled={disabled}
          aria-describedby={`${id}-dica`}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => {
            const n = lerQuantidade(texto, unit);
            if (n === null) setTexto(formatarQuantidade(value));
            else mudar(n);
          }}
        />
        <button
          type="button"
          className="quantity-step"
          aria-label={`Aumentar ${formatarQuantidade(t.passo)} ${t.nome}`}
          disabled={disabled}
          onClick={() => mudar(value + t.passo)}
        >
          <Plus size={24} aria-hidden />
        </button>
      </div>
      <small id={`${id}-dica`}>{hint ?? t.hint}</small>
    </div>
  );
}
