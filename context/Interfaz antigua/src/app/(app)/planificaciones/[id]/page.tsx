import Link from 'next/link';
import { PAAD_LABELS } from '@/lib/paad';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { planificacionVisiblePara } from '@/lib/visibilidad';
import { hasRole } from '@/lib/roles';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusTimeline } from '@/components/StatusTimeline';
import { ViewToggle } from '@/components/ViewToggle';
import { PaacForm } from '@/components/forms/PaacForm';
import { PaacDocumentView } from '@/components/documents/PaacDocumentView';
import { InvitarDocenteForm } from '@/components/forms/InvitarDocenteForm';
import { GestionEquipoModal } from '@/components/admin/GestionEquipoModal';
import { AccionesPanel } from '@/components/forms/AccionesPanel';
import { InformePedagogicoPanel } from '@/components/forms/InformePedagogicoPanel';
import { InformeDisciplinarPanel } from '@/components/forms/InformeDisciplinarPanel';
import { InformeGeneralPanel } from '@/components/forms/InformeGeneralPanel';
import { ArchivoExpedientePanel } from '@/components/forms/ArchivoExpedientePanel';
import { PlanificacionTabs, type TabDef } from '@/components/PlanificacionTabs';
import { SectionCard } from '@/components/forms/fields';
import { permiteObservaciones } from '@/lib/observaciones';
import type { GeneralReportData, PedagogicalReportData, DisciplinaryReportData } from '@/types/planificacion';

export default async function PlanificacionDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const planif = await planificacionVisiblePara(session.user, params.id);
  if (!planif) notFound();

  const rol = session.user.rol;
  const esResponsable = planif.docenteResponsableId === session.user.id;
  const tieneObservacionesPendientes = planif.observaciones.some((observacion) => !observacion.resuelto);
  const estadoPermiteCorreccion =
    ['BORRADOR', 'OBSERVADO'].includes(planif.estado) || (tieneObservacionesPendientes && permiteObservaciones(planif.estado));
  const editablePaac = estadoPermiteCorreccion && (esResponsable || rol === UserRole.ADMINISTRADOR);
  const canObserve = hasRole(rol, [UserRole.UAP, UserRole.DIRECCION_CARRERA]) && permiteObservaciones(planif.estado);
  const canResolveObs = (esResponsable || rol === UserRole.ADMINISTRADOR) && planif.estado === 'OBSERVADO';

  const docentesDisponibles =
    esResponsable || rol === UserRole.ADMINISTRADOR
      ? await prisma.usuario.findMany({
          where: { rol: UserRole.DOCENTE, NOT: { id: { in: planif.integrantes.map((p) => p.docenteId) } } },
          orderBy: { apellido: 'asc' },
        })
      : [];

  const docentesDisponiblesAdmin =
    rol === UserRole.ADMINISTRADOR
      ? await prisma.usuario.findMany({
          where: { rol: UserRole.DOCENTE, NOT: { id: { in: planif.integrantes.map((p) => p.docenteId) } } },
          orderBy: { apellido: 'asc' },
        })
      : [];

  const pendientesPaac = planif.observaciones.filter((o) => o.documentoTipo === 'PAAC' && !o.resuelto).length;
  const paadsAnuales = await prisma.paadAnual.findMany({ where: { cicloLectivo: planif.cicloLectivo, docenteId: { in: planif.integrantes.map(p => p.docenteId) } }, include: { presentaciones: { select: { id: true } } } });

  const informePedagogico = planif.informePedagogico as unknown as PedagogicalReportData | null;
  const informeDisciplinar = planif.informeDisciplinar as unknown as DisciplinaryReportData | null;
  const informeGeneral = planif.informeGeneral as unknown as GeneralReportData | null;

  const equipoPaadResumen = planif.integrantes.map((p) => ({
    docenteId: p.docenteId,
    nombre: `${p.docente.nombre} ${p.docente.apellido}`,
    cargo: p.cargoEnCatedra,
    estado: paadsAnuales.find(a => a.docenteId === p.docenteId)?.presentaciones.length ? 'PRESENTO' : 'NO_PRESENTO',
  }));

  const tabs: TabDef[] = [
    {
      key: 'PAAC',
      label: 'PAAC',
      pendientes: pendientesPaac,
      content: (
        <ViewToggle
          form={
            <PaacForm
              planificacionId={planif.id}
              data={planif.datosPaac as any}
              enfoque={planif.asignatura.planEstudio.enfoque}
              editable={editablePaac}
              canObserve={canObserve}
              canResolve={canResolveObs}
              observaciones={planif.observaciones.filter((o) => o.documentoTipo === 'PAAC')}
              infoGeneral={{
                sede: planif.asignatura.planEstudio.carrera.sede.nombre,
                carrera: planif.asignatura.planEstudio.carrera.nombre,
                planEstudio: planif.asignatura.planEstudio.ordenanza,
                asignatura: planif.asignatura.nombre,
                curso: `${planif.asignatura.anoCursada}° año`,
                regimen: planif.asignatura.regimen,
                creditoHorario: planif.asignatura.creditoHorario,
                contenidosMinimos: planif.asignatura.contenidosMinimosOficiales,
                equipoCatedra: equipoPaadResumen.map((p) => ({ cargo: p.cargo, nombre: p.nombre })),
              }}
            />
          }
          document={<PaacDocumentView data={planif.datosPaac} enfoque={planif.asignatura.planEstudio.enfoque} />}
        />
      ),
    },
    {
      key: 'EQUIPO',
      label: 'Equipo y PAAD',
      content: (
        <SectionCard title="Presentación del PAAD anual por docente">
          <p className="text-sm text-gray-400 mb-4">El PAAD es personal. Su presentación no bloquea el envío ni la aprobación de este PAAC.</p>
          {(esResponsable || rol === UserRole.ADMINISTRADOR) && ['BORRADOR', 'OBSERVADO'].includes(planif.estado) &&
            <InvitarDocenteForm planificacionId={planif.id} docentes={docentesDisponibles} />}
          <div className="space-y-3 mt-4">
            {planif.integrantes.map(p => {
              const anual = paadsAnuales.find(a => a.docenteId === p.docenteId);
              return <div key={p.id} className="border border-border rounded-lg p-3 text-sm">
                <p>{p.docente.nombre} {p.docente.apellido} · {p.cargoEnCatedra}</p>
                <p className="text-gray-400">{anual?.presentaciones.length ? 'Presentado' : 'Pendiente de presentar'} · {anual ? PAAD_LABELS[anual.estado] : 'Sin PAAD habilitado'}</p>
                {anual && rol !== UserRole.CONSEJO_DEPARTAMENTAL &&
                  <Link className="text-primary" href={'/paads/' + anual.id}>Ver PAAD anual</Link>}
              </div>;
            })}
          </div>
        </SectionCard>
      ),
    },
    {
      key: 'PEDAGOGICO',
      label: 'Informe Pedagógico',
      content: (
        <InformePedagogicoPanel
          planificacionId={planif.id}
          estado={planif.estado}
          rol={rol}
          equipoPaad={equipoPaadResumen}
          informePedagogico={informePedagogico}
        />
      ),
    },
    {
      key: 'DISCIPLINAR',
      label: 'Informe Disciplinar',
      content: (
        <InformeDisciplinarPanel
          planificacionId={planif.id}
          estado={planif.estado}
          rol={rol}
          equipoPaad={equipoPaadResumen}
          informeDisciplinar={informeDisciplinar}
        />
      ),
    },
    {
      key: 'GENERAL',
      label: 'Informe General',
      content: (
        <InformeGeneralPanel planificacionId={planif.id} estado={planif.estado} rol={rol} informeGeneral={informeGeneral} />
      ),
    },
  ];

  return (
    <div className="max-w-4xl space-y-8 pb-16">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-white">{planif.asignatura.nombre}</h1>
          <StatusBadge estado={planif.estado} />
        </div>
        <p className="text-gray-400 text-sm mt-1">
          {planif.asignatura.planEstudio.carrera.nombre} &middot; Ciclo {planif.cicloLectivo} &middot;{' '}
          {planif.asignatura.planEstudio.ordenanza}
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Responsable: {planif.docenteResponsable.nombre} {planif.docenteResponsable.apellido}
        </p>
      </div>

      <div className="no-print">
        <StatusTimeline
          estado={planif.estado}
          pedagogicoFavorable={informePedagogico?.dictamen === 'FAVORABLE'}
          disciplinarFavorable={informeDisciplinar?.dictamen === 'CUMPLE'}
          numeroExpediente={planif.numeroExpediente}
          numeroResolucion={planif.numeroResolucion}
        />
      </div>

      {rol === UserRole.ADMINISTRADOR && (
        <div className="no-print flex justify-end">
          <GestionEquipoModal
            planificacionId={planif.id}
            docenteResponsableId={planif.docenteResponsableId}
            equipo={planif.integrantes.map((p) => ({
              paadId: p.id,
              docenteId: p.docenteId,
              nombre: `${p.docente.nombre} ${p.docente.apellido}`,
              cargo: p.cargoEnCatedra,
            }))}
            docentesDisponibles={docentesDisponiblesAdmin.map((d) => ({ id: d.id, nombre: `${d.nombre} ${d.apellido}` }))}
          />
        </div>
      )}

      <div className="no-print">
        <AccionesPanel
          planificacionId={planif.id}
          estado={planif.estado}
          rol={rol}
          esResponsable={esResponsable}
          informeGeneralListo={!!informeGeneral?.elaboradoPorUap && !!informeGeneral?.elaboradoPorDireccion}
          numeroExpediente={planif.numeroExpediente}
          numeroResolucion={planif.numeroResolucion}
        />
      </div>

      <ArchivoExpedientePanel planificacionId={planif.id} estado={planif.estado} />

      <PlanificacionTabs tabs={tabs} />

      <section className="no-print">
        <SectionCard title="Historial de Observaciones">
          <div className="space-y-2">
            {planif.observaciones.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2">
                <span className={o.resuelto ? 'text-gray-500 line-through' : 'text-gray-300'}>
                  <strong>[{o.rolAutor}]</strong> {o.documentoTipo} &middot; {o.campoPath}: {o.mensaje}
                </span>
                <span className={`text-xs ${o.resuelto ? 'text-success' : 'text-warning'}`}>
                  {o.resuelto ? 'Resuelto' : 'Pendiente'}
                </span>
              </div>
            ))}
            {planif.observaciones.length === 0 && <p className="text-sm text-gray-500">Sin observaciones registradas.</p>}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
