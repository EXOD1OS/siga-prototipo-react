// Datos y navegación comunes a los dashboards de Inicio.
import type { AsigContext, Carrera } from '../../../types/estructura';
import type { ObservacionDoc, PaacDoc } from '../../../types/planificacion';
import type { FiltrosPaac, FiltrosPaad } from '../../../types/navegacion';

/** PAAD tal como lo necesitan los dashboards. */
export interface PaadFila {
  id: string;
  owner: string;
  state: string;
  cycle: number;
  /** Dirección de Carrera que evalúa el PAAD (es el filtro de carrera de la bandeja de PAAD). */
  evalCareer?: string;
  comments: ObservacionDoc[];
}

export interface NavDashboard {
  goToPlanificaciones: (f?: FiltrosPaac) => void;
  goToPaads: (f?: FiltrosPaad) => void;
  onOpenDoc: (id: string) => void;
  onOpenReport: (id: string) => void;
}

export interface DatosDashboard {
  nombre: string;
  ciclo: number;
  paacs: PaacDoc[];
  paads: PaadFila[];
  carreras: Carrera[];
  asigContext: (id: string) => AsigContext;
  fullName: (id: string) => string;
}

export const ESTADOS_REVISION_PAAC = ['ENVIADO_A_REVISION', 'APROBADO_PEDAGOGICO', 'APROBADO_DISCIPLINAR'];
export const ESTADOS_FAVORABLES = ['APROBADO_PLENO', 'ELEVADO_AL_CONSEJO', 'FINALIZADO'];

export const contar = <T,>(lista: T[], pred: (x: T) => boolean) => lista.filter(pred).length;

/** PAAC de una carrera. */
export const paacsDe = (paacs: PaacDoc[], carreraId: string, asigContext: (id: string) => AsigContext) =>
  paacs.filter((d) => asigContext(d.asignaturaId).carrera?.id === carreraId);

/** Conteo de PAAD por estado. */
export function estadosPaad(paads: PaadFila[]) {
  return {
    borrador: contar(paads, (d) => d.state === 'BORRADOR'),
    revision: contar(paads, (d) => d.state === 'ENVIADO_A_REVISION'),
    observado: contar(paads, (d) => d.state === 'OBSERVADO'),
    aprobado: contar(paads, (d) => d.state === 'APROBADO'),
  };
}
