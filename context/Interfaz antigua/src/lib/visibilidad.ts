import { PlanifStatus, Prisma, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const include = {
  asignatura: { include: { planEstudio: { include: { carrera: { include: { sede: true } } } }, carreraEvaluadora: true } },
  docenteResponsable: true,
  integrantes: { include: { docente: true } },
} satisfies Prisma.PlanificacionInclude;

type SessionUser = { id: string; rol: UserRole; carreraId: string | null };

const ESTADOS_VISIBLES_AL_CONSEJO: PlanifStatus[] = ['ELEVADO_AL_CONSEJO', 'FINALIZADO'];

// La carrera responsable de evaluar disciplinarmente una asignatura es la propia,
// salvo que esté explícitamente delegada a otra (caso de materias como Derecho
// Informático, que pertenecen a un plan de una carrera pero se radican y evalúan
// en la dirección de otra carrera/departamento).
function carreraEvaluadoraWhere(carreraId: string): Prisma.PlanificacionWhereInput {
  return {
    asignatura: {
      OR: [{ carreraEvaluadoraId: carreraId }, { carreraEvaluadoraId: null, planEstudio: { carreraId } }],
    },
  };
}

function planificacionesWherePara(user: SessionUser): Prisma.PlanificacionWhereInput {
  switch (user.rol) {
    case UserRole.ADMINISTRADOR:
    case UserRole.UAP:
      return {};
    case UserRole.CONSEJO_DEPARTAMENTAL:
      return { estado: { in: ESTADOS_VISIBLES_AL_CONSEJO } };
    case UserRole.DOCENTE:
      return { OR: [{ docenteResponsableId: user.id }, { integrantes: { some: { docenteId: user.id } } }] };
    case UserRole.DIRECCION_CARRERA:
      return user.carreraId ? carreraEvaluadoraWhere(user.carreraId) : { id: '__sin-carrera__' };
    default:
      return { id: '__rol-sin-acceso__' };
  }
}

export async function planificacionesVisiblesPara(user: SessionUser) {
  const where = planificacionesWherePara(user);

  return prisma.planificacion.findMany({
    where,
    include,
    orderBy: { updatedAt: 'desc' },
  });
}

export async function planificacionVisiblePara(user: SessionUser, id: string) {
  return prisma.planificacion.findFirst({
    where: { AND: [{ id }, planificacionesWherePara(user)] },
    include: {
      ...include,
      observaciones: { where: { documentoTipo: 'PAAC' }, include: { autor: true }, orderBy: { createdAt: 'desc' } },
    },
  });
}
