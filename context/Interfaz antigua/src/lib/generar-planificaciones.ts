import { Prisma, PrismaClient } from '@prisma/client';
import { defaultPaacCompetencias, defaultPaacTraditional } from './defaults';
import { asegurarPaad } from './paad';
import type { DocentCategory, PaacCompetenciasData, PaacTraditionalData } from '@/types/planificacion';

export async function generarPlanificacionesDelCiclo(prisma: PrismaClient, cicloLectivo: number) {
  if (!Number.isInteger(cicloLectivo) || cicloLectivo < 2000 || cicloLectivo > 2100) {
    throw new Error('El ciclo lectivo debe ser un año válido.');
  }

  const [asignaturas, asignaciones] = await Promise.all([
    prisma.asignatura.findMany({
      include: { planEstudio: { include: { carrera: { include: { sede: true } } } } },
      orderBy: { nombre: 'asc' },
    }),
    prisma.asignacionCatedra.findMany({
      where: { cicloLectivo: { in: [cicloLectivo, cicloLectivo - 1] } },
      include: { docente: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
  ]);
  const equipos = new Map<string, typeof asignaciones>();
  for (const asignacion of asignaciones) {
    const clave = `${asignacion.asignaturaId}:${asignacion.cicloLectivo}`;
    const equipo = equipos.get(clave) ?? [];
    equipo.push(asignacion);
    equipos.set(clave, equipo);
  }

  const resultado = {
    creadas: 0,
    yaExistentes: 0,
    asignacionesCopiadas: 0,
    sinEquipo: [] as string[],
    responsablesProvisionales: [] as string[],
  };

  for (const asignatura of asignaturas) {
    const equipoActual = equipos.get(`${asignatura.id}:${cicloLectivo}`) ?? [];
    const equipoAnterior = equipos.get(`${asignatura.id}:${cicloLectivo - 1}`) ?? [];
    const copiarEquipo = equipoActual.length === 0 && equipoAnterior.length > 0;
    const equipo = copiarEquipo ? equipoAnterior : equipoActual;
    if (!equipo.length) {
      resultado.sinEquipo.push(asignatura.nombre);
      continue;
    }

    const responsableDesignado = equipo.find((integrante) => integrante.esResponsable);
    const responsable = responsableDesignado ?? equipo[0];
    const plan = asignatura.planEstudio;
    const carrera = plan.carrera;
    const regimen = asignatura.regimen as PaacCompetenciasData['encabezado']['regimen'];
    const datosPaac = plan.enfoque === 'COMPETENCIAS'
      ? defaultPaacCompetencias({
          sede: carrera.sede.nombre,
          carrera: carrera.nombre,
          planEstudio: plan.ordenanza,
          curso: asignatura.anoCursada ? `${asignatura.anoCursada}° año` : 'A DEFINIR',
          asignatura: asignatura.nombre,
          regimen,
          creditoHorario: asignatura.creditoHorario,
          horasTeoricas: 0,
          horasPracticas: 0,
          equipoCatedra: equipo.map((integrante) => ({
            cargo: integrante.categoria as DocentCategory,
            nombre: `${integrante.docente.nombre} ${integrante.docente.apellido}`,
          })),
          contenidosMinimos: asignatura.contenidosMinimosOficiales,
          nivelIntensidad: 0,
          relacionTeoricoPractica: '',
        })
      : defaultPaacTraditional({
          carrera: carrera.nombre,
          planEstudio: plan.ordenanza,
          asignatura: asignatura.nombre,
          curso: asignatura.anoCursada,
          regimen: regimen as PaacTraditionalData['encabezado']['regimen'],
        });

    const creado = await prisma.$transaction(async (tx) => {
      if (copiarEquipo) {
        for (const [indice, integrante] of equipo.entries()) {
          await tx.asignacionCatedra.upsert({
            where: {
              asignaturaId_cicloLectivo_docenteId: {
                asignaturaId: asignatura.id,
                cicloLectivo,
                docenteId: integrante.docenteId,
              },
            },
            update: { categoria: integrante.categoria },
            create: {
              asignaturaId: asignatura.id,
              cicloLectivo,
              docenteId: integrante.docenteId,
              categoria: integrante.categoria,
              esResponsable: responsableDesignado ? integrante.esResponsable : indice === 0,
            },
          });
        }
      }
      const existente = await tx.planificacion.findUnique({
        where: { asignaturaId_cicloLectivo: { asignaturaId: asignatura.id, cicloLectivo } },
        select: { id: true, estado: true },
      });
      if (existente) {
        if (!['BORRADOR', 'OBSERVADO'].includes(existente.estado)) return false;
        for (const integrante of equipo) {
          await tx.integrantePlanificacion.upsert({
            where: { planificacionId_docenteId: { planificacionId: existente.id, docenteId: integrante.docenteId } },
            update: { cargoEnCatedra: integrante.categoria },
            create: {
              planificacionId: existente.id,
              docenteId: integrante.docenteId,
              cargoEnCatedra: integrante.categoria,
            },
          });
        }
        return false;
      }

      await tx.planificacion.create({
        data: {
          asignaturaId: asignatura.id,
          cicloLectivo,
          docenteResponsableId: responsable.docenteId,
          estado: 'BORRADOR',
          datosPaac: datosPaac as unknown as Prisma.InputJsonValue,
          integrantes: {
            create: equipo.map((integrante) => ({
              docenteId: integrante.docenteId,
              cargoEnCatedra: integrante.categoria,
            })),
          },
        },
      });
      return true;
    });

    if (creado) {
      resultado.creadas += 1;
      if (copiarEquipo) resultado.asignacionesCopiadas += equipo.length;
      if (!responsableDesignado) resultado.responsablesProvisionales.push(asignatura.nombre);
    } else {
      resultado.yaExistentes += 1;
    }
  }

  const docentes = await prisma.usuario.findMany({ where: { rol: 'DOCENTE' }, select: { id: true } });
  for (const docente of docentes) await asegurarPaad(prisma, docente.id, cicloLectivo);
  return resultado;
}
