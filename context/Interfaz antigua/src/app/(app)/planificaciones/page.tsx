import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { planificacionesVisiblesPara } from '@/lib/visibilidad';
import { PlanificacionesList } from '@/components/PlanificacionesList';

export default async function PlanificacionesPage({
  searchParams,
}: {
  searchParams?: { estado?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const planificaciones = await planificacionesVisiblesPara(session.user);
  const rows = planificaciones.map((p) => ({
    id: p.id,
    estado: p.estado,
    cicloLectivo: p.cicloLectivo,
    regimen: p.asignatura.regimen,
    numeroExpediente: p.numeroExpediente,
    numeroResolucion: p.numeroResolucion,
    fechaAprobacionCd: p.fechaAprobacionCd ? p.fechaAprobacionCd.toISOString() : null,
    asignatura: {
      nombre: p.asignatura.nombre,
      planEstudio: {
        carrera: {
          nombre: p.asignatura.planEstudio.carrera.nombre,
          codigo: p.asignatura.planEstudio.carrera.codigo,
          sede: { nombre: p.asignatura.planEstudio.carrera.sede.nombre },
        },
      },
    },
    docenteResponsable: { nombre: p.docenteResponsable.nombre, apellido: p.docenteResponsable.apellido },
  }));

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5">
      <header className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Gestión académica</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white">Planificaciones</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            {session.user.rol === 'ADMINISTRADOR'
              ? 'Consultá, filtrá y revisá las planificaciones de todas las carreras.'
              : 'Consultá tus planificaciones y encontrá rápidamente cada ciclo y estado.'}
          </p>
        </div>
        <div className="flex w-fit items-center rounded-lg border border-border bg-background px-4 py-3">
          <Image src="/unlar-logo.png" alt="Universidad Nacional de La Rioja" width={311} height={104} priority className="h-auto w-44 object-contain sm:w-52" />
        </div>
      </header>

      <PlanificacionesList planificaciones={rows} rol={session.user.rol} initialEstado={searchParams?.estado} />
    </div>
  );
}
