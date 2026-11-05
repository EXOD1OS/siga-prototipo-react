'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { registrarAprobacionPedagogica } from '@/actions/planificacion.actions';
import { SelectField, TextAreaField, SectionCard, KeyValueRow, EmptyState } from './fields';
import { hasRole } from '@/lib/roles';
import type { PedagogicalReportData, DocentCategory } from '@/types/planificacion';

const ASPECTOS_GENERALES_LABELS: Record<string, string> = {
  introduccion: 'Introducción',
  diagnostico: 'Diagnóstico',
  objetivosPropositoRA: 'Objetivos / Propósito / RA',
  claseRecursosDidacticos: 'Clase / Recursos didácticos',
};
const ASPECTOS_CURRICULARES_LABELS: Record<string, string> = {
  contenidos: 'Contenidos',
  trabajosPracticos: 'Trabajos prácticos',
  trabajosPracticosLaboratorio: 'Trabajos prácticos de laboratorio',
  trabajosCampo: 'Trabajos de campo',
  evaluacionInicial: 'Evaluación inicial',
  regimenAprobacion: 'Régimen de aprobación',
  horarios: 'Horarios',
  distribucionHoraria: 'Distribución horaria',
};

export function InformePedagogicoPanel({
  planificacionId,
  estado,
  rol,
  equipoPaad,
  informePedagogico,
}: {
  planificacionId: string;
  estado: string;
  rol: UserRole;
  equipoPaad: { cargo: string; nombre: string }[];
  informePedagogico: PedagogicalReportData | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const puedeDictaminar =
    ['ENVIADO_A_REVISION', 'APROBADO_PEDAGOGICO', 'APROBADO_DISCIPLINAR'].includes(estado) &&
    hasRole(rol, [UserRole.UAP, UserRole.ADMINISTRADOR]);

  const [pedagogico, setPedagogico] = useState<PedagogicalReportData>(
    informePedagogico ?? {
      equipoCatedra: equipoPaad.map((p) => ({ cargo: p.cargo as DocentCategory, nombre: p.nombre })),
      aspectosGenerales: {
        introduccion: 'PRESENTA_COMPLETA',
        diagnostico: 'PRESENTA_COMPLETA',
        objetivosPropositoRA: 'CONCRETOS_CLAROS',
        claseRecursosDidacticos: 'PRESENTA_Y_DESCRIBE',
      },
      aspectosCurriculares: {
        contenidos: 'DESARROLLADOS_EN_UNIDADES',
        trabajosPracticos: 'ARTICULADOS_CON_TEORIA',
        trabajosPracticosLaboratorio: 'NO_APLICA',
        trabajosCampo: 'NO_APLICA',
        evaluacionInicial: 'FORMATIVA_Y_SUMATIVA',
        regimenAprobacion: 'PROMOCIONAL_REGULAR_LIBRE',
        horarios: 'PRESENTA',
        distribucionHoraria: 'PRESENTA',
      },
      dictamen: 'FAVORABLE',
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
    if (!informePedagogico) {
      return (
        <EmptyState message="Este informe lo elabora la UAP una vez que la planificación fue enviada a revisión. Todavía no fue emitido." />
      );
    }
    return (
      <SectionCard title="Informe Pedagógico UAP (Anexo III — Ord. 219/22)">
        <dl className="divide-y divide-border">
          {Object.entries(informePedagogico.aspectosGenerales).map(([k, v]) => (
            <KeyValueRow key={k} label={ASPECTOS_GENERALES_LABELS[k] ?? k} value={String(v).replaceAll('_', ' ')} />
          ))}
          {Object.entries(informePedagogico.aspectosCurriculares).map(([k, v]) => (
            <KeyValueRow key={k} label={ASPECTOS_CURRICULARES_LABELS[k] ?? k} value={String(v).replaceAll('_', ' ')} />
          ))}
          <KeyValueRow
            label="Dictamen"
            value={
              <span className={informePedagogico.dictamen === 'FAVORABLE' ? 'text-success' : 'text-danger'}>
                {informePedagogico.dictamen === 'FAVORABLE' ? 'Favorable' : 'Requiere corrección'}
              </span>
            }
          />
          {informePedagogico.observaciones && <KeyValueRow label="Observaciones" value={informePedagogico.observaciones} />}
        </dl>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Informe Pedagógico UAP (Anexo III — Ord. 219/22)">
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Introducción"
          value={pedagogico.aspectosGenerales.introduccion}
          options={[
            { value: 'PRESENTA_COMPLETA', label: 'Presenta / completa' },
            { value: 'PRESENTA_INCOMPLETA', label: 'Presenta incompleta' },
            { value: 'NO_PRESENTA', label: 'No presenta' },
          ]}
          onChange={(v) => setPedagogico((p) => ({ ...p, aspectosGenerales: { ...p.aspectosGenerales, introduccion: v as any } }))}
        />
        <SelectField
          label="Diagnóstico"
          value={pedagogico.aspectosGenerales.diagnostico}
          options={[
            { value: 'PRESENTA_COMPLETA', label: 'Presenta / completa' },
            { value: 'PRESENTA_INCOMPLETA', label: 'Presenta incompleta' },
            { value: 'NO_PRESENTA', label: 'No presenta' },
          ]}
          onChange={(v) => setPedagogico((p) => ({ ...p, aspectosGenerales: { ...p.aspectosGenerales, diagnostico: v as any } }))}
        />
        <SelectField
          label="Objetivos / Propósito / RA"
          value={pedagogico.aspectosGenerales.objetivosPropositoRA}
          options={[
            { value: 'CONCRETOS_CLAROS', label: 'Concretos y claros' },
            { value: 'CONFUSOS', label: 'Confusos' },
            { value: 'NO_PRESENTA', label: 'No presenta' },
          ]}
          onChange={(v) => setPedagogico((p) => ({ ...p, aspectosGenerales: { ...p.aspectosGenerales, objetivosPropositoRA: v as any } }))}
        />
        <SelectField
          label="Clase / Recursos didácticos"
          value={pedagogico.aspectosGenerales.claseRecursosDidacticos}
          options={[
            { value: 'PRESENTA_Y_DESCRIBE', label: 'Presenta y describe metodología' },
            { value: 'INCOMPLETO', label: 'Incompleto' },
            { value: 'NO_PRESENTA', label: 'No presenta' },
          ]}
          onChange={(v) =>
            setPedagogico((p) => ({ ...p, aspectosGenerales: { ...p.aspectosGenerales, claseRecursosDidacticos: v as any } }))
          }
        />
        <SelectField
          label="Contenidos"
          value={pedagogico.aspectosCurriculares.contenidos}
          options={[
            { value: 'DESARROLLADOS_EN_UNIDADES', label: 'Desarrollados en unidades' },
            { value: 'INCOMPLETO', label: 'Incompleto' },
            { value: 'NO_PRESENTA', label: 'No presenta' },
          ]}
          onChange={(v) => setPedagogico((p) => ({ ...p, aspectosCurriculares: { ...p.aspectosCurriculares, contenidos: v as any } }))}
        />
        <SelectField
          label="Trabajos prácticos"
          value={pedagogico.aspectosCurriculares.trabajosPracticos}
          options={[
            { value: 'ARTICULADOS_CON_TEORIA', label: 'Articulados con teoría' },
            { value: 'NO_ARTICULADOS', label: 'No articulados' },
            { value: 'NO_APLICA', label: 'No aplica' },
          ]}
          onChange={(v) =>
            setPedagogico((p) => ({ ...p, aspectosCurriculares: { ...p.aspectosCurriculares, trabajosPracticos: v as any } }))
          }
        />
        <SelectField
          label="Trabajos prácticos de laboratorio"
          value={pedagogico.aspectosCurriculares.trabajosPracticosLaboratorio}
          options={[
            { value: 'ARTICULADOS', label: 'Articulados' },
            { value: 'NO_ARTICULADOS', label: 'No articulados' },
            { value: 'NO_APLICA', label: 'No aplica' },
          ]}
          onChange={(v) =>
            setPedagogico((p) => ({
              ...p,
              aspectosCurriculares: { ...p.aspectosCurriculares, trabajosPracticosLaboratorio: v as any },
            }))
          }
        />
        <SelectField
          label="Trabajos de campo"
          value={pedagogico.aspectosCurriculares.trabajosCampo}
          options={[
            { value: 'ACORDE', label: 'Acorde' },
            { value: 'NO_ACORDE', label: 'No acorde' },
            { value: 'NO_APLICA', label: 'No aplica' },
          ]}
          onChange={(v) => setPedagogico((p) => ({ ...p, aspectosCurriculares: { ...p.aspectosCurriculares, trabajosCampo: v as any } }))}
        />
        <SelectField
          label="Evaluación inicial"
          value={pedagogico.aspectosCurriculares.evaluacionInicial}
          options={[
            { value: 'FORMATIVA_Y_SUMATIVA', label: 'Formativa y sumativa' },
            { value: 'SOLO_SUMATIVA', label: 'Solo sumativa' },
            { value: 'NO_PRESENTA', label: 'No presenta' },
          ]}
          onChange={(v) =>
            setPedagogico((p) => ({ ...p, aspectosCurriculares: { ...p.aspectosCurriculares, evaluacionInicial: v as any } }))
          }
        />
        <SelectField
          label="Régimen de aprobación"
          value={pedagogico.aspectosCurriculares.regimenAprobacion}
          options={[
            { value: 'PROMOCIONAL_REGULAR_LIBRE', label: 'Promocional / Regular / Libre' },
            { value: 'INCOMPLETO', label: 'Incompleto' },
          ]}
          onChange={(v) =>
            setPedagogico((p) => ({ ...p, aspectosCurriculares: { ...p.aspectosCurriculares, regimenAprobacion: v as any } }))
          }
        />
        <SelectField
          label="Horarios"
          value={pedagogico.aspectosCurriculares.horarios}
          options={[
            { value: 'PRESENTA', label: 'Presenta' },
            { value: 'NO_PRESENTA', label: 'No presenta' },
          ]}
          onChange={(v) => setPedagogico((p) => ({ ...p, aspectosCurriculares: { ...p.aspectosCurriculares, horarios: v as any } }))}
        />
        <SelectField
          label="Distribución horaria"
          value={pedagogico.aspectosCurriculares.distribucionHoraria}
          options={[
            { value: 'PRESENTA', label: 'Presenta' },
            { value: 'NO_PRESENTA', label: 'No presenta' },
          ]}
          onChange={(v) =>
            setPedagogico((p) => ({ ...p, aspectosCurriculares: { ...p.aspectosCurriculares, distribucionHoraria: v as any } }))
          }
        />
      </div>

      <SelectField
        label="Dictamen"
        value={pedagogico.dictamen}
        options={[
          { value: 'FAVORABLE', label: 'Favorable' },
          { value: 'REQUIERE_CORRECCION', label: 'Requiere corrección' },
        ]}
        onChange={(v) => setPedagogico((p) => ({ ...p, dictamen: v as any }))}
      />
      <TextAreaField
        label="Observaciones generales"
        value={pedagogico.observaciones ?? ''}
        onChange={(v) => setPedagogico((p) => ({ ...p, observaciones: v }))}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => registrarAprobacionPedagogica(planificacionId, pedagogico))}
        className={`text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors ${
          pedagogico.dictamen === 'FAVORABLE' ? 'bg-success/80 hover:bg-success' : 'bg-danger/80 hover:bg-danger'
        }`}
      >
        {pending ? 'Procesando...' : 'Registrar dictamen pedagógico'}
      </button>
    </SectionCard>
  );
}
