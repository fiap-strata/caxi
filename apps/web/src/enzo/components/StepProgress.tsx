import { Check } from 'lucide-react';

type Props = {
  /** Etapa atual, começando em 1 */
  current: number;
  total: number;
  /** Nome do que está sendo contado, ex.: "Produto" → "Produto 2 de 3" */
  label?: string;
};

export function StepProgress({ current, total, label = 'Etapa' }: Props) {
  const etapas = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <nav className="steps" aria-label="Progresso">
      <p className="steps-label">
        {label} {current} de {total}
      </p>
      <ol>
        {etapas.map((n) => {
          const estado = n < current ? 'done' : n === current ? 'current' : 'todo';
          return (
            <li key={n} className={estado} aria-current={estado === 'current' ? 'step' : undefined}>
              {estado === 'done' ? <Check size={22} aria-label={`Etapa ${n} concluída`} /> : n}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
