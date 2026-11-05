export type DocentCategory = 'TITULAR' | 'ASOCIADO' | 'ADJUNTO' | 'JTP' | 'AYUDANTE';

export type NivelAporte = 0 | 1 | 2 | 3;

// ============================================================================
// PAAC — Plan Anual de Actividades de Cátedra
// Dos variantes reales según el plan de estudio de la asignatura:
//  - Tradicional (Ord. HCS 171/2019 Anexo II + Ord. HCS 219/2022): planes
//    anteriores (TUI y los planes viejos de ISI/LSI).
//  - Por Competencias: planes nuevos de ISI y LSI, que ya no se referencian a
//    la 171/219 sino a la matriz de competencias de egreso de la carrera.
// ============================================================================

export interface PaacTraditionalData {
  encabezado: {
    carrera: string;
    planEstudio: string;
    asignatura: string;
    curso: number;
    regimen: 'ANUAL' | '1C' | '2C';
    resolucionConeau?: string;
    resolucionMinisterial?: string;
  };
  fundamentacion: {
    introduccion: { importancia: string; relacionPerfil: string };
    diagnostico: { articulacionCorrelativas: string; articulacionMismoAno: string; infraestructura: string };
  };
  objetivos: {
    catedra: { conceptuales: string[]; procedimentales: string[]; actitudinales: string[] };
    especificos: string[];
  };
  metodologiaEnsenanza: {
    clasesTeoricas: string;
    clasesPracticas: string;
    recursosDidacticos: string[];
  };
  metodologiaEvaluacion: {
    tipos: ('INICIAL' | 'DE_PROCESO' | 'FINAL')[];
    modalidades: (
      | 'ORAL_INDIVIDUAL'
      | 'ORAL_GRUPAL'
      | 'ESCRITA_INDIVIDUAL'
      | 'ESCRITA_GRUPAL'
      | 'INFORME_MONOGRAFIA'
      | 'TRABAJOS_PRACTICOS'
    )[];
    criterios: string;
    regimenAprobacion: { promocional: string; regular: string; libre: string };
  };
  trabajosPracticos: {
    detalleTp: string;
    laboratorio?: string;
    trabajoCampo?: { objetivos: string; horas: number; lugar: string };
  };
  bibliografia: {
    basica: { autor: string; titulo: string; ano: number; editorial: string }[];
    complementaria: { autor: string; titulo: string; ano: number; editorial: string }[];
  };
  distribucionHoraria: { horasSemanales: number; horasTotales: number; cronograma: string };
}

export interface CompetenciaItem {
  codigo: string; // CG1, CE1.1, etc.
  tipo: 'GENERAL_TECNOLOGICA' | 'GENERAL_SOCIAL_POLITICA_ACTITUDINAL' | 'ESPECIFICA';
  detalle: string;
  nivelAporte: NivelAporte;
}

export interface PaacCompetenciasData {
  encabezado: {
    sede: string;
    carrera: string;
    planEstudio: string;
    curso: string;
    asignatura: string;
    regimen: 'ANUAL' | '1C' | '2C';
    creditoHorario: number;
    horasTeoricas: number;
    horasPracticas: number;
    equipoCatedra: { cargo: DocentCategory; nombre: string }[];
    contenidosMinimos: string;
    nivelIntensidad: NivelAporte;
    relacionTeoricoPractica: string;
  };
  fundamentacion: {
    importanciaAsignatura: string;
    matrizCompetencias: CompetenciaItem[];
    diagnostico: {
      articulacionCorrelativas: string;
      articulacionMismoAno: string;
      analisisEstudiantes: string;
      infraestructuraRequerida: string;
    };
  };
  objetivosPropositoRA: {
    objetivosCarrera: string;
    propositoAsignatura: string[];
    resultadosAprendizaje: { codigo: string; detalle: string }[];
  };
  metodologia: {
    enfoque: string;
    propuestaDesarrolloCompetencias: {
      competencia: string;
      resultadoAprendizaje: string;
      unidadTema: string;
      guiaTp: string;
      actividadFormativa: string;
      estrategiaEnsenanza: string;
    }[];
  };
  contenidos: { unidad: number; titulo: string; detalle: string }[];
  programaTrabajosPracticos: {
    numero: number;
    titulo: string;
    proposito: string[];
    modalidad: string;
    unidadTemas: string;
  }[];
  evaluacion: {
    tipos: ('INICIAL' | 'DE_PROCESO' | 'FINAL')[];
    criterios: string[];
    tecnicas: string[];
    regimenAprobacion: { promocional: string; regular: string; libre: string };
  };
  bibliografia: {
    basica: { titulo: string; autores: string; editorial: string; enlace?: string; ano: number }[];
    complementaria: { titulo: string; autores: string; editorial: string; enlace?: string; ano: number }[];
  };
  horariosClases: {
    dia: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO';
    horasTeoricas?: string;
    horasPracticas?: string;
  }[];
  cronograma: {
    semana: number;
    unidad?: number;
    horasTeoricas?: number;
    tpNumero?: number;
    horasPracticas?: number;
    evaluacion?: string;
  }[];
}

export type PaacData = PaacTraditionalData | PaacCompetenciasData;

// ============================================================================
// PAAD — Plan Anual de Actividades del Docente (Ord. HCS 171/2019 Anexo III)
// Ocho secciones, una presentación por cada integrante del equipo de cátedra.
// ============================================================================

export interface PaadData {
  actividadEnsenanza: {
    cursosAtendidos: string[];
    capacitaciones: { lugar: string; fecha: string; tematica: string; areaConocimiento: string; nombreCapacitacion: string }[];
    materialElaborado: { areaConocimiento: string; tipo: string; autores: string; fecha: string }[];
    otrosTrabajosDocentes: { areaTematica: string; lugar: string; fecha: string; destinatarios: string; nivel: string }[];
  };
  investigacion: { proyecto: string; descripcion: string; cargo: string; numeroResolucion: string; etapa: string }[];
  formacionRecursosHumanos: { detalle: string };
  formacionAcademica: { detalle: string };
  extension: { proyecto: string; destinatarios: string; tiempoLugar: string; alumnosInvolucrados: string; informe: string }[];
  gestion: { detalle: string };
  otrasActividades: string[];
  distribucionHoraria: {
    actividad: 'ENSENANZA' | 'INVESTIGACION' | 'EXTENSION' | 'FORMACION' | 'GESTION';
    lunes?: string;
    martes?: string;
    miercoles?: string;
    jueves?: string;
    viernes?: string;
    sabado?: string;
  }[];
}

// ============================================================================
// Informe Pedagógico — UAP (Ord. HCS 219/2022 Anexo III)
// ============================================================================

export interface PedagogicalReportData {
  equipoCatedra: { cargo: DocentCategory; nombre: string }[];
  aspectosGenerales: {
    introduccion: 'PRESENTA_COMPLETA' | 'PRESENTA_INCOMPLETA' | 'NO_PRESENTA';
    diagnostico: 'PRESENTA_COMPLETA' | 'PRESENTA_INCOMPLETA' | 'NO_PRESENTA';
    objetivosPropositoRA: 'CONCRETOS_CLAROS' | 'CONFUSOS' | 'NO_PRESENTA';
    claseRecursosDidacticos: 'PRESENTA_Y_DESCRIBE' | 'INCOMPLETO' | 'NO_PRESENTA';
  };
  aspectosCurriculares: {
    contenidos: 'DESARROLLADOS_EN_UNIDADES' | 'INCOMPLETO' | 'NO_PRESENTA';
    trabajosPracticos: 'ARTICULADOS_CON_TEORIA' | 'NO_ARTICULADOS' | 'NO_APLICA';
    trabajosPracticosLaboratorio: 'ARTICULADOS' | 'NO_ARTICULADOS' | 'NO_APLICA';
    trabajosCampo: 'ACORDE' | 'NO_ACORDE' | 'NO_APLICA';
    evaluacionInicial: 'FORMATIVA_Y_SUMATIVA' | 'SOLO_SUMATIVA' | 'NO_PRESENTA';
    regimenAprobacion: 'PROMOCIONAL_REGULAR_LIBRE' | 'INCOMPLETO';
    horarios: 'PRESENTA' | 'NO_PRESENTA';
    distribucionHoraria: 'PRESENTA' | 'NO_PRESENTA';
  };
  dictamen: 'FAVORABLE' | 'REQUIERE_CORRECCION';
  observaciones?: string;
}

// ============================================================================
// Informe Disciplinar — Dirección de Carrera (Ord. HCS 219/2022 Anexo IV)
// ============================================================================

export interface DisciplinaryReportData {
  contenidos: 'CUMPLE' | 'NO_CUMPLE';
  trabajosPracticos: {
    tp: 'ACORDE' | 'NO_ACORDE';
    laboratorio: 'ACORDE' | 'NO_ACORDE' | 'NO_APLICA';
    campo: 'ACORDE' | 'NO_ACORDE' | 'NO_APLICA';
  };
  bibliografia: { basica: 'PRESENTA' | 'NO_PRESENTA'; complementaria: 'PRESENTA' | 'NO_PRESENTA' };
  controlPaad: { docenteId: string; nombreDocente: string; cargo: DocentCategory; estado: 'PRESENTO' | 'NO_PRESENTO' }[];
  dictamen: 'CUMPLE' | 'REQUIERE_CORRECCION';
  observaciones?: string;
}

// ============================================================================
// Informe General de PAAC — elaborado en conjunto por UAP y Dirección de
// Carrera una vez que la planificación tiene aprobación pedagógica y
// disciplinar plena. Es requisito para poder elevarla al Consejo Departamental.
// ============================================================================

export interface GeneralReportData {
  conclusionConjunta: string;
  observacionesGenerales?: string;
  recomendacion: 'FAVORABLE' | 'NO_FAVORABLE';
  elaboradoPorUap: boolean;
  elaboradoPorDireccion: boolean;
}

export const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIADO_A_REVISION: 'Enviado a Revisión',
  OBSERVADO: 'Observado',
  APROBADO_PEDAGOGICO: 'Aprobado Pedagógico',
  APROBADO_DISCIPLINAR: 'Aprobado Disciplinar',
  APROBADO_PLENO: 'Aprobado Pleno',
  ELEVADO_AL_CONSEJO: 'Elevado al Consejo',
  FINALIZADO: 'Finalizado',
};

export const ROL_LABELS: Record<string, string> = {
  DOCENTE: 'Docente',
  UAP: 'UAP',
  DIRECCION_CARRERA: 'Dirección de Carrera',
  CONSEJO_DEPARTAMENTAL: 'Consejo Departamental',
  ADMINISTRADOR: 'Administrador',
};
