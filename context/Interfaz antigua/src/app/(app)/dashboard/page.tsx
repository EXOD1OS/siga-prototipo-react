import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ROL_LABELS, ESTADO_LABELS } from '@/types/planificacion';
import { planificacionesVisiblesPara } from '@/lib/visibilidad';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage({ searchParams }: { searchParams?: { ciclo?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const planificaciones = await planificacionesVisiblesPara(session.user);
  const ciclos = Array.from(new Set([new Date().getFullYear(), ...planificaciones.map((p) => p.cicloLectivo)])).sort((a, b) => b - a);
  const cicloSolicitado = Number(searchParams?.ciclo);
  const cicloActual = ciclos.includes(cicloSolicitado) ? cicloSolicitado : new Date().getFullYear();
  const planifCicloActual = planificaciones.filter((p) => p.cicloLectivo === cicloActual);

  const porEstado: Record<string, number> = {};
  for (const p of planifCicloActual) {
    porEstado[p.estado] = (porEstado[p.estado] ?? 0) + 1;
  }

  let pendientesUap: UapPendingWork | undefined;
  if (session.user.rol === 'UAP') {
    const [paadsEnRevision, planificacionesEnRevision] = await Promise.all([
      prisma.paadAnual.findMany({
        where: { cicloLectivo: cicloActual, estado: { in: ['ENVIADO_A_REVISION', 'APROBADO_DIRECCION'] } },
        include: {
          docente: { select: { nombre: true, apellido: true } },
          carreraEvaluadora: { select: { nombre: true } },
          presentaciones: {
            orderBy: { numero: 'desc' },
            take: 1,
            select: { numero: true, dictamenes: { select: { rolAutor: true } } },
          },
        },
        orderBy: { updatedAt: 'asc' },
      }),
      Promise.resolve(planifCicloActual
        .filter((p) => p.estado === 'ENVIADO_A_REVISION')
        .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())),
    ]);

    const paadsPendientes = paadsEnRevision.filter((p) =>
      p.presentaciones[0] && !p.presentaciones[0].dictamenes.some((d) => d.rolAutor === 'UAP')
    );
    pendientesUap = {
      planificaciones: planificacionesEnRevision.slice(0, 4),
      planificacionesTotal: planificacionesEnRevision.length,
      paads: paadsPendientes.slice(0, 4),
      paadsTotal: paadsPendientes.length,
    };
  }

  if (session.user.rol === 'ADMINISTRADOR') {
    return <AdminDashboard
      nombre={session.user.name ?? 'Administrador'}
      ciclo={cicloActual}
      ciclos={ciclos}
      planifCicloActual={planifCicloActual.length}
      porEstado={porEstado}
      recientes={planifCicloActual.slice(0, 6)}
    />;
  }

  const paadPersonal = session.user.rol === 'DOCENTE'
    ? await prisma.paadAnual.findUnique({
        where: { docenteId_cicloLectivo: { docenteId: session.user.id, cicloLectivo: cicloActual } },
        select: {
          id: true,
          estado: true,
          conflictoMigracion: true,
          observaciones: { where: { resuelto: false }, select: { id: true } },
        },
      })
    : undefined;

  return <UsuarioDashboard
    nombre={session.user.name ?? 'Usuario'}
    rol={session.user.rol}
    ciclo={cicloActual}
    ciclos={ciclos}
    planificacionesCiclo={planifCicloActual}
    recientes={planifCicloActual.slice(0, 6)}
    porEstado={porEstado}
    pendientesUap={pendientesUap}
    paadPersonal={paadPersonal}
  />;
}

type VisiblePlanificacion = Awaited<ReturnType<typeof planificacionesVisiblesPara>>[number];
type UapPendingWork = {
  planificaciones: VisiblePlanificacion[];
  planificacionesTotal: number;
  paads: {
    id: string;
    updatedAt: Date;
    docente: { nombre: string; apellido: string };
    carreraEvaluadora: { nombre: string } | null;
    presentaciones: { numero: number }[];
  }[];
  paadsTotal: number;
};
type PersonalPaadStatus = {
  id: string;
  estado: string;
  conflictoMigracion: boolean;
  observaciones: { id: string }[];
} | null;

function UsuarioDashboard({
  nombre,
  rol,
  ciclo,
  ciclos,
  planificacionesCiclo,
  recientes,
  porEstado,
  pendientesUap,
  paadPersonal,
}: {
  nombre: string;
  rol: string;
  ciclo: number;
  ciclos: number[];
  planificacionesCiclo: VisiblePlanificacion[];
  recientes: VisiblePlanificacion[];
  porEstado: Record<string, number>;
  pendientesUap?: UapPendingWork;
  paadPersonal?: PersonalPaadStatus;
}) {
  const total = planificacionesCiclo.length;

  const metricas = Object.entries(ESTADO_LABELS).map(([estado, label]) => ({
    estado,
    label,
    value: porEstado[estado] ?? 0,
    porcentaje: total ? Math.round(((porEstado[estado] ?? 0) / total) * 100) : 0,
  }));

  return (
    <div className="relative isolate -mx-4 -my-5 min-h-screen overflow-hidden bg-[#071326] px-4 py-6 text-slate-200 sm:-mx-6 sm:-my-7 sm:px-6 sm:py-8 xl:-mx-8 xl:-my-8 xl:px-10 xl:py-9">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-40 h-[520px] w-[620px] rounded-full bg-blue-600/15 blur-[130px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 left-[28%] h-[360px] w-[520px] rounded-full bg-indigo-700/10 blur-[120px]" />
      <div className="relative mx-auto w-full max-w-[1440px] space-y-6 sm:space-y-7">
        <header className="relative flex min-h-[150px] flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-blue-200/10 bg-gradient-to-r from-[#10213d] via-[#0d1b32] to-[#101a38] p-5 shadow-lg shadow-blue-950/20 sm:flex-row sm:items-center sm:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-28 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">UNLaR · {ROL_LABELS[rol] ?? rol}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Inicio</h1>
            <p className="mt-1 text-sm text-slate-300">Hola, {nombre}. Este es el resumen de tus planificaciones.</p>
          </div>
          <div className="relative flex w-fit items-center self-start rounded-xl border border-white/10 bg-[#071326]/35 px-5 py-4 shadow-lg backdrop-blur-sm sm:self-auto">
            <Image src="/unlar-logo.png" alt="Universidad Nacional de La Rioja" width={311} height={104} priority className="h-auto w-52 object-contain sm:w-60" />
          </div>
        </header>

        <CicloSelector ciclo={ciclo} ciclos={ciclos} />

        {rol === 'UAP' && pendientesUap && <UapPendingPanel pendientes={pendientesUap} ciclo={ciclo} />}
        {rol === 'DOCENTE' && paadPersonal !== undefined && <PersonalPaadCard paad={paadPersonal} ciclo={ciclo} />}

        <section aria-label={`Resumen de planificaciones del ciclo ${ciclo}`} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {metricas.map((metrica) => (
            <Link key={metrica.label} href={`/planificaciones?estado=${metrica.estado}`} aria-label={`Ver planificaciones: ${metrica.label}`} className="group relative flex min-h-[88px] items-center gap-3 overflow-hidden rounded-xl border border-blue-100/10 bg-gradient-to-r from-[#12233e] to-[#0b172b] px-3.5 py-3 shadow-md shadow-blue-950/15 transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/30 hover:shadow-lg hover:shadow-blue-950/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:min-h-[94px] sm:gap-4 sm:px-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200/10 bg-blue-400/[0.08] text-blue-200 transition-colors group-hover:bg-blue-400/[0.14]"><DashboardMetricIcon estado={metrica.estado} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium leading-4 text-slate-300 sm:text-sm">{metrica.label}</span>
                <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/[0.06]"><span className="block h-full rounded-full bg-blue-400 transition-all" style={{ width: `${metrica.porcentaje}%` }} /></span>
              </span>
              <span className="shrink-0 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">{metrica.value}</span>
              <span aria-hidden="true" className="shrink-0 text-slate-600 transition-colors group-hover:text-blue-300">→</span>
            </Link>
          ))}
        </section>

        <section aria-labelledby="mis-recientes-heading" className="flex min-w-0 flex-col">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-blue-300">Ciclo lectivo {ciclo}</p>
                <h2 id="mis-recientes-heading" className="mt-1 text-lg font-semibold text-white">Planificaciones recientes</h2>
              </div>
              <Link href="/planificaciones" className="shrink-0 rounded-md border border-blue-300/25 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-200 transition-colors hover:border-blue-300/50 hover:bg-blue-500/20 sm:text-sm">Ver todas</Link>
            </div>
            <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#0d1b32]/90 shadow-lg shadow-blue-950/20">
              <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(90px,0.7fr)_minmax(90px,0.7fr)_auto] gap-4 border-b border-white/[0.08] bg-white/[0.04] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
                <span>Asignatura</span><span className="text-center">Carrera</span><span className="text-center">Ciclo lectivo</span><span className="text-center">Estado</span>
              </div>
              {recientes.map((p) => (
                <Link key={p.id} href={`/planificaciones/${p.id}`} className="group grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-white/[0.06] px-4 py-3.5 transition-colors hover:bg-blue-400/[0.06] last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(90px,0.7fr)_minmax(90px,0.7fr)_auto] sm:gap-4 sm:px-5">
                  <span className="min-w-0 truncate text-sm font-medium text-slate-200 transition-colors group-hover:text-white">{p.asignatura.nombre}<span className="mt-1 block truncate text-[11px] font-normal text-slate-500">Actualizada {p.updatedAt.toLocaleDateString('es-AR')}</span></span>
                  <span className="hidden text-center text-sm text-slate-400 sm:block">{p.asignatura.planEstudio.carrera.codigo}</span>
                  <span className="hidden text-center text-sm text-slate-400 sm:block">{p.cicloLectivo}</span>
                  <span className="justify-self-center"><DashboardStatusBadge estado={p.estado} /></span>
                  <span className="col-span-2 truncate text-xs text-slate-500 sm:hidden">Ciclo {p.cicloLectivo} · {p.asignatura.planEstudio.carrera.codigo}</span>
                </Link>
              ))}
              {recientes.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">Todavía no hay planificaciones para mostrar.</p>}
            </div>
        </section>
      </div>
    </div>
  );
}

function PersonalPaadCard({ paad, ciclo }: { paad: PersonalPaadStatus; ciclo: number }) {
  const tieneObservaciones = (paad?.observaciones.length ?? 0) > 0;
  const statusCopy: Record<string, { title: string; detail: string; action: string }> = {
    BORRADOR: { title: 'Tu PAAD está en preparación', detail: 'Completá las actividades del ciclo y presentalo para iniciar la revisión.', action: 'Completar PAAD' },
    OBSERVADO: { title: 'Tu PAAD necesita correcciones', detail: tieneObservaciones ? `Tenés ${paad?.observaciones.length} observaciones pendientes para resolver.` : 'Revisá las observaciones y corregí el documento antes de volver a presentarlo.', action: 'Resolver observaciones' },
    ENVIADO_A_REVISION: { title: 'Tu PAAD está en revisión', detail: 'Ya fue presentado. Podés consultar el documento y seguir su estado.', action: 'Ver mi PAAD' },
    APROBADO_UAP: { title: 'Dictamen UAP registrado', detail: 'El PAAD continúa el circuito con la Dirección de Carrera.', action: 'Ver seguimiento' },
    APROBADO_DIRECCION: { title: 'Dictamen de Dirección registrado', detail: 'El PAAD continúa el circuito con la UAP.', action: 'Ver seguimiento' },
    APROBADO: { title: 'Tu PAAD tiene ambos dictámenes', detail: 'El circuito de revisión del ciclo está completo.', action: 'Ver mi PAAD' },
  };
  const copy = !paad
    ? { title: 'Tu PAAD todavía no está habilitado', detail: 'Cuando Administración genere el documento para este ciclo, lo vas a encontrar acá.', action: 'Consultar Mi PAAD' }
    : paad.conflictoMigracion
      ? { title: 'Tu PAAD requiere asistencia', detail: 'Administración debe resolver un conflicto del documento antes de que puedas continuar.', action: 'Ver Mi PAAD' }
      : statusCopy[paad.estado] ?? { title: 'Consultá el estado de tu PAAD', detail: 'Abrí el documento para ver el seguimiento del ciclo.', action: 'Ver Mi PAAD' };
  const statusBadges: Record<string, string> = {
    BORRADOR: 'En preparación', ENVIADO_A_REVISION: 'En revisión', OBSERVADO: 'Observado',
    APROBADO_UAP: 'Aprobado por UAP', APROBADO_DIRECCION: 'Aprobado por Dirección', APROBADO: 'Aprobado',
  };
  const badge = paad?.conflictoMigracion ? 'Requiere asistencia' : paad ? (statusBadges[paad.estado] ?? 'En seguimiento') : 'No iniciado';

  return (
    <section aria-labelledby="mi-paad-inicio" className="flex flex-col gap-4 rounded-xl border border-blue-100/10 bg-gradient-to-r from-[#12233e] to-[#0b172b] p-4 shadow-md shadow-blue-950/15 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="mi-paad-inicio" className="text-sm font-semibold text-white">Mi PAAD · {ciclo}</h2>
          <span className="rounded-md border border-blue-200/10 bg-blue-400/[0.08] px-2 py-1 text-[10px] font-medium text-blue-100">{badge}</span>
        </div>
        <p className="mt-2 text-sm font-medium text-slate-200">{copy.title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">{copy.detail}</p>
      </div>
      <Link href={`/mi-paad?ciclo=${ciclo}`} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-blue-300/20 bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-100 transition hover:border-blue-300/40 hover:bg-blue-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
        {copy.action} <span aria-hidden="true" className="ml-2">→</span>
      </Link>
    </section>
  );
}

function UapPendingPanel({ pendientes, ciclo }: { pendientes: UapPendingWork; ciclo: number }) {
  return (
    <section aria-labelledby="uap-pendientes-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2 px-1">
        <div>
          <p className="text-xs font-medium text-blue-300">Gabinete UAP · Ciclo {ciclo}</p>
          <h2 id="uap-pendientes-heading" className="mt-1 text-lg font-semibold text-white">Pendientes de revisión</h2>
        </div>
        <p className="text-xs text-slate-400">Documentos que esperan una acción del gabinete</p>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <PendingReviewCard
          title="Planificaciones pedagógicas"
          total={pendientes.planificacionesTotal}
          empty="No hay planificaciones pendientes de revisión pedagógica."
          moreHref="/planificaciones?estado=ENVIADO_A_REVISION"
        >
          {pendientes.planificaciones.map((p) => (
            <Link key={p.id} href={`/planificaciones/${p.id}`} className="group flex min-w-0 items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3 transition-colors first:border-t-0 hover:bg-blue-400/[0.06]">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-200 group-hover:text-white">{p.asignatura.nombre}</span>
                <span className="mt-1 block truncate text-xs text-slate-500">{p.asignatura.planEstudio.carrera.codigo} · {p.docenteResponsable.nombre} {p.docenteResponsable.apellido} · Actualizada {p.updatedAt.toLocaleDateString('es-AR')}</span>
              </span>
              <span className="shrink-0 text-xs font-medium text-blue-200">Revisar →</span>
            </Link>
          ))}
        </PendingReviewCard>

        <PendingReviewCard
          title="PAAD anuales para dictamen UAP"
          total={pendientes.paadsTotal}
          empty="No hay PAAD pendientes de dictamen UAP."
          moreHref={`/paads?ciclo=${ciclo}`}
        >
          {pendientes.paads.map((p) => (
            <Link key={p.id} href={`/paads/${p.id}`} className="group flex min-w-0 items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3 transition-colors first:border-t-0 hover:bg-blue-400/[0.06]">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-200 group-hover:text-white">{p.docente.nombre} {p.docente.apellido}</span>
                <span className="mt-1 block truncate text-xs text-slate-500">{p.carreraEvaluadora?.nombre ?? 'Dirección pendiente'} · Presentación {p.presentaciones[0]?.numero ?? '—'} · Actualizado {p.updatedAt.toLocaleDateString('es-AR')}</span>
              </span>
              <span className="shrink-0 text-xs font-medium text-blue-200">Revisar →</span>
            </Link>
          ))}
        </PendingReviewCard>
      </div>
    </section>
  );
}

function PendingReviewCard({ title, total, empty, moreHref, children }: {
  title: string;
  total: number;
  empty: string;
  moreHref: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-blue-100/10 bg-[#0d1b32]/90 shadow-md shadow-blue-950/15">
      <div className="flex items-center justify-between gap-3 bg-white/[0.035] px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <span className="rounded-md border border-blue-200/10 bg-blue-400/[0.08] px-2 py-1 text-xs font-semibold tabular-nums text-blue-100">{total}</span>
      </div>
      {total === 0 ? <p className="px-4 py-5 text-sm text-slate-500">{empty}</p> : <div>{children}</div>}
      {total > 4 && <Link href={moreHref} className="block border-t border-white/[0.07] px-4 py-2.5 text-xs font-medium text-blue-200 transition-colors hover:bg-blue-400/[0.06]">Ver los {total} pendientes →</Link>}
    </div>
  );
}

function DashboardMetricIcon({ estado }: { estado?: string }) {
  if (estado === 'OBSERVADO') return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7"><path d="m12 3 9 17H3L12 3Z" /><path d="M12 9v5m0 3h.01" /></svg>;
  if (estado) return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7"><path d="M7 3.75h7l4.25 4.5v12A1.75 1.75 0 0 1 16.5 22h-9A1.75 1.75 0 0 1 5.75 20.25V5.5A1.75 1.75 0 0 1 7.5 3.75Z" /><path d="M14 4v5h4M9 13h6M9 17h6" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>;
}

function CicloSelector({ ciclo, ciclos }: { ciclo: number; ciclos: number[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-blue-100/10 bg-[#0d1b32]/85 p-3.5 shadow-md shadow-blue-950/10 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div>
        <p className="text-sm font-medium text-slate-200">Resumen del ciclo lectivo {ciclo}</p>
        <p className="mt-0.5 text-xs text-slate-500">Elegí otro año para actualizar los datos de Inicio.</p>
      </div>
      <form method="get" className="flex items-center gap-2">
        <label htmlFor="dashboard-ciclo" className="sr-only">Ciclo lectivo</label>
        <select id="dashboard-ciclo" name="ciclo" defaultValue={ciclo} className="min-h-10 min-w-28 rounded-lg border border-blue-100/10 bg-[#09172b] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-300/40 focus:ring-2 focus:ring-blue-400/10">
          {ciclos.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
        </select>
        <button type="submit" className="min-h-10 rounded-lg border border-blue-300/20 bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-100 transition hover:border-blue-300/40 hover:bg-blue-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Ver ciclo</button>
      </form>
    </div>
  );
}

function AdminDashboard({
  nombre,
  ciclo,
  ciclos,
  planifCicloActual,
  porEstado,
  recientes,
}: {
  nombre: string;
  ciclo: number;
  ciclos: number[];
  planifCicloActual: number;
  porEstado: Record<string, number>;
  recientes: VisiblePlanificacion[];
}) {
  const metricas = [
    { label: 'Planificaciones del ciclo', value: planifCicloActual, detail: `Ciclo lectivo ${ciclo}`, icon: 'grid' as const, href: '/planificaciones' },
    { label: 'En borrador', value: porEstado.BORRADOR ?? 0, detail: 'Pendientes de completar', icon: 'file' as const, href: '/planificaciones?estado=BORRADOR' },
    { label: 'En revisión', value: porEstado.ENVIADO_A_REVISION ?? 0, detail: 'En evaluación académica', icon: 'review' as const, href: '/planificaciones?estado=ENVIADO_A_REVISION' },
    { label: 'Observadas', value: porEstado.OBSERVADO ?? 0, detail: 'Requieren seguimiento', icon: 'alert' as const, href: '/planificaciones?estado=OBSERVADO' },
  ];

  const estadosCiclo = [
    { label: 'En borrador', value: porEstado.BORRADOR ?? 0, color: '#5796ff' },
    { label: 'En revisión', value: porEstado.ENVIADO_A_REVISION ?? 0, color: '#61c7e8' },
    { label: 'Aprobadas / elevadas', value: (porEstado.APROBADO_PEDAGOGICO ?? 0) + (porEstado.APROBADO_DISCIPLINAR ?? 0) + (porEstado.APROBADO_PLENO ?? 0) + (porEstado.ELEVADO_AL_CONSEJO ?? 0), color: '#8b82f6' },
    { label: 'Finalizadas', value: porEstado.FINALIZADO ?? 0, color: '#a9bff7' },
    { label: 'Observadas', value: porEstado.OBSERVADO ?? 0, color: '#7885a6' },
  ] as const;
  const totalEstados = estadosCiclo.reduce((total, estado) => total + estado.value, 0);
  const borradores = porEstado.BORRADOR ?? 0;
  const observadas = porEstado.OBSERVADO ?? 0;
  const enRevision = porEstado.ENVIADO_A_REVISION ?? 0;
  const lecturaEstado = planifCicloActual === 0
    ? 'Todavía no hay planificaciones registradas para este ciclo.'
    : borradores === planifCicloActual
      ? `Las ${planifCicloActual} planificaciones están en borrador. Revisá el listado para seguir su avance.`
      : observadas > 0
        ? `Hay ${observadas} planificaciones observadas que requieren seguimiento.`
        : enRevision > 0
          ? `Hay ${enRevision} planificaciones en revisión. Podés consultar el listado para seguir su evaluación.`
          : 'Las planificaciones ya comenzaron a avanzar por las etapas de aprobación.';
  let anguloAcumulado = 0;
  const segmentos = estadosCiclo.map((estado) => {
    const inicio = anguloAcumulado;
    anguloAcumulado += totalEstados ? (estado.value / totalEstados) * 360 : 0;
    return `${estado.color} ${inicio}deg ${anguloAcumulado}deg`;
  });
  const graficoEstados = totalEstados
    ? `conic-gradient(${segmentos.join(', ')})`
    : 'conic-gradient(#243550 0deg 360deg)';

  return (
    <div className="relative isolate -mx-4 -my-5 min-h-screen overflow-hidden bg-[#071326] px-4 py-6 text-slate-200 sm:-mx-6 sm:-my-7 sm:px-6 sm:py-8 xl:-mx-8 xl:-my-8 xl:px-10 xl:py-9">
    <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-40 h-[520px] w-[620px] rounded-full bg-blue-600/15 blur-[130px]" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 left-[28%] h-[360px] w-[520px] rounded-full bg-indigo-700/10 blur-[120px]" />
    <div className="relative mx-auto w-full max-w-[1440px] space-y-6 sm:space-y-7">
      <header className="relative flex min-h-[170px] flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-blue-200/10 bg-gradient-to-r from-[#10213d] via-[#0d1b32] to-[#101a38] p-5 shadow-lg shadow-blue-950/20 sm:flex-row sm:items-center sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-28 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">Administración · Ciclo lectivo {ciclo}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Inicio</h1>
          <p className="mt-1 text-sm text-slate-300">Hola, {nombre}. Este es el resumen de actividad de tu unidad.</p>
        </div>
        <div className="relative flex w-fit items-center self-start rounded-xl border border-white/10 bg-[#071326]/35 px-5 py-4 shadow-lg backdrop-blur-sm sm:self-auto">
          <Image src="/unlar-logo.png" alt="Universidad Nacional de La Rioja" width={311} height={104} priority className="h-auto w-52 object-contain sm:w-60" />
        </div>
      </header>

      <CicloSelector ciclo={ciclo} ciclos={ciclos} />

      <section aria-label={`Resumen del ciclo lectivo ${ciclo}`} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        {metricas.map((metrica) => (
          <Link key={metrica.label} href={metrica.href} aria-label={`Ver planificaciones: ${metrica.label}`} className="group relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-2xl border border-blue-100/10 bg-gradient-to-br from-[#12233e] to-[#0b172b] p-5 shadow-lg shadow-blue-950/20 transition duration-200 hover:-translate-y-1 hover:border-blue-300/30 hover:shadow-xl hover:shadow-blue-950/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:p-5">
            <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border border-blue-200/[0.06] transition-transform duration-300 group-hover:scale-110" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200/10 bg-blue-400/[0.08] text-blue-200 transition-colors group-hover:bg-blue-400/[0.14]">
                <MetricGlyph kind={metrica.icon} />
              </div>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">{metrica.label === 'Planificaciones del ciclo' ? 'Total' : 'Estado'}</span>
            </div>
            <div className="relative mt-6">
              <p className="text-4xl font-semibold tracking-tight text-white">{metrica.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-300">{metrica.label}</p>
              <p className="mt-1 text-xs text-slate-500">{metrica.detail}</p>
            </div>
            <span className="sr-only">Abrir listado filtrado</span>
          </Link>
        ))}
      </section>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
        <section aria-labelledby="recientes-heading" className="flex min-w-0 flex-col">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-blue-300">Ciclo actual</p>
              <h2 id="recientes-heading" className="mt-1 text-lg font-semibold text-white">Planificaciones recientes</h2>
            </div>
            <Link href="/planificaciones" className="shrink-0 rounded-md border border-blue-300/25 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-200 transition-colors hover:border-blue-300/50 hover:bg-blue-500/20 sm:text-sm">Ver todas</Link>
          </div>
          <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#0d1b32]/90 shadow-lg shadow-blue-950/20">
            <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(90px,0.7fr)_minmax(90px,0.7fr)_auto] gap-4 border-b border-white/[0.08] bg-white/[0.04] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
              <span>Asignatura</span><span className="text-center">Carrera</span><span className="text-center">Ciclo lectivo</span><span className="text-center">Estado</span>
            </div>
            {recientes.map((p) => (
              <Link key={p.id} href={`/planificaciones/${p.id}`} className="group grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-white/[0.06] px-4 py-3.5 transition-colors hover:bg-blue-400/[0.06] last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(90px,0.7fr)_minmax(90px,0.7fr)_auto] sm:gap-4 sm:px-5">
                <span className="min-w-0 truncate text-sm font-medium text-slate-200 transition-colors group-hover:text-white">{p.asignatura.nombre}<span className="mt-1 block truncate text-[11px] font-normal text-slate-500">Actualizada {p.updatedAt.toLocaleDateString('es-AR')}</span></span>
                <span className="hidden text-center text-sm text-slate-400 sm:block">{p.asignatura.planEstudio.carrera.codigo}</span>
                <span className="hidden text-center text-sm text-slate-400 sm:block">{p.cicloLectivo}</span>
                <span className="justify-self-center"><DashboardStatusBadge estado={p.estado} /></span>
                <span className="col-span-2 truncate text-xs text-slate-500 sm:hidden">Ciclo {p.cicloLectivo} · {p.asignatura.planEstudio.carrera.codigo}</span>
              </Link>
            ))}
            {recientes.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">Todavía no hay planificaciones para mostrar.</p>}
          </div>
        </section>

        <section aria-labelledby="estado-ciclo-heading" className="flex h-full min-h-[400px] flex-col rounded-xl border border-white/10 bg-[#0d1b32]/90 p-4 shadow-lg shadow-blue-950/20 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-blue-300">Ciclo {ciclo}</p>
              <h2 id="estado-ciclo-heading" className="mt-1 text-base font-semibold text-white">Estado del ciclo</h2>
            </div>
            <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] text-slate-400">{totalEstados} en total</span>
          </div>
          <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="relative h-28 w-28 shrink-0 rounded-full p-2.5" style={{ background: graficoEstados }} aria-label={`Distribución de ${totalEstados} planificaciones por estado`} role="img">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/[0.06] bg-[#0d1b32]">
                <span className="text-3xl font-semibold tracking-tight text-white">{planifCicloActual}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">planes</span>
              </div>
            </div>
            <ul className="w-full space-y-2.5">
              {estadosCiclo.map((estado) => (
                <li key={estado.label} className="flex items-center gap-2.5 text-xs">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: estado.color }} />
                  <span className="min-w-0 flex-1 text-slate-400">{estado.label}</span>
                  <span className="font-semibold tabular-nums text-slate-200">{estado.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5 rounded-lg border border-blue-300/10 bg-blue-400/[0.06] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">Lectura del ciclo</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-300">{lecturaEstado}</p>
            <Link href="/planificaciones" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-200 transition-colors hover:text-white">
              Ir al listado <span aria-hidden="true">→</span>
            </Link>
          </div>
          {observadas > 0 && (
            <Link href="/planificaciones?estado=OBSERVADO" className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-300/25 bg-amber-300/[0.08] px-3.5 py-3 transition-colors hover:border-amber-200/45 hover:bg-amber-300/[0.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
              <span className="min-w-0"><span className="block text-xs font-semibold text-amber-100">Seguimiento pendiente</span><span className="mt-0.5 block text-xs text-amber-100/70">{observadas} {observadas === 1 ? 'planificación observada' : 'planificaciones observadas'}</span></span>
              <span className="shrink-0 text-xs font-medium text-amber-100">Revisar →</span>
            </Link>
          )}
        </section>
      </div>

      <section aria-labelledby="accesos-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-blue-300">Herramientas</p>
            <h2 id="accesos-heading" className="mt-1 text-lg font-semibold text-white">Accesos de administración</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AdminShortcut href="/admin" title="Estructura académica" detail="Organizá sedes, carreras, materias y equipos docentes." />
          <AdminShortcut href="/admin/usuarios" title="Usuarios y roles" detail="Creá cuentas y vinculá docentes con sus materias." />
          <AdminShortcut href="/planificaciones" title="Todas las planificaciones" detail="Buscá documentos y consultá su estado." />
        </div>
      </section>
    </div>
    </div>
  );
}

function MetricGlyph({ kind }: { kind: 'grid' | 'file' | 'review' | 'alert' }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" {...common}>
      {kind === 'grid' && <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>}
      {kind === 'file' && <><path d="M7 3.75h7l4.25 4.5v12A1.75 1.75 0 0 1 16.5 22h-9A1.75 1.75 0 0 1 5.75 20.25V5.5A1.75 1.75 0 0 1 7.5 3.75Z" /><path d="M14 4v5h4M9 13h6M9 17h6" /></>}
      {kind === 'review' && <><path d="M2.8 12s3.2-5.2 9.2-5.2 9.2 5.2 9.2 5.2-3.2 5.2-9.2 5.2S2.8 12 2.8 12Z" /><circle cx="12" cy="12" r="2.3" /></>}
      {kind === 'alert' && <><path d="m12 3.5 9 16H3l9-16Z" /><path d="M12 9v4.5M12 17h.01" /></>}
    </svg>
  );
}

function AdminShortcut({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <Link href={href} className="group flex h-full min-h-[132px] flex-col justify-between rounded-xl border border-white/10 bg-[#0d1b32]/90 p-4 shadow-md shadow-blue-950/10 transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/25 hover:bg-[#10213b] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-200 transition-colors group-hover:text-white">{title}</span>
        <span className="mt-2 block text-xs leading-5 text-slate-400">{detail}</span>
      </span>
      <span aria-hidden="true" className="mt-3 self-end text-sm text-slate-500 transition-colors group-hover:text-blue-300">Abrir →</span>
    </Link>
  );
}

function DashboardStatusBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    BORRADOR: 'border border-white/10 bg-white/[0.06] text-slate-300',
    ENVIADO_A_REVISION: 'border border-blue-300/20 bg-blue-400/10 text-blue-200',
    OBSERVADO: 'border border-amber-300/20 bg-amber-300/10 text-amber-200',
    APROBADO_PEDAGOGICO: 'border border-blue-300/20 bg-blue-400/10 text-blue-200',
    APROBADO_DISCIPLINAR: 'border border-blue-300/20 bg-blue-400/10 text-blue-200',
    APROBADO_PLENO: 'border border-blue-300/20 bg-blue-400/10 text-blue-200',
    ELEVADO_AL_CONSEJO: 'border border-blue-300/20 bg-blue-400/10 text-blue-200',
    FINALIZADO: 'border border-blue-300/20 bg-blue-400/10 text-blue-200',
  };

  return (
    <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium ${styles[estado] ?? 'border border-white/10 bg-white/[0.06] text-slate-300'}`}>
      {ESTADO_LABELS[estado] ?? estado}
    </span>
  );
}
