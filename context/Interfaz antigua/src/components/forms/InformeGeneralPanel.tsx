'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { guardarInformeGeneral } from '@/actions/planificacion.actions';
import { SelectField, TextAreaField, SectionCard, KeyValueRow, EmptyState } from './fields';
import { hasRole } from '@/lib/roles';
import type { GeneralReportData } from '@/types/planificacion';

export function InformeGeneralPanel({
  planificacionId,
  estado,
  rol,
  informeGeneral,
}: {
  planificacionId: string;
  estado: string;
  rol: UserRole;
  informeGeneral: GeneralReportData | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const puedeElaborar = estado === 'APROBADO_PLENO' && hasRole(rol, [UserRole.UAP, UserRole.DIRECCION_CARRERA, UserRole.ADMINISTRADOR]);

  const [general, setGeneral] = useState<GeneralReportData>(
    informeGeneral ?? {
      conclusionConjunta: '',
      observacionesGenerales: '',
      recomendacion: 'FAVORABLE',
      elaboradoPorUap: false,
      elaboradoPorDireccion: false,
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

  if (estado !== 'APROBADO_PLENO' && !informeGeneral) {
    return (
      <EmptyState message="El Informe General de PAAC se elabora en conjunto entre la UAP y la Dirección de Carrera una vez que la planificación tiene Aprobación Plena." />
    );
  }

  if (!puedeElaborar) {
    if (!informeGeneral) {
      return <EmptyState message="Todavía no fue elaborado el Informe General de PAAC." />;
    }
    return (
      <SectionCard title="Informe General de PAAC">
        <div className="flex gap-3 text-xs mb-2">
          <span className={informeGeneral.elaboradoPorUap ? 'text-success' : 'text-gray-500'}>
            {informeGeneral.elaboradoPorUap ? '✓' : '○'} UAP
          </span>
          <span className={informeGeneral.elaboradoPorDireccion ? 'text-success' : 'text-gray-500'}>
            {informeGeneral.elaboradoPorDireccion ? '✓' : '○'} Dirección de Carrera
          </span>
        </div>
        <dl className="divide-y divide-border">
          <KeyValueRow label="Conclusión conjunta" value={informeGeneral.conclusionConjunta} />
          {informeGeneral.observacionesGenerales && (
            <KeyValueRow label="Observaciones generales" value={informeGeneral.observacionesGenerales} />
          )}
          <KeyValueRow
            label="Recomendación"
            value={
              <span className={informeGeneral.recomendacion === 'FAVORABLE' ? 'text-success' : 'text-danger'}>
                {informeGeneral.recomendacion === 'FAVORABLE' ? 'Favorable' : 'No favorable'}
              </span>
            }
          />
        </dl>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Informe General de PAAC (elaborado en conjunto por UAP y Dirección de Carrera)">
      <div className="flex gap-3 text-xs">
        <span className={informeGeneral?.elaboradoPorUap ? 'text-success' : 'text-gray-500'}>
          {informeGeneral?.elaboradoPorUap ? '✓' : '○'} UAP
        </span>
        <span className={informeGeneral?.elaboradoPorDireccion ? 'text-success' : 'text-gray-500'}>
          {informeGeneral?.elaboradoPorDireccion ? '✓' : '○'} Dirección de Carrera
        </span>
      </div>
      <TextAreaField
        label="Conclusión conjunta"
        rows={3}
        value={general.conclusionConjunta}
        onChange={(v) => setGeneral((g) => ({ ...g, conclusionConjunta: v }))}
      />
      <TextAreaField
        label="Observaciones generales"
        value={general.observacionesGenerales ?? ''}
        onChange={(v) => setGeneral((g) => ({ ...g, observacionesGenerales: v }))}
      />
      <SelectField
        label="Recomendación"
        value={general.recomendacion}
        options={[
          { value: 'FAVORABLE', label: 'Favorable' },
          { value: 'NO_FAVORABLE', label: 'No favorable' },
        ]}
        onChange={(v) => setGeneral((g) => ({ ...g, recomendacion: v as any }))}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => guardarInformeGeneral(planificacionId, general))}
        className="bg-primary hover:bg-primary-hover transition-colors text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
      >
        {pending ? 'Procesando...' : 'Guardar Informe General'}
      </button>
    </SectionCard>
  );
}
