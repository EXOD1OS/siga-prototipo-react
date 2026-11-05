import { ESTADO_LABELS } from '@/types/planificacion';

const COLORS: Record<string, string> = {
  BORRADOR: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  ENVIADO_A_REVISION: 'bg-primary/20 text-blue-300 border-primary/40',
  OBSERVADO: 'bg-warning/20 text-amber-300 border-warning/40',
  APROBADO_PEDAGOGICO: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  APROBADO_DISCIPLINAR: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  APROBADO_PLENO: 'bg-success/20 text-emerald-300 border-success/40',
  ELEVADO_AL_CONSEJO: 'bg-violet-500/15 text-violet-300 border-violet-500/40',
  FINALIZADO: 'bg-success/30 text-emerald-200 border-success/60',
};

export function StatusBadge({ estado }: { estado: string }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${COLORS[estado] ?? ''}`}>
      {ESTADO_LABELS[estado] ?? estado}
    </span>
  );
}
