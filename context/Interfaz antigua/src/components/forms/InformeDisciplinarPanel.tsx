'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { registrarAprobacionDisciplinar } from '@/actions/planificacion.actions';
import { SelectField, TextAreaField, SectionCard, KeyValueRow, EmptyState } from './fields';
import { hasRole } from '@/lib/roles';
import type { DisciplinaryReportData, DocentCategory } from '@/types/planificacion';

export function InformeDisciplinarPanel({
  planificacionId,
  estado,
  rol,
  equipoPaad,
  informeDisciplinar,
}: {
  planificacionId: string;
  estado: string;
  rol: UserRole;
  equipoPaad: { docenteId: string; nombre: string; cargo: string; estado: string }[];
  informeDisciplinar: DisciplinaryReportData | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const puedeDictaminar =
    ['ENVIADO_A_REVISION', 'APROBADO_PEDAGOGICO', 'APROBADO_DISCIPLINAR'].includes(estado) &&
    hasRole(rol, [UserRole.DIRECCION_CARRERA, UserRole.ADMINISTRADOR]);

  const controlActual: DisciplinaryReportData['controlPaad'] = equipoPaad.map(p => ({
    docenteId: p.docenteId, nombreDocente: p.nombre, cargo: p.cargo as DocentCategory,
    estado: p.estado === 'PRESENTO' ? 'PRESENTO' : 'NO_PRESENTO',
  }));
  const [disciplinar, setDisciplinar] = useState<DisciplinaryReportData>(
    informeDisciplinar ?? {
      contenidos: 'CUMPLE',
      trabajosPracticos: { tp: 'ACORDE', laboratorio: 'NO_APLICA', campo: 'NO_APLICA' },
      bibliografia: { basica: 'PRESENTA', complementaria: 'PRESENTA' },
      controlPaad: controlActual,
      dictamen: 'CUMPLE',
      observaciones: '',
    }
  );

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

  if (!puedeDictaminar) {
    if (!informeDisciplinar) {
      return (
        <EmptyState message="Este informe lo elabora la Dirección de Carrera una vez que la planificación fue enviada a revisión. Todavía no fue emitido." />
      );
    }
    return (
      <SectionCard title="Informe Disciplinar Dirección de Carrera (Anexo IV — Ord. 219/22)">
        <dl className="divide-y divide-border">
          <KeyValueRow label="Contenidos" value={informeDisciplinar.contenidos} />
          <KeyValueRow label="Trabajos prácticos" value={informeDisciplinar.trabajosPracticos.tp} />
          <KeyValueRow label="Laboratorio" value={informeDisciplinar.trabajosPracticos.laboratorio} />
          <KeyValueRow label="Trabajo de campo" value={informeDisciplinar.trabajosPracticos.campo} />
          <KeyValueRow label="Bibliografía básica" value={informeDisciplinar.bibliografia.basica} />
          <KeyValueRow label="Bibliografía complementaria" value={informeDisciplinar.bibliografia.complementaria} />
          <KeyValueRow
            label="Dictamen"
            value={
              <span className={informeDisciplinar.dictamen === 'CUMPLE' ? 'text-success' : 'text-danger'}>
                {informeDisciplinar.dictamen === 'CUMPLE' ? 'Cumple' : 'Requiere corrección'}
              </span>
            }
          />
          {informeDisciplinar.observaciones && <KeyValueRow label="Observaciones" value={informeDisciplinar.observaciones} />}
        </dl>
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Control actual de PAAD (informativo, no bloquea el PAAC)</p>
          <div className="space-y-1">
            {controlActual.map((c) => (
              <div key={c.docenteId} className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2">
                <span>
                  {c.nombreDocente} <span className="text-gray-500">({c.cargo})</span>
                </span>
                <span className={c.estado === 'PRESENTO' ? 'text-success' : 'text-danger'}>{c.estado}</span>
              </div>
            ))}
          </div>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer">Control guardado al emitir el informe (antecedente)</summary>
          {informeDisciplinar.controlPaad.map(c => <p key={c.docenteId}>{c.nombreDocente}: {c.estado}</p>)}
        </details>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Informe Disciplinar Dirección de Carrera (Anexo IV — Ord. 219/22)">
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Contenidos"
          value={disciplinar.contenidos}
          options={[
            { value: 'CUMPLE', label: 'Cumple' },
            { value: 'NO_CUMPLE', label: 'No cumple' },
          ]}
          onChange={(v) => setDisciplinar((d) => ({ ...d, contenidos: v as any }))}
        />
        <SelectField
          label="Trabajos prácticos"
          value={disciplinar.trabajosPracticos.tp}
          options={[
            { value: 'ACORDE', label: 'Acorde' },
            { value: 'NO_ACORDE', label: 'No acorde' },
          ]}
          onChange={(v) => setDisciplinar((d) => ({ ...d, trabajosPracticos: { ...d.trabajosPracticos, tp: v as any } }))}
        />
        <SelectField
          label="Laboratorio"
          value={disciplinar.trabajosPracticos.laboratorio}
          options={[
            { value: 'ACORDE', label: 'Acorde' },
            { value: 'NO_ACORDE', label: 'No acorde' },
            { value: 'NO_APLICA', label: 'No aplica' },
          ]}
          onChange={(v) => setDisciplinar((d) => ({ ...d, trabajosPracticos: { ...d.trabajosPracticos, laboratorio: v as any } }))}
        />
        <SelectField
          label="Trabajo de campo"
          value={disciplinar.trabajosPracticos.campo}
          options={[
            { value: 'ACORDE', label: 'Acorde' },
            { value: 'NO_ACORDE', label: 'No acorde' },
            { value: 'NO_APLICA', label: 'No aplica' },
          ]}
          onChange={(v) => setDisciplinar((d) => ({ ...d, trabajosPracticos: { ...d.trabajosPracticos, campo: v as any } }))}
        />
        <SelectField
          label="Bibliografía básica"
          value={disciplinar.bibliografia.basica}
          options={[
            { value: 'PRESENTA', label: 'Presenta' },
            { value: 'NO_PRESENTA', label: 'No presenta' },
          ]}
          onChange={(v) => setDisciplinar((d) => ({ ...d, bibliografia: { ...d.bibliografia, basica: v as any } }))}
        />
        <SelectField
          label="Bibliografía complementaria"
          value={disciplinar.bibliografia.complementaria}
          options={[
            { value: 'PRESENTA', label: 'Presenta' },
            { value: 'NO_PRESENTA', label: 'No presenta' },
          ]}
          onChange={(v) => setDisciplinar((d) => ({ ...d, bibliografia: { ...d.bibliografia, complementaria: v as any } }))}
        />
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">Control actual de PAAD (informativo, no bloquea el PAAC)</p>
        <div className="space-y-1">
          {controlActual.map((c) => (
            <div key={c.docenteId} className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2">
              <span>
                {c.nombreDocente} <span className="text-gray-500">({c.cargo})</span>
              </span>
              <span className={c.estado === 'PRESENTO' ? 'text-success' : 'text-danger'}>{c.estado}</span>
            </div>
          ))}
        </div>
      </div>

      <SelectField
        label="Dictamen"
        value={disciplinar.dictamen}
        options={[
          { value: 'CUMPLE', label: 'Cumple' },
          { value: 'REQUIERE_CORRECCION', label: 'Requiere corrección' },
        ]}
        onChange={(v) => setDisciplinar((d) => ({ ...d, dictamen: v as any }))}
      />
      <TextAreaField
        label="Observaciones generales"
        value={disciplinar.observaciones ?? ''}
        onChange={(v) => setDisciplinar((d) => ({ ...d, observaciones: v }))}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => registrarAprobacionDisciplinar(planificacionId, { ...disciplinar, controlPaad: controlActual }))}
        className={`text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors ${
          disciplinar.dictamen === 'CUMPLE' ? 'bg-success/80 hover:bg-success' : 'bg-danger/80 hover:bg-danger'
        }`}
      >
        {pending ? 'Procesando...' : 'Registrar dictamen disciplinar'}
      </button>
    </SectionCard>
  );
}
