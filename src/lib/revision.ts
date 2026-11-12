// Cierre de revisión (UAP / Dirección), devolución al docente y reenvío.
// Basado en registrarAprobacionPedagogica / registrarAprobacionDisciplinar / enviarARevision
// del sistema anterior (context/Interfaz antigua/src/actions/planificacion.actions.ts).
import type { InformeEvaluacion, ObservacionDoc } from '../types/planificacion';

export type AreaRevision = 'uap' | 'direccion';
export type ResultadoRevision = 'OBSERVADO' | 'FAVORABLE';

/** Lo mínimo que necesita un PAAC o PAAD para recorrer el circuito de revisión. */
export interface DocRevisable {
  type: string;
  state: string;
  pedApproved: boolean;
  discApproved: boolean;
  pedReport?: InformeEvaluacion;
  discReport?: InformeEvaluacion;
  comments: ObservacionDoc[];
}

/** Estados en los que UAP y Dirección pueden observar y cerrar su revisión. */
export const ESTADOS_EN_REVISION = ['ENVIADO_A_REVISION', 'APROBADO_PEDAGOGICO', 'APROBADO_DISCIPLINAR'];

export const AREA_LABEL: Record<AreaRevision, { corto: string; dictamen: string }> = {
  uap: { corto: 'UAP', dictamen: 'dictamen pedagógico' },
  direccion: { corto: 'Dirección de Carrera', dictamen: 'dictamen disciplinar' },
};

/** Área que revisa según el perfil de la sesión (null si no evalúa). */
export function areaDeRol(role: string): AreaRevision | null {
  if (role === 'UAP') return 'uap';
  if (role === 'DIRECCION_CARRERA') return 'direccion';
  return null;
}

const claves = (area: AreaRevision) =>
  area === 'uap'
    ? ({ informe: 'pedReport', aprobado: 'pedApproved' } as const)
    : ({ informe: 'discReport', aprobado: 'discApproved' } as const);

/** Observaciones de un área que el docente todavía no subsanó. */
export const observacionesPendientesDe = (d: Pick<DocRevisable, 'comments'>, area: AreaRevision) =>
  d.comments.filter((o) => !o.resolved && o.area === area).length;

export const tieneDictamenObservado = (d: Pick<DocRevisable, 'pedReport' | 'discReport'>) =>
  d.pedReport?.dictamen === 'OBSERVADO' || d.discReport?.dictamen === 'OBSERVADO';

/**
 * El docente puede editar en Borrador, en Observado o si algún dictamen quedó "Con observaciones".
 * Presentado (en revisión) y Aprobado quedan en lectura.
 */
export function esEditablePorDocente(d: Pick<DocRevisable, 'state' | 'pedReport' | 'discReport'>): boolean {
  return ['BORRADOR', 'OBSERVADO'].includes(d.state) || tieneDictamenObservado(d);
}

/** Estado general a partir de los dictámenes (sin observaciones abiertas). */
function estadoSegunDictamenes(d: DocRevisable): string {
  if (d.pedApproved && d.discApproved) return d.type === 'PAAD' ? 'APROBADO' : 'APROBADO_PLENO';
  if (d.type === 'PAAD') return 'ENVIADO_A_REVISION';
  if (d.pedApproved) return 'APROBADO_PEDAGOGICO';
  if (d.discApproved) return 'APROBADO_DISCIPLINAR';
  return 'ENVIADO_A_REVISION';
}

export interface ResultadoTransicion<T> {
  doc: T;
  error?: string;
}

/** Cierra la revisión de un área: con observaciones (devuelve al docente) o favorable. */
export function finalizarRevision<T extends DocRevisable>(
  doc: T,
  area: AreaRevision,
  resultado: ResultadoRevision,
  firma: { autor: string; fecha: string },
  /** Contenido del informe (Anexo III / IV) que se guarda junto con el dictamen. */
  datosInforme?: Partial<InformeEvaluacion>
): ResultadoTransicion<T> {
  const { informe, aprobado } = claves(area);
  if (resultado === 'FAVORABLE' && observacionesPendientesDe(doc, area) > 0) {
    return { doc, error: 'No se puede emitir un dictamen favorable mientras tengas observaciones sin subsanar.' };
  }
  const base: InformeEvaluacion = { items: {}, ...doc[informe], ...datosInforme };
  const next = {
    ...doc,
    [informe]: { ...base, dictamen: resultado === 'FAVORABLE' ? 'APROBADO' : 'OBSERVADO', by: firma.autor, fecha: firma.fecha },
    [aprobado]: resultado === 'FAVORABLE',
  } as T;
  // Si cualquiera de las dos áreas dejó observaciones, el documento vuelve al docente.
  const state = resultado === 'OBSERVADO' || tieneDictamenObservado(next) ? 'OBSERVADO' : estadoSegunDictamenes(next);
  return { doc: { ...next, state } as T };
}

/**
 * Presentación del docente. Si venía observado ("Subsanar y volver a presentar"),
 * los dictámenes observados vuelven a "En revisión" y los favorables se conservan.
 */
export function presentarDocumento<T extends DocRevisable>(doc: T): T {
  const reevaluar = (inf: InformeEvaluacion | undefined): InformeEvaluacion | undefined =>
    inf?.dictamen === 'OBSERVADO' ? { ...inf, dictamen: 'REEVALUACION' } : inf;
  const next = { ...doc, pedReport: reevaluar(doc.pedReport), discReport: reevaluar(doc.discReport) } as T;
  return { ...next, state: estadoSegunDictamenes(next) } as T;
}

/** true si la presentación es un reenvío tras observaciones. */
export const esReenvio = (d: Pick<DocRevisable, 'state' | 'pedReport' | 'discReport'>) => d.state === 'OBSERVADO' || tieneDictamenObservado(d);
