// Tipos del circuito de planificaciones (PAAC) — ver context/context.md.
import type { PaadContenido } from './paad';
import { paacTieneContenido, type PaacContenido } from './paac';
import type { InformeDisciplinarDatos, InformePedagogicoDatos } from './informes';

export type EstadoPlanif =
  | 'BORRADOR'
  | 'ENVIADO_A_REVISION'
  | 'OBSERVADO'
  | 'APROBADO_PEDAGOGICO'
  | 'APROBADO_DISCIPLINAR'
  | 'APROBADO_PLENO'
  | 'ELEVADO_AL_CONSEJO'
  | 'FINALIZADO';

export const ESTADO_LABELS: Record<EstadoPlanif, string> = {
  BORRADOR: 'Borrador',
  ENVIADO_A_REVISION: 'En revisión',
  OBSERVADO: 'Observado',
  APROBADO_PEDAGOGICO: 'Aprob. pedagógico',
  APROBADO_DISCIPLINAR: 'Aprob. disciplinar',
  APROBADO_PLENO: 'Evaluado favorablemente',
  ELEVADO_AL_CONSEJO: 'Elevado al Consejo',
  FINALIZADO: 'Finalizado',
};

/** En proceso: todavía falta algún dictamen o corrección. */
export const ESTADOS_ACTIVOS: EstadoPlanif[] = [
  'BORRADOR',
  'ENVIADO_A_REVISION',
  'OBSERVADO',
  'APROBADO_PEDAGOGICO',
  'APROBADO_DISCIPLINAR',
];

/** Históricas / aprobadas: ya cuentan con ambos dictámenes favorables. */
export const ESTADOS_HISTORICOS: EstadoPlanif[] = ['APROBADO_PLENO', 'ELEVADO_AL_CONSEJO', 'FINALIZADO'];

/** Valor guardado del dictamen en el informe. */
export type DictamenGuardado = 'PENDIENTE' | 'APROBADO' | 'OBSERVADO' | 'REEVALUACION';
/** Dictamen tal como se muestra en la bandeja. */
export type Dictamen = 'PENDIENTE' | 'FAVORABLE' | 'CON_OBSERVACIONES' | 'REEVALUACION';

export interface InformeEvaluacion {
  /** Valoración por ítem (índice de PEDITEMS / DISCITEMS). */
  items: Record<string, string>;
  dictamen?: DictamenGuardado;
  /** Observaciones del informe pedagógico (UAP). */
  obsGenerales?: string;
  /** Observaciones del informe disciplinar (Dirección). */
  obsDisciplinares?: string;
  /** Evaluador que emitió el informe. */
  by?: string;
  fecha?: string;
  /** Cuadro oficial del Informe Disciplinar (Anexo IV, Ord. 219/22). */
  disciplinar?: InformeDisciplinarDatos;
  /** Grilla oficial del Informe Pedagógico (Anexo III, Ord. 219/22). */
  pedagogico?: InformePedagogicoDatos;
}

/** Observación anclada a un campo del documento por UAP o Dirección. */
export interface ObservacionDoc {
  id: string;
  resolved: boolean;
  field?: string;
  campoPath?: string;
  /** Índice del apartado del esquema donde está el campo. */
  section?: number;
  area?: 'uap' | 'direccion';
  author?: string;
  text?: string;
  date?: string;
}

export type PaacData = Record<string, string | string[][] | undefined>;

export interface PaacDoc {
  id: string;
  type: 'PAAC';
  asignaturaId: string;
  /** Docente responsable / autor del PAAC. */
  owner: string;
  cycle: number;
  periodo: string;
  state: EstadoPlanif;
  pedApproved: boolean;
  discApproved: boolean;
  expediente: string;
  resolucion: string;
  data: PaacData;
  /** Contenido estructurado del PAAC (reemplaza a `data`, que queda solo por compatibilidad). */
  paac?: PaacContenido;
  pedReport: InformeEvaluacion;
  discReport: InformeEvaluacion;
  comments: ObservacionDoc[];
  /** true si hubo cambios después del último "Guardar borrador". */
  sinGuardar?: boolean;
  /** Hora del último guardado de borrador. */
  guardadoEn?: string;
}

/** Documento editable en DocumentFormView (PAAC o PAAD). */
export interface DocumentoEditable {
  id: string;
  type: 'PAAC' | 'PAAD';
  owner: string;
  cycle: number;
  state: string;
  asignaturaId?: string;
  data: PaacData;
  /** Contenido estructurado del PAAD (solo documentos PAAD). */
  paad?: PaadContenido;
  /** Contenido estructurado del PAAC (solo documentos PAAC). */
  paac?: PaacContenido;
  comments: ObservacionDoc[];
  /** Dictámenes de UAP (pedagógico) y Dirección (disciplinar). */
  pedReport?: InformeEvaluacion;
  discReport?: InformeEvaluacion;
  sinGuardar?: boolean;
  guardadoEn?: string;
}

export function esHistorica(d: Pick<PaacDoc, 'state'>): boolean {
  return ESTADOS_HISTORICOS.includes(d.state);
}

/** Un PAAC está iniciado si tiene algún campo cargado o ya salió de Borrador. */
/** Datos mínimos para saber la etapa del PAAC (sirve para PaacDoc y para DocumentoEditable). */
export type DatosEtapaPaac = { state: string } & Pick<PaacDoc, 'data' | 'paac'>;

export function paacIniciado(d: DatosEtapaPaac): boolean {
  if (d.state !== 'BORRADOR') return true;
  if (d.paac) return paacTieneContenido(d.paac);
  return Object.values(d.data ?? {}).some((v) => (Array.isArray(v) ? v.length > 0 : !!v && v.trim() !== ''));
}

/** Etapa de elaboración del documento PAAC (para la columna PAAC de la bandeja). */
export type EtapaPaac = 'SIN_INICIAR' | 'EN_ELABORACION' | 'EN_CORRECCION' | 'PRESENTADO';

export function etapaPaac(d: DatosEtapaPaac): EtapaPaac {
  if (!paacIniciado(d)) return 'SIN_INICIAR';
  if (d.state === 'BORRADOR') return 'EN_ELABORACION';
  if (d.state === 'OBSERVADO') return 'EN_CORRECCION';
  return 'PRESENTADO';
}

export const ETAPA_PAAC: Record<EtapaPaac, { label: string; cls: string }> = {
  SIN_INICIAR: { label: 'Sin iniciar', cls: 'text-muted' },
  EN_ELABORACION: { label: 'En elaboración', cls: 'text-amber-700 dark:text-amber-400' },
  EN_CORRECCION: { label: 'Correcciones', cls: 'text-amber-700 dark:text-amber-400' },
  PRESENTADO: { label: 'Presentado', cls: 'text-emerald-700 dark:text-emerald-400' },
};

/** Dictamen visible de un área: favorable si está aprobado, con observaciones si fue observado. */
export function dictamenDe(aprobado: boolean, informe: InformeEvaluacion | undefined): Dictamen {
  if (aprobado || informe?.dictamen === 'APROBADO') return 'FAVORABLE';
  if (informe?.dictamen === 'OBSERVADO') return 'CON_OBSERVACIONES';
  if (informe?.dictamen === 'REEVALUACION') return 'REEVALUACION';
  return 'PENDIENTE';
}

export const DICTAMEN_LABELS: Record<Dictamen, string> = {
  PENDIENTE: 'Pendiente',
  FAVORABLE: 'Favorable',
  CON_OBSERVACIONES: 'Con observaciones',
  REEVALUACION: 'En revisión',
};

export const DICTAMEN_BADGE: Record<Dictamen, string> = {
  PENDIENTE: 'bg-slate-500/15 text-muted',
  FAVORABLE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  CON_OBSERVACIONES: 'bg-red-500/15 text-red-700 dark:text-red-400',
  REEVALUACION: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
};
