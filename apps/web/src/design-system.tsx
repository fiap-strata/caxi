import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { ArrowRight, LoaderCircle, Sprout } from 'lucide-react';
export function Brand() {
  return (
    <a className="brand" href="/" aria-label="Caxi, início">
      <span>
        <Sprout size={23} />
      </span>
      caxi<span className="brand-dot">.</span>
    </a>
  );
}
export function Button({
  children,
  busy,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className={`button ${variant} ${props.className || ''}`}
    >
      {busy ? <LoaderCircle size={19} className="spin" /> : null}
      {children}
      {variant === 'primary' && !busy ? <ArrowRight size={18} /> : null}
    </button>
  );
}
export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = props.id || props.name;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input {...props} id={id} aria-describedby={hint ? id + '-hint' : undefined} />
      {hint ? <small id={id + '-hint'}>{hint}</small> : null}
    </label>
  );
}
export function Notice({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'error' | 'success';
}) {
  return (
    <div className={'notice ' + tone} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
export function Money({ value }: { value: number }) {
  return (
    <>
      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)}
    </>
  );
}
