import type { PaacTraditionalData, PaacCompetenciasData, PaadData, GeneralReportData } from '@/types/planificacion';

export function defaultPaacTraditional(encabezado: PaacTraditionalData['encabezado']): PaacTraditionalData {
  return {
    encabezado,
    fundamentacion: {
      introduccion: { importancia: '', relacionPerfil: '' },
      diagnostico: { articulacionCorrelativas: '', articulacionMismoAno: '', infraestructura: '' },
    },
    objetivos: {
      catedra: { conceptuales: [], procedimentales: [], actitudinales: [] },
      especificos: [],
    },
    metodologiaEnsenanza: { clasesTeoricas: '', clasesPracticas: '', recursosDidacticos: [] },
    metodologiaEvaluacion: {
      tipos: [],
      modalidades: [],
      criterios: '',
      regimenAprobacion: { promocional: '', regular: '', libre: '' },
    },
    trabajosPracticos: { detalleTp: '' },
    bibliografia: { basica: [], complementaria: [] },
    distribucionHoraria: { horasSemanales: 0, horasTotales: 0, cronograma: '' },
  };
}

export function defaultPaacCompetencias(encabezado: PaacCompetenciasData['encabezado']): PaacCompetenciasData {
  return {
    encabezado,
    fundamentacion: {
      importanciaAsignatura: '',
      matrizCompetencias: [],
      diagnostico: {
        articulacionCorrelativas: '',
        articulacionMismoAno: '',
        analisisEstudiantes: '',
        infraestructuraRequerida: '',
      },
    },
    objetivosPropositoRA: {
      objetivosCarrera: '',
      propositoAsignatura: [],
      resultadosAprendizaje: [],
    },
    metodologia: {
      enfoque: '',
      propuestaDesarrolloCompetencias: [],
    },
    contenidos: [],
    programaTrabajosPracticos: [],
    evaluacion: {
      tipos: [],
      criterios: [],
      tecnicas: [],
      regimenAprobacion: { promocional: '', regular: '', libre: '' },
    },
    bibliografia: { basica: [], complementaria: [] },
    horariosClases: [],
    cronograma: [],
  };
}

export function defaultPaad(): PaadData {
  return {
    actividadEnsenanza: {
      cursosAtendidos: [],
      capacitaciones: [],
      materialElaborado: [],
      otrosTrabajosDocentes: [],
    },
    investigacion: [],
    formacionRecursosHumanos: { detalle: '' },
    formacionAcademica: { detalle: '' },
    extension: [],
    gestion: { detalle: '' },
    otrasActividades: [],
    distribucionHoraria: [
      { actividad: 'ENSENANZA' },
      { actividad: 'INVESTIGACION' },
      { actividad: 'EXTENSION' },
      { actividad: 'FORMACION' },
      { actividad: 'GESTION' },
    ],
  };
}

export function defaultInformeGeneral(): GeneralReportData {
  return {
    conclusionConjunta: '',
    observacionesGenerales: '',
    recomendacion: 'FAVORABLE',
    elaboradoPorUap: false,
    elaboradoPorDireccion: false,
  };
}
