'use client';

import { useState } from 'react';

interface Props {
  asignatura: string;
  cicloLectivo: number;
  numeroExpediente: string | null;
  numeroResolucion: string | null;
  fechaAprobacionCd: string | null;
}

export function ResolucionModal({ asignatura, cicloLectivo, numeroExpediente, numeroResolucion, fechaAprobacionCd }: Props) {
  const [open, setOpen] = useState(false);

  if (!numeroExpediente) return <span className="text-xs text-gray-600">—</span>;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="text-xs text-primary hover:underline"
      >
        Detalles
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }}
        >
          <div
            className="w-full max-w-md bg-surface border border-border rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-white mb-4">Resolución — {asignatura}</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Ciclo lectivo</dt>
                <dd className="text-gray-200">{cicloLectivo}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">N° de expediente</dt>
                <dd className="text-gray-200">{numeroExpediente}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">N° de resolución</dt>
                <dd className="text-gray-200">{numeroResolucion ?? 'Pendiente de formalizar'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Fecha de aprobación</dt>
                <dd className="text-gray-200">
                  {fechaAprobacionCd ? new Date(fechaAprobacionCd).toLocaleDateString('es-AR') : '—'}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full text-sm text-gray-300 border border-border rounded-lg py-2 hover:bg-background/50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
