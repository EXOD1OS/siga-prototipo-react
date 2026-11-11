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
import { horarioVacio, paacVacio, type PaacContenido, type SemanaCronograma } from '../types/paac';
import { paacDesdeDatosAnteriores } from '../lib/paac';

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
    { id: 'asig-aed1', codigo: 'ISI-1.02', planEstudioId: 'plan-isi-231', departamentoRadicacionId: 'depto-exactas', nombre: 'Algoritmo y Estructura de Datos I', anoCursada: 1, regimenDictado: '1C', horasSemanales: 6, horasTotales: 90, contenidosMinimos: 'Resolución de problemas y algoritmos. Tipos de datos simples, expresiones y estructuras de control. Modularización: funciones y procedimientos. Recursividad. Estructuras de datos estáticas: arreglos, cadenas y registros. Algoritmos de búsqueda y ordenamiento. Nociones de complejidad algorítmica.' },
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
    { id: 'u-campazzo', nombre: 'Eduardo Nicolás', apellido: 'Campazzo', dni: '30556677', email: 'eduardo.campazzo@unlar.edu.ar', rol: 'Docente', carreraId: null, mustChangePassword: false, activo: true },
    { id: 'u-guzman', nombre: 'Alejandra Elena', apellido: 'Guzmán', dni: '29776655', email: 'alejandra.guzman@unlar.edu.ar', rol: 'Docente', carreraId: null, mustChangePassword: false, activo: true },
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
    { id: 'eq-aed1-1', asignaturaId: 'asig-aed1', docenteId: 'u-campazzo', cicloLectivo: 2026, cargo: 'Profesor Titular', esResponsable: true },
    { id: 'eq-aed1-2', asignaturaId: 'asig-aed1', docenteId: 'u-guzman', cicloLectivo: 2026, cargo: 'Profesor Adjunto', esResponsable: false },
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
        { id: 'obs-1', field: 'diagnostico.correlativas', campoPath: 'paac.diagnostico.correlativas', section: 2, area: 'uap', author: 'Ana Suárez (UAP)', text: 'Explicitar cómo se coordina horizontalmente con Álgebra y Lógica del primer cuatrimestre.', date: '10/04/2026', resolved: false },
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

  // ---- PAAC completo de ejemplo: Algoritmo y Estructura de Datos I (ISI, Ord. 231/2023) ----
  // Semanas: [unidad, hs teoría, TP, hs práctica, TPL, hs lab., evaluación, hs evaluación]
  const semanasAed: [string, string, string, string, string, string, string, string][] = [
    ['1', '3', '1', '3', '', '', '', ''],
    ['1', '3', '1', '3', '', '', '', ''],
    ['2', '3', '2', '2', '1', '1', '', ''],
    ['2', '3', '2', '2', '1', '1', '', ''],
    ['2', '2', '2', '2', '2', '2', '', ''],
    ['3', '3', '3', '2', '2', '1', '', ''],
    ['3', '2', '', '', '', '', '1er Parcial', '4'],
    ['3', '3', '3', '3', '', '', '', ''],
    ['4', '3', '4', '2', '3', '1', '', ''],
    ['4', '3', '4', '2', '3', '1', '', ''],
    ['4', '2', '4', '2', '', '', 'Recuperatorio 1er Parcial', '2'],
    ['5', '3', '5', '2', '4', '1', '', ''],
    ['5', '3', '5', '2', '4', '1', '', ''],
    ['5', '2', '', '', '', '', '2do Parcial', '4'],
    ['', '', '', '', '', '', 'Recuperatorio 2do Parcial / Coloquio integrador', '6'],
  ];
  const cronogramaAed: SemanaCronograma[] = semanasAed.map(([unidad, horasTeoria, tp, horasPractica, tpl, horasLab, evaluacion, horasEval], i) => ({
    id: `aed-sem-${i + 1}`,
    semana: String(i + 1),
    unidad,
    horasTeoria,
    tp,
    horasPractica,
    tpl,
    horasLab,
    tplCampo: '',
    horasCampo: '',
    evaluacion,
    horasEval,
  }));
  const ELIBRO = 'https://elibro.net/es/lc/unlariojabiblio/';

  const paacAed1: PaacContenido = {
    ...paacVacio(),
    nivelIntensidad: '2',
    relacionTP: 'T = P',
    importancia:
      '<p><strong>Algoritmo y Estructura de Datos I</strong> se ubica en el primer cuatrimestre del primer año, dentro del Bloque de <strong>Tecnologías Básicas</strong> del Plan de Estudios (Ordenanza N° 231/2023). Es la primera asignatura del área de Programación y constituye la base conceptual y práctica sobre la que se construyen las asignaturas de desarrollo de software de los años siguientes.</p><p>Aporta al perfil del graduado la capacidad de analizar problemas, formular algoritmos correctos y eficientes e implementarlos en un lenguaje de programación, articulando el razonamiento lógico-matemático con la práctica de la ingeniería de software.</p>',
    competenciasGenerales: { CG1: 3, CG2: 1, CG3: 0, CG4: 2, CG5: 1, CG6: 2, CG7: 1, CG8: 1, CG9: 2, CG10: 0 },
    competenciasEspecificas: [
      { id: 'aed-ce-1', codigo: 'CE1.1', detalle: 'Especificar, proyectar y desarrollar sistemas de información.', nivel: 1 },
      { id: 'aed-ce-2', codigo: 'CE1.2', detalle: 'Especificar, proyectar y desarrollar sistemas de comunicación de datos.', nivel: 0 },
      { id: 'aed-ce-3', codigo: 'CE1.3', detalle: 'Especificar, proyectar y desarrollar software.', nivel: 3 },
      { id: 'aed-ce-4', codigo: 'CE2.1', detalle: 'Proyectar y dirigir lo referido a seguridad informática.', nivel: 0 },
      { id: 'aed-ce-5', codigo: 'CE3.1', detalle: 'Establecer métricas y normas de calidad de software.', nivel: 1 },
      { id: 'aed-ce-6', codigo: 'CE4.1', detalle: 'Certificar el funcionamiento, condición de uso o estado de los sistemas de información, de comunicación de datos y del software.', nivel: 0 },
      { id: 'aed-ce-7', codigo: 'CE5.1', detalle: 'Dirigir y controlar la implementación, operación y mantenimiento de los sistemas de información y del software.', nivel: 1 },
    ],
    diagnostico: {
      correlativas:
        '<p>Al ser una asignatura del primer cuatrimestre no tiene correlativas anteriores: retoma los saberes de lógica y matemática del Curso de Ingreso. Es correlativa anterior de <strong>Algoritmo y Estructura de Datos II</strong> y de <strong>Paradigmas de Programación</strong>, a las que ofrece el dominio de la programación estructurada, la modularización y las estructuras de datos estáticas.</p>',
      mismoAnio:
        '<p>Se articula con <strong>Análisis Matemático</strong> y <strong>Álgebra y Geometría Analítica</strong> (funciones, sucesiones y matrices aplicadas en los ejercicios de arreglos) y con <strong>Sistemas y Organizaciones</strong>, que aporta problemas reales para los trabajos prácticos. Se coordinan fechas de parciales para evitar superposiciones.</p>',
      estudiantes:
        '<ul><li>Ingresantes con conocimientos previos dispares de programación (la mayoría sin experiencia).</li><li>Alrededor de un 20 % de recursantes, con trayectorias interrumpidas por motivos laborales.</li><li>Acceso desigual a computadora personal: se garantiza el uso del laboratorio y del Campus Virtual.</li></ul><p>Se recomienda reforzar las tutorías de consulta y las actividades de nivelación en las primeras semanas.</p>',
      infraestructura:
        '<ul><li>Aula con proyector para las clases teóricas.</li><li>Laboratorio de Informática con un puesto cada dos estudiantes y entorno de desarrollo instalado.</li><li>Conectividad a internet y aula en el Campus Virtual UNLaR.</li><li>Acceso a la Biblioteca y a la plataforma eLibro.</li></ul>',
    },
    objetivosCarrera:
      '<p>Formar ingenieros e ingenieras en Sistemas de Información capaces de concebir, diseñar, desarrollar, implementar y gestionar sistemas de información y software de calidad, con sólida formación científica y tecnológica, actitud ética y compromiso con el desarrollo regional, según el Diseño Curricular del Plan de Estudios y las normativas ministeriales vigentes.</p>',
    proposito:
      '<p>Que las y los estudiantes desarrollen el pensamiento algorítmico y adquieran las técnicas de programación estructurada y el uso de estructuras de datos estáticas necesarias para resolver problemas computacionales de manera correcta, legible y eficiente.</p>',
    resultados: [
      { id: 'aed-ra-1', codigo: 'RA1', descripcion: 'Formula algoritmos para resolver problemas computacionales simples, aplicando análisis, diseño descendente y verificación de su corrección.' },
      { id: 'aed-ra-2', codigo: 'RA2', descripcion: 'Implementa programas estructurados en un lenguaje de alto nivel utilizando tipos de datos simples, estructuras de control y modularización.' },
      { id: 'aed-ra-3', codigo: 'RA3', descripcion: 'Utiliza arreglos, registros y cadenas para representar y manipular colecciones de datos, seleccionando la estructura adecuada al problema.' },
      { id: 'aed-ra-4', codigo: 'RA4', descripcion: 'Aplica algoritmos de búsqueda y ordenamiento y compara su eficiencia mediante un análisis elemental de complejidad.' },
      { id: 'aed-ra-5', codigo: 'RA5', descripcion: 'Trabaja colaborativamente en la resolución de problemas y comunica las soluciones con documentación técnica clara.' },
    ],
    metodologia:
      '<p>Se adopta un enfoque de <strong>Aprendizaje Centrado en el Estudiante</strong>. Las clases teóricas presentan los conceptos a partir de problemas y se complementan con material de <em>aula invertida</em> en el Campus Virtual UNLaR.</p><ul><li>Clases prácticas de resolución de problemas en pequeños grupos.</li><li>Laboratorio con codificación, prueba y depuración de programas.</li><li>Cuestionarios con retroalimentación inmediata y desafíos con dinámicas de gamificación.</li><li>Tutorías de consulta presenciales y foros en el aula virtual.</li></ul>',
    propuesta: [
      { id: 'aed-pr-1', competencia: 'CG1, CE1.3', ra: 'RA1', unidades: 'Unidad 1', guiaTp: 'TP N° 1', actividad: 'Resolución guiada de problemas y pruebas de escritorio.', estrategia: 'Aprendizaje basado en problemas.' },
      { id: 'aed-pr-2', competencia: 'CG4, CE1.3', ra: 'RA2', unidades: 'Unidades 2 y 3', guiaTp: 'TP N° 2 y 3', actividad: 'Codificación y depuración de programas en laboratorio.', estrategia: 'Práctica de laboratorio y aula invertida.' },
      { id: 'aed-pr-3', competencia: 'CG1, CE1.1', ra: 'RA3', unidades: 'Unidad 4', guiaTp: 'TP N° 4', actividad: 'Ejercicios en el Campus Virtual con autocorrección.', estrategia: 'Gamificación y cuestionarios.' },
      { id: 'aed-pr-4', competencia: 'CG4, CE3.1', ra: 'RA4', unidades: 'Unidad 5', guiaTp: 'TP N° 5', actividad: 'Medición de tiempos de ejecución y comparación de algoritmos.', estrategia: 'Trabajo colaborativo en laboratorio.' },
      { id: 'aed-pr-5', competencia: 'CG6, CG7', ra: 'RA5', unidades: 'Todas', guiaTp: 'TP N° 3 y 5', actividad: 'Defensa oral de las soluciones grupales.', estrategia: 'Trabajo colaborativo y exposición.' },
    ],
    unidades: [
      { id: 'aed-un-1', numero: '1', titulo: 'Resolución de problemas y algoritmos', contenidos: '<ul><li>Concepto de problema, algoritmo y programa.</li><li>Etapas de la resolución de problemas con computadora.</li><li>Representación de algoritmos: pseudocódigo y diagramas de flujo.</li><li>Diseño descendente y refinamiento sucesivo.</li></ul>', resultados: 'RA1' },
      { id: 'aed-un-2', numero: '2', titulo: 'Tipos de datos, expresiones y estructuras de control', contenidos: '<ul><li>Datos simples, constantes y variables.</li><li>Operadores y expresiones aritméticas, relacionales y lógicas.</li><li>Estructuras secuencial, condicional y repetitiva.</li><li>Prueba de escritorio y depuración.</li></ul>', resultados: 'RA1, RA2' },
      { id: 'aed-un-3', numero: '3', titulo: 'Modularización', contenidos: '<ul><li>Funciones y procedimientos.</li><li>Pasaje de parámetros por valor y por referencia.</li><li>Ámbito y tiempo de vida de las variables.</li><li>Recursividad: concepto y ejemplos simples.</li></ul>', resultados: 'RA2' },
      { id: 'aed-un-4', numero: '4', titulo: 'Estructuras de datos estáticas', contenidos: '<ul><li>Arreglos unidimensionales y bidimensionales.</li><li>Cadenas de caracteres.</li><li>Registros y arreglos de registros.</li></ul>', resultados: 'RA3' },
      { id: 'aed-un-5', numero: '5', titulo: 'Búsqueda, ordenamiento y nociones de complejidad', contenidos: '<ul><li>Búsqueda secuencial y binaria.</li><li>Ordenamiento por burbuja, selección e inserción.</li><li>Intercalación de arreglos ordenados.</li><li>Noción de eficiencia y orden de complejidad.</li></ul>', resultados: 'RA4' },
    ],
    tpIntro:
      '<p>Los trabajos prácticos se desarrollan en las clases prácticas y en el Laboratorio de Informática (T.P.L.), con entregas en el Campus Virtual. Cada trabajo se aprueba con la entrega en término y la defensa de la solución.</p>',
    trabajosPracticos: [
      { id: 'aed-tp-1', numero: '1', titulo: 'Algoritmos y pseudocódigo', proposito: 'Analizar problemas y representar su solución mediante pseudocódigo y diagramas de flujo.', modalidad: 'Individual', unidadTemas: 'Unidad 1' },
      { id: 'aed-tp-2', numero: '2', titulo: 'Estructuras de control', proposito: 'Implementar y probar programas con estructuras condicionales y repetitivas.', modalidad: 'Individual y Grupal', unidadTemas: 'Unidad 2' },
      { id: 'aed-tp-3', numero: '3', titulo: 'Funciones y procedimientos', proposito: 'Modularizar soluciones aplicando pasaje de parámetros y recursividad simple.', modalidad: 'Grupal', unidadTemas: 'Unidad 3' },
      { id: 'aed-tp-4', numero: '4', titulo: 'Arreglos, cadenas y registros', proposito: 'Representar y procesar colecciones de datos con estructuras estáticas.', modalidad: 'Actividades en clases Prácticas y en plataforma', unidadTemas: 'Unidad 4' },
      { id: 'aed-tp-5', numero: '5', titulo: 'Búsqueda y ordenamiento', proposito: 'Implementar y comparar algoritmos de búsqueda y ordenamiento midiendo su eficiencia.', modalidad: 'Grupal', unidadTemas: 'Unidad 5' },
    ],
    evalDescripcion:
      '<p>La evaluación es <strong>continua</strong>: combina instancias formativas durante el cursado (cuestionarios, trabajos prácticos y laboratorio) con dos parciales sumativos, cada uno con su recuperatorio, y un coloquio integrador.</p>',
    evaluacion: [
      { id: 'aed-ev-1', tipo: 'Formativa', criterios: 'Resolución correcta de los ejercicios y uso adecuado de la notación algorítmica.', ra: 'RA1', tecnica: 'Cuestionarios en el Campus Virtual y pruebas de escritorio.' },
      { id: 'aed-ev-2', tipo: 'Formativa', criterios: 'Funcionamiento, legibilidad y modularidad del código.', ra: 'RA2', tecnica: 'Rúbrica de trabajos prácticos de laboratorio.' },
      { id: 'aed-ev-3', tipo: 'Sumativa', criterios: 'Selección y uso correcto de las estructuras de control y de datos.', ra: 'RA2, RA3', tecnica: '1er Parcial: examen escrito y práctico en máquina.' },
      { id: 'aed-ev-4', tipo: 'Sumativa', criterios: 'Corrección y eficiencia de los algoritmos implementados.', ra: 'RA4', tecnica: '2do Parcial: examen práctico en máquina.' },
      { id: 'aed-ev-5', tipo: 'Formativa / Sumativa', criterios: 'Trabajo en equipo y claridad de la comunicación técnica.', ra: 'RA5', tecnica: 'Coloquio integrador con rúbrica.' },
    ],
    regimen: {
      promocionales:
        '<ul><li>80 % de asistencia a las clases teóricas y prácticas.</li><li>100 % de los trabajos prácticos aprobados.</li><li>Ambos parciales aprobados con nota igual o mayor a 7 (siete), con un recuperatorio por parcial.</li><li>Aprobación del coloquio integrador.</li></ul>',
      regulares:
        '<ul><li>75 % de asistencia a las clases prácticas.</li><li>80 % de los trabajos prácticos aprobados.</li><li>Parciales aprobados con nota igual o mayor a 4 (cuatro); cada parcial tiene una instancia de recuperación.</li></ul><p>Rinden un examen final escrito u oral sobre los contenidos teóricos del programa.</p>',
      libres:
        '<p>Examen en dos instancias: una <strong>práctica eliminatoria en máquina</strong> sobre los contenidos de los trabajos prácticos y, una vez aprobada, una instancia <strong>teórica escrita u oral</strong> sobre la totalidad del programa.</p>',
    },
    bibliografia: {
      basica: {
        fisica: [
          { id: 'aed-bf-1', titulo: 'Fundamentos de programación: algoritmos, estructura de datos y objetos', autores: 'Joyanes Aguilar, L.', editorial: 'McGraw-Hill', ejemplares: '5', anio: '2008' },
          { id: 'aed-bf-2', titulo: 'Introduction to Algorithms', autores: 'Cormen, T.; Leiserson, C.; Rivest, R.; Stein, C.', editorial: 'MIT Press', ejemplares: '2', anio: '2009' },
        ],
        digital: [
          { id: 'aed-bd-1', titulo: 'Metodología de la programación: algoritmos, diagramas de flujo y programas', autores: 'Cairó, O.', editorial: 'Alfaomega', url: ELIBRO, anio: '2005' },
        ],
      },
      complementaria: {
        fisica: [{ id: 'aed-bf-3', titulo: 'Algoritmos + Estructuras de Datos = Programas', autores: 'Wirth, N.', editorial: 'Ediciones del Castillo', ejemplares: '1', anio: '1980' }],
        digital: [
          { id: 'aed-bd-2', titulo: 'Programación en C: metodología, algoritmos y estructura de datos', autores: 'Joyanes Aguilar, L.; Zahonero Martínez, I.', editorial: 'McGraw-Hill', url: ELIBRO, anio: '2005' },
        ],
      },
    },
    horarios: {
      ...horarioVacio(),
      teoricas: { lunes: '18 a 21 hs', martes: '', miercoles: '', jueves: '', viernes: '', sabado: '' },
      practicas: { lunes: '', martes: '', miercoles: 'Comisión 1: 9 a 12 hs', jueves: 'Comisión 2: 18 a 21 hs', viernes: '', sabado: '' },
    },
    cronograma: cronogramaAed,
    notasCronograma:
      'Las semanas 7 y 14 incluyen los exámenes parciales; los recuperatorios se toman en las semanas 11 y 15. El coloquio integrador se realiza en la semana 15.',
  };

  docs.push(
    // ISI · Ord. 231/2023 · PAAC completo en borrador (Prof. Campazzo, responsable).
    paac({
      id: 'paac-aed1', asignaturaId: 'asig-aed1', owner: 'u-campazzo', cycle: 2026, periodo: '1C', state: 'BORRADOR',
      data: {}, paac: paacAed1,
      pedReport: pendiente('ped'), discReport: pendiente('disc'),
    }),
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
      comments: [
        { id: 'obs-cham-1', field: 'unidades', campoPath: 'paac.unidades', section: 5, area: 'direccion', author: 'Laura Pérez (Dirección TUI)', text: 'Falta una unidad con los contenidos mínimos de pruebas básicas de software.', date: '15/04/2026', resolved: false },
      ],
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

  // Los PAAC cargados con el esquema anterior (campos planos) pasan al modelo estructurado.
  for (const d of docs) {
    if (d.type === 'PAAC' && !d.paac) d.paac = paacDesdeDatosAnteriores(d.data ?? {});
  }

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
    // Devuelto por la UAP: el docente puede corregirlo y volver a presentarlo.
    'u-martin': { state: 'OBSERVADO', ok: false },
  };
  const informePaad = (ok: boolean) => ({ items: {}, dictamen: ok ? 'APROBADO' : 'PENDIENTE' });
  const docentesList = usuarios.filter((u) => u.rol === 'Docente');
  const paads = docentesList.map((u) => {
    const ok = estadoPaad[u.id]?.ok ?? false;
    const observadoUap = u.id === 'u-martin';
    return {
      id: 'paad-' + u.id, type: 'PAAD', owner: u.id, cycle: 2026, evalCareer: 'car-isi',
      state: estadoPaad[u.id]?.state ?? 'BORRADOR',
      pedApproved: ok, discApproved: ok,
      pedReport: observadoUap
        ? { items: {}, dictamen: 'OBSERVADO', obsGenerales: 'Detallar las capacitaciones previstas en el apartado 1) a).', by: 'Ana Suárez', fecha: '05/05/2026' }
        : informePaad(ok),
      discReport: informePaad(ok),
      data: {},
      paad: u.id === 'u-lastra' ? paadLastra : paadGenerico(u.id),
      comments: observadoUap
        ? [
            { id: 'obs-paad-martin-1', field: 'ensenanza.a', campoPath: 'paad.ensenanza.a', section: 1, area: 'uap', author: 'Ana Suárez (UAP)', text: 'Indicar lugar, fecha y área de conocimiento de las capacitaciones en las que participará.', date: '05/05/2026', resolved: false },
          ]
        : [],
    };
  });

  return { cycle: 2026, sedes, departamentos, carreras, planes, asignaturas, usuarios, equiposCatedra, periodos, docs: [...docs, ...paads] };
}