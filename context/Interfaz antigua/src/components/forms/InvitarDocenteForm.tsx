'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { invitarDocenteEquipo } from '@/actions/planificacion.actions';

interface Docente {
  id: string;
  nombre: string;
  apellido: string;
}

const CARGOS = ['TITULAR', 'ASOCIADO', 'ADJUNTO', 'JTP', 'AYUDANTE'];

export function InvitarDocenteForm({ planificacionId, docentes }: { planificacionId: string; docentes: Docente[] }) {
  const router = useRouter();
  const [docenteId, setDocenteId] = useState(docentes[0]?.id ?? '');
  const [cargo, setCargo] = useState('AYUDANTE');
  const [pending, startTransition] = useTransition();

  if (docentes.length === 0) return null;

  function handleAdd() {
    startTransition(async () => {
      await invitarDocenteEquipo(planificacionId, docenteId, cargo);
      router.refresh();
    });
  }

  return (
    <div className="flex items-end gap-2 border border-dashed border-border rounded-lg p-3">
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Docente</label>
        <select className="w-full" value={docenteId} onChange={(e) => setDocenteId(e.target.value)}>
          {docentes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre} {d.apellido}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Cargo</label>
        <select className="w-full" value={cargo} onChange={(e) => setCargo(e.target.value)}>
          {CARGOS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={handleAdd}
        className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-lg disabled:opacity-50"
      >
        + Agregar al equipo
      </button>
    </div>
  );
}
