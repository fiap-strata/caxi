import type { ButtonHTMLAttributes } from 'react';
import { ArrowRight, LoaderCircle, MessageCircle } from 'lucide-react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'whatsapp';
  /** Ação em andamento: desabilita o botão e mostra o spinner com `busyLabel`. */
  busy?: boolean;
  busyLabel?: string;
};

export function Button({
  variant = 'primary',
  busy = false,
  busyLabel = 'Salvando…',
  children,
  className,
  disabled,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={['button', variant, className].filter(Boolean).join(' ')}
    >
      {busy ? (
        <>
          <LoaderCircle size={20} className="spin" aria-hidden />
          {busyLabel}
        </>
      ) : (
        <>
          {variant === 'whatsapp' ? <MessageCircle size={20} aria-hidden /> : null}
          <span className="button-label">{children}</span>
          {variant === 'primary' ? <ArrowRight size={20} aria-hidden /> : null}
        </>
      )}
    </button>
  );
}
