'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { generarPlanificaciones } from '@/actions/admin.actions';
import { NumberField } from '@/components/forms/fields';

export function GenerarPlanificacionesPanel() {
  const router = useRouter();
  const [cicloLectivo, setCicloLectivo] = useState(new Date().getFullYear());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Awaited<ReturnType<typeof generarPlanificaciones>> | null>(null);

  function generar() {
    setError(null);
    setResultado(null);
    startTransition(async () => {
      try {
        setResultado(await generarPlanificaciones(cicloLectivo));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudieron generar las planificaciones.');
      }
    });
  }

  return (
    <div className="rounded-xl border border-blue-100/10 bg-[#09172b]/65 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <CalendarIcon />
        <span>Elegí el año lectivo</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-400">Solo completa los borradores que faltan.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-36">
          <NumberField label="Ciclo lectivo" value={cicloLectivo} onChange={setCicloLectivo} />
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={generar}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {pending ? <><Spinner /> Preparando…</> : <>Iniciar ciclo lectivo <ArrowIcon /></>}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/[0.08] px-3 py-2 text-sm text-rose-100">{error}</p>}
      {resultado && (
        <div role="status" className="mt-4 space-y-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-3 text-xs leading-5 text-slate-200">
          <p className="font-medium text-emerald-100">Ciclo {cicloLectivo} procesado</p>
          <p>{resultado.creadas} borradores creados · {resultado.asignacionesCopiadas} integrantes copiados · {resultado.yaExistentes} ya existentes.</p>
          {resultado.responsablesProvisionales.length > 0 && <p>{resultado.responsablesProvisionales.length} materias tienen responsable provisional; revisá esas designaciones.</p>}
          {resultado.sinEquipo.length > 0 && <p>{resultado.sinEquipo.length} materias sin equipo docente: {resultado.sinEquipo.join(', ')}.</p>}
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-blue-200" stroke="currentColor" strokeWidth="1.6"><rect x="2.5" y="4" width="15" height="13" rx="2" /><path d="M6.5 2.5v3M13.5 2.5v3M2.5 8h15M6 11h2m4 0h2m-8 3h2" /></svg>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8"><path d="M3.5 10h12M10.5 5l5 5-5 5" /></svg>;
}

function Spinner() {
  return <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}
