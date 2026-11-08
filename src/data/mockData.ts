import type {
  Asignatura,
  Carrera,
  CatedraAsignada,
  Departamento,
  EquipoCatedra,
  PeriodoAcademico,
  PlanEstudio,
  Sede,
  Usuario,
  UsuarioConCatedras,
} from '../types/estructura';
import { matrizVacia, paadVacio, type PaadContenido } from '../types/paad';

/**
 * Perfiles del selector "Vista de Rol" (simulación de sesión del prototipo).
 * Para el rol de cuenta de un usuario usar el tipo Rol de types/estructura.
 */
export const ROLES: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  DOCENTE_RESPONSABLE: 'Docente Responsable',
  DOCENTE_AUXILIAR: 'Docente Auxiliar',
  UAP: 'UAP (Asesoría Pedagógica)',
  DIRECCION_CARRERA: 'Dirección de Carrera',
  CONSEJO_DEPARTAMENTAL: 'Consejo Departamental',
};

/** Columna tipada de una tabla dinámica del documento. */
export interface ColumnSpec {
  label: string;
  /** `equipo`: selector con los integrantes del equipo de cátedra. */
  type?: 'text' | 'number' | 'select' | 'date' | 'equipo';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  /** Ancho sugerido (clase Tailwind). */
  width?: string;
}

export interface SchemaField {
  key: string;
  label: string;
  /** `horas`: tabla fija de distribución horaria con totales calculados. */
  type: 'text' | 'table' | 'select' | 'horas';
  /** Columnas de texto simple (esquema PAAD). */
  cols?: string[];
  /** Columnas tipadas (esquema PAAC). Si existen, tienen prioridad sobre `cols`. */
  columns?: ColumnSpec[];
  options?: string[];
  required?: boolean;
  /** Mínimo de filas exigido al presentar (tablas). */
  minRows?: number;
  hint?: string;
  addLabel?: string;
  /** Fila nueva precargada (recibe la cantidad de filas actuales). */
  newRow?: (n: number) => string[];
  campoPath: string;
}

export interface SchemaSection {
  title: string;
  norm: string;
  fields: SchemaField[];
}

/** Filas fijas de la Distribución Horaria. `computa`: suma para la carga horaria del plan. */
export const HORAS_ACTIVIDADES = [
  { label: 'Clases teóricas', computa: true },
  { label: 'Clases prácticas / resolución de problemas', computa: true },
  { label: 'Laboratorio / trabajo de campo / aula de informática', computa: true },
  { label: 'Consulta y tutoría de cátedra', computa: false },
] as const;

export const TIPOS_CLASE = ['Teórica', 'Práctica', 'Teórico-práctica', 'Laboratorio', 'Evaluación', 'Consulta'];

export const PAAC_SCHEMA: SchemaSection[] = [
  { title: 'A. Aspectos Generales', norm: 'A. DATOS DE ENCABEZADO Y EQUIPO DOCENTE', fields: [] },
  {
    title: '1. Fundamentación y Diagnóstico',
    norm: '1. FUNDAMENTACIÓN Y DIAGNÓSTICO',
    fields: [
      { key: 'intro', label: '1.1. Fundamentación e importancia en el plan de estudios', type: 'text', required: true, campoPath: 'fundamentacionDiagnostico.introduccion' },
      { key: 'diag', label: '1.2. Diagnóstico: articulación horizontal/vertical e infraestructura', type: 'text', required: true, campoPath: 'fundamentacionDiagnostico.diagnostico' },
    ],
  },
  {
    title: '2. Objetivos y Competencias',
    norm: '2. OBJETIVOS GENERALES Y MATRIZ DE COMPETENCIAS (ORD. 448/11)',
    fields: [
      { key: 'concept', label: '2.1. Objetivos conceptuales', type: 'text', required: true, campoPath: 'objetivosGenerales.conceptuales' },
      { key: 'procedure', label: '2.2. Objetivos procedimentales', type: 'text', required: true, campoPath: 'objetivosGenerales.procedimentales' },
      { key: 'attitude', label: '2.3. Objetivos actitudinales', type: 'text', required: true, campoPath: 'objetivosGenerales.actitudinales' },
      {
        key: 'competencias', label: '2.4. Matriz de Competencias (Ord. HCS 448/11 - Nivel de Aporte 0 a 3)', type: 'table',
        hint: 'Obligatoria en planes por competencias.', addLabel: 'Agregar competencia',
        columns: [
          { label: 'Tipo', type: 'select', options: ['Genérica', 'Específica'], required: true, width: 'w-32' },
          { label: 'Descripción de la competencia', required: true },
          { label: 'Nivel de aporte', type: 'select', options: ['0', '1', '2', '3'], required: true, width: 'w-24' },
          { label: 'Descriptores de aprendizaje' },
        ],
        campoPath: 'paacCompetencias.matriz',
      },
    ],
  },
  {
    title: '3. Metodología de Enseñanza',
    norm: '3. METODOLOGÍA DE ENSEÑANZA Y RECURSOS',
    fields: [
      { key: 'method', label: '3.1. Metodología de clases teóricas, prácticas y de laboratorio', type: 'text', required: true, campoPath: 'metodologiaEnsenanza.metodologia' },
      { key: 'resources', label: '3.2. Recursos didácticos y entorno virtual', type: 'text', campoPath: 'metodologiaEnsenanza.recursos' },
    ],
  },
  {
    title: '4. Contenidos y Unidades',
    norm: 'B. ASPECTOS CURRICULARES · 1. UNIDADES Y CONTENIDOS',
    fields: [
      {
        key: 'units', label: 'Unidades temáticas y desarrollo analítico', type: 'table', required: true, minRows: 1, addLabel: 'Agregar unidad',
        newRow: (n) => [`Unidad ${n + 1}: `, ''],
        columns: [
          { label: 'Unidad', required: true, width: 'w-64' },
          { label: 'Contenidos analíticos', required: true },
        ],
        campoPath: 'aspectosCurriculares.unidades',
      },
    ],
  },
  {
    title: '5. Trabajos Prácticos',
    norm: '2 y 3. PLANIFICACIÓN DE TRABAJOS PRÁCTICOS Y LABORATORIO',
    fields: [
      {
        key: 'tp', label: 'Planificación de Trabajos Prácticos', type: 'table', required: true, minRows: 1, addLabel: 'Agregar Trabajo Práctico',
        newRow: (n) => [String(n + 1), '', 'Individual', 'Aula', '', ''],
        columns: [
          { label: 'N° TP', type: 'number', required: true, width: 'w-16' },
          { label: 'Título / Tema', required: true },
          { label: 'Modalidad', type: 'select', options: ['Individual', 'Grupal'], required: true, width: 'w-28' },
          { label: 'Ámbito', type: 'select', options: ['Laboratorio', 'Aula', 'Virtual'], required: true, width: 'w-28' },
          { label: 'Horas est.', type: 'number', required: true, width: 'w-20' },
          { label: 'Criterio / fecha tentativa de entrega', placeholder: 'Ej. Semana 4 · rúbrica', width: 'w-56' },
        ],
        campoPath: 'trabajosPracticos.listado',
      },
      { key: 'lab', label: 'Programa de Trabajos Prácticos de Laboratorio y Equipamiento', type: 'text', campoPath: 'trabajosPracticos.laboratorio' },
    ],
  },
  {
    title: '6. Distribución Horaria',
    norm: '7. DISTRIBUCIÓN DEL CRÉDITO HORARIO Y DEDICACIÓN',
    fields: [
      { key: 'horas', label: 'Carga horaria semanal por tipo de actividad', type: 'horas', required: true, campoPath: 'distribucionHoraria.actividades' },
    ],
  },
  {
    title: '7. Cronograma de Clases',
    norm: 'CRONOGRAMA / PLAN DE CLASES',
    fields: [
      {
        key: 'cronograma', label: 'Plan de clases por semana', type: 'table', required: true, minRows: 1, addLabel: 'Agregar clase',
        newRow: (n) => [`Semana ${n + 1}`, '', 'Teórico-práctica', ''],
        columns: [
          { label: 'Semana / fecha', required: true, width: 'w-32' },
          { label: 'Tema a dictar', required: true },
          { label: 'Tipo de clase', type: 'select', options: TIPOS_CLASE, required: true, width: 'w-36' },
          { label: 'Docente(s) a cargo', type: 'equipo', required: true, width: 'w-48' },
        ],
        campoPath: 'cronograma.clases',
      },
    ],
  },
  {
    title: '8. Evaluación y Promoción',
    norm: '4. METODOLOGÍA DE EVALUACIÓN Y RÉGIMEN DE APROBACIÓN',
    fields: [
      { key: 'eval', label: '8.1. Criterios e instrumentos de evaluación', type: 'text', required: true, campoPath: 'metodologiaEvaluacion.criterios' },
      {
        key: 'regimenAprob', label: '8.2. Régimen de aprobación', type: 'select', required: true,
        options: ['Promoción directa y regularidad', 'Solo regularidad (examen final)', 'Promoción directa sin examen final'],
        campoPath: 'metodologiaEvaluacion.regimenAprobacion.tipo',
      },
      {
        key: 'asistenciaMin', label: '8.3. Asistencia mínima exigida', type: 'select', required: true,
        options: ['60 %', '70 %', '75 %', '80 %'], campoPath: 'metodologiaEvaluacion.regimenAprobacion.asistencia',
      },
      { key: 'regular', label: '8.4. Condiciones de regularidad', type: 'text', required: true, campoPath: 'metodologiaEvaluacion.regimenAprobacion.regular' },
      { key: 'promotion', label: '8.5. Condiciones de promoción directa', type: 'text', hint: 'Obligatorio si el régimen admite promoción.', campoPath: 'metodologiaEvaluacion.regimenAprobacion.promocion' },
      { key: 'free', label: '8.6. Condiciones de examen libre', type: 'text', required: true, campoPath: 'metodologiaEvaluacion.regimenAprobacion.libre' },
      {
        key: 'parciales', label: '8.7. Fechas de exámenes parciales y recuperatorios', type: 'table', required: true, minRows: 1, addLabel: 'Agregar instancia',
        newRow: (n) => [n % 2 === 0 ? `Parcial ${n / 2 + 1}` : `Recuperatorio ${(n + 1) / 2}`, '', 'Escrito', ''],
        columns: [
          { label: 'Instancia', type: 'select', options: ['Parcial 1', 'Recuperatorio 1', 'Parcial 2', 'Recuperatorio 2', 'Integrador', 'Coloquio'], required: true, width: 'w-40' },
          { label: 'Fecha', type: 'date', required: true, width: 'w-40' },
          { label: 'Modalidad', type: 'select', options: ['Escrito', 'Oral', 'Práctico en máquina', 'Entrega de proyecto'], required: true, width: 'w-44' },
          { label: 'Unidades evaluadas' },
        ],
        campoPath: 'metodologiaEvaluacion.instancias',
      },
    ],
  },
  {
    title: '9. Bibliografía',
    norm: '5. BIBLIOGRAFÍA BÁSICA Y COMPLEMENTARIA',
    fields: [
      {
        key: 'books', label: 'Bibliografía', type: 'table', required: true, minRows: 1, addLabel: 'Agregar ítem bibliográfico',
        newRow: () => ['Básica', '', '', '', '', ''],
        columns: [
          { label: 'Tipo', type: 'select', options: ['Básica', 'Complementaria'], required: true, width: 'w-36' },
          { label: 'Autor/es', required: true },
          { label: 'Título', required: true },
          { label: 'Editorial', width: 'w-32' },
          { label: 'Año', type: 'number', required: true, width: 'w-20' },
          { label: 'Enlace / disponibilidad', placeholder: 'URL o "Biblioteca central"', width: 'w-48' },
        ],
        campoPath: 'bibliografia.items',
      },
    ],
  },
];

export const PEDITEMS = [
  '1. Fundamentación e introducción al perfil profesional',
  '2. Diagnóstico y articulación horizontal/vertical',
  '3. Coherencia de Objetivos / Matriz de Competencias (Ord. 448/11)',
  '4. Metodología de enseñanza y recursos didácticos',
  '5. Selección y secuenciación de Unidades de Contenido',
  '6. Programa de Trabajos Prácticos y Laboratorio',
  '7. Metodología de Evaluación y Régimen (Regular, Promoción, Libre)',
  '8. Bibliografía y Distribución del Crédito Horario',
];

export const DISCITEMS = [
  '1. Correspondencia con los Contenidos Mínimos del Plan de Estudio',
  '2. Pertinencia del Programa de Trabajos Prácticos y Laboratorio',
  '3. Actualización y pertinencia de la Bibliografía Básica y Complementaria',
  '4. Control individual de PAAD de los integrantes de la cátedra',
];

/** Datos necesarios para resolver las cátedras de los usuarios. */
export interface DatosCatedras {
  cycle: number;
  usuarios: Usuario[];
  equiposCatedra: EquipoCatedra[];
  asignaturas: Asignatura[];
  planes: PlanEstudio[];
  carreras: Carrera[];
}

/**
 * Cada usuario con su arreglo `catedras` del ciclo vigente (asignatura, carrera, cargo).
 * Se deriva de EQUIPOS_CATEDRA, que sigue siendo la única fuente de verdad:
 * así lo editado desde Estructura Académica y desde Usuarios queda siempre sincronizado.
 */
export function usuariosConCatedras(data: DatosCatedras): UsuarioConCatedras[] {
  const asigBy = new Map(data.asignaturas.map((a) => [a.id, a]));
  const planBy = new Map(data.planes.map((p) => [p.id, p]));
  const carBy = new Map(data.carreras.map((c) => [c.id, c]));
  const porDocente = new Map<string, CatedraAsignada[]>();
  for (const e of data.equiposCatedra) {
    if (e.cicloLectivo !== data.cycle) continue;
    const asig = asigBy.get(e.asignaturaId);
    const car = asig ? carBy.get(planBy.get(asig.planEstudioId)?.carreraId ?? '') : undefined;
    const lista = porDocente.get(e.docenteId) ?? [];
    lista.push({
      asignaturaId: e.asignaturaId,
      asignaturaNombre: asig?.nombre ?? e.asignaturaId,
      carreraId: car?.id ?? '',
      carreraCodigo: car?.codigo ?? '?',
      cargo: e.cargo,
      esResponsable: e.esResponsable,
    });
    porDocente.set(e.docenteId, lista);
  }
  return data.usuarios.map((u) => ({ ...u, catedras: u.rol === 'Docente' ? (porDocente.get(u.id) ?? []) : [] }));
}

/**
 * Reemplaza las cátedras de un docente en un ciclo. Conserva el id del registro
 * si la asignatura ya estaba, y mantiene un único Responsable por cátedra.
 */
export function reemplazarCatedrasDeUsuario(
  equipos: EquipoCatedra[],
  docenteId: string,
  ciclo: number,
  catedras: CatedraAsignada[]
): EquipoCatedra[] {
  const previos = new Map(
    equipos.filter((e) => e.docenteId === docenteId && e.cicloLectivo === ciclo).map((e) => [e.asignaturaId, e])
  );
  const nuevaResponsabilidad = new Set(catedras.filter((c) => c.esResponsable).map((c) => c.asignaturaId));
  const resto = equipos
    .filter((e) => !(e.docenteId === docenteId && e.cicloLectivo === ciclo))
    .map((e) =>
      e.cicloLectivo === ciclo && e.esResponsable && nuevaResponsabilidad.has(e.asignaturaId)
        ? { ...e, esResponsable: false }
        : e
    );
  const propios: EquipoCatedra[] = catedras.map((c, i) => ({
    id: previos.get(c.asignaturaId)?.id ?? `eq-${Date.now()}-${i}`,
    asignaturaId: c.asignaturaId,
    docenteId,
    cicloLectivo: ciclo,
    cargo: c.cargo,
    esResponsable: c.esResponsable,
  }));
  return [...resto, ...propios];
}

export function createInitialData() {
  const sedes: Sede[] = [
    { id: 'sede-cap', nombre: 'Sede Capital', esCapital: true },
    { id: 'sede-cham', nombre: 'Sede Regional Chamical', esCapital: false },
  ];
  const departamentos: Departamento[] = [
    { id: 'depto-exactas', nombre: 'DACEFyN (Ciencias Exactas, Físicas y Naturales)', sedeId: 'sede-cap' },
    { id: 'depto-humanas', nombre: 'Departamento de Ciencias Humanas y de la Educación', sedeId: 'sede-cap' },
    { id: 'depto-sociales', nombre: 'Departamento de Ciencias Sociales, Jurídicas y Económicas', sedeId: 'sede-cap' },
  ];
  const carreras: Carrera[] = [
    { id: 'car-isi', codigo: 'ISI', sigla: 'ISI', nombre: 'Ingeniería en Sistemas de Información', sedeId: 'sede-cap', departamentoId: 'depto-exactas', directorId: 'u-dir-isi' },
    { id: 'car-lsi', codigo: 'LSI', sigla: 'LSI', nombre: 'Licenciatura en Sistemas de Información', sedeId: 'sede-cap', departamentoId: 'depto-exactas', directorId: 'u-dir-lsi' },
    { id: 'car-tui', codigo: 'TUI', sigla: 'TUI', nombre: 'Tecnicatura Universitaria en Informática', sedeId: 'sede-cap', departamentoId: 'depto-exactas', directorId: 'u-dir-tui' },
    { id: 'car-tui-cham', codigo: 'TUI-CHAM', sigla: 'TUI-CH', nombre: 'Tecnicatura Universitaria en Informática (Chamical)', sedeId: 'sede-cham', departamentoId: null, directorId: 'u-dir-tui' },
  ];
  const planes: PlanEstudio[] = [
    { id: 'plan-isi-448', carreraId: 'car-isi', ordenanza: 'Ord. HCS N° 448/2011', enfoque: 'COMPETENCIAS', activo: true },
    { id: 'plan-isi-231', carreraId: 'car-isi', ordenanza: 'Ordenanza N° 231/2023', enfoque: 'COMPETENCIAS', activo: true },
    { id: 'plan-lsi-171', carreraId: 'car-lsi', ordenanza: 'Ord. HCS N° 171/2019', enfoque: 'TRADICIONAL', activo: true },
    { id: 'plan-tui-171', carreraId: 'car-tui', ordenanza: 'Ord. HCS N° 171/2019', enfoque: 'TRADICIONAL', activo: true },
    { id: 'plan-cham-171', carreraId: 'car-tui-cham', ordenanza: 'Ord. HCS N° 171/2019', enfoque: 'TRADICIONAL', activo: true },
  ];
  const asignaturas: Asignatura[] = [
    { id: 'asig-am', codigo: 'ISI-1.03', planEstudioId: 'plan-isi-231', departamentoRadicacionId: 'depto-exactas', nombre: 'Análisis Matemático', anoCursada: 1, regimenDictado: '1C', horasSemanales: 6, horasTotales: 90, contenidosMinimos: 'Números reales. Funciones de una variable. Límite y continuidad. Derivada y aplicaciones. Integral indefinida y definida. Aplicaciones del cálculo integral.' },
    { id: 'asig-prog1', codigo: 'ISI-1.01', planEstudioId: 'plan-isi-448', departamentoRadicacionId: 'depto-exactas', nombre: 'Programación I', anoCursada: 1, regimenDictado: '1C', horasSemanales: 6, horasTotales: 90, contenidosMinimos: 'Algoritmos, estructuras de control secuenciales, condicionales y repetitivas. Modularización, funciones y tipos de datos estructurados.' },
    { id: 'asig-prog2', codigo: 'ISI-1.06', planEstudioId: 'plan-isi-448', departamentoRadicacionId: 'depto-exactas', nombre: 'Programación II', anoCursada: 1, regimenDictado: '2C', horasSemanales: 6, horasTotales: 90, contenidosMinimos: 'Programación orientada a objetos: clases, herencia, polimorfismo. Manejo de excepciones y archivos. Pruebas unitarias.' },
    { id: 'asig-sis1', codigo: 'ISI-2.04', planEstudioId: 'plan-isi-448', departamentoRadicacionId: 'depto-exactas', nombre: 'Sistemas de Información I', anoCursada: 2, regimenDictado: 'ANUAL', horasSemanales: 4, horasTotales: 120, contenidosMinimos: 'Teoría General de Sistemas. Las organizaciones como sistemas. Ingeniería de requerimientos, relevamiento y modelado conceptual.' },
    { id: 'asig-der', codigo: 'ISI-5.12', planEstudioId: 'plan-isi-448', departamentoRadicacionId: 'depto-sociales', nombre: 'Derecho Informático y Ética Profesional', anoCursada: 5, regimenDictado: '2C', horasSemanales: 4, horasTotales: 60, contenidosMinimos: 'Legislación informática, propiedad intelectual del software, delitos informáticos, protección de datos personales y deontología profesional.' },
    { id: 'asig-bd', codigo: 'TUI-2.03', planEstudioId: 'plan-tui-171', departamentoRadicacionId: 'depto-exactas', nombre: 'Bases de Datos', anoCursada: 2, regimenDictado: '2C', horasSemanales: 4, horasTotales: 60, contenidosMinimos: 'Modelo Entidad-Relación, Modelo Relacional, Álgebra Relacional, Lenguaje SQL (DDL/DML) y Normalización (1FN a FNBC).' },
    { id: 'asig-aed', codigo: 'LSI-1.02', planEstudioId: 'plan-lsi-171', departamentoRadicacionId: 'depto-exactas', nombre: 'Algoritmos y Estructuras de Datos', anoCursada: 1, regimenDictado: 'ANUAL', horasSemanales: 6, horasTotales: 180, contenidosMinimos: 'Tipos abstractos de datos, listas, pilas, colas, árboles y grafos. Recursividad, ordenamiento y búsqueda. Análisis de complejidad.' },
    { id: 'asig-lab-cham', codigo: 'TUC-1.02', planEstudioId: 'plan-cham-171', departamentoRadicacionId: null, nombre: 'Laboratorio de Software I (Sede Chamical)', anoCursada: 1, regimenDictado: '1C', horasSemanales: 4, horasTotales: 60, contenidosMinimos: 'Herramientas de desarrollo, control de versiones Git, compilación y pruebas básicas de software.' },
  ];
  const usuarios: Usuario[] = [
    { id: 'u-admin', nombre: 'Administrador', apellido: 'General', dni: '20000001', email: 'admin@unlar.edu.ar', rol: 'Administrador', carreraId: null, mustChangePassword: false, activo: true },
    { id: 'u-lucia', nombre: 'Lucía', apellido: 'Torres', dni: '28456123', email: 'titular.prog@unlar.edu.ar', rol: 'Docente', carreraId: null, mustChangePassword: false, activo: true },
    { id: 'u-martin', nombre: 'Martín', apellido: 'López', dni: '30112233', email: 'auxiliar.prog@unlar.edu.ar', rol: 'Docente', carreraId: null, mustChangePassword: true, activo: true },
    { id: 'u-sofia', nombre: 'Sofía', apellido: 'Romero', dni: '32998877', email: 'sofia.romero@unlar.edu.ar', rol: 'Docente', carreraId: null, mustChangePassword: false, activo: true },
    { id: 'u-diego', nombre: 'Diego', apellido: 'Castro', dni: '29334455', email: 'diego.castro@unlar.edu.ar', rol: 'Docente', carreraId: null, mustChangePassword: false, activo: true },
    { id: 'u-lastra', nombre: 'Mariana Soledad', apellido: 'Lastra', dni: '27845612', email: 'mariana.lastra@unlar.edu.ar', rol: 'Docente', carreraId: null, mustChangePassword: false, activo: true },
    { id: 'u-uap', nombre: 'Ana', apellido: 'Suárez', dni: '27554433', email: 'uap@unlar.edu.ar', rol: 'UAP', carreraId: null, mustChangePassword: false, activo: true },
    { id: 'u-dir-isi', nombre: 'María', apellido: 'Vega', dni: '25111222', email: 'direccion.isi@unlar.edu.ar', rol: 'Director', carreraId: 'car-isi', mustChangePassword: false, activo: true },
    { id: 'u-dir-lsi', nombre: 'Gabriel', apellido: 'Ruiz', dni: '26333444', email: 'direccion.lsi@unlar.edu.ar', rol: 'Director', carreraId: 'car-lsi', mustChangePassword: false, activo: true },
    { id: 'u-dir-tui', nombre: 'Laura', apellido: 'Pérez', dni: '24888999', email: 'direccion.tui@unlar.edu.ar', rol: 'Director', carreraId: 'car-tui', mustChangePassword: false, activo: true },
    { id: 'u-consejo', nombre: 'Secretaría', apellido: 'Consejo DACEFyN', dni: '21000999', email: 'consejo.exactas@unlar.edu.ar', rol: 'Consejo', carreraId: null, mustChangePassword: false, activo: true },
  ];
  const equiposCatedra: EquipoCatedra[] = [
    { id: 'eq-1', asignaturaId: 'asig-prog1', docenteId: 'u-lucia', cicloLectivo: 2026, cargo: 'Profesor Titular', esResponsable: true },
    { id: 'eq-2', asignaturaId: 'asig-prog1', docenteId: 'u-martin', cicloLectivo: 2026, cargo: 'Jefe de Trabajos Prácticos', esResponsable: false },
    { id: 'eq-3', asignaturaId: 'asig-sis1', docenteId: 'u-sofia', cicloLectivo: 2026, cargo: 'Profesor Asociado', esResponsable: true },
    { id: 'eq-4', asignaturaId: 'asig-sis1', docenteId: 'u-diego', cicloLectivo: 2026, cargo: 'Ayudante de Primera', esResponsable: false },
    { id: 'eq-5', asignaturaId: 'asig-bd', docenteId: 'u-diego', cicloLectivo: 2026, cargo: 'Profesor Adjunto', esResponsable: true },
    { id: 'eq-6', asignaturaId: 'asig-bd', docenteId: 'u-lucia', cicloLectivo: 2026, cargo: 'Jefe de Trabajos Prácticos', esResponsable: false },
    { id: 'eq-7', asignaturaId: 'asig-der', docenteId: 'u-sofia', cicloLectivo: 2026, cargo: 'Profesor Titular', esResponsable: true },
    { id: 'eq-8', asignaturaId: 'asig-aed', docenteId: 'u-martin', cicloLectivo: 2026, cargo: 'Profesor Adjunto', esResponsable: true },
    { id: 'eq-9', asignaturaId: 'asig-aed', docenteId: 'u-diego', cicloLectivo: 2026, cargo: 'Jefe de Trabajos Prácticos', esResponsable: false },
    { id: 'eq-10', asignaturaId: 'asig-lab-cham', docenteId: 'u-lucia', cicloLectivo: 2026, cargo: 'Profesor Titular', esResponsable: true },
    { id: 'eq-am-1', asignaturaId: 'asig-am', docenteId: 'u-lastra', cicloLectivo: 2026, cargo: 'Profesor Titular', esResponsable: true },
    { id: 'eq-am-2', asignaturaId: 'asig-am', docenteId: 'u-martin', cicloLectivo: 2026, cargo: 'Ayudante de Primera', esResponsable: false },
    { id: 'eq-11', asignaturaId: 'asig-prog2', docenteId: 'u-lucia', cicloLectivo: 2026, cargo: 'Profesor Titular', esResponsable: true },
    { id: 'eq-12', asignaturaId: 'asig-prog2', docenteId: 'u-martin', cicloLectivo: 2026, cargo: 'Jefe de Trabajos Prácticos', esResponsable: false },
    // Equipos del ciclo 2025 (histórico): habilitan la visibilidad de planificaciones anteriores.
    { id: 'eq-h1', asignaturaId: 'asig-prog1', docenteId: 'u-lucia', cicloLectivo: 2025, cargo: 'Profesor Titular', esResponsable: true },
    { id: 'eq-h2', asignaturaId: 'asig-prog1', docenteId: 'u-sofia', cicloLectivo: 2025, cargo: 'Jefe de Trabajos Prácticos', esResponsable: false },
    { id: 'eq-h3', asignaturaId: 'asig-bd', docenteId: 'u-diego', cicloLectivo: 2025, cargo: 'Profesor Adjunto', esResponsable: true },
    { id: 'eq-h4', asignaturaId: 'asig-sis1', docenteId: 'u-sofia', cicloLectivo: 2025, cargo: 'Profesor Asociado', esResponsable: true },
    { id: 'eq-h5', asignaturaId: 'asig-sis1', docenteId: 'u-martin', cicloLectivo: 2025, cargo: 'Ayudante de Primera', esResponsable: false },
  ];
  const periodos: PeriodoAcademico[] = [
    { id: 'per-2026-1c', cicloLectivo: 2026, tipoPeriodo: '1C', alcance: 'Anuales y 1.º Cuatrimestre', fechaLimite: '2026-04-30' },
    { id: 'per-2026-2c', cicloLectivo: 2026, tipoPeriodo: '2C', alcance: '2.º Cuatrimestre', fechaLimite: '2026-08-31' },
  ];
  const docs: any[] = [
    {
      id: 'paac-1', type: 'PAAC', asignaturaId: 'asig-prog1', owner: 'u-lucia', cycle: 2026, periodo: '1C',
      state: 'OBSERVADO', pedApproved: false, discApproved: false, expediente: '', resolucion: '',
      data: {
        intro: 'La asignatura introduce los fundamentos de la algoritmia y programación estructurada, esenciales para el desarrollo de software en Ingeniería en Sistemas.',
        diag: 'Los ingresantes requieren nivelación en lógica proposicional. Se dispone del Laboratorio de Informática 2.',
        concept: 'Comprender estructuras de control, tipos de datos y modularización.',
        procedure: 'Diseñar, codificar y depurar algoritmos empleando buenas prácticas.',
        attitude: 'Fomentar el trabajo en equipo y la responsabilidad ética profesional.',
        competencias: [
          ['Específica', 'CE-1 · Especificar, diseñar e implementar software de base y de aplicación.', '2', 'Construye programas modulares correctos a partir de especificaciones lógicas.'],
          ['Genérica', 'CG-4 · Desempeñarse de manera efectiva en equipos de trabajo.', '1', 'Participa colaborativamente en la resolución de laboratorios grupales.'],
        ],
        method: 'Clases teórico-prácticas con resolución de problemas en máquina y seguimiento en aula virtual.',
        resources: 'Proyector, entorno de desarrollo integrado (IDE), plataforma Moodle institucional.',
        units: [['Unidad 1: Algoritmos y Estructuras Básicas', 'Concepto de algoritmo, variables, tipos de datos y estructuras secuenciales.'], ['Unidad 2: Estructuras de Control y Funciones', 'Condicionales, bucles repetitivos, pasaje de parámetros y modularidad.']],
        tp: [['1', 'Resolver problemas secuenciales', 'Individual', 'Laboratorio', '6', 'Semana 4 · ejercicios resueltos en el aula virtual'], ['2', 'Implementar ciclos y funciones modulares', 'Grupal', 'Laboratorio', '8', 'Semana 9 · defensa oral del código']],
        lab: 'Prácticas semanales de 2 hs en Laboratorio de Cómputos con asistencia obligatoria.',
        eval: 'Dos exámenes parciales teórico-prácticos con sus respectivos recuperatorios.',
        regular: '80% de asistencia a clases prácticas, 100% de TPs aprobados y parciales con nota >= 4.',
        promotion: 'Parciales aprobados en primera instancia con nota >= 7 y coloquio integrador.',
        free: 'Instancia práctica eliminatoria en laboratorio seguida de evaluación teórica oral y escrita.',
        books: [['Básica', 'Joyanes Aguilar, L.', 'Fundamentos de Programación', 'McGraw-Hill', '2020', 'Biblioteca central (3 ej.)'], ['Complementaria', 'Deitel, P. & Deitel, H.', 'Cómo programar en C/C++', 'Pearson', '2019', 'https://biblioteca.unlar.edu.ar']],
        horas: [['3'], ['2'], ['1'], ['2']],
        cronograma: [['Semana 1', 'Concepto de algoritmo y variables', 'Teórica', 'Lucía Torres'], ['Semana 2', 'Estructuras secuenciales', 'Práctica', 'Martín López'], ['Semana 5', 'Estructuras condicionales', 'Teórico-práctica', 'Todo el equipo'], ['Semana 8', 'Primer parcial', 'Evaluación', 'Todo el equipo']],
        regimenAprob: 'Promoción directa y regularidad',
        asistenciaMin: '80 %',
        parciales: [['Parcial 1', '2026-04-24', 'Práctico en máquina', 'Unidad 1'], ['Recuperatorio 1', '2026-05-08', 'Práctico en máquina', 'Unidad 1'], ['Parcial 2', '2026-06-12', 'Escrito', 'Unidad 2']],
      },
      pedReport: {
        items: { 0: 'Pertinente.', 1: 'Falta explicitar la articulación horizontal con Álgebra y Lógica.', 2: 'Coherente con la matriz de competencias.' },
        dictamen: 'OBSERVADO',
        obsGenerales: 'Precisar la articulación horizontal en el diagnóstico.',
        by: 'Ana Suárez',
        fecha: '10/04/2026',
      },
      discReport: { items: {}, dictamen: 'PENDIENTE', obsDisciplinares: '' },
      comments: [
        { id: 'obs-1', field: 'diag', campoPath: 'fundamentacionDiagnostico.diagnostico', section: 1, area: 'uap', author: 'Ana Suárez (UAP)', text: 'Explicitar cómo se coordina horizontalmente con Álgebra y Lógica del primer cuatrimestre.', date: '10/04/2026', resolved: false },
      ],
    },
    {
      id: 'paac-2', type: 'PAAC', asignaturaId: 'asig-sis1', owner: 'u-sofia', cycle: 2026, periodo: '1C',
      state: 'ENVIADO_A_REVISION', pedApproved: false, discApproved: false, expediente: '', resolucion: '',
      data: {
        intro: 'Provee las bases metodológicas para el relevamiento, análisis y especificación de requerimientos de sistemas de información organizacionales.',
        diag: 'Grupo de segundo año con conocimientos previos de programación básica.',
        concept: 'Asimilar el ciclo de vida del software y la teoría general de sistemas.',
        procedure: 'Modelar procesos de negocio e identificar requerimientos funcionales y no funcionales.',
        attitude: 'Capacidad de escucha activa en entrevistas con usuarios y rigor documental.',
        competencias: [['Específica', 'CE-2 · Relevar, analizar y especificar requerimientos de sistemas de información.', '3', 'Elabora documentos SRS completos y modelos de casos de uso validados.']],
        method: 'Estudio de casos reales, simulación de entrevistas y taller de modelado UML.',
        resources: 'Herramientas CASE, guías de estudio y bibliografía digital.',
        units: [['Unidad 1: Teoría General de Sistemas', 'Sistemas abiertos, subsistemas organizacionales y procesos.'], ['Unidad 2: Ingeniería de Requerimientos', 'Técnicas de relevamiento, casos de uso y especificación SRS.']],
        tp: [['1', 'Relevamiento de una organización local', 'Grupal', 'Aula', '12', 'Entrega incremental · semanas 6 y 12']],
        lab: 'Uso de herramientas de modelado CASE en gabinete.',
        eval: 'Evaluación continua de entregas incrementales del trabajo integrador y dos parciales.',
        regular: 'Aprobar parciales con nota mínima de 4 y el 100% de entregas del TP integrador.',
        promotion: 'Nota mínima 7 en ambos parciales y defensa pública del proyecto integrador.',
        free: 'Presentación previa de un caso práctico completo y examen escrito/oral.',
        books: [['Básica', 'Kendall, K. & Kendall, J.', 'Análisis y Diseño de Sistemas', 'Pearson', '2018', 'Biblioteca central (5 ej.)']],
        horas: [['2'], ['2'], ['0'], ['1']],
        cronograma: [['Semanas 1-4', 'Teoría General de Sistemas', 'Teórica', 'Sofía Romero'], ['Semanas 5-10', 'Técnicas de relevamiento', 'Teórico-práctica', 'Todo el equipo']],
        regimenAprob: 'Promoción directa y regularidad',
        asistenciaMin: '75 %',
        parciales: [['Parcial 1', '2026-06-19', 'Escrito', 'Unidad 1'], ['Parcial 2', '2026-10-23', 'Entrega de proyecto', 'Unidad 2']],
      },
      pedReport: { items: {}, dictamen: 'PENDIENTE', obsGenerales: '' },
      discReport: { items: {}, dictamen: 'PENDIENTE', obsDisciplinares: '' },
      comments: [],
    },
    {
      id: 'paac-3', type: 'PAAC', asignaturaId: 'asig-bd', owner: 'u-diego', cycle: 2026, periodo: '2C',
      state: 'APROBADO_PLENO', pedApproved: true, discApproved: true, expediente: '', resolucion: '',
      data: {
        intro: 'Diseño, implementación y administración de bases de datos relacionales.',
        diag: 'Estudiantes con manejo fluido de estructuras de datos.',
        concept: 'Dominar el modelo relacional, álgebra relacional y normalización.',
        procedure: 'Construir esquemas normalizados y consultas complejas en SQL.',
        attitude: 'Valorar la integridad, seguridad y confidencialidad de los datos.',
        competencias: [],
        method: 'Clases expositivas y práctica intensiva con motores PostgreSQL.',
        resources: 'Servidor de base de datos de cátedra, guías SQL.',
        units: [['Unidad 1: Modelo Entidad-Relación y Relacional', 'Modelado conceptual, claves y restricciones de integridad.'], ['Unidad 2: Lenguaje SQL y Normalización', 'DDL, DML, formas normales 1FN a BCNF y transacciones.']],
        tp: [['1', 'Modelado DER: diseñar un esquema relacional', 'Grupal', 'Aula', '6', 'Semana 5'], ['2', 'Consultas SQL sobre PostgreSQL', 'Individual', 'Laboratorio', '8', 'Semana 11']],
        lab: 'Ejecución de scripts SQL sobre contenedor PostgreSQL.',
        eval: 'Dos evaluaciones prácticas en laboratorio y coloquio teórico.',
        regular: 'Aprobar ambos parciales prácticos con nota >= 4.',
        promotion: 'Aprobar parciales con nota >= 7 y coloquio final.',
        free: 'Examen práctico en máquina de diseño y SQL, más instancia teórica.',
        books: [['Básica', 'Elmasri, R. & Navathe, S.', 'Fundamentos de Sistemas de Bases de Datos', 'Pearson', '2017', 'Biblioteca central (4 ej.)']],
        horas: [['2'], ['1'], ['1'], ['1']],
        cronograma: [['Semana 1', 'Modelo Entidad-Relación', 'Teórica', 'Diego Castro'], ['Semana 6', 'SQL DDL/DML', 'Laboratorio', 'Lucía Torres']],
        regimenAprob: 'Promoción directa y regularidad',
        asistenciaMin: '75 %',
        parciales: [['Parcial 1', '2026-09-25', 'Práctico en máquina', 'Unidad 1'], ['Parcial 2', '2026-11-13', 'Práctico en máquina', 'Unidad 2']],
      },
      pedReport: { items: Object.fromEntries(PEDITEMS.map((_, i) => [i, 'Desarrollo pertinente y ajustado a la normativa.'])), dictamen: 'APROBADO', obsGenerales: 'Propuesta pedagógica sólida.', by: 'Ana Suárez', fecha: '02/09/2026' },
      discReport: { items: Object.fromEntries(DISCITEMS.map((_, i) => [i, 'Cumple'])), dictamen: 'APROBADO', obsDisciplinares: 'Cumple con los contenidos mínimos.', by: 'Laura Pérez', fecha: '05/09/2026' },
      comments: [],
    },
  ];

  // Planificaciones adicionales para probar la bandeja con todos los roles.
  const informeFavorable = (area: 'ped' | 'disc', by: string, fecha: string, obs: string) =>
    area === 'ped'
      ? { items: Object.fromEntries(PEDITEMS.map((_, i) => [i, 'Pertinente y ajustado a la normativa.'])), dictamen: 'APROBADO', obsGenerales: obs, by, fecha }
      : { items: Object.fromEntries(DISCITEMS.map((_, i) => [i, 'Cumple'])), dictamen: 'APROBADO', obsDisciplinares: obs, by, fecha };
  const pendiente = (area: 'ped' | 'disc') =>
    area === 'ped' ? { items: {}, dictamen: 'PENDIENTE', obsGenerales: '' } : { items: {}, dictamen: 'PENDIENTE', obsDisciplinares: '' };
  const paac = (base: Record<string, unknown>) => ({
    type: 'PAAC', expediente: '', resolucion: '', pedApproved: false, discApproved: false, comments: [], ...base,
  });

  docs.push(
    // ISI · matricial: aprobada por UAP, pendiente de la Dirección.
    paac({
      id: 'paac-4', asignaturaId: 'asig-der', owner: 'u-sofia', cycle: 2026, periodo: '2C', state: 'APROBADO_PEDAGOGICO', pedApproved: true,
      data: { intro: 'Marco jurídico del ejercicio profesional informático y responsabilidad ética.', concept: 'Conocer la legislación informática vigente.', procedure: 'Analizar casos de delitos informáticos y protección de datos.', attitude: 'Asumir un compromiso ético con la profesión.', method: 'Análisis de jurisprudencia y debates guiados.', eval: 'Dos parciales y un trabajo monográfico.', regular: 'Parciales aprobados con nota >= 4.', promotion: 'Parciales con nota >= 7.', free: 'Examen escrito y oral.', units: [['Unidad 1: Propiedad intelectual', 'Ley 11.723 y software.'], ['Unidad 2: Datos personales', 'Ley 25.326 y habeas data.']], tp: [['1', 'Análisis de un fallo judicial', 'Grupal', 'Aula', '4', 'Semana 6']], books: [['Básica', 'Altmark, D.', 'Informática y Derecho', 'Depalma', '2015', 'Biblioteca central']], horas: [['3'], ['1'], ['0'], ['1']] },
      pedReport: informeFavorable('ped', 'Ana Suárez', '20/08/2026', 'Buena articulación entre teoría y casos.'),
      discReport: pendiente('disc'),
    }),
    // LSI · en elaboración por el responsable.
    paac({
      id: 'paac-5', asignaturaId: 'asig-aed', owner: 'u-martin', cycle: 2026, periodo: '1C', state: 'BORRADOR',
      data: { intro: 'Introduce las estructuras de datos fundamentales y el análisis de algoritmos.' },
      pedReport: pendiente('ped'), discReport: pendiente('disc'),
    }),
    // TUI Chamical · observada por la Dirección.
    paac({
      id: 'paac-6', asignaturaId: 'asig-lab-cham', owner: 'u-lucia', cycle: 2026, periodo: '1C', state: 'OBSERVADO',
      data: { intro: 'Primer contacto con herramientas profesionales de desarrollo.', method: 'Laboratorio semanal con entregas cortas.', eval: 'Entregas prácticas y un proyecto final.', units: [['Unidad 1: Git', 'Repositorios, ramas y fusiones.']], tp: [['1', 'Repositorio personal en Git', 'Individual', 'Laboratorio', '4', 'Semana 3']] },
      pedReport: pendiente('ped'),
      discReport: { items: { 0: 'Cumple parcialmente: falta la unidad de pruebas.', 1: 'Cumple', 2: 'Bibliografía desactualizada.' }, dictamen: 'OBSERVADO', obsDisciplinares: 'Incorporar los contenidos mínimos de pruebas básicas y actualizar la bibliografía.', by: 'Laura Pérez', fecha: '15/04/2026' },
      comments: [{ id: 'obs-cham-1', resolved: false }],
    }),
    // ISI · instanciada por el lote de 2C pero todavía sin iniciar (data vacía).
    paac({
      id: 'paac-7', asignaturaId: 'asig-prog2', owner: 'u-lucia', cycle: 2026, periodo: '2C', state: 'BORRADOR',
      data: {},
      pedReport: pendiente('ped'), discReport: pendiente('disc'),
    }),
    // Ciclo 2025 (históricas)
    paac({
      id: 'paac-h1', asignaturaId: 'asig-prog1', owner: 'u-lucia', cycle: 2025, periodo: '1C', state: 'FINALIZADO', pedApproved: true, discApproved: true,
      expediente: 'EXP-2025-0412', resolucion: 'RES-CD-031/25',
      data: { ...docs[0].data },
      pedReport: informeFavorable('ped', 'Ana Suárez', '28/04/2025', 'Propuesta consolidada.'),
      discReport: informeFavorable('disc', 'María Vega', '30/04/2025', 'Cumple con los contenidos mínimos del plan.'),
    }),
    paac({
      id: 'paac-h2', asignaturaId: 'asig-bd', owner: 'u-diego', cycle: 2025, periodo: '2C', state: 'FINALIZADO', pedApproved: true, discApproved: true,
      expediente: 'EXP-2025-0447', resolucion: 'RES-CD-036/25',
      data: { ...docs[2].data },
      pedReport: informeFavorable('ped', 'Ana Suárez', '25/08/2025', 'Sin observaciones.'),
      discReport: informeFavorable('disc', 'Laura Pérez', '27/08/2025', 'Cumple.'),
    }),
    paac({
      id: 'paac-h3', asignaturaId: 'asig-sis1', owner: 'u-sofia', cycle: 2025, periodo: '1C', state: 'ELEVADO_AL_CONSEJO', pedApproved: true, discApproved: true,
      expediente: 'EXP-2025-0503',
      data: { ...docs[1].data },
      pedReport: informeFavorable('ped', 'Ana Suárez', '05/05/2025', 'Adecuada secuenciación de contenidos.'),
      discReport: informeFavorable('disc', 'María Vega', '08/05/2025', 'Cumple; se sugiere ampliar bibliografía complementaria.'),
    })
  );

  // ---- PAAD (Anexo III, Ord. 171/19) ----
  const catedraDeReferencia = (docenteId: string) => {
    const propios = equiposCatedra.filter((e) => e.docenteId === docenteId && e.cicloLectivo === 2026);
    return (propios.find((e) => e.esResponsable) ?? propios[0])?.asignaturaId ?? null;
  };
  const cursosDe = (docenteId: string) =>
    equiposCatedra
      .filter((e) => e.docenteId === docenteId && e.cicloLectivo === 2026)
      .map((e) => {
        const a = asignaturas.find((x) => x.id === e.asignaturaId);
        const car = carreras.find((c) => c.id === planes.find((p) => p.id === a?.planEstudioId)?.carreraId);
        return `${a?.nombre} – ${a?.anoCursada}.º año ${car?.sigla} – ${e.cargo}`;
      });

  /** PAAD de ejemplo real: Lastra Mariana Soledad, Análisis Matemático (Ord. N° 231/2023). */
  const paadLastra: PaadContenido = {
    asignaturaId: 'asig-am',
    listas: {
      cursos: ['Análisis Matemático – Primer Año de Ingeniería en Sistemas de Información – comisiones A y B (teoría y práctica).'],
      capacitaciones: [
        'Jornadas de Enseñanza de la Matemática en Carreras de Ingeniería – UNLaR, Sede Capital – mayo de 2026 – didáctica del cálculo, área Ciencias Básicas.',
        'Taller "Evaluación por competencias en asignaturas básicas" – modalidad virtual (DACEFyN) – agosto de 2026 – área Educación en Ingeniería.',
      ],
      materiales: [
        'Guía de Trabajos Prácticos de Análisis Matemático – Ciencias Básicas – dossier – autores: Lastra M. S. y equipo de cátedra – marzo de 2026.',
        'Cuadernillo de ingreso "Funciones y límites" – material mediado para el aula virtual – Lastra M. S. – febrero de 2026.',
      ],
      otrosDocentes: [
        'Curso "GeoGebra para la enseñanza del cálculo" – Instituto de Formación Docente, La Rioja – septiembre de 2026 – destinatarios: docentes de nivel secundario – nivel: curso.',
      ],
      investigacion: [
        'Proyecto "Modelización matemática en problemas de ingeniería" – estudia estrategias de modelización con estudiantes de primer año – cargo: investigadora integrante – Res. CD N° 045/25 – etapa de ejecución (segundo año).',
      ],
      recursosHumanos: [
        'Ayudante de 1º: Lic. Martín López, desde 2025 – resolución de trabajos prácticos y clases de consulta – evaluación por observación de clases e informe final cuatrimestral.',
        'Adscripto alumno: Est. Julieta Ríos, desde marzo de 2026 – elaboración de ejercicios para la guía de TP – informe final de desempeño en diciembre.',
      ],
      formacionAcademica: [
        'Maestría en Enseñanza de las Ciencias Exactas (UNLaR) – 4 de 6 módulos aprobados – tesis en elaboración sobre evaluación en cálculo.',
        'Artículo "El error como recurso en Análisis Matemático" – aprobado para las Actas del Congreso de Educación Matemática del NOA 2026.',
      ],
      extension: [
        'Proyecto "Matemática en tu escuela" – dirigido a estudiantes de 5.º año de escuelas secundarias de Capital – abril a octubre de 2026 – 6 alumnos de ISI involucrados – informe de finalización en diciembre.',
      ],
      gestion: [
        'Miembro del Consejo Consultivo de la carrera de Ingeniería en Sistemas de Información.',
        'Reuniones mensuales del equipo de cátedra y del área de Ciencias Básicas.',
      ],
      otras: [
        'Clases de consulta previas a las mesas de examen de julio y diciembre.',
        'Participación en la comisión de seguimiento del Plan de Estudios Ordenanza N° 231/2023.',
      ],
    },
    horas: {
      ...matrizVacia(),
      ensenanza: { lunes: '', martes: '', miercoles: '3', jueves: '', viernes: '', sabado: '' },
      investigacion: { lunes: '', martes: '4', miercoles: '', jueves: '', viernes: '', sabado: '' },
      formacion: { lunes: '6', martes: '', miercoles: '', jueves: '', viernes: '', sabado: '' },
      gestion: { lunes: '', martes: '', miercoles: '', jueves: '4', viernes: '', sabado: '' },
    },
  };

  /** PAAD genérico para el resto de los docentes de prueba. */
  const paadGenerico = (docenteId: string): PaadContenido => ({
    asignaturaId: catedraDeReferencia(docenteId),
    listas: {
      ...paadVacio().listas,
      cursos: cursosDe(docenteId),
      materiales: ['Actualización de guías de trabajos prácticos y material didáctico para el aula virtual – marzo de 2026.'],
      otrosDocentes: ['Participación en tribunales examinadores y reuniones de cátedra.'],
      investigacion: ['Integrante del proyecto "Ingeniería de Software y Calidad de Sistemas" (DACEFyN) – Res. CD N° 112/24 – etapa de ejecución.'],
      recursosHumanos: ['Formación y acompañamiento de ayudantes alumnos y adscriptos de la cátedra.'],
      formacionAcademica: ['Curso de posgrado en Metodologías Ágiles y Docencia Universitaria.'],
      extension: ['Taller de introducción a la programación para escuelas secundarias – segundo cuatrimestre.'],
      gestion: ['Participación en comisiones asesoras de carrera.'],
    },
    horas: {
      ...matrizVacia(),
      ensenanza: { lunes: '3', martes: '', miercoles: '3', jueves: '', viernes: '', sabado: '' },
      investigacion: { lunes: '', martes: '2', miercoles: '', jueves: '', viernes: '', sabado: '' },
      gestion: { lunes: '', martes: '', miercoles: '', jueves: '', viernes: '2', sabado: '' },
    },
  });

  const estadoPaad: Record<string, { state: string; ok: boolean }> = {
    'u-lucia': { state: 'ENVIADO_A_REVISION', ok: false },
    'u-sofia': { state: 'APROBADO', ok: true },
  };
  const docentesList = usuarios.filter((u) => u.rol === 'Docente');
  const paads = docentesList.map((u) => ({
    id: 'paad-' + u.id, type: 'PAAD', owner: u.id, cycle: 2026, evalCareer: 'car-isi',
    state: estadoPaad[u.id]?.state ?? 'BORRADOR',
    pedApproved: estadoPaad[u.id]?.ok ?? false, discApproved: estadoPaad[u.id]?.ok ?? false,
    data: {},
    paad: u.id === 'u-lastra' ? paadLastra : paadGenerico(u.id),
    comments: [],
  }));

  return { cycle: 2026, sedes, departamentos, carreras, planes, asignaturas, usuarios, equiposCatedra, periodos, docs: [...docs, ...paads] };
}