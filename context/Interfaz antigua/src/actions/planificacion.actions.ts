'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PlanifStatus, UserRole } from '@prisma/client';
import { hasRole } from '@/lib/roles';
import { asegurarPaad } from '@/lib/paad';
import { planificacionVisiblePara } from '@/lib/visibilidad';
import { permiteObservaciones, tieneObservacionesPendientes } from '@/lib/observaciones';
import { archivarExpedienteFinal } from '@/lib/archivo-expediente';
import type {
  PaacData,
  PedagogicalReportData,
  DisciplinaryReportData,
  GeneralReportData,
} from '@/types/planificacion';

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('No autenticado.');
  return session;
}

function revalidatePlanif(id: string) {
  revalidatePath(`/planificaciones/${id}`);
  revalidatePath('/planificaciones');
  revalidatePath('/paads', 'layout');
  revalidatePath('/mi-paad');
  revalidatePath('/admin');
}

async function requirePlanificacionVisible(planificacionId: string, session: Awaited<ReturnType<typeof requireSession>>) {
  const planif = await planificacionVisiblePara(session.user, planificacionId);
  if (!planif) throw new Error('No encontrada o no autorizada.');
  return planif;
}

function requireEstadoEditable(estado: string, tienePendientes = false) {
  if (!['BORRADOR', 'OBSERVADO'].includes(estado) && !(tienePendientes && permiteObservaciones(estado))) {
    throw new Error('No editable en el estado actual.');
  }
}

function requireSinObservacionesPendientes(planif: { observaciones: readonly { resuelto: boolean }[] }, mensaje: string) {
  if (tieneObservacionesPendientes(planif.observaciones)) throw new Error(mensaje);
}

export async function actualizarPaac(planifId: string, datosPaac: PaacData) {
  const session = await requireSession();
  const planif = await requirePlanificacionVisible(planifId, session);

  const puedeEditar = planif.docenteResponsableId === session.user.id || session.user.rol === UserRole.ADMINISTRADOR;
  if (!puedeEditar) throw new Error('No autorizado.');
  const tienePendientes = tieneObservacionesPendientes(planif.observaciones);
  requireEstadoEditable(planif.estado, tienePendientes);

  const updated = await prisma.planificacion.update({
    where: { id: planifId },
    data: { datosPaac: datosPaac as any, ...(tienePendientes ? { estado: 'OBSERVADO' } : {}) },
  });

  revalidatePlanif(planifId);
  return updated;
}

export async function invitarDocenteEquipo(planificacionId: string, docenteId: string, cargoEnCatedra: string) {
  const session = await requireSession();
  const planif = await requirePlanificacionVisible(planificacionId, session);
  const autorizado = session.user.rol === UserRole.ADMINISTRADOR || planif.docenteResponsableId === session.user.id;
  if (!autorizado) throw new Error('No autorizado.');
  requireEstadoEditable(planif.estado);
  const docente = await prisma.usuario.findUnique({ where: { id: docenteId }, select: { rol: true } });
  if (!docente || docente.rol !== UserRole.DOCENTE) throw new Error('El integrante debe tener rol Docente.');

  const integrante = await prisma.$transaction(async tx => {
    const miembro = await tx.integrantePlanificacion.upsert({
      where: { planificacionId_docenteId: { planificacionId, docenteId } },
      update: { cargoEnCatedra }, create: { planificacionId, docenteId, cargoEnCatedra },
    });
    await tx.asignacionCatedra.upsert({
      where: { asignaturaId_cicloLectivo_docenteId: { asignaturaId: planif.asignaturaId, cicloLectivo: planif.cicloLectivo, docenteId } },
      create: { asignaturaId: planif.asignaturaId, cicloLectivo: planif.cicloLectivo, docenteId, categoria: cargoEnCatedra },
      update: { categoria: cargoEnCatedra },
    });
    await asegurarPaad(tx, docenteId, planif.cicloLectivo);
    return miembro;
  });
  revalidatePath('/paads', 'layout');
  revalidatePath('/admin');
  revalidatePlanif(planificacionId);
  return integrante;
}

export async function quitarDocenteEquipo(planificacionId: string, paadId: string) {
  const session = await requireSession();
  if (session.user.rol !== UserRole.ADMINISTRADOR) throw new Error('No autorizado.');

  const paad = await prisma.integrantePlanificacion.findUnique({ where: { id: paadId } });
  if (!paad || paad.planificacionId !== planificacionId) throw new Error('No encontrado.');

  const planif = await requirePlanificacionVisible(planificacionId, session);
  requireEstadoEditable(planif.estado);
  if (planif.docenteResponsableId === paad.docenteId) {
    throw new Error('No se puede quitar al Docente Responsable. Cambiá el responsable antes de quitarlo del equipo.');
  }

  await prisma.$transaction(async tx => {
    await tx.integrantePlanificacion.delete({ where: { id: paadId } });
    await tx.asignacionCatedra.deleteMany({ where: { asignaturaId: planif.asignaturaId, cicloLectivo: planif.cicloLectivo, docenteId: paad.docenteId } });
    await asegurarPaad(tx, paad.docenteId, planif.cicloLectivo);
  });
  revalidatePlanif(planificacionId);
}

export async function cambiarResponsablePlanificacion(planificacionId: string, nuevoDocenteId: string, cargoEnCatedra: string) {
  const session = await requireSession();
  if (session.user.rol !== UserRole.ADMINISTRADOR) throw new Error('No autorizado.');

  const planif = await requirePlanificacionVisible(planificacionId, session);
  requireEstadoEditable(planif.estado);
  const nuevoResponsable = await prisma.usuario.findUnique({ where: { id: nuevoDocenteId }, select: { rol: true } });
  if (!nuevoResponsable || nuevoResponsable.rol !== UserRole.DOCENTE) throw new Error('El responsable debe tener rol Docente.');

  await prisma.$transaction(async tx => {
    await tx.integrantePlanificacion.upsert({
      where: { planificacionId_docenteId: { planificacionId, docenteId: nuevoDocenteId } },
      update: { cargoEnCatedra }, create: { planificacionId, docenteId: nuevoDocenteId, cargoEnCatedra },
    });
    await tx.planificacion.update({ where: { id: planificacionId }, data: { docenteResponsableId: nuevoDocenteId } });
    await tx.asignacionCatedra.updateMany({
      where: { asignaturaId: planif.asignaturaId, cicloLectivo: planif.cicloLectivo }, data: { esResponsable: false },
    });
    await tx.asignacionCatedra.upsert({
      where: { asignaturaId_cicloLectivo_docenteId: { asignaturaId: planif.asignaturaId, cicloLectivo: planif.cicloLectivo, docenteId: nuevoDocenteId } },
      create: { asignaturaId: planif.asignaturaId, cicloLectivo: planif.cicloLectivo, docenteId: nuevoDocenteId, categoria: cargoEnCatedra, esResponsable: true },
      update: { categoria: cargoEnCatedra, esResponsable: true },
    });
    await asegurarPaad(tx, nuevoDocenteId, planif.cicloLectivo);
  });
  revalidatePath('/paads', 'layout');
  revalidatePath('/admin');
  revalidatePlanif(planificacionId);
}

export async function enviarARevision(planifId: string) {
  const session = await requireSession();
  const planif = await requirePlanificacionVisible(planifId, session);

  const autorizado = session.user.rol === UserRole.ADMINISTRADOR || planif.docenteResponsableId === session.user.id;
  if (!autorizado) throw new Error('No autorizado.');
  if (!['BORRADOR', 'OBSERVADO'].includes(planif.estado)) throw new Error('El estado actual no permite el envío.');

  requireSinObservacionesPendientes(
    planif,
    'No se puede enviar a revisión: primero deben resolverse todas las observaciones pendientes.',
  );

  const updated = await prisma.planificacion.update({
    where: { id: planifId },
    data: { estado: 'ENVIADO_A_REVISION' },
  });

  revalidatePlanif(planifId);
  return updated;
}

export async function agregarObservacion(input: {
  planificacionId: string;
  documentoTipo: 'PAAC' | 'PAAD';
  campoPath: string;
  mensaje: string;
  docentePaadId?: string;
}) {
  const session = await requireSession();
  if (!hasRole(session.user.rol, [UserRole.UAP, UserRole.DIRECCION_CARRERA, UserRole.ADMINISTRADOR])) {
    throw new Error('No autorizado.');
  }

  const planif = await requirePlanificacionVisible(input.planificacionId, session);
  if (!permiteObservaciones(planif.estado)) {
    throw new Error('Solo se pueden observar planificaciones enviadas a revisión o en evaluación.');
  }
  if (input.documentoTipo !== 'PAAC') throw new Error('Observá el PAAD desde su documento anual.');

  const observacion = await prisma.$transaction(async (tx) => {
    const creada = await tx.itemObservacion.create({
      data: {
        planificacionId: input.planificacionId,
        documentoTipo: input.documentoTipo,
        campoPath: input.campoPath,
        docentePaadId: input.docentePaadId,
        mensaje: input.mensaje,
        autorId: session.user.id,
        rolAutor: session.user.rol,
      },
    });

    // Una observación abre formalmente el ciclo de corrección. Sin esta
    // transición el docente podía leer el comentario, pero los formularios
    // seguían bloqueados por conservar el estado de revisión anterior.
    await tx.planificacion.update({
      where: { id: input.planificacionId },
      data: { estado: 'OBSERVADO' },
    });

    return creada;
  });

  revalidatePlanif(input.planificacionId);
  return observacion;
}

export async function resolverObservacion(observacionId: string) {
  const session = await requireSession();
  const obs = await prisma.itemObservacion.findUnique({ where: { id: observacionId } });
  if (!obs) throw new Error('No encontrada.');
  if (obs.documentoTipo !== 'PAAC') throw new Error('El PAAD antiguo es un antecedente de solo lectura.');
  const planif = await requirePlanificacionVisible(obs.planificacionId, session);
  if (planif.estado !== 'OBSERVADO') throw new Error('Solo se pueden resolver observaciones de planificaciones observadas.');
  if (planif.docenteResponsableId !== session.user.id && session.user.rol !== UserRole.ADMINISTRADOR) {
    throw new Error('No autorizado.');
  }

  const updated = await prisma.itemObservacion.update({
    where: { id: observacionId },
    data: { resuelto: true },
  });

  revalidatePlanif(obs.planificacionId);
  return updated;
}

export async function marcarComoObservado(planifId: string) {
  const session = await requireSession();
  if (!hasRole(session.user.rol, [UserRole.UAP, UserRole.DIRECCION_CARRERA])) throw new Error('No autorizado.');

  const planif = await requirePlanificacionVisible(planifId, session);
  if (!['ENVIADO_A_REVISION', 'APROBADO_PEDAGOGICO', 'APROBADO_DISCIPLINAR'].includes(planif.estado)) {
    throw new Error('El estado actual no permite observar esta planificación.');
  }

  const updated = await prisma.planificacion.update({
    where: { id: planifId },
    data: { estado: 'OBSERVADO' },
  });

  revalidatePlanif(planifId);
  return updated;
}

export async function registrarAprobacionPedagogica(planifId: string, dictamen: PedagogicalReportData) {
  const session = await requireSession();
  if (!hasRole(session.user.rol, [UserRole.UAP, UserRole.ADMINISTRADOR])) throw new Error('No autorizado.');

  const planif = await requirePlanificacionVisible(planifId, session);
  if (!['ENVIADO_A_REVISION', 'APROBADO_PEDAGOGICO', 'APROBADO_DISCIPLINAR'].includes(planif.estado)) {
    throw new Error('El estado actual no permite registrar el dictamen pedagógico.');
  }

  if (dictamen.dictamen === 'REQUIERE_CORRECCION') {
    const updated = await prisma.planificacion.update({
      where: { id: planifId },
      data: { informePedagogico: dictamen as any, estado: 'OBSERVADO' },
    });
    revalidatePlanif(planifId);
    return updated;
  }

  requireSinObservacionesPendientes(
    planif,
    'No se puede registrar un dictamen favorable mientras existan observaciones pendientes.',
  );

  const nuevoEstado: PlanifStatus = planif.estado === 'APROBADO_DISCIPLINAR' ? 'APROBADO_PLENO' : 'APROBADO_PEDAGOGICO';
  const updated = await prisma.planificacion.update({
    where: { id: planifId },
    data: { informePedagogico: dictamen as any, estado: nuevoEstado },
  });

  revalidatePlanif(planifId);
  return updated;
}

export async function registrarAprobacionDisciplinar(planifId: string, dictamen: DisciplinaryReportData) {
  const session = await requireSession();
  if (!hasRole(session.user.rol, [UserRole.DIRECCION_CARRERA, UserRole.ADMINISTRADOR])) throw new Error('No autorizado.');

  const planif = await requirePlanificacionVisible(planifId, session);
  if (!['ENVIADO_A_REVISION', 'APROBADO_PEDAGOGICO', 'APROBADO_DISCIPLINAR'].includes(planif.estado)) {
    throw new Error('El estado actual no permite registrar el dictamen disciplinar.');
  }

  if (dictamen.dictamen === 'REQUIERE_CORRECCION') {
    const updated = await prisma.planificacion.update({
      where: { id: planifId },
      data: { informeDisciplinar: dictamen as any, estado: 'OBSERVADO' },
    });
    revalidatePlanif(planifId);
    return updated;
  }

  requireSinObservacionesPendientes(
    planif,
    'No se puede registrar un dictamen favorable mientras existan observaciones pendientes.',
  );

  const nuevoEstado: PlanifStatus = planif.estado === 'APROBADO_PEDAGOGICO' ? 'APROBADO_PLENO' : 'APROBADO_DISCIPLINAR';
  const updated = await prisma.planificacion.update({
    where: { id: planifId },
    data: { informeDisciplinar: dictamen as any, estado: nuevoEstado },
  });

  revalidatePlanif(planifId);
  return updated;
}

export async function guardarInformeGeneral(planifId: string, informe: GeneralReportData) {
  const session = await requireSession();
  if (!hasRole(session.user.rol, [UserRole.UAP, UserRole.DIRECCION_CARRERA, UserRole.ADMINISTRADOR])) {
    throw new Error('No autorizado.');
  }

  const planif = await requirePlanificacionVisible(planifId, session);
  if (planif.estado !== 'APROBADO_PLENO') throw new Error('El informe general solo puede elaborarse con aprobación plena.');

  const informeConAutoria: GeneralReportData = {
    ...informe,
    elaboradoPorUap: informe.elaboradoPorUap || session.user.rol === UserRole.UAP,
    elaboradoPorDireccion: informe.elaboradoPorDireccion || session.user.rol === UserRole.DIRECCION_CARRERA,
  };

  const updated = await prisma.planificacion.update({
    where: { id: planifId },
    data: { informeGeneral: informeConAutoria as any },
  });

  revalidatePlanif(planifId);
  return updated;
}

export async function elevarAlConsejo(planifId: string) {
  const session = await requireSession();
  if (!hasRole(session.user.rol, [UserRole.DIRECCION_CARRERA, UserRole.ADMINISTRADOR])) throw new Error('No autorizado.');

  const planif = await requirePlanificacionVisible(planifId, session);
  if (planif.estado !== 'APROBADO_PLENO') throw new Error('La planificación debe estar Aprobada Plena para elevarla.');
  requireSinObservacionesPendientes(planif, 'No se puede elevar una planificación con observaciones pendientes.');
  if (!planif.informeGeneral) throw new Error('Falta elaborar el Informe General de PAAC junto a la UAP.');
  const informeGeneral = planif.informeGeneral as unknown as GeneralReportData;
  if (!informeGeneral.elaboradoPorUap || !informeGeneral.elaboradoPorDireccion) {
    throw new Error('El Informe General debe contar con la participación de UAP y Dirección de Carrera.');
  }

  const updated = await prisma.planificacion.update({
    where: { id: planifId },
    data: { estado: 'ELEVADO_AL_CONSEJO' },
  });

  revalidatePlanif(planifId);
  return updated;
}

export async function asignarExpediente(planifId: string, nroExpediente: string) {
  const session = await requireSession();
  if (!hasRole(session.user.rol, [UserRole.CONSEJO_DEPARTAMENTAL, UserRole.ADMINISTRADOR])) throw new Error('No autorizado.');

  const planif = await requirePlanificacionVisible(planifId, session);
  if (planif.estado !== 'ELEVADO_AL_CONSEJO') throw new Error('La planificación debe estar elevada al consejo.');
  if (!nroExpediente.trim()) throw new Error('El número de expediente es obligatorio.');
  if (planif.numeroExpediente) throw new Error('Ya hay un expediente asignado.');

  const updated = await prisma.planificacion.update({
    where: { id: planifId },
    data: { numeroExpediente: nroExpediente },
  });

  revalidatePlanif(planifId);
  return updated;
}

export async function formalizarResolucion(planifId: string, nroResolucion: string) {
  const session = await requireSession();
  if (!hasRole(session.user.rol, [UserRole.CONSEJO_DEPARTAMENTAL, UserRole.ADMINISTRADOR])) throw new Error('No autorizado.');

  const planif = await requirePlanificacionVisible(planifId, session);
  if (planif.estado !== 'ELEVADO_AL_CONSEJO') throw new Error('La planificación debe estar elevada al consejo.');
  if (!planif.numeroExpediente) throw new Error('Primero hay que asignar el número de expediente.');
  if (!nroResolucion.trim()) throw new Error('El número de resolución es obligatorio.');
  if (planif.numeroResolucion) throw new Error('Ya hay una resolución asignada.');

  const fechaAprobacion = new Date();
  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Planificacion" WHERE id = ${planifId} FOR UPDATE`;
      const actual = await tx.planificacion.findUniqueOrThrow({ where: { id: planifId } });
      if (actual.estado !== 'ELEVADO_AL_CONSEJO') throw new Error('La planificación ya no está elevada al consejo.');
      if (!actual.numeroExpediente) throw new Error('Primero hay que asignar el número de expediente.');
      if (actual.numeroResolucion) throw new Error('Ya hay una resolución asignada.');

      await archivarExpedienteFinal(tx, planifId, actual.numeroExpediente, nroResolucion.trim(), fechaAprobacion);
      return tx.planificacion.update({
        where: { id: planifId },
        data: {
          numeroResolucion: nroResolucion.trim(),
          fechaAprobacionCd: fechaAprobacion,
          estado: 'FINALIZADO',
        },
      });
    }, { maxWait: 10_000, timeout: 120_000 });
  } catch (error) {
    const statusCode = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    if (statusCode === 403) {
      return {
        error: 'El almacenamiento de expedientes rechazo la escritura (S3 403). Revisa que las credenciales de la aplicacion tengan permiso s3:PutObject sobre el bucket y la ruta planificaciones/*.',
      };
    }
    throw error;
  }

  revalidatePlanif(planifId);
  return updated;
}
