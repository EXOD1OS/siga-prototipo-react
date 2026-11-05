'use client';

import { useState, useTransition } from 'react';
import { guardarBorradorPaad, presentarPaad } from '@/actions/paad.actions';
import { useRouter } from 'next/navigation';
import { ObservationFieldWrapper } from '@/components/ObservationFieldWrapper';
import { TextField, TextAreaField, ListField, RepeatableList, SectionCard } from './fields';
import type { PaadData } from '@/types/planificacion';

interface Observacion {
  id: string;
  campoPath: string;
  mensaje: string;
  rolAutor: string;
  resuelto: boolean;
}

interface Props {
  presentacionId?: string;
  canPresent: boolean;
  paadId: string;
  data: PaadData;
  editable: boolean;
  canObserve: boolean;
  canResolve: boolean;
  observaciones: Observacion[];
}

function obsFor(observaciones: Observacion[], paadId: string, path: string) {
  return observaciones.filter((o) => o.campoPath === path);
}

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
const DIA_LABELS: Record<(typeof DIAS)[number], string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
};
const ACTIVIDAD_LABELS: Record<string, string> = {
  ENSENANZA: 'Enseñanza',
  INVESTIGACION: 'Investigación',
  EXTENSION: 'Extensión',
  FORMACION: 'Formación',
  GESTION: 'Gestión',
};

export function PaadForm({
  presentacionId,
  canPresent,
  paadId,
  data,
  editable,
  canObserve,
  canResolve,
  observaciones,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState<PaadData>(data);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const hayTexto = (items: object[]) => items.some(item => Object.values(item).some(value => typeof value === 'string' && value.trim().length > 0));
  const secciones = [
    { nombre: 'Enseñanza', completa: form.actividadEnsenanza.cursosAtendidos.some(x => x.trim()) || hayTexto(form.actividadEnsenanza.capacitaciones) || hayTexto(form.actividadEnsenanza.materialElaborado) || hayTexto(form.actividadEnsenanza.otrosTrabajosDocentes) },
    { nombre: 'Investigación', completa: hayTexto(form.investigacion) },
    { nombre: 'Recursos humanos', completa: !!form.formacionRecursosHumanos.detalle.trim() },
    { nombre: 'Formación académica', completa: !!form.formacionAcademica.detalle.trim() },
    { nombre: 'Extensión', completa: hayTexto(form.extension) },
    { nombre: 'Gestión universitaria', completa: !!form.gestion.detalle.trim() },
    { nombre: 'Otras actividades', completa: form.otrasActividades.some(x => x.trim()) },
    { nombre: 'Distribución horaria', completa: form.distribucionHoraria.some(f => [f.lunes, f.martes, f.miercoles, f.jueves, f.viernes, f.sabado].some(x => x?.trim())) },
  ];
  const conContenido = secciones.filter(s => s.completa).length;

  function irASeccion(index: number) {
    const seccion = document.getElementById(`paad-section-${index + 1}`) as HTMLDetailsElement | null;
    if (!seccion) return;
    seccion.open = true;
    seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function update(updater: (draft: PaadData) => void) {
    setForm((prev) => {
      const draft = structuredClone(prev);
      updater(draft);
      return draft;
    });
    setSaved(false);
    setDirty(true);
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      try { await guardarBorradorPaad(paadId, form); setSaved(true); setDirty(false); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar.'); }
    });
  }

  const wrap = (path: string, node: React.ReactNode) => (
    <ObservationFieldWrapper
      paadAnualId={paadId}
      presentacionId={presentacionId}
      documentoTipo="PAAD"
      fieldPath={path}
      observaciones={obsFor(observaciones, paadId, path)}
      canObserve={canObserve}
      canResolve={canResolve}
    >
      {node}
    </ObservationFieldWrapper>
  );

  return (
    <SectionCard title="Completar el PAAD" className="border-blue-100/10 bg-[#0d1b32]/90 shadow-lg shadow-blue-950/15">
      <div className="-mt-2 rounded-xl border border-blue-200/10 bg-gradient-to-r from-[#10213d] to-[#0d1b32] p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div><h3 className="text-sm font-semibold text-white">Avance del formulario</h3><p className="mt-1 text-xs text-slate-400">Se actualiza mientras completás cada área.</p></div>
          <p className="text-sm font-semibold tabular-nums text-blue-100">{conContenido}<span className="font-normal text-slate-400"> / {secciones.length} áreas</span></p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-label="Avance del PAAD" aria-valuemin={0} aria-valuemax={secciones.length} aria-valuenow={conContenido}>
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-300" style={{ width: `${conContenido / secciones.length * 100}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
          {secciones.map((s, index) => <button key={s.nombre} type="button" onClick={() => irASeccion(index)} className="flex min-w-0 items-center gap-2 rounded-md py-1 text-left text-xs transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.completa ? 'bg-blue-300' : 'bg-slate-600'}`} />
            <span className={s.completa ? 'truncate text-slate-200' : 'truncate text-slate-500'}>{s.nombre}</span>
            <span className="sr-only">Ir a la sección {index + 1}</span>
          </button>)}
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-500">Es una referencia visual: las actividades que no correspondan pueden quedar vacías.</p>
      </div>

      <details id="paad-section-1" open className="group scroll-mt-6 rounded-xl border border-blue-100/10 bg-[#0b172b]/70 p-4 sm:p-5">
        <summary className="mb-4 flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
          <span><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-blue-300">Sección 1</span><span className="mt-1 block text-sm font-semibold text-white">Actividad de enseñanza</span><span className="mt-1 block text-xs text-slate-500">Cursos, capacitaciones y materiales producidos.</span></span>
          <span aria-hidden="true" className="mt-2 text-slate-500 transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="space-y-4">
        {wrap(
          'actividadEnsenanza.cursosAtendidos',
          <ListField
            label="Cursos y/o asignaturas atendidos"
            value={form.actividadEnsenanza.cursosAtendidos}
            disabled={!editable}
            onChange={(v) => update((d) => (d.actividadEnsenanza.cursosAtendidos = v))}
          />
        )}
        <RepeatableList
          label="Capacitaciones en las que participará"
          items={form.actividadEnsenanza.capacitaciones}
          disabled={!editable}
          newItem={() => ({ lugar: '', fecha: '', tematica: '', areaConocimiento: '', nombreCapacitacion: '' })}
          onChange={(items) => update((d) => (d.actividadEnsenanza.capacitaciones = items))}
          renderItem={(item, patch) => (
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Nombre" value={item.nombreCapacitacion} disabled={!editable} onChange={(v) => patch({ nombreCapacitacion: v })} />
              <TextField label="Temática" value={item.tematica} disabled={!editable} onChange={(v) => patch({ tematica: v })} />
              <TextField label="Área de conocimiento" value={item.areaConocimiento} disabled={!editable} onChange={(v) => patch({ areaConocimiento: v })} />
              <TextField label="Lugar" value={item.lugar} disabled={!editable} onChange={(v) => patch({ lugar: v })} />
              <TextField label="Fecha" value={item.fecha} disabled={!editable} onChange={(v) => patch({ fecha: v })} />
            </div>
          )}
        />
        <RepeatableList
          label="Manuales, guías de TP y programas elaborados"
          items={form.actividadEnsenanza.materialElaborado}
          disabled={!editable}
          newItem={() => ({ areaConocimiento: '', tipo: '', autores: '', fecha: '' })}
          onChange={(items) => update((d) => (d.actividadEnsenanza.materialElaborado = items))}
          renderItem={(item, patch) => (
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Área de conocimiento" value={item.areaConocimiento} disabled={!editable} onChange={(v) => patch({ areaConocimiento: v })} />
              <TextField label="Tipo" value={item.tipo} disabled={!editable} onChange={(v) => patch({ tipo: v })} />
              <TextField label="Autores" value={item.autores} disabled={!editable} onChange={(v) => patch({ autores: v })} />
              <TextField label="Fecha" value={item.fecha} disabled={!editable} onChange={(v) => patch({ fecha: v })} />
            </div>
          )}
        />
        <RepeatableList
          label="Otros trabajos de índole docente"
          items={form.actividadEnsenanza.otrosTrabajosDocentes}
          disabled={!editable}
          newItem={() => ({ areaTematica: '', lugar: '', fecha: '', destinatarios: '', nivel: '' })}
          onChange={(items) => update((d) => (d.actividadEnsenanza.otrosTrabajosDocentes = items))}
          renderItem={(item, patch) => (
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Área temática" value={item.areaTematica} disabled={!editable} onChange={(v) => patch({ areaTematica: v })} />
              <TextField label="Lugar" value={item.lugar} disabled={!editable} onChange={(v) => patch({ lugar: v })} />
              <TextField label="Fecha" value={item.fecha} disabled={!editable} onChange={(v) => patch({ fecha: v })} />
              <TextField label="Destinatarios" value={item.destinatarios} disabled={!editable} onChange={(v) => patch({ destinatarios: v })} />
              <TextField label="Nivel" value={item.nivel} disabled={!editable} onChange={(v) => patch({ nivel: v })} />
            </div>
          )}
        />
        </div>
      </details>

      <details id="paad-section-2" className="group scroll-mt-6 rounded-xl border border-blue-100/10 bg-[#0b172b]/70 p-4 sm:p-5">
        <summary className="mb-4 flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden"><span><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-blue-300">Sección 2</span><span className="mt-1 block text-sm font-semibold text-white">Actividades de investigación</span></span><span aria-hidden="true" className="mt-2 text-slate-500 transition-transform group-open:rotate-180">⌄</span></summary>
        <div className="space-y-4">
        <RepeatableList
          label="Proyectos de investigación"
          items={form.investigacion}
          disabled={!editable}
          newItem={() => ({ proyecto: '', descripcion: '', cargo: '', numeroResolucion: '', etapa: '' })}
          onChange={(items) => update((d) => (d.investigacion = items))}
          renderItem={(item, patch) => (
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Proyecto" value={item.proyecto} disabled={!editable} onChange={(v) => patch({ proyecto: v })} />
              <TextField label="Cargo que ocupa" value={item.cargo} disabled={!editable} onChange={(v) => patch({ cargo: v })} />
              <TextField label="N° de resolución" value={item.numeroResolucion} disabled={!editable} onChange={(v) => patch({ numeroResolucion: v })} />
              <TextField label="Etapa" value={item.etapa} disabled={!editable} onChange={(v) => patch({ etapa: v })} />
              <div className="col-span-2">
                <TextAreaField label="Descripción" rows={2} value={item.descripcion} disabled={!editable} onChange={(v) => patch({ descripcion: v })} />
              </div>
            </div>
          )}
        />
        </div>
      </details>

      <div className="grid gap-3 lg:grid-cols-2">
        <details id="paad-section-3" className="group scroll-mt-6 rounded-xl border border-blue-100/10 bg-[#0b172b]/70 p-4 sm:p-5"><summary className="mb-4 flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden"><span><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-blue-300">Sección 3</span><span className="mt-1 block text-sm font-semibold text-white">Formación de recursos humanos</span></span><span aria-hidden="true" className="mt-2 text-slate-500 transition-transform group-open:rotate-180">⌄</span></summary>
          {wrap('formacionRecursosHumanos.detalle', <TextAreaField label="Ayudantes, adscriptos y JTP a cargo" rows={3} value={form.formacionRecursosHumanos.detalle} disabled={!editable} onChange={(v) => update((d) => (d.formacionRecursosHumanos.detalle = v))} />)}
        </details>
        <details id="paad-section-4" className="group scroll-mt-6 rounded-xl border border-blue-100/10 bg-[#0b172b]/70 p-4 sm:p-5"><summary className="mb-4 flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden"><span><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-blue-300">Sección 4</span><span className="mt-1 block text-sm font-semibold text-white">Formación académica</span></span><span aria-hidden="true" className="mt-2 text-slate-500 transition-transform group-open:rotate-180">⌄</span></summary>
          {wrap('formacionAcademica.detalle', <TextAreaField label="Especialización y formación profesional" rows={3} value={form.formacionAcademica.detalle} disabled={!editable} onChange={(v) => update((d) => (d.formacionAcademica.detalle = v))} />)}
        </details>
      </div>

      <details id="paad-section-5" className="group scroll-mt-6 rounded-xl border border-blue-100/10 bg-[#0b172b]/70 p-4 sm:p-5">
        <summary className="mb-4 flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden"><span><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-blue-300">Sección 5</span><span className="mt-1 block text-sm font-semibold text-white">Actividades de extensión</span></span><span aria-hidden="true" className="mt-2 text-slate-500 transition-transform group-open:rotate-180">⌄</span></summary>
        <div className="space-y-4">
        <RepeatableList
          label="Proyectos de extensión"
          items={form.extension}
          disabled={!editable}
          newItem={() => ({ proyecto: '', destinatarios: '', tiempoLugar: '', alumnosInvolucrados: '', informe: '' })}
          onChange={(items) => update((d) => (d.extension = items))}
          renderItem={(item, patch) => (
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Proyecto" value={item.proyecto} disabled={!editable} onChange={(v) => patch({ proyecto: v })} />
              <TextField label="Destinatarios" value={item.destinatarios} disabled={!editable} onChange={(v) => patch({ destinatarios: v })} />
              <TextField label="Tiempo y lugar" value={item.tiempoLugar} disabled={!editable} onChange={(v) => patch({ tiempoLugar: v })} />
              <TextField label="Alumnos involucrados" value={item.alumnosInvolucrados} disabled={!editable} onChange={(v) => patch({ alumnosInvolucrados: v })} />
              <div className="col-span-2">
                <TextAreaField label="Informe de finalización" rows={2} value={item.informe} disabled={!editable} onChange={(v) => patch({ informe: v })} />
              </div>
            </div>
          )}
        />
        </div>
      </details>

      <details id="paad-section-6" className="group scroll-mt-6 rounded-xl border border-blue-100/10 bg-[#0b172b]/70 p-4 sm:p-5"><summary className="mb-4 flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden"><span><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-blue-300">Sección 6</span><span className="mt-1 block text-sm font-semibold text-white">Administración y gobierno universitario</span></span><span aria-hidden="true" className="mt-2 text-slate-500 transition-transform group-open:rotate-180">⌄</span></summary>
        {wrap('gestion.detalle', <TextAreaField label="Actividades realizadas o previstas" rows={3} value={form.gestion.detalle} disabled={!editable} onChange={(v) => update((d) => (d.gestion.detalle = v))} />)}
      </details>

      <details id="paad-section-7" className="group scroll-mt-6 rounded-xl border border-blue-100/10 bg-[#0b172b]/70 p-4 sm:p-5"><summary className="mb-4 flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden"><span><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-blue-300">Sección 7</span><span className="mt-1 block text-sm font-semibold text-white">Otras actividades</span></span><span aria-hidden="true" className="mt-2 text-slate-500 transition-transform group-open:rotate-180">⌄</span></summary>
        {wrap('otrasActividades', <ListField label="Actividades no previstas en las secciones anteriores" value={form.otrasActividades} disabled={!editable} onChange={(v) => update((d) => (d.otrasActividades = v))} />)}
      </details>

      <details id="paad-section-8" className="group scroll-mt-6 rounded-xl border border-blue-100/10 bg-[#0b172b]/70 p-4 sm:p-5"><summary className="mb-4 flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden"><span><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-blue-300">Sección 8</span><span className="mt-1 block text-sm font-semibold text-white">Distribución horaria semanal</span><span className="mt-1 block text-xs text-slate-500">Indicá los días y horarios dedicados a cada actividad.</span></span><span aria-hidden="true" className="mt-2 text-slate-500 transition-transform group-open:rotate-180">⌄</span></summary>
        <div className="overflow-x-auto rounded-lg border border-blue-100/10">
          <table className="w-full min-w-[720px] border-collapse text-xs">
            <thead>
              <tr className="bg-white/[0.04] text-slate-400">
                <th className="px-3 py-2.5 text-left font-medium">Actividad</th>
                {DIAS.map((dia) => (
                  <th key={dia} className="px-2 py-2.5 text-center font-medium">
                    {DIA_LABELS[dia]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.distribucionHoraria.map((fila, idx) => (
                <tr key={fila.actividad} className="border-t border-white/[0.07]">
                  <td className="px-3 py-2.5 font-medium text-slate-300">{ACTIVIDAD_LABELS[fila.actividad] ?? fila.actividad}</td>
                  {DIAS.map((dia) => (
                    <td key={dia} className="px-2 py-1.5">
                      <input
                        aria-label={`${ACTIVIDAD_LABELS[fila.actividad] ?? fila.actividad}, ${DIA_LABELS[dia]}`}
                        placeholder="—"
                        className="w-full min-w-20 text-center text-xs"
                        value={(fila as any)[dia] ?? ''}
                        disabled={!editable}
                        onChange={(e) =>
                          update((d) => {
                            (d.distribucionHoraria[idx] as any)[dia] = e.target.value;
                          })
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {editable && (
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-blue-100/10 bg-[#0b172b]/95 p-3 shadow-xl shadow-black/20 backdrop-blur sm:gap-3 sm:p-4">
          <button
            type="button"
            disabled={pending}
            onClick={handleSave}
            className="bg-primary hover:bg-primary-hover transition-colors text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {pending ? 'Guardando...' : 'Guardar borrador PAAD'}
          </button>
          {canPresent && <button type="button" disabled={pending || dirty} className="bg-success/80 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            onClick={() => startTransition(async () => {
              setError(null);
              try { await presentarPaad(paadId); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo presentar.'); }
            })}>Presentar PAAD</button>}
          {dirty && <span className="text-xs text-gray-400">Guardá los cambios antes de presentar.</span>}
          {saved && !pending && <span className="text-xs text-success">Guardado.</span>}
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </SectionCard>
  );
}
