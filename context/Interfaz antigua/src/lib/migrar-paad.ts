import { Prisma, PrismaClient } from '@prisma/client';
import { asegurarPaad, type PaadTx } from './paad';

function canonico(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonico).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => JSON.stringify(k) + ':' + canonico(v)).join(',') + '}';
  return JSON.stringify(value);
}
function vacio(value: unknown, key = ''): boolean {
  if (key === 'actividad') return true;
  if (Array.isArray(value)) return value.every(v => vacio(v));
  if (value && typeof value === 'object') return Object.entries(value).every(([k, v]) => vacio(v, k));
  return value == null || value === '' || value === 0 || (typeof value === 'string' && !value.trim());
}
export function elegirCopias(copias: { id: string; datosPaad: unknown; estadoPresento: string; observaciones: number; antecedentes?: string }[]) {
  if (!copias.length) throw new Error('No hay copias para convertir.');
  if (new Set(copias.map(c => canonico(c.datosPaad))).size === 1) {
    const antecedentesIncompatibles = copias.every(c => vacio(c.datosPaad)) &&
      new Set(copias.map(c => c.estadoPresento + ':' + (c.antecedentes ?? c.observaciones))).size > 1;
    return antecedentesIncompatibles ? { conflicto: true, ids: [] as string[] } : { conflicto: false, ids: copias.map(c => c.id) };
  }
  const conContenido = copias.filter(c => !vacio(c.datosPaad));
  const restantes = copias.filter(c => vacio(c.datosPaad));
  if (conContenido.length === 1 && restantes.every(c => c.estadoPresento !== 'PRESENTO' && c.observaciones === 0))
    return { conflicto: false, ids: [conContenido[0].id] };
  return { conflicto: true, ids: [] as string[] };
}

export async function aplicarFuenteLegacy(tx: PaadTx, paadId: string, fuentes: string[]) {
  const p = await tx.paadAnual.findUniqueOrThrow({ where: { id: paadId } });
  const copias = await tx.paadDocente.findMany({ where: { id: { in: fuentes }, docenteId: p.docenteId,
    planificacion: { cicloLectivo: p.cicloLectivo } }, orderBy: { updatedAt: 'desc' } });
  if (!copias.length || copias.length !== fuentes.length) throw new Error('La fuente no pertenece al docente y ciclo.');
  const source = copias.find(c => c.estadoPresento === 'PRESENTO') ?? copias[0];
  const observaciones = await tx.itemObservacion.findMany({ where: { documentoTipo: 'PAAD', OR: [
    { docentePaadId: { in: fuentes } },
    { docentePaadId: null, planificacionId: { in: copias.map(c => c.planificacionId) } },
  ] } });
  const presentado = copias.some(c => c.estadoPresento === 'PRESENTO');
  const pendiente = observaciones.some(o => !o.resuelto);
  let presentacionId: string | null = null;
  if (presentado || pendiente) {
    const revision = await tx.presentacionPaad.upsert({
      where: { paadId_numero: { paadId, numero: 1 } }, update: {},
      create: { paadId, numero: 1, datosPaad: source.datosPaad as Prisma.InputJsonValue, createdAt: source.updatedAt },
    });
    presentacionId = revision.id;
  }
  for (const o of observaciones) {
    // Una observación genérica antigua puede corresponder a varios docentes.
    const legacyId = o.id + ':' + paadId;
    await tx.observacionPaad.upsert({ where: { legacyId }, update: {}, create: {
      legacyId, paadId, presentacionId, campoPath: o.campoPath, autorId: o.autorId,
      rolAutor: o.rolAutor, mensaje: o.mensaje, resuelto: o.resuelto, createdAt: o.createdAt,
    } });
  }
  return tx.paadAnual.update({ where: { id: paadId }, data: {
    datosPaad: source.datosPaad as Prisma.InputJsonValue, fuenteLegacyId: source.id,
    conflictoMigracion: false, legacyConvertido: true,
    estado: pendiente ? 'OBSERVADO' : presentado ? 'ENVIADO_A_REVISION' : 'BORRADOR',
  } });
}

export async function migrarPaads(db: PrismaClient) {
  const legacy = await db.paadDocente.findMany({ include: { planificacion: true }, orderBy: { updatedAt: 'desc' } });
  const grupos = new Map<string, typeof legacy>();
  for (const c of legacy) {
    const key = c.docenteId + ':' + c.planificacion.cicloLectivo;
    grupos.set(key, [...(grupos.get(key) ?? []), c]);
  }
  let convertidos = 0;
  let conflictos = 0;
  for (const copias of grupos.values()) {
    await db.$transaction(async tx => {
      const convertido = await tx.paadAnual.findUnique({ where: { docenteId_cicloLectivo: {
        docenteId: copias[0].docenteId, cicloLectivo: copias[0].planificacion.cicloLectivo,
      } } });
      if (convertido?.legacyConvertido) return;
      for (const c of copias) await tx.integrantePlanificacion.upsert({
        where: { planificacionId_docenteId: { planificacionId: c.planificacionId, docenteId: c.docenteId } }, update: {},
        create: { planificacionId: c.planificacionId, docenteId: c.docenteId, cargoEnCatedra: c.cargoEnCatedra },
      });
      const p = await asegurarPaad(tx, copias[0].docenteId, copias[0].planificacion.cicloLectivo);
      await tx.$queryRawUnsafe('SELECT id FROM "PaadAnual" WHERE id = $1 FOR UPDATE', p.id);
      const actual = await tx.paadAnual.findUniqueOrThrow({ where: { id: p.id } });
      if (actual.legacyConvertido) return;
      if (await tx.presentacionPaad.count({ where: { paadId: p.id } }) || !vacio(actual.datosPaad))
        throw new Error('El PAAD anual ya tiene actividad: convertir las copias antes de usar la aplicación.');
      const observaciones = await tx.itemObservacion.findMany({ where: { documentoTipo: 'PAAD', planificacionId: { in: copias.map(c => c.planificacionId) } } });
      const seleccion = elegirCopias(copias.map(c => {
        const propias = observaciones.filter(o => o.docentePaadId === c.id ||
          (o.docentePaadId === null && o.planificacionId === c.planificacionId));
        return { ...c, observaciones: propias.length, antecedentes: canonico(propias.map(o => ({
          autorId: o.autorId, rolAutor: o.rolAutor, campoPath: o.campoPath, mensaje: o.mensaje,
          resuelto: o.resuelto, fecha: o.createdAt.toISOString(),
        })).sort((a, b) => canonico(a).localeCompare(canonico(b)))) };
      }));
      if (seleccion.conflicto) {
        await tx.paadAnual.update({ where: { id: p.id }, data: { conflictoMigracion: true, legacyConvertido: true } });
        conflictos++;
      } else {
        await aplicarFuenteLegacy(tx, p.id, seleccion.ids);
        convertidos++;
      }
    }, { timeout: 20000 });
  }
  return { convertidos, conflictos };
}

export async function elegirFuenteMigracion(db: PrismaClient, paadId: string, fuenteId: string) {
  return db.$transaction(async tx => {
    await tx.$queryRawUnsafe('SELECT id FROM "PaadAnual" WHERE id = $1 FOR UPDATE', paadId);
    const p = await tx.paadAnual.findUniqueOrThrow({ where: { id: paadId } });
    if (!p.conflictoMigracion || await tx.presentacionPaad.count({ where: { paadId } })) throw new Error('El conflicto ya fue resuelto.');
    return aplicarFuenteLegacy(tx, paadId, [fuenteId]);
  });
}
