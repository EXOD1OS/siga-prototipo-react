// Tipos de la estructura académica (ver diagrama de context/context.md).

export type Regimen = 'ANUAL' | '1C' | '2C';
export type Enfoque = 'COMPETENCIAS' | 'TRADICIONAL';
export type TipoPeriodo = '1C' | '2C';

export interface Sede {
  id: string;
  nombre: string;
  /** Sede Capital: tiene departamentos. Sedes regionales: jerarquía directa. */
  esCapital: boolean;
}

export interface Departamento {
  id: string;
  nombre: string;
  sedeId: string;
}

export interface Carrera {
  id: string;
  /** Código único de la carrera (ej. TUI-CHAM). */
  codigo: string;
  /** Sigla legible para listados (ej. ISI, LSI, TUI). */
  sigla: string;
  nombre: string;
  sedeId: string;
  /** null en sedes regionales (sin departamento). */
  departamentoId: string | null;
  directorId: string;
}

export interface PlanEstudio {
  id: string;
  carreraId: string;
  ordenanza: string;
  enfoque: Enfoque;
  activo: boolean;
}

export interface Asignatura {
  id: string;
  planEstudioId: string;
  /** Departamento que dicta la materia. Si difiere del de la carrera, es matricial. */
  departamentoRadicacionId: string | null;
  /** Código de la materia en el plan (ej. ISI-1.01). */
  codigo: string;
  nombre: string;
  anoCursada: number;
  regimenDictado: Regimen;
  horasSemanales: number;
  horasTotales: number;
  contenidosMinimos: string;
  /** Nivel de intensidad de la formación práctica (1, 2 o 3), si la cátedra lo tiene cargado. */
  nivelIntensidad?: string;
  /** Relación teórica-práctica (ej. "T = P"), si la cátedra la tiene cargada. */
  relacionTeoricaPractica?: string;
}

/**
 * Rol base de la cuenta de usuario (catálogo cerrado).
 * Para un Docente, el cargo (Titular, Adjunto, JTP…) y si es Responsable
 * se definen por cátedra en EQUIPOS_CATEDRA, no en la cuenta.
 * (El selector "Vista de Rol" del Header simula sesiones y es independiente de este tipo.)
 */
export type Rol = 'Docente' | 'Director' | 'UAP' | 'Consejo' | 'Administrador';

export const ROLES_ORDENADOS: Rol[] = ['Docente', 'Director', 'UAP', 'Consejo', 'Administrador'];

/** Descripción corta de cada rol, para ayudas del formulario. */
export const ROL_DESCRIPCION: Record<Rol, string> = {
  Docente: 'Integra equipos de cátedra; el cargo se define en cada una.',
  Director: 'Dirección de una carrera: evalúa sus PAAC y PAAD.',
  UAP: 'Unidad de Asesoramiento Pedagógico, transversal a las carreras.',
  Consejo: 'Consejo Departamental: dictamen y resolución final.',
  Administrador: 'Gestiona usuarios, estructura y ciclos lectivos.',
};

/** Clases del badge de cada rol en la tabla. */
export const ROL_BADGE: Record<Rol, string> = {
  Docente: 'bg-soft text-primary',
  Director: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  UAP: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  Consejo: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  Administrador: 'bg-slate-500/15 text-ink',
};

export const esRolDocente = (rol: Rol) => rol === 'Docente';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  rol: Rol;
  carreraId: string | null;
  mustChangePassword: boolean;
  activo: boolean;
}

export interface EquipoCatedra {
  id: string;
  asignaturaId: string;
  docenteId: string;
  cicloLectivo: number;
  cargo: string;
  esResponsable: boolean;
}

export interface PeriodoAcademico {
  id: string;
  cicloLectivo: number;
  tipoPeriodo: TipoPeriodo;
  alcance: string;
  fechaLimite: string;
}

/** Datos mínimos de un documento (PAAC/PAAD) que necesita la vista de estructura. */
export interface DocumentoResumen {
  id: string;
  type: string;
  owner: string;
  state: string;
  periodo?: string;
  asignaturaId?: string;
}

export interface AsigContext {
  asig?: Asignatura;
  plan?: PlanEstudio;
  carrera?: Carrera;
  sede?: Sede;
  depto?: Departamento | null;
  radicacion?: Departamento | null;
}

/** Integrante del equipo tal como se edita en el modal (aún no guardado). */
export interface IntegranteBorrador {
  id: string;
  docenteId: string;
  cargo: string;
  esResponsable: boolean;
}

/** Datos editables de un usuario en el formulario de alta/edición. */
export interface UsuarioDraft {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  rol: Rol;
  /** Solo para Director: carrera que dirige. */
  carreraId: string | null;
  activo: boolean;
  /** Cátedras del docente en el ciclo vigente (se persisten en EQUIPOS_CATEDRA). */
  catedras: CatedraAsignada[];
}

/** Vínculo de un docente con una cátedra: un registro de EQUIPOS_CATEDRA visto desde el usuario. */
export interface CatedraAsignada {
  asignaturaId: string;
  asignaturaNombre: string;
  carreraId: string;
  carreraCodigo: string;
  cargo: string;
  esResponsable: boolean;
}

/** Usuario con sus cátedras del ciclo vigente (vacío si no es Docente). */
export interface UsuarioConCatedras extends Usuario {
  catedras: CatedraAsignada[];
}

export const CARGOS_CATEDRA = [
  'Profesor Titular',
  'Profesor Asociado',
  'Profesor Adjunto',
  'Jefe de Trabajos Prácticos',
  'Ayudante de Primera',
] as const;
