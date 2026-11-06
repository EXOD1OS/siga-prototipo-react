import React, { useState } from 'react';

interface Props {
  fKey: string;
  label: string;
  campoPath: string;
  notes: any[];
  canEdit: boolean;
  canObserve: boolean;
  role: string;
  onAddObs: (fKey: string, campoPath: string, text: string) => void;
  onResolveObs: (obsId: string) => void;
  children: React.ReactNode;
}

export function ObservationFieldWrapper({
  fKey,
  label,
  campoPath,
  notes,
  canEdit,
  canObserve,
  role,
  onAddObs,
  onResolveObs,
  children,
}: Props) {
  const [draftNote, setDraftNote] = useState('');
  const hasUnresolved = notes.some((o) => !o.resolved);
  // Solo mostramos la columna lateral si existen observaciones en este campo o si el rol actual puede agregarlas
  const showRail = notes.length > 0 || canObserve;

  const handleAdd = () => {
    if (!draftNote.trim()) return;
    onAddObs(fKey, campoPath, draftNote.trim());
    setDraftNote('');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start py-6 first:pt-0 border-b border-border last:border-b-0">
      <div className={`${showRail ? 'xl:col-span-8' : 'xl:col-span-12'} space-y-2`}>
        <label className={`block text-xs font-semibold ${hasUnresolved ? 'text-amber-600 dark:text-amber-400' : 'text-ink'}`}>
          {label}
        </label>
        <div className={hasUnresolved ? 'ring-2 ring-amber-500/70 rounded-lg bg-amber-500/5 p-0.5' : ''}>
          {children}
        </div>
      </div>

      {showRail && (
        <aside className="xl:col-span-4 space-y-2.5">
          {notes.map((o) => (
            <div
              key={o.id}
              className={`p-3.5 rounded-r-lg border-l-4 ${
                o.area === 'uap' ? 'bg-amber-500/10 border-amber-600' : 'bg-blue-500/10 border-blue-600'
              } ${o.resolved ? 'opacity-60' : ''} text-xs space-y-1.5`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-bold text-[11px] ${o.area === 'uap' ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}`}>
                  {o.author}
                </span>
                <span className="text-[10px] text-muted">{o.date}</span>
              </div>
              <p className="text-ink text-[11px]">{o.text}</p>
              <div className="text-[10px] text-muted">
                {o.resolved ? '✓ Subsanada por el docente' : 'Pendiente de subsanación'}
              </div>
              {!o.resolved && canEdit && (
                <button
                  onClick={() => onResolveObs(o.id)}
                  className="w-full mt-1 py-1.5 px-3 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] transition"
                >
                  ✓ Marcar como subsanada
                </button>
              )}
            </div>
          ))}

          {canObserve && (
            <div className="p-3 rounded-lg bg-background border border-dashed border-border space-y-2">
              <label className="block text-[10px] font-bold uppercase text-muted">
                Anclar Observación ({role === 'UAP' ? 'UAP' : 'Dirección'})
              </label>
              <textarea
                rows={2}
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Describir corrección requerida…"
                className="w-full rounded bg-surface border border-border p-2 text-xs text-ink outline-none focus:border-primary"
              />
              <button
                onClick={handleAdd}
                className="w-full py-1.5 rounded bg-primary hover:bg-primary-hover text-white text-[11px] font-semibold transition"
              >
                + Anclar a {fKey}
              </button>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}