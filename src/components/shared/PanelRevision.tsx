import { useId, useState } from 'react';
import { IconCheck, IconReturn, IconSeal } from '../layout/icons';
import { AREA_LABEL, type AreaRevision, type ResultadoRevision } from '../../lib/revision';
import type { InformeEvaluacion } from '../../types/planificacion';

/** Datos para que UAP o Dirección cierren su revisión (null = la sesión no puede revisar). */
export interface InfoRevision {
  area: AreaRevision;
  /** Observaciones de esta área que el docente todavía no subsanó. */
  pendientes: number;
  /** Registra el dictamen; `datos` es el contenido del informe que se guarda con él. */
  onFinalizar: (r: ResultadoRevision, datos?: Partial<InformeEvaluacion>) => void;
  /**
   * PAAC: el dictamen favorable no se emite en seco. Abre el informe oficial autocompletado
   * (Disciplinar o Pedagógico) para revisarlo y confirmarlo.
   */
  onAbrirInforme?: () => void;
}

interface Props {
  revision: InfoRevision;
  tipo: 'PAAC' | 'PAAD';
  /** `barra`: fija al pie del editor (con sombra); `tarjeta`: dentro de un modal o informe. */
  variante?: 'barra' | 'tarjeta';
}

export const APROBAR_INFORME: Record<AreaRevision, string> = {
  uap: 'Aprobar Informe Pedagógico',
  direccion: 'Aprobar Informe Disciplinar',
};

export const btnObservar =
  'w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-600 text-amber-800 dark:text-amber-300 hover:text-white border border-amber-500/40 font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-amber-500/15 disabled:hover:text-amber-800';
export const btnAprobar =
  'w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-600';
export const btnSecundario =
  'w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border bg-surface text-xs font-medium text-ink transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

/** Dictamen de UAP / Dirección: enviar con revisiones (vuelve al docente) o aprobar el informe. */
export function PanelRevision({ revision, tipo, variante = 'tarjeta' }: Props) {
  const [confirmando, setConfirmando] = useState<ResultadoRevision | null>(null);
  const idAyuda = useId();
  const idTitulo = useId();
  const { area, pendientes, onFinalizar, onAbrirInforme } = revision;
  const etiqueta = AREA_LABEL[area];
  const bloqueaFavorable = pendientes > 0;
  const informe = area === 'uap' ? 'Informe Pedagógico' : 'Informe Disciplinar';

  const confirmar = () => {
    if (!confirmando) return;
    onFinalizar(confirmando);
    setConfirmando(null);
  };

  const aprobar = () => (onAbrirInforme ? onAbrirInforme() : setConfirmando('FAVORABLE'));

  return (
    <section
      aria-labelledby={idTitulo}
      className={`mt-4 space-y-3 rounded-xl border border-border bg-background p-4 ${variante === 'barra' ? 'shadow-xl' : ''}`}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-soft text-primary">
          <IconSeal className="h-4 w-4" />
        </span>
        <div className="min-w-0 text-xs">
          <h2 id={idTitulo} className="font-semibold text-ink">
            Dictamen · {etiqueta.corto}
          </h2>
          <p className="mt-0.5 text-muted">
            Emití el {etiqueta.dictamen} del {tipo}.{' '}
            {pendientes > 0 ? (
              <span className="font-medium text-amber-700 dark:text-amber-400">Tenés {pendientes} observación(es) anclada(s) sin subsanar.</span>
            ) : (
              'No tenés observaciones abiertas en los apartados.'
            )}
          </p>
        </div>
      </div>

      {confirmando ? (
        <div role="group" aria-label="Confirmar dictamen" className="space-y-3 rounded-xl border border-border bg-surface p-3">
          <p className="text-xs font-medium text-ink">
            {confirmando === 'OBSERVADO'
              ? `El ${tipo} vuelve al docente en estado Observado y se habilita su edición para corregir. ¿Confirmás?`
              : `Se registra el ${etiqueta.dictamen} favorable. ¿Confirmás?`}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => setConfirmando(null)} className={btnSecundario}>
              Cancelar
            </button>
            <button type="button" autoFocus onClick={confirmar} className={confirmando === 'OBSERVADO' ? btnObservar : btnAprobar}>
              {confirmando === 'OBSERVADO' ? <IconReturn className="h-4 w-4" /> : <IconCheck className="h-4 w-4" />}
              {confirmando === 'OBSERVADO' ? 'Sí, enviar con revisiones' : `Sí, ${APROBAR_INFORME[area].toLowerCase()}`}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setConfirmando('OBSERVADO')}
            title={`Devuelve el ${tipo} al docente con las observaciones`}
            className={btnObservar}
          >
            <IconReturn className="h-4 w-4" />
            Enviar con revisiones
          </button>
          <button
            type="button"
            onClick={aprobar}
            disabled={bloqueaFavorable}
            aria-describedby={bloqueaFavorable || onAbrirInforme ? idAyuda : undefined}
            title={onAbrirInforme ? `Abre el ${informe} autocompletado para revisarlo y confirmarlo` : undefined}
            className={btnAprobar}
          >
            <IconCheck className="h-4 w-4" />
            {APROBAR_INFORME[area]}
          </button>
        </div>
      )}

      {!confirmando && (bloqueaFavorable || onAbrirInforme) && (
        <p id={idAyuda} className="text-[11px] text-muted">
          {bloqueaFavorable
            ? 'Para aprobar, el docente debe subsanar tus observaciones. También podés eliminar las que cargaste por error.'
            : `Al aprobar se abre el ${informe} con los datos del ${tipo} ya completados: revisalos y confirmá el envío.`}
        </p>
      )}
    </section>
  );
}
