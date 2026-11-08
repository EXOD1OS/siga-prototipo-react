// PAAD — Plan Anual de Actividades del Docente (Anexo III, Ord. Nº 171/19).

export const DIAS_PAAD = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
export type DiaPaad = (typeof DIAS_PAAD)[number];

export const DIA_LABEL: Record<DiaPaad, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
};

export const ACTIVIDADES_PAAD = ['ensenanza', 'investigacion', 'extension', 'formacion', 'gestion'] as const;
export type ActividadPaad = (typeof ACTIVIDADES_PAAD)[number];

export const ACTIVIDAD_LABEL: Record<ActividadPaad, string> = {
  ensenanza: 'Enseñanza',
  investigacion: 'Investigación',
  extension: 'Extensión',
  formacion: 'Formación',
  gestion: 'Gestión',
};

/** Horas por actividad y día (texto numérico, ej. "3"). */
export type MatrizHoras = Record<ActividadPaad, Record<DiaPaad, string>>;

/** Cada lista de ítems del formulario, en el orden del documento oficial. */
export type ListaPaad =
  | 'cursos'
  | 'capacitaciones'
  | 'materiales'
  | 'otrosDocentes'
  | 'investigacion'
  | 'recursosHumanos'
  | 'formacionAcademica'
  | 'extension'
  | 'gestion'
  | 'otras';

export interface PaadContenido {
  /** Cátedra de referencia para los Aspectos Generales. */
  asignaturaId: string | null;
  listas: Record<ListaPaad, string[]>;
  horas: MatrizHoras;
}

/** Datos de la ficha "Aspectos Generales" (autocompletados, solo lectura). */
export interface AspectosGeneralesPaad {
  profesorACargo: string;
  presentadoPor: string;
  anio: string;
  sede: string;
  departamento: string;
  carrera: string;
  planEstudio: string;
  asignatura: string;
  curso: string;
  regimen: string;
}

export function matrizVacia(): MatrizHoras {
  const fila = (): Record<DiaPaad, string> => ({ lunes: '', martes: '', miercoles: '', jueves: '', viernes: '', sabado: '' });
  return { ensenanza: fila(), investigacion: fila(), extension: fila(), formacion: fila(), gestion: fila() };
}

export function paadVacio(asignaturaId: string | null = null): PaadContenido {
  return {
    asignaturaId,
    listas: {
      cursos: [],
      capacitaciones: [],
      materiales: [],
      otrosDocentes: [],
      investigacion: [],
      recursosHumanos: [],
      formacionAcademica: [],
      extension: [],
      gestion: [],
      otras: [],
    },
    horas: matrizVacia(),
  };
}

/** Convierte una celda de horas en número (vacío o inválido = 0). */
export function horasDe(v: string | undefined): number {
  const n = Number(String(v ?? '').replace(',', '.').replace(/hs?\.?/i, '').trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** "3" → "3 hs"; vacío → "". */
export function formatoHoras(v: string | undefined): string {
  const n = horasDe(v);
  return n > 0 ? `${n} hs` : '';
}
