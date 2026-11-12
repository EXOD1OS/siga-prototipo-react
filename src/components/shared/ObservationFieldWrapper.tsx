import { useId, useState, type ReactNode } from 'react';
import { IconAlert, IconCheck } from '../layout/icons';
import type { ObservacionDoc } from '../../types/planificacion';

interface Props {
  fKey: string;
  label: ReactNode;
  campoPath: string;
  notes: ObservacionDoc[];
  canEdit: boolean;
  canObserve: boolean;
  role: string;
  onAddObs: (fKey: string, campoPath: string, text: string) => void;
  onResolveObs: (obsId: string) => void;
  onDeleteObs: (obsId: string) => void;
  children: ReactNode;
}

/** UAP y Dirección eliminan solo las observaciones de su área; el Administrador, cualquiera. */
export function puedeEliminarObservacion(role: string, o: Pick<ObservacionDoc, 'area'>): boolean {
  return (role === 'UAP' && o.area === 'uap') || (role === 'DIRECCION_CARRERA' && o.area === 'direccion') || role === 'ADMINISTRADOR';
}

const AREA = {
  uap: {
    nombre: 'UAP',
    tarjeta: 'border-amber-500/30 bg-amber-500/10',
    autor: 'text-amber-700 dark:text-amber-300',
    icono: 'border-amber-500/20 bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  direccion: {
    nombre: 'Dirección',
    tarjeta: 'border-sky-500/30 bg-sky-500/10',
    autor: 'text-sky-700 dark:text-sky-300',
    icono: 'border-sky-500/20 bg-sky-500/15 text-sky-600 dark:text-sky-400',
  },
} as const;

/** Campo del documento con su riel de observaciones (UAP / Dirección) y la acción de subsanar. */
export function ObservationFieldWrapper({ fKey, label, campoPath, notes, canEdit, canObserve, role, onAddObs, onResolveObs, onDeleteObs, children }: Props) {
  const [draftNote, setDraftNote] = useState('');
  const idNota = useId();
  const hasUnresolved = notes.some((o) => !o.resolved);
  // El riel lateral aparece si hay observaciones en el campo o si la sesión puede agregarlas.
  const showRail = notes.length > 0 || canObserve;

  const handleAdd = () => {
    if (!draftNote.trim()) return;
    onAddObs(fKey, campoPath, draftNote.trim());
    setDraftNote('');
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 border-b border-border py-6 first:pt-0 last:border-b-0 xl:grid-cols-12">
      <div className={`${showRail ? 'xl:col-span-8' : 'xl:col-span-12'} space-y-2`}>
        <div className={`flex items-start gap-2 text-xs font-semibold ${hasUnresolved ? 'text-amber-700 dark:text-amber-400' : 'text-ink'}`}>
          {hasUnresolved && (
            <>
              <IconAlert className="mt-px h-4 w-4 shrink-0" />
              <span className="sr-only">Campo observado:</span>
            </>
          )}
          <div className="min-w-0 flex-1">{label}</div>
        </div>
        <div className={hasUnresolved ? 'rounded-lg bg-amber-500/5 p-0.5 ring-2 ring-amber-500/60' : ''}>{children}</div>
      </div>

      {showRail && (
        <aside className="space-y-2.5 xl:col-span-4" aria-label="Observaciones del campo">
          {notes.map((o) => {
            const a = AREA[o.area ?? 'uap'];
            return (
              <div key={o.id} className={`space-y-2 rounded-xl border p-3 text-xs transition-opacity ${a.tarjeta} ${o.resolved ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-2.5">
                  <span aria-hidden className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${o.resolved ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : a.icono}`}>
                    {o.resolved ? <IconCheck className="h-3.5 w-3.5" /> : <IconAlert className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-[11px] font-bold ${a.autor}`}>{o.author ?? a.nombre}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="text-[10px] text-muted">{o.date}</span>
                        {puedeEliminarObservacion(role, o) && (
                          <button
                            type="button"
                            onClick={() => onDeleteObs(o.id)}
                            aria-label={`Eliminar observación de ${o.author ?? a.nombre}`}
                            className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-danger transition hover:bg-rose-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose-500"
                          >
                            Eliminar
                          </button>
                        )}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ink">{o.text}</p>
                    <p className="mt-1 text-[10px] text-muted">{o.resolved ? 'Subsanada por el docente' : 'Pendiente de subsanación'}</p>
                  </div>
                </div>
                {!o.resolved && canEdit && (
                  <button
                    type="button"
                    onClick={() => onResolveObs(o.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500"
                  >
                    <IconCheck className="h-3.5 w-3.5" />
                    Marcar como subsanada
                  </button>
                )}
              </div>
            );
          })}

          {canObserve && (
            <div className="space-y-2 rounded-xl border border-dashed border-border bg-background p-3">
              <label htmlFor={idNota} className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                Anclar observación ({role === 'UAP' ? 'UAP' : 'Dirección'})
              </label>
              <textarea
                id={idNota}
                rows={2}
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Describir la corrección requerida…"
                className="w-full rounded-lg border border-border bg-surface p-2 text-xs text-ink outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!draftNote.trim()}
                className="w-full rounded-lg bg-primary py-1.5 text-[11px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anclar observación al campo
              </button>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
