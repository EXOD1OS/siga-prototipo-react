import { IconAlert } from '../layout/icons';

const STATE_STYLES: Record<string, { label: string; cls: string; dot: string }> = {
  BORRADOR: { label: 'Borrador', cls: 'bg-slate-500/15 text-slate-600 dark:text-slate-300', dot: 'bg-slate-400' },
  ENVIADO_A_REVISION: { label: 'En revisión', cls: 'bg-sky-500/15 text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  OBSERVADO: { label: 'Observado', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  APROBADO_PEDAGOGICO: { label: 'Aprob. Pedagógico', cls: 'bg-teal-500/15 text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
  APROBADO_DISCIPLINAR: { label: 'Aprob. Disciplinar', cls: 'bg-teal-500/15 text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
  APROBADO_PLENO: { label: 'Evaluado favorablemente', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  APROBADO: { label: 'Aprobado', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  ELEVADO_AL_CONSEJO: { label: 'Elevado al Consejo', cls: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  FINALIZADO: { label: 'Finalizado', cls: 'bg-purple-500/15 text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
};

interface Props {
  state: string;
  /**
   * Observaciones sin subsanar. Si se pasa y el documento está Observado,
   * debajo del estado se muestra el indicador "Observaciones pendientes".
   */
  pendientes?: number;
}

/** Estado general del documento (PAAC o PAAD). */
export function StatusBadge({ state, pendientes }: Props) {
  const s = STATE_STYLES[state] || { label: state, cls: 'bg-soft text-muted', dot: 'bg-slate-400' };
  const badge = (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-bold ${s.cls}`}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
  if (state !== 'OBSERVADO' || pendientes === undefined) return badge;
  return (
    <span className="inline-flex flex-col items-start gap-1">
      {badge}
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold text-amber-700 dark:text-amber-400">
        <IconAlert className="h-3 w-3" />
        Observaciones pendientes: <span className="tabular-nums">{pendientes}</span>
      </span>
    </span>
  );
}
