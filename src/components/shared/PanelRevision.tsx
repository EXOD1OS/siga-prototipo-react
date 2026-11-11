import { useId, useState } from 'react';
import { IconCheck, IconReturn, IconSeal } from '../layout/icons';
import { AREA_LABEL, type AreaRevision, type ResultadoRevision } from '../../lib/revision';

/** Datos para que UAP o Dirección cierren su revisión (null = la sesión no puede revisar). */
export interface InfoRevision {
  area: AreaRevision;
  /** Observaciones de esta área que el docente todavía no subsanó. */
  pendientes: number;
  onFinalizar: (r: ResultadoRevision) => void;
}

interface Props {
  revision: InfoRevision;
  tipo: 'PAAC' | 'PAAD';
  /** `barra`: fija al pie del editor; `tarjeta`: dentro de un modal o informe. */
  variante?: 'barra' | 'tarjeta';
}

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50';

/** Panel de decisión: cierra la revisión con observaciones (devuelve al docente) o con dictamen favorable. */
export function PanelRevision({ revision, tipo, variante = 'tarjeta' }: Props) {
  const [confirmando, setConfirmando] = useState<ResultadoRevision | null>(null);
  const idAyuda = useId();
  const { area, pendientes, onFinalizar } = revision;
  const etiqueta = AREA_LABEL[area];
  const bloqueaFavorable = pendientes > 0;

  const confirmar = () => {
    if (!confirmando) return;
    onFinalizar(confirmando);
    setConfirmando(null);
  };

  return (
    <section
      aria-label={`Decisión de revisión · ${etiqueta.corto}`}
      className={`rounded-xl border border-border bg-surface px-4 py-3 ${variante === 'barra' ? 'shadow-xl' : 'shadow-sm'}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-soft text-primary">
            <IconSeal className="h-4 w-4" />
          </span>
          <div className="text-xs">
            <p className="font-semibold text-ink">
              Finalizar revisión · {etiqueta.corto}
            </p>
            <p className="mt-0.5 text-muted">
              Emití el {etiqueta.dictamen} del {tipo}.{' '}
              {pendientes > 0 ? (
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  Tenés {pendientes} observación(es) anclada(s) sin subsanar.
                </span>
              ) : (
                'No tenés observaciones abiertas en los apartados.'
              )}
            </p>
          </div>
        </div>

        {confirmando ? (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirmar decisión">
            <span className="text-[11px] font-medium text-ink">
              {confirmando === 'OBSERVADO'
                ? `El ${tipo} vuelve al docente en estado Observado y se habilita su edición. ¿Confirmás?`
                : `Se registra el ${etiqueta.dictamen} favorable. ¿Confirmás?`}
            </span>
            <button type="button" onClick={() => setConfirmando(null)} className={`${btnBase} border border-border text-ink hover:bg-background`}>
              Cancelar
            </button>
            <button
              type="button"
              autoFocus
              onClick={confirmar}
              className={`${btnBase} ${
                confirmando === 'OBSERVADO' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-primary text-white hover:bg-primary-hover'
              }`}
            >
              Confirmar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
            <button
              type="button"
              onClick={() => setConfirmando('OBSERVADO')}
              className={`${btnBase} border border-amber-500/30 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-200`}
            >
              <IconReturn className="h-4 w-4" />
              Finalizar Revisión con Observaciones (Devolver al Docente)
            </button>
            <button
              type="button"
              onClick={() => setConfirmando('FAVORABLE')}
              disabled={bloqueaFavorable}
              aria-describedby={bloqueaFavorable ? idAyuda : undefined}
              className={`${btnBase} bg-primary text-white shadow-sm hover:bg-primary-hover`}
            >
              <IconCheck className="h-4 w-4" />
              Finalizar Revisión Favorable (Aprobar Dictamen)
            </button>
          </div>
        )}
      </div>
      {bloqueaFavorable && !confirmando && (
        <p id={idAyuda} className="mt-2 text-[11px] text-muted lg:text-right">
          Para aprobar, el docente debe subsanar tus observaciones (o devolvé el documento para que las corrija).
        </p>
      )}
    </section>
  );
}
