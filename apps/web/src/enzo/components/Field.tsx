import { useId, type InputHTMLAttributes } from 'react';
import { CircleAlert } from 'lucide-react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  hint?: string;
  /** Mensagem de erro. Quando existe, substitui a dica e marca o campo como inválido. */
  error?: string;
  /** `money` mostra o prefixo R$ e abre o teclado numérico no celular. */
  type?: 'text' | 'money';
};

export function Field({ label, hint, error, type = 'text', id, className, ...props }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const helpId = `${inputId}-ajuda`;
  const help = error ?? hint;

  return (
    <div className={['field', error ? 'has-error' : '', className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId}>{label}</label>
      <div className="field-box">
        {type === 'money' ? (
          <span className="field-prefix" aria-hidden>
            R$
          </span>
        ) : null}
        <input
          {...props}
          id={inputId}
          type="text"
          inputMode={type === 'money' ? 'decimal' : props.inputMode}
          aria-invalid={error ? true : undefined}
          aria-describedby={help ? helpId : undefined}
        />
      </div>
      {help ? (
        <small id={helpId} className="field-help">
          {error ? <CircleAlert size={16} aria-hidden /> : null}
          {help}
        </small>
      ) : null}
    </div>
  );
}
