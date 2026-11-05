import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { CrearUsuarioForm } from '@/components/forms/CrearUsuarioForm';
import { UsuariosPanel, type UsuarioRow } from '@/components/admin/UsuariosPanel';

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.rol !== UserRole.ADMINISTRADOR) redirect('/dashboard');

  const [usuarios, carreras, asignaturas] = await Promise.all([
    prisma.usuario.findMany({
      include: {
        carrera: true,
        asignacionesCatedra: { include: { asignatura: true }, orderBy: { cicloLectivo: 'desc' } },
      },
      orderBy: [{ rol: 'asc' }, { apellido: 'asc' }],
    }),
    prisma.carrera.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.asignatura.findMany({
      include: { planEstudio: { include: { carrera: true } } },
      orderBy: { nombre: 'asc' },
    }),
  ]);

  const filas: UsuarioRow[] = usuarios.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    dni: u.dni,
    rol: u.rol,
    carrera: u.carrera?.codigo ?? null,
    materias: u.asignacionesCatedra.map((a) => ({
      nombre: a.asignatura.nombre,
      categoria: a.categoria,
      cicloLectivo: a.cicloLectivo,
    })),
  }));

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-blue-200/10 bg-gradient-to-r from-[#10213d] via-[#0d1b32] to-[#101a38] p-5 shadow-lg shadow-blue-950/20 sm:rounded-3xl sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-28 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Administración · UNLaR</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Gestión de usuarios</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Creá cuentas institucionales y consultá los roles, carreras y materias asociadas.</p>
          </div>
          <div className="relative flex w-fit items-center self-start rounded-xl border border-white/10 bg-[#071326]/35 px-5 py-4 shadow-lg backdrop-blur-sm sm:self-auto">
            <Image src="/unlar-logo.png" alt="Universidad Nacional de La Rioja" width={311} height={104} priority className="h-auto w-52 object-contain sm:w-60" />
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Espacio de trabajo</p>
          <p className="mt-1 text-sm text-slate-300">Los usuarios se crean desde esta sección.</p>
        </div>
        <AdminTabs />
      </div>

      <section aria-label="Alta institucional" className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">Alta institucional</p>
          <p className="mt-1 text-sm text-slate-400">El DNI será la contraseña temporal y el sistema pedirá cambiarla en el primer ingreso.</p>
        </div>
        <CrearUsuarioForm
          carreras={carreras}
          asignaturas={asignaturas.map((a) => ({
            id: a.id,
            nombre: a.nombre,
            carrera: a.planEstudio.carrera.codigo,
            planEstudio: a.planEstudio.ordenanza,
          }))}
        />
      </section>

      <UsuariosPanel usuarios={filas} />
    </div>
  );
}
