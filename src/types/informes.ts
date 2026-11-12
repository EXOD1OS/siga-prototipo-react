// Informes de evaluación del PAAC según la Ord. HCS N° 219/2022 (DACEFyN – UNLaR):
// Anexo III (Informe Pedagógico, UAP) y Anexo IV (Informe Disciplinar, Dirección de Carrera).

export const OPC_CUMPLE = ['Cumple', 'No Cumple'] as const;
export const OPC_ACORDE = ['Acorde', 'No Acorde', 'No corresponde'] as const;
export const OPC_PRESENTA = ['Presenta', 'No Presenta'] as const;
export const OPC_PAAD = ['Presentó', 'No Presentó'] as const;
export const OPC_COMPLETITUD = ['Presenta Completa', 'Presenta Parcialmente', 'No Presenta'] as const;

/** Sugerencias de los campos de texto libre del informe pedagógico (se ofrecen como lista desplegable). */
export const SUGERENCIAS_PED = {
  objetivos: ['Concretos y claros', 'Poco precisos', 'No presenta'],
  clase: [
    'Presenta y describe la metodología del proceso de enseñanza',
    'Presenta la metodología sin detallar los recursos didácticos',
    'No presenta',
  ],
  recursos: ['Presenta recursos didácticos acordes a las estrategias', 'Recursos didácticos a precisar', 'No presenta'],
  tp: ['Articulados con la teoría', 'Parcialmente articulados con la teoría', 'No corresponde'],
  evaluacion: [
    'Formativa y Sumativa. Criterios claros. Técnicas de evaluación apropiadas',
    'Solo sumativa. Criterios a precisar',
    'No presenta',
  ],
} as const;

export interface PaadIntegrante {
  docenteId: string;
  nombre: string;
  cargo: string;
  valor: string;
}

/** Cuadro del Informe Disciplinar (Anexo IV). La observación se guarda en `obsDisciplinares`. */
export interface InformeDisciplinarDatos {
  contenidos: string;
  tp: string;
  tpLab: string;
  tpCampo: string;
  bibBasica: string;
  bibComplementaria: string;
  paads: PaadIntegrante[];
}

/** Ítem con selector discreto y comentario del evaluador. */
export interface ItemValorado {
  valor: string;
  texto: string;
}

/** Grilla del Informe Pedagógico (Anexo III). La observación se guarda en `obsGenerales`. */
export interface InformePedagogicoDatos {
  // A) Aspectos generales
  introduccion: ItemValorado;
  diagnostico: ItemValorado;
  objetivos: string;
  clase: string;
  recursos: string;
  // B) Aspectos curriculares
  contenidos: string;
  tp: string;
  tpLab: string;
  tpCampo: string;
  evaluacion: string;
  regimen: string;
  horarios: string;
  distribucion: string;
}
