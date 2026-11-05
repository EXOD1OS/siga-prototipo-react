'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/Modal';
import { invitarDocenteEquipo, quitarDocenteEquipo, cambiarResponsablePlanificacion } from '@/actions/planificacion.actions';
import { SelectField } from '@/components/forms/fields';

const CATEGORIAS = ['TITULAR', 'ASOCIADO', 'ADJUNTO', 'JTP', 'AYUDANTE'];

export interface EquipoRow {
  paadId: string;
  docenteId: string;
  nombre: string;
  cargo: string;
}

export function GestionEquipoModal({
  planificacionId,
  docenteResponsableId,
  equipo,
  docentesDisponibles,
}: {
  planificacionId: string;
  docenteResponsableId: string;
  equipo: EquipoRow[];
  docentesDisponibles: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nuevoDocenteId, setNuevoDocenteId] = useState(docentesDisponibles[0]?.id ?? '');
  const [nuevaCategoria, setNuevaCategoria] = useState('AYUDANTE');

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e: any) {
        setError(e.message ?? 'Ocurrió un error.');
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-primary hover:text-primary-hover border border-border hover:border-primary/50 rounded-lg px-3 py-1.5 transition-colors"
      >
        Gestionar equipo
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Gestión de equipo de cátedra" widthClass="max-w-2xl">
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Los cambios se aplican de inmediato sobre la planificación en curso, sin alterar su estado actual.
          </p>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="space-y-2">
            {equipo.map((m) => (
              <div key={m.paadId} className="flex items-center gap-3 border border-border rounded-lg px-3 py-2">
                <label className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
                  <input
                    type="radio"
                    name={`responsable-${planificacionId}`}
                    checked={m.docenteId === docenteResponsableId}
                    disabled={pending}
                    onChange={() => run(() => cambiarResponsablePlanificacion(planificacionId, m.docenteId, m.cargo))}
                  />
                  Responsable
                </label>
                <span className="flex-1 text-sm text-gray-200 truncate">{m.nombre}</span>
                <span className="text-xs text-gray-500">{m.cargo}</span>
                <button
                  type="button"
                  disabled={pending || m.docenteId === docenteResponsableId}
                  onClick={() => run(() => quitarDocenteEquipo(planificacionId, m.paadId))}
                  className="text-xs text-danger hover:underline disabled:opacity-40 disabled:hover:no-underline whitespace-nowrap"
                  title={m.docenteId === docenteResponsableId ? 'Cambiá el responsable antes de quitarlo' : undefined}
                >
                  Quitar
                </button>
              </div>
            ))}
            {equipo.length === 0 && <p className="text-xs text-gray-600">Sin integrantes cargados.</p>}
          </div>

          {docentesDisponibles.length > 0 && (
            <div className="flex items-end gap-2 border border-dashed border-border rounded-lg p-3">
              <div className="flex-1">
                <SelectField
                  label="Docente"
                  value={nuevoDocenteId || docentesDisponibles[0]?.id}
                  options={docentesDisponibles.map((d) => ({ value: d.id, label: d.nombre }))}
                  onChange={setNuevoDocenteId}
                />
              </div>
              <div>
                <SelectField
                  label="Categoría"
                  value={nuevaCategoria}
                  options={CATEGORIAS.map((c) => ({ value: c, label: c }))}
                  onChange={setNuevaCategoria}
                />
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() => invitarDocenteEquipo(planificacionId, nuevoDocenteId || docentesDisponibles[0].id, nuevaCategoria))
                }
                className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-lg disabled:opacity-50"
              >
                + Agregar
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
