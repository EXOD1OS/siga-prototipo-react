// Autocompletado de los informes del PAAC (Ord. HCS N° 219/2022, Anexos III y IV)
// a partir del contenido cargado por la cátedra, el contexto de la asignatura y los PAAD del equipo.
import { htmlTieneTexto } from './richText';
import { paacDesdeDatosAnteriores } from './paac';
import type { PaacContenido, SemanaCronograma } from '../types/paac';
import type { AsigContext, EquipoCatedra, Regimen } from '../types/estructura';
import type { PaacData } from '../types/planificacion';
import type { InformeDisciplinarDatos, InformePedagogicoDatos } from '../types/informes';

/** Lo que necesita el autocompletado del PAAC evaluado. */
export interface FuenteInforme {
  cycle: number;
  data: PaacData;
  paac?: PaacContenido;
  comments: { resolved: boolean; area?: string }[];
}

/** Documento mínimo para saber si un integrante presentó su PAAD. */
export interface DocPaadResumen {
  type: string;
  owner: string;
  state: string;
  cycle?: number;
}

const contenidoDe = (d: FuenteInforme): PaacContenido => d.paac ?? paacDesdeDatosAnteriores(d.data);

const textoLegado = (v: PaacData[string]) => (typeof v === 'string' ? v.trim() : '');

const horas = (v: string) => {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/** true si el cronograma prevé horas o actividades en esa columna. */
const cronogramaPreve = (c: PaacContenido, horasKey: keyof SemanaCronograma, actividadKey: keyof SemanaCronograma) =>
  c.cronograma.some((s) => horas(s[horasKey]) > 0 || s[actividadKey].trim() !== '');

const NO_SE_PREVE = /no se prev/i;

/** Laboratorio: horas en el cronograma o un texto del PAAC anterior que no diga "no se prevén". */
function preveLaboratorio(d: FuenteInforme, c: PaacContenido): boolean {
  const lab = textoLegado(d.data.lab);
  if (lab) return !NO_SE_PREVE.test(lab);
  return cronogramaPreve(c, 'horasLab', 'tpl');
}

function preveCampo(d: FuenteInforme, c: PaacContenido): boolean {
  const campo = textoLegado(d.data.campo);
  if (campo) return !NO_SE_PREVE.test(campo);
  return cronogramaPreve(c, 'horasCampo', 'tplCampo');
}

const cantLibros = (b: PaacContenido['bibliografia']['basica']) => b.fisica.length + b.digital.length;

export const REGIMEN_LABEL: Record<Regimen, string> = {
  ANUAL: 'Anual',
  '1C': '1º Cuatrimestre',
  '2C': '2º Cuatrimestre',
};

/** "A", "A y B", "A, B y C". */
export function enumerar(partes: string[]): string {
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

/** Integrantes del equipo con cargo legible (el responsable se indica en el cargo). */
export function integrantesEquipo(equipo: EquipoCatedra[], fullName: (id: string) => string) {
  return [...equipo]
    .sort((a, b) => Number(b.esResponsable) - Number(a.esResponsable))
    .map((e) => ({ docenteId: e.docenteId, nombre: fullName(e.docenteId), cargo: e.esResponsable ? `${e.cargo} / Responsable` : e.cargo }));
}

/** Anexo IV — sugerencia de la Dirección de Carrera a partir del PAAC. */
export function sugerirInformeDisciplinar(opts: {
  d: FuenteInforme;
  equipo: EquipoCatedra[];
  docs: DocPaadResumen[];
  fullName: (id: string) => string;
}): InformeDisciplinarDatos {
  const { d, equipo, docs, fullName } = opts;
  const c = contenidoDe(d);
  const paadDe = (docenteId: string) => docs.find((x) => x.type === 'PAAD' && x.owner === docenteId && (x.cycle === undefined || x.cycle === d.cycle));
  return {
    contenidos: c.unidades.length > 0 ? 'Cumple' : 'No Cumple',
    tp: c.trabajosPracticos.length > 0 ? 'Acorde' : 'No Acorde',
    tpLab: preveLaboratorio(d, c) ? 'Acorde' : 'No corresponde',
    tpCampo: preveCampo(d, c) ? 'Acorde' : 'No corresponde',
    bibBasica: cantLibros(c.bibliografia.basica) > 0 ? 'Presenta' : 'No Presenta',
    // El PAAC anterior no separaba la complementaria: se acepta si cargó más de un libro.
    bibComplementaria:
      cantLibros(c.bibliografia.complementaria) > 0 || cantLibros(c.bibliografia.basica) > 1 ? 'Presenta' : 'No Presenta',
    paads: integrantesEquipo(equipo, fullName).map((i) => {
      const paad = paadDe(i.docenteId);
      return { ...i, valor: paad && paad.state !== 'BORRADOR' ? 'Presentó' : 'No Presentó' };
    }),
  };
}

/** Anexo III — sugerencia de la UAP a partir del PAAC. */
export function sugerirInformePedagogico(d: FuenteInforme): InformePedagogicoDatos {
  const c = contenidoDe(d);

  const tieneCompetencias = c.competenciasEspecificas.length > 0 || Object.values(c.competenciasGenerales).some((n) => n !== null);
  const intro = htmlTieneTexto(c.importancia);
  const introduccion =
    intro && tieneCompetencias
      ? { valor: 'Presenta Completa', texto: 'Fundamenta la importancia de la asignatura y su aporte a las competencias de egreso.' }
      : intro || tieneCompetencias
        ? { valor: 'Presenta Parcialmente', texto: intro ? 'Falta precisar el aporte a las competencias de egreso.' : 'Falta fundamentar la importancia de la asignatura.' }
        : { valor: 'No Presenta', texto: '' };

  const diag = Object.values(c.diagnostico).filter(htmlTieneTexto).length;
  const diagnostico =
    diag === 4
      ? { valor: 'Presenta Completa', texto: 'Describe articulación vertical y horizontal, características de los estudiantes e infraestructura.' }
      : diag > 0
        ? { valor: 'Presenta Parcialmente', texto: `Completa ${diag} de los 4 aspectos del diagnóstico.` }
        : { valor: 'No Presenta', texto: '' };

  const hayObjetivos = htmlTieneTexto(c.objetivosCarrera) || htmlTieneTexto(c.proposito) || c.resultados.length > 0 || tieneCompetencias;
  const metodo = htmlTieneTexto(c.metodologia);
  const recursos = c.propuesta.length > 0;
  const hayTps = c.trabajosPracticos.length > 0;

  const regimenes = [
    htmlTieneTexto(c.regimen.promocionales) && 'Promocional',
    htmlTieneTexto(c.regimen.regulares) && 'Regular',
    htmlTieneTexto(c.regimen.libres) && 'Libre',
  ].filter((x): x is string => !!x);

  const tiposEval = new Set(c.evaluacion.map((e) => e.tipo));
  const evalCompleta = htmlTieneTexto(c.evalDescripcion) && c.evaluacion.length > 0;
  const hayHorarios = Object.values(c.horarios).some((fila) => Object.values(fila).some((v) => v.trim() !== ''));

  return {
    introduccion,
    diagnostico,
    objetivos: hayObjetivos ? 'Concretos y claros' : 'No presenta',
    clase: metodo && recursos
      ? 'Presenta y describe la metodología del proceso de enseñanza'
      : metodo
        ? 'Presenta la metodología sin detallar los recursos didácticos'
        : 'No presenta',
    contenidos: `Desarrollados en ${c.unidades.length} unidades`,
    tp: hayTps ? 'Articulados con la teoría' : 'No presenta',
    tpLab: preveLaboratorio(d, c) ? 'Articulados con la teoría' : 'No corresponde',
    tpCampo: preveCampo(d, c) ? 'Articulados con la teoría' : 'No corresponde',
    evaluacion: evalCompleta
      ? tiposEval.size === 1 && tiposEval.has('Sumativa')
        ? 'Solo sumativa. Criterios a precisar'
        : 'Formativa y Sumativa. Criterios claros. Técnicas de evaluación apropiadas'
      : 'No presenta',
    regimen: regimenes.length ? enumerar(regimenes) : 'No presenta',
    // Los horarios pueden venir de la base de datos de la carrera: se asume "Presenta" salvo que no haya ninguno.
    horarios: hayHorarios || c.cronograma.length > 0 ? 'Presenta' : 'No Presenta',
    distribucion: c.cronograma.length > 0 ? 'Presenta' : 'No Presenta',
  };
}

/** Síntesis inicial de la observación cuando el área no dejó observaciones abiertas. */
export function observacionSugerida(d: FuenteInforme, area: 'uap' | 'direccion'): string {
  const abiertas = d.comments.some((o) => !o.resolved && o.area === area);
  if (abiertas) return '';
  return area === 'direccion'
    ? 'Sin observaciones. El PAAC se ajusta a los contenidos mínimos del plan de estudio.'
    : 'Sin observaciones. La propuesta pedagógica es coherente con el perfil de egreso.';
}

/** Contexto institucional que encabeza ambos anexos. */
export function encabezadoInforme(ctx: AsigContext, ciclo: number) {
  return {
    sede: ctx.sede?.nombre ?? '—',
    carrera: ctx.carrera?.nombre ?? '—',
    plan: ctx.plan?.ordenanza ?? '—',
    anio: String(ciclo),
    asignatura: ctx.asig?.nombre ?? '—',
    anioCursada: ctx.asig ? `${ctx.asig.anoCursada}º Año` : '—',
    regimen: ctx.asig ? REGIMEN_LABEL[ctx.asig.regimenDictado] : '—',
    cargaHoraria: ctx.asig ? `${ctx.asig.horasTotales} HS` : '—',
  };
}
