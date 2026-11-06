// Tipos del circuito de planificaciones (PAAC) — ver context/context.md.

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
  APROBADO_PLENO: 'Aprobado pleno',
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
export type DictamenGuardado = 'PENDIENTE' | 'APROBADO' | 'OBSERVADO';
/** Dictamen tal como se muestra en la bandeja. */
export type Dictamen = 'PENDIENTE' | 'FAVORABLE' | 'CON_OBSERVACIONES';

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
}

export interface ObservacionDoc {
  id: string;
  resolved: boolean;
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
  pedReport: InformeEvaluacion;
  discReport: InformeEvaluacion;
  comments: ObservacionDoc[];
}

export function esHistorica(d: Pick<PaacDoc, 'state'>): boolean {
  return ESTADOS_HISTORICOS.includes(d.state);
}

/** Dictamen visible de un área: favorable si está aprobado, con observaciones si fue observado. */
export function dictamenDe(aprobado: boolean, informe: InformeEvaluacion | undefined): Dictamen {
  if (aprobado || informe?.dictamen === 'APROBADO') return 'FAVORABLE';
  if (informe?.dictamen === 'OBSERVADO') return 'CON_OBSERVACIONES';
  return 'PENDIENTE';
}

export const DICTAMEN_LABELS: Record<Dictamen, string> = {
  PENDIENTE: 'Pendiente',
  FAVORABLE: 'Favorable',
  CON_OBSERVACIONES: 'Con observaciones',
};

export const DICTAMEN_BADGE: Record<Dictamen, string> = {
  PENDIENTE: 'bg-slate-500/15 text-muted',
  FAVORABLE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  CON_OBSERVACIONES: 'bg-red-500/15 text-red-700 dark:text-red-400',
};
