import type { ReactNode } from 'react';
import { Check, CircleAlert } from 'lucide-react';

type Props = { tone?: 'info' | 'success' | 'error'; children: ReactNode };

// Erro usa role="alert" (leitor de tela anuncia na hora); os demais, role="status".
export function Notice({ tone = 'info', children }: Props) {
  return (
    <div className={`notice ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {tone === 'success' ? <Check size={20} aria-hidden /> : null}
      {tone === 'error' ? <CircleAlert size={20} aria-hidden /> : null}
      <span>{children}</span>
    </div>
  );
}
