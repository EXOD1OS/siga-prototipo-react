import type { ReactNode } from 'react';
import { IconAlert, IconCheck, IconClock, IconLock } from '../layout/icons';
import { esReenvio } from '../../lib/revision';
import type { InformeEvaluacion } from '../../types/planificacion';

export type TonoAviso = 'lectura' | 'observado' | 'revision' | 'listo';

const TONOS: Record<TonoAviso, { Icon: typeof IconLock; caja: string; icono: string; rol: 'note' | 'status' }> = {
  lectura: {
    Icon: IconLock,
    caja: 'border-border bg-background text-muted',
    icono: 'border-border bg-slate-500/10 text-muted',
    rol: 'note',
  },
  observado: {
    Icon: IconAlert,
    caja: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200',
    icono: 'border-amber-500/20 bg-amber-500/15 text-amber-600 dark:text-amber-400',
    rol: 'status',
  },
  revision: {
    Icon: IconClock,
    caja: 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200',
    icono: 'border-sky-500/20 bg-sky-500/15 text-sky-600 dark:text-sky-400',
    rol: 'note',
  },
  listo: {
    Icon: IconCheck,
    caja: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
    icono: 'border-emerald-500/20 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    rol: 'status',
  },
};

/** Ícono en contenedor redondeado, con el mismo acabado que las notificaciones del Header. */
export function IconoEstado({ tono, className = 'h-8 w-8' }: { tono: TonoAviso; className?: string }) {
  const { Icon, icono } = TONOS[tono];
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-lg border ${icono} ${className}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function AvisoEstado({ tono, titulo, etiqueta, children }: { tono: TonoAviso; titulo: string; etiqueta?: string; children?: ReactNode }) {
  const t = TONOS[tono];
  return (
    <div role={t.rol} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs ${t.caja}`}>
      <IconoEstado tono={tono} />
      <div className="min-w-0 pt-0.5">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {etiqueta && <span className="rounded-md border border-current px-1.5 py-px text-[10px] font-bold uppercase tracking-wider opacity-80">{etiqueta}</span>}
          {titulo}
        </p>
        {children && <div className="mt-0.5 leading-relaxed opacity-90">{children}</div>}
      </div>
    </div>
  );
}

/** Aviso que corresponde al documento según su estado y los permisos de la sesión (null = ninguno). */
export function avisoDeDocumento(opts: {
  d: { state: string; pedReport?: InformeEvaluacion; discReport?: InformeEvaluacion };
  tipo: 'PAAC' | 'PAAD';
  canEdit: boolean;
  canObserve: boolean;
  esDocente: boolean;
  /** Observaciones que el docente todavía no marcó como subsanadas. */
  pendientes: number;
}): { tono: TonoAviso; titulo: string; texto?: string; etiqueta?: string } | null {
  const { d, tipo, canEdit, canObserve, esDocente, pendientes } = opts;
  const enCorreccion = esReenvio(d);
  if (canEdit) {
    if (!enCorreccion) return null;
    return {
      tono: 'observado',
      // En el PAAC la etapa de corrección se rotula "Correcciones".
      etiqueta: tipo === 'PAAC' ? 'Correcciones' : undefined,
      titulo: 'Documento con observaciones pendientes de corrección.',
      texto:
        pendientes > 0
          ? `Edite los apartados señalados y vuelva a presentar. Quedan ${pendientes} observación(es) por marcar como subsanada(s).`
          : 'Edite los apartados señalados y vuelva a presentar. Todas las observaciones están subsanadas.',
    };
  }
  if (canObserve) {
    return {
      tono: 'revision',
      titulo: 'Revisión en curso.',
      texto: 'Anclá las observaciones en los apartados y cerrá tu revisión con el panel de decisión.',
    };
  }
  if (['BORRADOR', 'OBSERVADO'].includes(d.state) || enCorreccion) {
    return esDocente
      ? {
          tono: 'lectura',
          titulo: 'Modo lectura.',
          texto: tipo === 'PAAC' ? 'Solo el Docente Responsable de la cátedra edita y presenta el PAAC.' : 'Solo el docente titular del PAAD puede editarlo.',
        }
      : {
          tono: enCorreccion ? 'observado' : 'lectura',
          etiqueta: enCorreccion && tipo === 'PAAC' ? 'Correcciones' : undefined,
          titulo: 'Vista de consulta.',
          texto: enCorreccion ? 'El documento fue devuelto al docente con observaciones pendientes.' : 'El documento todavía no fue presentado.',
        };
  }
  return {
    tono: 'lectura',
    etiqueta: tipo === 'PAAC' && d.state === 'ENVIADO_A_REVISION' ? 'Presentado' : undefined,
    titulo: 'El documento ya fue presentado: se muestra en modo lectura.',
  };
}
