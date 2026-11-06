import type { EquipoCatedra } from '../types/estructura';
import type { PaacDoc } from '../types/planificacion';

/** Sesión simulada (selector "Vista de Rol" del Header). */
export interface SesionActiva {
  /** Perfil de sesión: DOCENTE_RESPONSABLE, DOCENTE_AUXILIAR, DIRECCION_CARRERA, UAP, CONSEJO_DEPARTAMENTAL, ADMINISTRADOR. */
  role: string;
  /** Docente activo (solo para perfiles docentes). */
  uid: string;
  /** Carrera de la Dirección activa (solo para DIRECCION_CARRERA). */
  careerId: string;
}

export const esSesionDocente = (role: string) => role.startsWith('DOCENTE');

/** Roles con visibilidad sobre todas las carreras del departamento. */
export const ROLES_DEPARTAMENTALES = ['UAP', 'CONSEJO_DEPARTAMENTAL', 'ADMINISTRADOR'];

/**
 * Qué planificaciones ve cada perfil (paridad con lib/visibilidad.ts del sistema anterior):
 * - Docente: aquellas de las que es responsable/autor o integra el equipo de cátedra
 *   (en el ciclo de la planificación o en el ciclo vigente).
 * - Dirección de Carrera: todas las de su carrera, en proceso e históricas.
 * - UAP, Consejo y Administrador: todas.
 */
export function puedeVerPlanificacion(
  doc: PaacDoc,
  sesion: SesionActiva,
  ctx: { carreraId?: string; equipos: EquipoCatedra[]; cicloVigente: number }
): boolean {
  if (ROLES_DEPARTAMENTALES.includes(sesion.role)) return true;
  if (sesion.role === 'DIRECCION_CARRERA') return !!ctx.carreraId && ctx.carreraId === sesion.careerId;
  if (esSesionDocente(sesion.role)) {
    if (doc.owner === sesion.uid) return true;
    return ctx.equipos.some(
      (e) =>
        e.asignaturaId === doc.asignaturaId &&
        e.docenteId === sesion.uid &&
        (e.cicloLectivo === doc.cycle || e.cicloLectivo === ctx.cicloVigente)
    );
  }
  return false;
}
