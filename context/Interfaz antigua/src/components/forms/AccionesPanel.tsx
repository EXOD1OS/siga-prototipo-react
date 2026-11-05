'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { enviarARevision, elevarAlConsejo, asignarExpediente, formalizarResolucion } from '@/actions/planificacion.actions';
import { SectionCard, TextField } from './fields';
import { hasRole } from '@/lib/roles';

interface Props {
  planificacionId: string;
  estado: string;
  rol: UserRole;
  esResponsable: boolean;
  informeGeneralListo: boolean;
  numeroExpediente: string | null;
  numeroResolucion: string | null;
}

function ActionButton({
  label,
  pending,
  onClick,
  variant = 'primary',
}: {
  label: string;
  pending: boolean;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'success';
}) {
  const styles = {
    primary: 'bg-primary hover:bg-primary-hover',
    danger: 'bg-danger/80 hover:bg-danger',
    success: 'bg-success/80 hover:bg-success',
  } as const;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={`text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors ${styles[variant]}`}
    >
      {pending ? 'Procesando...' : label}
    </button>
  );
}

export function AccionesPanel({
  planificacionId,
  estado,
  rol,
  esResponsable,
  informeGeneralListo,
  numeroExpediente,
  numeroResolucion,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nroExpedienteInput, setNroExpedienteInput] = useState('');
  const [nroResolucionInput, setNroResolucionInput] = useState('');

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await fn();
        if (result && typeof result === 'object' && 'error' in result && typeof result.error === 'string') {
          setError(result.error);
          return;
        }
        router.refresh();
      } catch (e: any) {
        setError(e.message ?? 'Ocurrió un error.');
      }
    });
  }

  const puedeEnviar = ['BORRADOR', 'OBSERVADO'].includes(estado) && (esResponsable || rol === UserRole.ADMINISTRADOR);
  const puedeElevar = estado === 'APROBADO_PLENO' && hasRole(rol, [UserRole.DIRECCION_CARRERA, UserRole.ADMINISTRADOR]);
  const puedeAsignarExpediente =
    estado === 'ELEVADO_AL_CONSEJO' && !numeroExpediente && hasRole(rol, [UserRole.CONSEJO_DEPARTAMENTAL, UserRole.ADMINISTRADOR]);
  const puedeFormalizarResolucion =
    estado === 'ELEVADO_AL_CONSEJO' &&
    !!numeroExpediente &&
    !numeroResolucion &&
    hasRole(rol, [UserRole.CONSEJO_DEPARTAMENTAL, UserRole.ADMINISTRADOR]);

  if (!puedeEnviar && !puedeElevar && !puedeAsignarExpediente && !puedeFormalizarResolucion) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {puedeEnviar && (
          <ActionButton label="Enviar a Revisión" pending={pending} onClick={() => run(() => enviarARevision(planificacionId))} />
        )}
        {puedeElevar && (
          <ActionButton
            label={informeGeneralListo ? 'Elevar al Consejo Departamental' : 'Elevar al Consejo (falta Informe General)'}
            pending={pending}
            onClick={() => run(() => elevarAlConsejo(planificacionId))}
          />
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {puedeAsignarExpediente && (
        <SectionCard title="Consejo Departamental — Asignación de Expediente">
          <p className="text-sm text-gray-400">
            El Consejo aprueba la elevación y asigna número de expediente. La resolución se formaliza en un paso posterior.
          </p>
          <TextField label="Número de expediente" value={nroExpedienteInput} onChange={setNroExpedienteInput} />
          <ActionButton
            label="Asignar expediente"
            pending={pending}
            onClick={() => run(() => asignarExpediente(planificacionId, nroExpedienteInput))}
          />
        </SectionCard>
      )}

      {puedeFormalizarResolucion && (
        <SectionCard title="Consejo Departamental — Formalización con Resolución">
          <p className="text-sm text-gray-400">Expediente N° {numeroExpediente}. Cargá el número de resolución para finalizar.</p>
          <TextField label="Número de resolución" value={nroResolucionInput} onChange={setNroResolucionInput} />
          <ActionButton
            label="Formalizar y finalizar"
            variant="success"
            pending={pending}
            onClick={() => run(() => formalizarResolucion(planificacionId, nroResolucionInput))}
          />
        </SectionCard>
      )}
    </div>
  );
}
