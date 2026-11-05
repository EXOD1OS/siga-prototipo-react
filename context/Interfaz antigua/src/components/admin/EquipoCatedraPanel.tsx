'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  agregarIntegranteCatedra,
  actualizarCategoriaIntegrante,
  desvincularIntegrante,
  designarResponsable,
} from '@/actions/admin.actions';
import { SectionCard, SelectField, NumberField } from '@/components/forms/fields';

const CATEGORIAS = ['TITULAR', 'ASOCIADO', 'ADJUNTO', 'JTP', 'AYUDANTE'];

export interface AsignacionRow {
  id: string;
  docenteId: string;
  docenteNombre: string;
  categoria: string;
  esResponsable: boolean;
}

export interface AsignaturaSeleccionada {
  id: string;
  nombre: string;
  carrera: string;
}

export function EquipoCatedraPanel({
  asignatura,
  cicloLectivo,
  onCicloChange,
  asignaciones,
  docentesDisponibles,
}: {
  asignatura: AsignaturaSeleccionada | null;
  cicloLectivo: number;
  onCicloChange: (c: number) => void;
  asignaciones: AsignacionRow[];
  docentesDisponibles: { id: string; nombre: string }[];
}) {
  const router = useRouter();
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

  if (!asignatura) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-xl p-8 text-center text-sm text-gray-500">
        Seleccioná una asignatura en el árbol para gestionar su equipo de cátedra.
      </div>
    );
  }

  const idsYaAsignados = new Set(asignaciones.map((a) => a.docenteId));
  const opcionesDocentes = docentesDisponibles.filter((d) => !idsYaAsignados.has(d.id));

  return (
    <SectionCard title={`Equipo de Cátedra — ${asignatura.nombre}`}>
      <p className="text-xs text-gray-500 -mt-2">{asignatura.carrera}</p>

      <div className="w-40">
        <NumberField label="Ciclo lectivo" value={cicloLectivo} onChange={onCicloChange} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="space-y-2">
        {asignaciones.map((a) => (
          <div key={a.id} className="flex items-center gap-3 border border-border rounded-lg px-3 py-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
              <input
                type="radio"
                name={`responsable-${asignatura.id}-${cicloLectivo}`}
                checked={a.esResponsable}
                disabled={pending}
                onChange={() => run(() => designarResponsable(asignatura.id, cicloLectivo, a.id))}
              />
              Responsable
            </label>
            <span className="flex-1 text-sm text-gray-200 truncate">{a.docenteNombre}</span>
            <select
              className="text-xs"
              value={a.categoria}
              disabled={pending}
              onChange={(e) => run(() => actualizarCategoriaIntegrante(a.id, e.target.value))}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => desvincularIntegrante(a.id))}
              className="text-xs text-danger hover:underline whitespace-nowrap"
            >
              Desvincular
            </button>
          </div>
        ))}
        {asignaciones.length === 0 && (
          <p className="text-xs text-gray-600">Sin integrantes cargados para el ciclo {cicloLectivo}.</p>
        )}
      </div>

      {opcionesDocentes.length > 0 && (
        <div className="flex items-end gap-2 border border-dashed border-border rounded-lg p-3">
          <div className="flex-1">
            <SelectField
              label="Docente"
              value={nuevoDocenteId || opcionesDocentes[0]?.id}
              options={opcionesDocentes.map((d) => ({ value: d.id, label: d.nombre }))}
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
              run(() =>
                agregarIntegranteCatedra({
                  asignaturaId: asignatura.id,
                  cicloLectivo,
                  docenteId: nuevoDocenteId || opcionesDocentes[0].id,
                  categoria: nuevaCategoria,
                })
              )
            }
            className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-lg disabled:opacity-50"
          >
            + Agregar
          </button>
        </div>
      )}
    </SectionCard>
  );
}
