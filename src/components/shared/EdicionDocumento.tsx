import { IconAlert, IconCheck, IconSend } from '../layout/icons';

/** Indicador de observaciones de un apartado en el índice lateral (ámbar si hay pendientes). */
export function BadgeObservaciones({ pendientes, total }: { pendientes: number; total: number }) {
  if (total === 0) return null;
  if (pendientes === 0) {
    return (
      <span
        title={`${total} observación(es) subsanada(s)`}
        className="flex h-5 w-5 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      >
        <IconCheck className="h-3 w-3" />
        <span className="sr-only">{total} observación(es) subsanada(s)</span>
      </span>
    );
  }
  return (
    <span
      title={`${pendientes} observación(es) pendiente(s)`}
      className="flex h-5 items-center gap-0.5 rounded-md border border-amber-500/20 bg-amber-500/15 px-1 text-[10px] font-bold tabular-nums text-amber-700 dark:text-amber-400"
    >
      <IconAlert className="h-3 w-3" />
      {pendientes}
      <span className="sr-only"> observación(es) pendiente(s)</span>
    </span>
  );
}

interface BarraProps {
  tipo: 'PAAC' | 'PAAD';
  sinGuardar?: boolean;
  estadoGuardado: string;
  problemas: number;
  /** true si el documento vuelve a revisión tras observaciones. */
  reenvio: boolean;
  canSubmit: boolean;
  confirmar: boolean;
  onCancelar: () => void;
  onPresentar: () => void;
  onPreview: () => void;
  onSaveDraft: () => void;
}

const btn =
  'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary';

/** Barra fija del docente: guardar borrador, vista previa y presentar / subsanar y volver a presentar. */
export function BarraPresentacion({
  tipo,
  sinGuardar,
  estadoGuardado,
  problemas,
  reenvio,
  canSubmit,
  confirmar,
  onCancelar,
  onPresentar,
  onPreview,
  onSaveDraft,
}: BarraProps) {
  return (
    <div className="no-print sticky bottom-4 z-30">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className={`flex items-center gap-1.5 font-medium ${sinGuardar ? 'text-amber-700 dark:text-amber-400' : 'text-muted'}`} aria-live="polite">
            <span aria-hidden className={`h-2 w-2 rounded-full ${sinGuardar ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {estadoGuardado}
          </span>
          {problemas > 0 ? (
            <span className="text-muted">{problemas} punto(s) pendiente(s) para presentar</span>
          ) : (
            <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
              <IconCheck className="h-3.5 w-3.5" /> Listo para presentar
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {confirmar ? (
            <>
              <span className="text-[11px] font-medium text-ink">
                {reenvio
                  ? 'Se guardan las correcciones y el documento vuelve a revisión. ¿Confirmás?'
                  : 'Al presentar se bloquea la edición. ¿Confirmás?'}
              </span>
              <button type="button" onClick={onCancelar} className={`${btn} border border-border text-ink hover:bg-background`}>
                Cancelar
              </button>
              <button type="button" onClick={onPresentar} autoFocus className={`${btn} bg-primary font-semibold text-white hover:bg-primary-hover`}>
                <IconSend className="h-4 w-4" />
                {reenvio ? 'Sí, volver a presentar' : 'Sí, presentar'}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onPreview} className={`${btn} border border-border text-ink hover:bg-background`}>
                Vista previa
              </button>
              <button type="button" onClick={onSaveDraft} className={`${btn} border border-border bg-surface text-ink hover:bg-background`}>
                Guardar borrador
              </button>
              {canSubmit && (
                <button type="button" onClick={onPresentar} className={`${btn} bg-primary font-semibold text-white shadow-sm hover:bg-primary-hover`}>
                  {reenvio ? <IconCheck className="h-4 w-4" /> : <IconSend className="h-4 w-4" />}
                  {reenvio ? 'Subsanar y Volver a Presentar' : `Presentar ${tipo}`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
