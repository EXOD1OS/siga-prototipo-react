import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { EstructuraExplorer } from '@/components/admin/EstructuraExplorer';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { GenerarPlanificacionesPanel } from '@/components/admin/GenerarPlanificacionesPanel';

export default async function AdminHubPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.rol !== UserRole.ADMINISTRADOR) redirect('/dashboard');

  const [sedes, asignaciones, docentes] = await Promise.all([
    prisma.sede.findMany({
      include: {
        carreras: {
          include: {
            departamento: true,
            planes: { include: { asignaturas: true } },
          },
          orderBy: { nombre: 'asc' },
        },
      },
      orderBy: { nombre: 'asc' },
    }),
    prisma.asignacionCatedra.findMany({ include: { docente: true }, orderBy: { createdAt: 'asc' } }),
    prisma.usuario.findMany({
      where: { rol: UserRole.DOCENTE },
      orderBy: { apellido: 'asc' },
    }),
  ]);

  const carreras = sedes.flatMap((sede) => sede.carreras);
  const asignaturasCount = carreras.reduce(
    (total, carrera) => total + carrera.planes.reduce((planTotal, plan) => planTotal + plan.asignaturas.length, 0),
    0,
  );

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-blue-200/10 bg-gradient-to-r from-[#10213d] via-[#0d1b32] to-[#101a38] p-5 shadow-lg shadow-blue-950/20 sm:rounded-3xl sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-28 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Administración · UNLaR</p>
              <span className="rounded-full border border-blue-200/10 bg-blue-300/[0.07] px-2.5 py-1 text-[10px] font-medium text-blue-100/80">DACEFyN</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Gestión académica</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Prepará el ciclo lectivo, organizá los equipos docentes y mantené al día la estructura académica desde un solo lugar.
            </p>
          </div>
          <div className="relative flex w-fit items-center self-start rounded-xl border border-white/10 bg-[#071326]/35 px-5 py-4 shadow-lg backdrop-blur-sm lg:self-auto">
            <Image src="/unlar-logo.png" alt="Universidad Nacional de La Rioja" width={311} height={104} priority className="h-auto w-52 object-contain sm:w-60" />
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Espacio de trabajo</p>
          <p className="mt-1 text-sm text-slate-300">Elegí una sección para continuar con la gestión.</p>
        </div>
        <AdminTabs />
      </div>

      <section aria-label="Resumen de la estructura académica" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        <SummaryCard label="Sedes" value={sedes.length} detail="con estructura cargada" icon={<PinIcon />} />
        <SummaryCard label="Carreras" value={carreras.length} detail="en todas las sedes" icon={<CapIcon />} />
        <SummaryCard label="Asignaturas" value={asignaturasCount} detail="en los planes cargados" icon={<BookIcon />} />
        <SummaryCard label="Docentes" value={docentes.length} detail={`${asignaciones.length} asignaciones en todos los ciclos`} icon={<PeopleIcon />} />
      </section>

      <section aria-labelledby="ciclo-heading" className="grid gap-4 rounded-2xl border border-blue-200/10 bg-gradient-to-br from-[#12233e] to-[#0b172b] p-4 shadow-lg shadow-blue-950/15 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)] lg:items-center">
        <div className="flex gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Ciclo lectivo</p>
            <h2 id="ciclo-heading" className="mt-1 text-lg font-semibold text-white sm:text-xl">Preparar planificaciones docentes</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Crea los borradores PAAC por materia y los PAAD personales por docente. Toma como referencia los equipos del ciclo anterior y conserva el historial.
            </p>
            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-400">
              <span className="mt-0.5 text-blue-300"><InfoIcon /></span>
              Las materias sin equipo quedan señaladas para que puedas completarlas desde la estructura académica.
            </p>
          </div>
        </div>
        <GenerarPlanificacionesPanel />
      </section>

      <section aria-labelledby="estructura-heading" className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#0d1b32]/60 p-4 shadow-lg shadow-blue-950/10 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-white/[0.07] pb-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Estructura y equipos</p>
              <h2 id="estructura-heading" className="mt-1 text-lg font-semibold text-white sm:text-xl">Organizar equipos de cátedra</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                Buscá una asignatura y abrila para asignar docentes, definir categorías o elegir a la persona responsable.
              </p>
              <p className="mt-1 text-xs text-slate-500">Capital se organiza por departamento; las sedes regionales, directamente por carrera.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 sm:gap-2 sm:text-xs">
            <HierarchyChip>Sede</HierarchyChip><ArrowIcon /><HierarchyChip>Departamento / Carrera</HierarchyChip><ArrowIcon /><HierarchyChip>Plan</HierarchyChip><ArrowIcon /><HierarchyChip>Asignatura</HierarchyChip>
          </div>
        </div>

        <EstructuraExplorer
          sedes={sedes}
          asignaciones={asignaciones.map((a) => ({
            id: a.id,
            asignaturaId: a.asignaturaId,
            cicloLectivo: a.cicloLectivo,
            docenteId: a.docenteId,
            categoria: a.categoria,
            esResponsable: a.esResponsable,
            docenteNombre: `${a.docente.nombre} ${a.docente.apellido}`,
          }))}
          docentesDisponibles={docentes.map((d) => ({ id: d.id, nombre: `${d.nombre} ${d.apellido}` }))}
        />
      </section>
    </div>
  );
}

function SummaryCard({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: React.ReactNode }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-blue-100/[0.09] bg-gradient-to-br from-[#12213a] to-[#0d182b] p-4 shadow-md shadow-blue-950/10 transition hover:-translate-y-0.5 hover:border-blue-200/20 sm:p-5">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-400 sm:text-sm">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200/10 bg-blue-400/[0.08] text-blue-200">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{value}</p>
      <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">{detail}</p>
    </div>
  );
}

function HierarchyChip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md border border-blue-100/10 bg-[#09172b]/80 px-2 py-1 text-slate-300">{children}</span>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.8"><path d="M3.5 10h12M10.5 5l5 5-5 5" /></svg>;
}

function PinIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></svg>;
}

function CapIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7"><path d="m2.5 9 9.5-5 9.5 5-9.5 5-9.5-5Z" /><path d="M6.5 11.2v5.2c3.5 2.7 7.5 2.7 11 0v-5.2M21.5 9v6" /></svg>;
}

function BookIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" /><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20M8 7h8m-8 4h8" /></svg>;
}

function PeopleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7"><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-1.5A5.5 5.5 0 0 1 9 13h1a5.5 5.5 0 0 1 5.5 5.5V20h-12Z" /><path d="M16 5.5a3 3 0 0 1 0 5.8m2.5 2.3a4.8 4.8 0 0 1 2 4V20" /></svg>;
}

function InfoIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="10" r="7.5" /><path d="M10 9v4m0-6h.01" /></svg>;
}
