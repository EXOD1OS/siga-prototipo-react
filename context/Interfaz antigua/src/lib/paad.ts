import { PaadStatus, Prisma, PrismaClient, UserRole } from '@prisma/client';
import { z } from 'zod';
import { defaultPaad } from './defaults';
import type { PaadData } from '@/types/planificacion';

export type PaadActor = { id: string; rol: UserRole; carreraId: string | null };
export type PaadTx = Prisma.TransactionClient;
export const PAAD_LABELS: Record<PaadStatus, string> = {
  BORRADOR: 'Borrador', ENVIADO_A_REVISION: 'Enviado a revisión', OBSERVADO: 'Observado',
  APROBADO_UAP: 'Aprobado por UAP', APROBADO_DIRECCION: 'Aprobado por Dirección', APROBADO: 'Aprobado',
};
export const PAAD_REVISABLES: PaadStatus[] = ['ENVIADO_A_REVISION', 'APROBADO_UAP', 'APROBADO_DIRECCION'];

// Valida la estructura del formulario sin inventar campos obligatorios.
const text = z.string();
const paadSchema = z.object({
  actividadEnsenanza: z.object({
    cursosAtendidos: z.array(text),
    capacitaciones: z.array(z.object({ lugar: text, fecha: text, tematica: text, areaConocimiento: text, nombreCapacitacion: text })),
    materialElaborado: z.array(z.object({ areaConocimiento: text, tipo: text, autores: text, fecha: text })),
    otrosTrabajosDocentes: z.array(z.object({ areaTematica: text, lugar: text, fecha: text, destinatarios: text, nivel: text })),
  }),
  investigacion: z.array(z.object({ proyecto: text, descripcion: text, cargo: text, numeroResolucion: text, etapa: text })),
  formacionRecursosHumanos: z.object({ detalle: text }), formacionAcademica: z.object({ detalle: text }),
  extension: z.array(z.object({ proyecto: text, destinatarios: text, tiempoLugar: text, alumnosInvolucrados: text, informe: text })),
  gestion: z.object({ detalle: text }), otrasActividades: z.array(text),
  distribucionHoraria: z.array(z.object({
    actividad: z.enum(['ENSENANZA', 'INVESTIGACION', 'EXTENSION', 'FORMACION', 'GESTION']),
    lunes: text.optional(), martes: text.optional(), miercoles: text.optional(), jueves: text.optional(), viernes: text.optional(), sabado: text.optional(),
  })),
});

export async function carrerasPaad(tx: PaadTx, docenteId: string, cicloLectivo: number) {
  const include = { planEstudio: { select: { carreraId: true } } } as const;
  const [roster, equipos] = await Promise.all([
    tx.asignacionCatedra.findMany({ where: { docenteId, cicloLectivo }, include: { asignatura: { include } } }),
    tx.integrantePlanificacion.findMany({ where: { docenteId, planificacion: { cicloLectivo } }, include: { planificacion: { include: { asignatura: { include } } } } }),
  ]);
  return [...new Set([...roster.map(x => x.asignatura), ...equipos.map(x => x.planificacion.asignatura)]
    .map(a => a.carreraEvaluadoraId ?? a.planEstudio.carreraId))];
}

export async function asegurarPaad(tx: PaadTx, docenteId: string, cicloLectivo: number) {
  if (!Number.isInteger(cicloLectivo) || cicloLectivo < 2000 || cicloLectivo > 2100) throw new Error('Ciclo lectivo inválido.');
  const docente = await tx.usuario.findUnique({ where: { id: docenteId }, select: { rol: true } });
  if (docente?.rol !== UserRole.DOCENTE) throw new Error('El integrante debe ser docente.');
  const carreras = await carrerasPaad(tx, docenteId, cicloLectivo);
  const anual = await tx.paadAnual.upsert({
    where: { docenteId_cicloLectivo: { docenteId, cicloLectivo } }, update: {},
    create: { docenteId, cicloLectivo, datosPaad: defaultPaad() as unknown as Prisma.InputJsonValue,
      carreraEvaluadoraId: carreras.length === 1 ? carreras[0] : null },
  });
  if (!anual.direccionManual && anual.estado === 'BORRADOR' &&
      !(await tx.presentacionPaad.count({ where: { paadId: anual.id } }))) {
    return tx.paadAnual.update({ where: { id: anual.id }, data: { carreraEvaluadoraId: carreras.length === 1 ? carreras[0] : null } });
  }
  return anual;
}

export async function puedeVerPaad(tx: PaadTx, actor: PaadActor, paad: { docenteId: string; cicloLectivo: number; carreraEvaluadoraId: string | null }) {
  if (actor.rol === UserRole.ADMINISTRADOR || actor.rol === UserRole.UAP) return true;
  if (actor.rol === UserRole.DIRECCION_CARRERA) {
    return !!actor.carreraId && (actor.carreraId === paad.carreraEvaluadoraId ||
      (await carrerasPaad(tx, paad.docenteId, paad.cicloLectivo)).includes(actor.carreraId));
  }
  if (actor.rol !== UserRole.DOCENTE) return false;
  if (actor.id === paad.docenteId) return true;
  return !!await tx.integrantePlanificacion.findFirst({ where: {
    docenteId: paad.docenteId, planificacion: { cicloLectivo: paad.cicloLectivo,
      OR: [{ docenteResponsableId: actor.id }, { integrantes: { some: { docenteId: actor.id } } }] },
  } });
}

export const paadInclude = {
  docente: true, carreraEvaluadora: true,
  presentaciones: { orderBy: { numero: 'desc' }, include: { autor: true, dictamenes: { include: { autor: true } } } },
  observaciones: { orderBy: { createdAt: 'asc' }, include: { autor: true } },
} satisfies Prisma.PaadAnualInclude;

export async function paadVisible(tx: PaadTx, actor: PaadActor, id: string) {
  const paad = await tx.paadAnual.findUnique({ where: { id }, include: paadInclude });
  if (!paad || !await puedeVerPaad(tx, actor, paad)) throw new Error('PAAD no encontrado o no autorizado.');
  return paad;
}
function propietario(actor: PaadActor, paad: { docenteId: string }) {
  if (actor.rol !== UserRole.ADMINISTRADOR && !(actor.rol === UserRole.DOCENTE && actor.id === paad.docenteId)) throw new Error('Solo el propietario puede modificar su PAAD.');
}
function editable(paad: { conflictoMigracion: boolean; estado: PaadStatus }) {
  if (paad.conflictoMigracion) throw new Error('Administración debe resolver las copias del PAAD antes de continuar.');
  if (!['BORRADOR', 'OBSERVADO'].includes(paad.estado)) throw new Error('El PAAD no es editable en este estado.');
}
function revisor(actor: PaadActor, paad: { carreraEvaluadoraId: string | null }) {
  if (actor.rol !== UserRole.UAP && !(actor.rol === UserRole.DIRECCION_CARRERA &&
      !!actor.carreraId && actor.carreraId === paad.carreraEvaluadoraId)) throw new Error('No puede revisar este PAAD.');
}

export async function operarPaad(db: PrismaClient, actor: PaadActor, id: string,
  operacion: 'guardar' | 'presentar' | 'observar' | 'dictaminar' | 'direccion',
  input: { datos?: PaadData; presentacionId?: string; campoPath?: string; mensaje?: string; resultado?: 'FAVORABLE' | 'REQUIERE_CORRECCION'; carreraId?: string }) {
  return db.$transaction(async tx => {
    // Parámetros separados del SQL: serializa cambios para conservar dictámenes concurrentes.
    await tx.$queryRawUnsafe('SELECT id FROM "PaadAnual" WHERE id = $1 FOR UPDATE', id);
    if (operacion === 'presentar') {
      const documento = await tx.paadAnual.findUnique({ where: { id } });
      if (documento) {
        propietario(actor, documento);
        await asegurarPaad(tx, documento.docenteId, documento.cicloLectivo);
      }
    }
    const p = await paadVisible(tx, actor, id);
    if (operacion === 'guardar') {
      propietario(actor, p); editable(p);
      const datos = paadSchema.parse(input.datos);
      return tx.paadAnual.update({ where: { id }, data: { datosPaad: datos as Prisma.InputJsonValue } });
    }
    if (operacion === 'direccion') {
      if (actor.rol !== UserRole.ADMINISTRADOR) throw new Error('Solo Administración puede asignar la Dirección.');
      if (p.estado !== 'BORRADOR' || p.presentaciones.length) throw new Error('Solo se puede cambiar la Dirección antes de la primera presentación.');
      const carreras = await carrerasPaad(tx, p.docenteId, p.cicloLectivo);
      if (!input.carreraId || (carreras.length > 0 && !carreras.includes(input.carreraId))) throw new Error('Seleccioná una carrera evaluadora del docente.');
      if (!await tx.carrera.findUnique({ where: { id: input.carreraId } })) throw new Error('La carrera no existe.');
      return tx.paadAnual.update({ where: { id }, data: { carreraEvaluadoraId: input.carreraId, direccionManual: true } });
    }
    if (operacion === 'presentar') {
      propietario(actor, p); editable(p);
      if (!p.carreraEvaluadoraId) throw new Error('Administración debe asignar la Dirección responsable antes de presentar.');
      if (p.observaciones.some(o => !o.resuelto)) throw new Error('Primero deben resolverse todas las observaciones del PAAD.');
      paadSchema.parse(p.datosPaad);
      await tx.presentacionPaad.create({ data: { paadId: id, numero: (p.presentaciones[0]?.numero ?? 0) + 1,
        datosPaad: p.datosPaad as Prisma.InputJsonValue, autorId: actor.id, rolAutor: actor.rol } });
      return tx.paadAnual.update({ where: { id }, data: { estado: 'ENVIADO_A_REVISION' } });
    }
    revisor(actor, p);
    if (!PAAD_REVISABLES.includes(p.estado) || p.conflictoMigracion) throw new Error('El PAAD no está disponible para revisión.');
    const revision = p.presentaciones[0];
    if (!revision || input.presentacionId !== revision.id) throw new Error('La presentación cambió. Actualizá la página antes de revisar.');
    const mensaje = input.mensaje?.trim() ?? '';
    if (operacion === 'observar' || input.resultado === 'REQUIERE_CORRECCION') {
      if (!mensaje) throw new Error('Escribí la corrección requerida.');
      if (operacion === 'dictaminar') {
        if (revision.dictamenes.some(d => d.rolAutor === actor.rol)) throw new Error('Esta instancia ya registró su dictamen para la presentación.');
        await tx.dictamenPaad.create({ data: { presentacionId: revision.id, autorId: actor.id, rolAutor: actor.rol,
          resultado: 'REQUIERE_CORRECCION', comentario: mensaje } });
      }
      await tx.observacionPaad.create({ data: { paadId: id, presentacionId: revision.id, autorId: actor.id,
        rolAutor: actor.rol, campoPath: input.campoPath || 'general', mensaje } });
      return tx.paadAnual.update({ where: { id }, data: { estado: 'OBSERVADO' } });
    }
    if (input.resultado !== 'FAVORABLE') throw new Error('Dictamen inválido.');
    if (p.observaciones.some(o => !o.resuelto)) throw new Error('No se puede aprobar con observaciones pendientes.');
    const anterior = revision.dictamenes.find(d => d.rolAutor === actor.rol);
    if (anterior) {
      if (anterior.resultado === 'FAVORABLE') return p;
      throw new Error('Ya existe un dictamen para esta presentación.');
    }
    await tx.dictamenPaad.create({ data: { presentacionId: revision.id, autorId: actor.id, rolAutor: actor.rol,
      resultado: 'FAVORABLE', comentario: mensaje } });
    const ambos = revision.dictamenes.some(d => d.resultado === 'FAVORABLE' && d.rolAutor !== actor.rol);
    return tx.paadAnual.update({ where: { id }, data: { estado: ambos ? 'APROBADO' : actor.rol === UserRole.UAP ? 'APROBADO_UAP' : 'APROBADO_DIRECCION' } });
  }, { timeout: 20000 });
}

export async function resolverObservacionPersonal(db: PrismaClient, actor: PaadActor, observacionId: string) {
  const obs = await db.observacionPaad.findUnique({ where: { id: observacionId } });
  if (!obs) throw new Error('Observación no encontrada.');
  return db.$transaction(async tx => {
    await tx.$queryRawUnsafe('SELECT id FROM "PaadAnual" WHERE id = $1 FOR UPDATE', obs.paadId);
    const p = await paadVisible(tx, actor, obs.paadId);
    propietario(actor, p); editable(p);
    if (p.estado !== 'OBSERVADO') throw new Error('El PAAD no está observado.');
    await tx.observacionPaad.update({ where: { id: observacionId }, data: { resuelto: true } });
    return p;
  });
}
