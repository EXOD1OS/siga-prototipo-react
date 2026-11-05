'use client';

import { useState, useTransition } from 'react';
import { observarPaad, resolverObservacionPaad } from '@/actions/paad.actions';
import { agregarObservacion, resolverObservacion } from '@/actions/planificacion.actions';

interface Observacion {
  id: string;
  mensaje: string;
  rolAutor: string;
  resuelto: boolean;
}

interface Props {
  planificacionId?: string;
  paadAnualId?: string;
  presentacionId?: string;
  documentoTipo: 'PAAC' | 'PAAD';
  docentePaadId?: string;
  fieldPath: string;
  observaciones?: Observacion[];
  canObserve?: boolean;
  canResolve?: boolean;
  children: React.ReactNode;
}

export function ObservationFieldWrapper({
  planificacionId,
  paadAnualId,
  presentacionId,
  documentoTipo,
  docentePaadId,
  fieldPath,
  observaciones = [],
  canObserve = false,
  canResolve = false,
  children,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [pending, startTransition] = useTransition();

  const pendientes = observaciones.filter((o) => !o.resuelto);
  const hasObs = pendientes.length > 0;

  function submitObservacion() {
    if (!mensaje.trim()) return;
    startTransition(async () => {
      setError(null);
      try {
        if (paadAnualId && presentacionId) await observarPaad({ paadId: paadAnualId, presentacionId, campoPath: fieldPath, mensaje });
        else if (planificacionId) await agregarObservacion({ planificacionId, documentoTipo, campoPath: fieldPath, mensaje, docentePaadId });
        else throw new Error('Documento no disponible.');
      } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo registrar la observación.'); return; }
      setMensaje('');
      setOpen(false);
    });
  }

  return (
    <div className={`p-2 rounded-lg transition-colors ${hasObs ? 'bg-red-950/10 ring-1 ring-danger/30' : ''}`}>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}

      {canObserve && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
        >
          <span aria-hidden className="text-sm leading-none">+</span> Realizar observación
        </button>
      )}

      {open && (
        <div className="mt-2 flex gap-2">
          <input
            className="flex-1 text-xs"
            placeholder="Observación"
            autoFocus
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitObservacion();
              if (e.key === 'Escape') setOpen(false);
            }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={submitObservacion}
            className="text-xs bg-danger/15 border border-danger/40 text-red-300 px-3 rounded-lg hover:bg-danger/25 whitespace-nowrap disabled:opacity-50"
          >
            Enviar observación
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-gray-500 hover:text-gray-300 px-1"
          >
            Cancelar
          </button>
        </div>
      )}

      {hasObs && (
        <div className="mt-2 space-y-1">
          {pendientes.map((obs) => (
            <div
              key={obs.id}
              className="flex items-center justify-between gap-2 text-xs bg-danger/10 text-red-300 border border-danger/30 px-2 py-1 rounded"
            >
              <span>
                <strong>[{obs.rolAutor}]:</strong> {obs.mensaje}
              </span>
              {canResolve && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(async () => { try { if (paadAnualId) await resolverObservacionPaad(obs.id); else await resolverObservacion(obs.id); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo resolver.'); } })}
                  className="ml-2 text-emerald-400 hover:underline whitespace-nowrap"
                >
                  Marcar resuelto
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
