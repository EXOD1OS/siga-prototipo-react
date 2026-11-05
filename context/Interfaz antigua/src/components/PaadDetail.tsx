import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { carrerasPaad, paadVisible, PAAD_LABELS, PAAD_REVISABLES, type PaadActor } from '@/lib/paad';
import { PaadForm } from './forms/PaadForm';
import { PaadControls } from './forms/PaadControls';
import { PaadDocumentView } from './documents/PaadDocumentView';
import { ObservationFieldWrapper } from './ObservationFieldWrapper';
import { ViewToggle } from './ViewToggle';
import { notFound } from 'next/navigation';
import type { PaadData } from '@/types/planificacion';

export async function PaadDetail({ id, actor, showInstitutionalLogo = true }: { id: string; actor: PaadActor; showInstitutionalLogo?: boolean }) {
  const p = await paadVisible(prisma, actor, id).catch(() => null);
  if (!p) notFound();
  const propio = actor.rol === 'ADMINISTRADOR' || (actor.rol === 'DOCENTE' && actor.id === p.docenteId);
  const editable = propio && !p.conflictoMigracion && ['BORRADOR', 'OBSERVADO'].includes(p.estado);
  const revision = p.presentaciones[0];
  const revisor = actor.rol === 'UAP' || (actor.rol === 'DIRECCION_CARRERA' && !!actor.carreraId && actor.carreraId === p.carreraEvaluadoraId);
  const revisable = revisor && !p.conflictoMigracion && PAAD_REVISABLES.includes(p.estado);
  const carrerasIds = await carrerasPaad(prisma, p.docenteId, p.cicloLectivo);
  const carreras = actor.rol === 'ADMINISTRADOR' ? await prisma.carrera.findMany({
    where: carrerasIds.length ? { id: { in: carrerasIds } } : {}, select: { id: true, nombre: true }, orderBy: { nombre: 'asc' },
  }) : [];
  const copias = await prisma.paadDocente.findMany({ where: { docenteId: p.docenteId, planificacion: { cicloLectivo: p.cicloLectivo } },
    include: { planificacion: { select: { id: true, asignatura: { select: { nombre: true } } } } }, orderBy: { updatedAt: 'desc' } });
  const obsLegacy = copias.length ? await prisma.itemObservacion.findMany({
    where: { documentoTipo: 'PAAD', planificacionId: { in: copias.map(c => c.planificacionId) } }, orderBy: { createdAt: 'asc' },
  }) : [];
  const nombre = p.docente.nombre + ' ' + p.docente.apellido;
  const data = p.datosPaad as unknown as PaadData;
  const pendientes = p.observaciones.filter(o => !o.resuelto).length;
  const etiquetaEstado: Record<string, string> = {
    BORRADOR: 'En preparación', ENVIADO_A_REVISION: 'En revisión', OBSERVADO: 'Requiere ajustes',
    APROBADO_UAP: 'Aprobado por UAP', APROBADO_DIRECCION: 'Aprobado por Dirección', APROBADO: 'Aprobado',
  };
  const colorEstado: Record<string, string> = {
    BORRADOR: 'text-slate-300', ENVIADO_A_REVISION: 'text-blue-200', OBSERVADO: 'text-amber-200',
    APROBADO_UAP: 'text-blue-200', APROBADO_DIRECCION: 'text-indigo-200', APROBADO: 'text-emerald-200',
  };
  return <div className="mx-auto w-full max-w-[1440px] space-y-5 pb-12 sm:space-y-6">
    <header className="flex flex-col justify-between gap-4 border-l-2 border-[#c65c22] py-1 pl-4 sm:flex-row sm:items-center sm:pl-5">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">Plan anual · Ciclo lectivo {p.cicloLectivo}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">{nombre}</h2>
        <p className="mt-1 text-sm text-slate-300">Tu actividad docente, reunida en un solo documento anual.</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className={`flex items-center gap-2 text-sm font-medium ${colorEstado[p.estado] ?? colorEstado.BORRADOR}`}><span aria-hidden="true" className={`h-2 w-2 rounded-full ${p.estado === 'OBSERVADO' ? 'bg-amber-300' : p.estado === 'APROBADO' ? 'bg-emerald-300' : p.estado === 'BORRADOR' ? 'bg-slate-400' : 'bg-blue-300'}`} />{etiquetaEstado[p.estado] ?? PAAD_LABELS[p.estado]}</p>
          <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" aria-hidden="true" />
          <p className="text-xs text-slate-500">Actualizado <time dateTime={p.updatedAt.toISOString()}>{p.updatedAt.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}</time></p>
        </div>
      </div>
      {showInstitutionalLogo && <div className="flex w-fit items-center self-start sm:self-auto">
        <Image src="/unlar-logo.png" alt="Universidad Nacional de La Rioja" width={311} height={104} className="h-auto w-48 object-contain sm:w-52" />
      </div>}
    </header>

    <section aria-label="Seguimiento del PAAD" className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#0d1b32]/90 p-4 shadow-md shadow-blue-950/10">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dirección responsable</p>
          <p className="mt-2 text-sm font-medium text-slate-200">{p.carreraEvaluadora?.nombre ?? 'Pendiente de asignación'}</p>
          {!p.carreraEvaluadoraId && <p className="mt-1 text-xs leading-5 text-slate-500">Administración debe asignarla antes de que puedas presentar el PAAD.</p>}
        </div>
        <div className={`rounded-xl border p-4 shadow-md shadow-blue-950/10 ${pendientes ? 'border-amber-300/20 bg-amber-300/[0.05]' : 'border-white/10 bg-[#0d1b32]/90'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Observaciones pendientes</p>
          <p className={`mt-2 text-sm font-semibold ${pendientes ? 'text-amber-200' : 'text-slate-200'}`}>{pendientes ? `${pendientes} para resolver` : 'Ninguna'}</p>
          <p className="mt-1 text-xs text-slate-500">{pendientes ? 'Revisá los comentarios y marcá cada corrección como resuelta.' : 'No hay correcciones abiertas para este PAAD.'}</p>
        </div>
    </section>

    {p.conflictoMigracion && <p className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-100">Administración debe resolver las copias anteriores. El formulario y la presentación están bloqueados.</p>}
    <PaadControls key={p.id + ':' + (revision?.id ?? '') + ':' + (p.fuenteLegacyId ?? '')} paadId={p.id} presentacionId={revision?.id}
      canReview={revisable && !revision?.dictamenes.some(d => d.rolAutor === actor.rol)}
      canAssign={actor.rol === 'ADMINISTRADOR' && p.estado === 'BORRADOR' && !p.presentaciones.length}
      carreraId={p.carreraEvaluadoraId} carreras={carreras}
      fuentes={actor.rol === 'ADMINISTRADOR' && p.conflictoMigracion ? copias.map(c => ({ id: c.id,
        nombre: c.planificacion.asignatura.nombre + ' · ' + c.updatedAt.toLocaleDateString('es-AR') + ' · ' + c.estadoPresento })) : []} />
    <ViewToggle form={<PaadForm key={p.id + ':' + (revision?.numero ?? 0) + ':' + (p.fuenteLegacyId ?? '')} paadId={p.id} presentacionId={revision?.id}
      canPresent={editable && !!p.carreraEvaluadoraId && !p.observaciones.some(o => !o.resuelto)}
      data={data} editable={editable} canObserve={revisable}
      canResolve={propio && !p.conflictoMigracion && p.estado === 'OBSERVADO'} observaciones={p.observaciones} />}
      document={<PaadDocumentView data={p.datosPaad as unknown as PaadData} docenteNombre={nombre} cargo={'Ciclo ' + p.cicloLectivo} />} />
    <section className="space-y-3 rounded-xl border border-white/10 bg-[#0d1b32]/90 p-4 shadow-md shadow-blue-950/10 sm:p-5"><div><p className="text-xs font-medium text-blue-300">Seguimiento</p><h2 className="mt-1 text-base font-semibold text-white">Historial de observaciones</h2></div>
      {p.observaciones.map(o => <div key={o.id} className="border border-border rounded-lg p-3">
        <p className="text-xs text-gray-500">{o.rolAutor} · {o.autor.nombre} {o.autor.apellido} · {o.createdAt.toLocaleString('es-AR')} · {o.campoPath}</p>
        <ObservationFieldWrapper paadAnualId={p.id} presentacionId={revision?.id} documentoTipo="PAAD" fieldPath={o.campoPath}
          observaciones={[o]} canResolve={propio && p.estado === 'OBSERVADO' && !p.conflictoMigracion}>
          <p>{o.resuelto ? 'Resuelto: ' + o.mensaje : 'Pendiente'}</p>
        </ObservationFieldWrapper>
      </div>)}
      {!p.observaciones.length && <p className="text-gray-500">Sin observaciones.</p>}
    </section>
    <section className="space-y-3 rounded-xl border border-white/10 bg-[#0d1b32]/90 p-4 shadow-md shadow-blue-950/10 sm:p-5"><div><p className="text-xs font-medium text-blue-300">Trazabilidad</p><h2 className="mt-1 text-base font-semibold text-white">Presentaciones y dictámenes</h2></div>
      {p.presentaciones.map(r => <details key={r.id} className="border border-border rounded-lg p-3">
        <summary>Presentación {r.numero} · {r.createdAt.toLocaleString('es-AR')}</summary>
        <p className="text-sm my-2">{r.autor ? 'Presentada por ' + r.autor.nombre + ' ' + r.autor.apellido + ' · ' + r.rolAutor : 'Presentación importada: autor de presentación no registrado en el sistema anterior.'}</p>
        {r.dictamenes.map(d => <p key={d.id} className="text-sm my-2">{d.rolAutor} · {d.autor.nombre} {d.autor.apellido} · {d.createdAt.toLocaleString('es-AR')} · {d.resultado}: {d.comentario}</p>)}
        <PaadDocumentView data={r.datosPaad as unknown as PaadData} docenteNombre={nombre} cargo={'Presentación ' + r.numero} />
      </details>)}
    </section>
    {copias.length > 0 && <section><h2 className="text-lg mb-3">Antecedentes por materia (solo lectura)</h2>
      {copias.map(c => <details key={c.id} className="border border-border rounded-lg p-3 mb-2">
        <summary>{c.planificacion.asignatura.nombre} · {c.estadoPresento} {p.fuenteLegacyId === c.id ? '· Fuente elegida' : ''}</summary>
        <PaadDocumentView data={c.datosPaad as unknown as PaadData} docenteNombre={nombre} cargo={c.cargoEnCatedra} />
        {obsLegacy.filter(o => o.docentePaadId === c.id || (o.docentePaadId === null && o.planificacionId === c.planificacionId)).map(o =>
          <p key={o.id} className="text-sm">{o.rolAutor} · {o.createdAt.toLocaleString('es-AR')} · {o.mensaje} · {o.resuelto ? 'Resuelto' : 'Pendiente en la copia antigua'}</p>)}
      </details>)}
    </section>}
  </div>;
}
