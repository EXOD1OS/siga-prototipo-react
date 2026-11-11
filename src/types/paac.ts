// PAAC — Programa de Actividades Académicas de la Cátedra (DACEFyN – UNLaR).
// Los campos narrativos guardan HTML saneado (ver lib/richText.ts).
import { htmlTieneTexto } from '../lib/richText';
import { DIAS_PAAD, type DiaPaad } from './paad';

export type NivelAporte = 0 | 1 | 2 | 3;
export const NIVELES_APORTE: readonly NivelAporte[] = [0, 1, 2, 3];

export const NIVEL_APORTE_LABEL: Record<NivelAporte, { nombre: string; detalle: string }> = {
  0: { nombre: 'Ninguna', detalle: 'No contribuye' },
  1: { nombre: 'Baja', detalle: 'Contribuye en alguna medida / sirve de fundamento' },
  2: { nombre: 'Media', detalle: 'Contribuye de manera significativa' },
  3: { nombre: 'Alta', detalle: 'Tributa directamente a la competencia' },
};

export type GrupoCompetencia = 'tecnologicas' | 'sociales';

export const GRUPO_CG_LABEL: Record<GrupoCompetencia, string> = {
  tecnologicas: 'Competencias Tecnológicas',
  sociales: 'Competencias Sociales, Políticas y Actitudinales',
};

/** Competencias generales de egreso (fijas). */
export const COMPETENCIAS_GENERALES: readonly { codigo: string; grupo: GrupoCompetencia; texto: string }[] = [
  { codigo: 'CG1', grupo: 'tecnologicas', texto: 'Identificar, formular y resolver problemas de ingeniería.' },
  { codigo: 'CG2', grupo: 'tecnologicas', texto: 'Concebir, diseñar y desarrollar proyectos de ingeniería.' },
  { codigo: 'CG3', grupo: 'tecnologicas', texto: 'Gestionar, planificar, ejecutar y controlar proyectos de ingeniería.' },
  { codigo: 'CG4', grupo: 'tecnologicas', texto: 'Utilizar de manera efectiva las técnicas y herramientas de aplicación en la ingeniería.' },
  { codigo: 'CG5', grupo: 'tecnologicas', texto: 'Contribuir a la generación de desarrollos tecnológicos y/o innovación tecnológica.' },
  { codigo: 'CG6', grupo: 'sociales', texto: 'Desempeñarse de manera efectiva en equipos de trabajo.' },
  { codigo: 'CG7', grupo: 'sociales', texto: 'Comunicarse con efectividad.' },
  {
    codigo: 'CG8',
    grupo: 'sociales',
    texto:
      'Actuar con ética, responsabilidad profesional y compromiso social, considerando el impacto económico, social y ambiental de su actividad en el contexto local, regional y global.',
  },
  { codigo: 'CG9', grupo: 'sociales', texto: 'Aprender en forma continua y autónoma.' },
  { codigo: 'CG10', grupo: 'sociales', texto: 'Actuar con espíritu emprendedor.' },
];

export interface CompetenciaEspecifica {
  id: string;
  codigo: string;
  detalle: string;
  nivel: NivelAporte | null;
}

export interface ResultadoAprendizaje {
  id: string;
  codigo: string;
  descripcion: string;
}

export interface PropuestaCompetencia {
  id: string;
  competencia: string;
  ra: string;
  unidades: string;
  guiaTp: string;
  actividad: string;
  estrategia: string;
}

export interface UnidadTematica {
  id: string;
  numero: string;
  titulo: string;
  /** HTML enriquecido. */
  contenidos: string;
  resultados: string;
}

export const MODALIDADES_TP = ['Individual', 'Grupal', 'Individual y Grupal', 'Actividades en clases Prácticas y en plataforma'] as const;

export interface TrabajoPractico {
  id: string;
  numero: string;
  titulo: string;
  proposito: string;
  modalidad: string;
  unidadTemas: string;
}

export const TIPOS_EVALUACION = ['Formativa', 'Sumativa', 'Formativa / Sumativa'] as const;

export interface FilaEvaluacion {
  id: string;
  tipo: string;
  criterios: string;
  ra: string;
  tecnica: string;
}

export interface LibroFisico {
  id: string;
  titulo: string;
  autores: string;
  editorial: string;
  ejemplares: string;
  anio: string;
}

export interface LibroDigital {
  id: string;
  titulo: string;
  autores: string;
  editorial: string;
  url: string;
  anio: string;
}

export interface BloqueBibliografia {
  fisica: LibroFisico[];
  digital: LibroDigital[];
}

export const FILAS_HORARIO = ['teoricas', 'practicas'] as const;
export type FilaHorario = (typeof FILAS_HORARIO)[number];
export const FILA_HORARIO_LABEL: Record<FilaHorario, string> = { teoricas: 'Horas Teóricas', practicas: 'Horas Prácticas' };
export type HorarioClases = Record<FilaHorario, Record<DiaPaad, string>>;

export interface SemanaCronograma {
  id: string;
  semana: string;
  unidad: string;
  horasTeoria: string;
  tp: string;
  horasPractica: string;
  tpl: string;
  horasLab: string;
  tplCampo: string;
  horasCampo: string;
  evaluacion: string;
  horasEval: string;
}

/** Columnas de horas del cronograma que suman en la fila TOTAL. */
export const HORAS_CRONOGRAMA = ['horasTeoria', 'horasPractica', 'horasLab', 'horasCampo', 'horasEval'] as const;
export type ColumnaHorasCronograma = (typeof HORAS_CRONOGRAMA)[number];

export interface PaacContenido {
  /** Se usan solo si la asignatura no los trae cargados de la base de datos. */
  nivelIntensidad: string;
  relacionTP: string;
  // 1) Fundamentación
  importancia: string;
  competenciasGenerales: Record<string, NivelAporte | null>;
  competenciasEspecificas: CompetenciaEspecifica[];
  // 2) Diagnóstico
  diagnostico: { correlativas: string; mismoAnio: string; estudiantes: string; infraestructura: string };
  // 3) Objetivo, propósito y RA
  objetivosCarrera: string;
  proposito: string;
  resultados: ResultadoAprendizaje[];
  // 4) Metodología
  metodologia: string;
  propuesta: PropuestaCompetencia[];
  // 5) Contenidos
  unidades: UnidadTematica[];
  // 6) Trabajos prácticos
  tpIntro: string;
  trabajosPracticos: TrabajoPractico[];
  // 7) Evaluación
  evalDescripcion: string;
  evaluacion: FilaEvaluacion[];
  regimen: { promocionales: string; regulares: string; libres: string };
  // 8) Bibliografía
  bibliografia: { basica: BloqueBibliografia; complementaria: BloqueBibliografia };
  // 9) Horarios y cronograma
  horarios: HorarioClases;
  cronograma: SemanaCronograma[];
  notasCronograma: string;
}

let contador = 0;
/** Id local para filas nuevas. */
export const nuevoId = (prefijo = 'f') => `${prefijo}-${Date.now().toString(36)}-${(contador++).toString(36)}`;

const filaDias = (): Record<DiaPaad, string> => Object.fromEntries(DIAS_PAAD.map((d) => [d, ''])) as Record<DiaPaad, string>;

export const horarioVacio = (): HorarioClases => ({ teoricas: filaDias(), practicas: filaDias() });

export const semanaVacia = (n: number): SemanaCronograma => ({
  id: nuevoId('sem'),
  semana: String(n),
  unidad: '',
  horasTeoria: '',
  tp: '',
  horasPractica: '',
  tpl: '',
  horasLab: '',
  tplCampo: '',
  horasCampo: '',
  evaluacion: '',
  horasEval: '',
});

export function paacVacio(): PaacContenido {
  return {
    nivelIntensidad: '',
    relacionTP: '',
    importancia: '',
    competenciasGenerales: Object.fromEntries(COMPETENCIAS_GENERALES.map((c) => [c.codigo, null])),
    competenciasEspecificas: [],
    diagnostico: { correlativas: '', mismoAnio: '', estudiantes: '', infraestructura: '' },
    objetivosCarrera: '',
    proposito: '',
    resultados: [],
    metodologia: '',
    propuesta: [],
    unidades: [],
    tpIntro: '',
    trabajosPracticos: [],
    evalDescripcion: '',
    evaluacion: [],
    regimen: { promocionales: '', regulares: '', libres: '' },
    bibliografia: { basica: { fisica: [], digital: [] }, complementaria: { fisica: [], digital: [] } },
    horarios: horarioVacio(),
    cronograma: [],
    notasCronograma: '',
  };
}

/** true si el PAAC tiene algo cargado (para la columna "PAAC" de la bandeja). */
export function paacTieneContenido(c: PaacContenido): boolean {
  const textos = [
    c.importancia,
    c.objetivosCarrera,
    c.proposito,
    c.metodologia,
    c.tpIntro,
    c.evalDescripcion,
    ...Object.values(c.diagnostico),
    ...Object.values(c.regimen),
  ];
  const listas = [
    c.competenciasEspecificas,
    c.resultados,
    c.propuesta,
    c.unidades,
    c.trabajosPracticos,
    c.evaluacion,
    c.cronograma,
    c.bibliografia.basica.fisica,
    c.bibliografia.basica.digital,
  ];
  return textos.some(htmlTieneTexto) || listas.some((l) => l.length > 0) || Object.values(c.competenciasGenerales).some((n) => n !== null);
}
