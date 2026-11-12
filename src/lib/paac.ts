import type { AsigContext, EquipoCatedra, Usuario } from '../types/estructura';
import type { ObservacionDoc, PaacData } from '../types/planificacion';
import { horasDe } from '../types/paad';
import {
  COMPETENCIAS_GENERALES,
  HORAS_CRONOGRAMA,
  nuevoId,
  paacVacio,
  semanaVacia,
  type ColumnaHorasCronograma,
  type NivelAporte,
  type PaacContenido,
  type SemanaCronograma,
} from '../types/paac';
import { escaparHtml, htmlTieneTexto, parrafo } from './richText';
import { nombreOficial } from './paad';

/** Lema institucional que encabeza el documento. Reemplazar por el lema oficial de cada año. */
export const LEMA_ANUAL: Record<number, string> = {
  2025: '“2025 – Lema institucional del año”',
  2026: '“2026 – Lema institucional del año”',
};

// ---------------------------------------------------------------------------
// Guía oficial de llenado (íconos "i")
// ---------------------------------------------------------------------------

export const INFO_PAAC = {
  equipo: 'Según su conformación, integra automáticamente el equipo de cátedra registrado en la Sede.',
  nivelIntensidad: 'Nivel de intensidad de la formación práctica según estándares curriculares (ej. Nivel 2 o Nivel 3).',
  relacionTP: 'Relación entre la carga horaria teórica y la práctica de la asignatura (ej. T = P, T < P).',
  importancia:
    'Describir la ubicación de la asignatura dentro del Bloque de Conocimiento del plan de estudios, su aporte conceptual y práctico al perfil del graduado y su vínculo epistemológico con el área disciplinar.',
  competencias:
    'Indicar el nivel de contribución al desarrollo de las competencias considerando la codificación: 0: Ninguna (No contribuye) | 1: Baja (Contribuye en alguna medida / sirve de fundamento) | 2: Media (Contribuye de manera significativa) | 3: Alta (Tributa directamente a la competencia).',
  competenciasEspecificas:
    'Las Competencias Específicas (CE) están definidas en el Diseño Curricular de cada carrera (ej. CE1.1, CE1.2, CE1.3, CE2.1...). Agregue las competencias específicas correspondientes y evalúe al final de cada fila su nivel de aporte (0, 1, 2 o 3).',
  correlativas:
    'Describir la relación entre las asignaturas correlativas anteriores y posteriores (qué conocimientos se toman de las anteriores y qué ofrece a las consecutivas de nivel superior).',
  mismoAnio:
    'Describir la importancia de la asignatura en el Diseño Curricular, tomando los aportes de las asignaturas del mismo año y estableciendo una articulación de contenidos y/o prácticas para lograr la integración de saberes.',
  estudiantes:
    'Describir conocimientos previos (nivel alcanzado), caracterizar el perfil de los estudiantes teniendo en cuenta cantidad de recursantes, estudiantes con discapacidad y aspectos del contexto sociocultural (trabajo, residencia, acceso a la tecnología) y recomendaciones.',
  infraestructura:
    'Describir si es necesario contar con infraestructura física y recursos específicos para el desarrollo de la asignatura (aulas, conectividad, laboratorios, software específico, equipamiento, plataformas virtuales, biblioteca).',
  objetivosCarrera: 'Según lo establecido en el Diseño Curricular del Plan de Estudios y normativas ministeriales vigentes.',
  proposito:
    'Describir la meta y/o propósito principal de la asignatura en relación con los aprendizajes y competencias a lograr por las y los estudiantes.',
  resultados: 'Describir y explicar los Resultados de Aprendizaje (RA1, RA2, RA3...) a promover en el desarrollo de la asignatura.',
  metodologia:
    'Describir el enfoque de enseñanza adoptado (Aprendizaje Centrado en el Estudiante), estrategias de trabajo colaborativo, aula invertida, características de las actividades prácticas, uso de laboratorios físicos/virtuales, gamificación y utilización del Campus Virtual UNLaR.',
  propuesta:
    'Especificar para cada Resultado de Aprendizaje las competencias vinculadas, unidades temáticas, guías de trabajos prácticos, actividades formativas y estrategias de enseñanza.',
  unidades:
    'Detallar cada Unidad (Unidad N° 1, 2, 3...), su título, los contenidos analíticos desarrollados y opcionalmente los resultados de aprendizaje específicos de la unidad.',
  trabajosPracticos: 'Detallar cada Trabajo Práctico (N°, Título, Propósito, Modalidad Individual/Grupal/Plataforma y Unidad/Temas vinculados).',
  evaluacion:
    'Vincular el Tipo de Evaluación (Formativa / Sumativa) con los Criterios de Evaluación, el RA N° correspondiente y las Técnicas e Instrumentos de Evaluación (rúbricas, exámenes escritos, estudios de caso, trabajos prácticos, coloquios).',
  regimen:
    'Describir claramente las condiciones de asistencia, calificaciones mínimas, instancias de recuperación y modalidad de evaluación para cada condición de alumno según la normativa vigente.',
  bibliografia:
    'Debe procurarse que la bibliografía básica cuente con ejemplares en Centros de Documentación de la UNLaR (https://biblioteca.unlar.edu.ar/) o en la Plataforma eLibro (https://elibro.net/es/lc/unlariojabiblio/).',
  horarios:
    'Indicar las franjas horarias y comisiones de dictado de Horas Teóricas y Horas Prácticas de Lunes a Sábado (ej. 18-21 hs, Comisión 1 9-11 hs).',
  cronograma:
    'Para las cátedras ANUALES deberán considerarse 30 semanas (32 en Profesorados). Para las cátedras CUATRIMESTRALES deberán considerarse 15 semanas (16 en Profesorados).',
} as const;

// ---------------------------------------------------------------------------
// Aspectos generales (autocompletados desde la cátedra)
// ---------------------------------------------------------------------------

export interface IntegranteEquipo {
  cargo: string;
  nombre: string;
  docenteId: string;
  esResponsable: boolean;
}

export interface AspectosPaac {
  sede: string;
  departamento: string;
  /** Nombre largo para el encabezado ("Departamento Académico de …"). */
  departamentoEncabezado: string;
  carrera: string;
  planOrdenanza: string;
  asignatura: string;
  curso: string;
  regimen: string;
  creditoHorario: string;
  equipo: IntegranteEquipo[];
  contenidosMinimos: string;
  nivelIntensidad: string;
  relacionTP: string;
  /** true si el dato viene de la base y no se puede editar desde el PAAC. */
  nivelIntensidadFijo: boolean;
  relacionTPFija: boolean;
}

const CURSO: Record<number, string> = { 1: '1er. Año', 2: '2do. Año', 3: '3er. Año', 4: '4to. Año', 5: '5to. Año', 6: '6to. Año' };
const REGIMEN: Record<string, string> = { '1C': '1er. Cuatrimestre', '2C': '2do. Cuatrimestre', ANUAL: 'Anual' };
const CARGO_CORTO: Record<string, string> = {
  'Profesor Titular': 'Prof. Titular',
  'Profesor Asociado': 'Prof. Asociado',
  'Profesor Adjunto': 'Prof. Adjunto',
  'Jefe de Trabajos Prácticos': 'Prof. JTP',
  'Ayudante de Primera': 'Ayudante de Primera',
};
const ORDEN_CARGO = Object.keys(CARGO_CORTO);

export function armarAspectosPaac(opts: {
  asignaturaId: string | undefined;
  contenido: PaacContenido;
  ciclo: number;
  usuarios: Usuario[];
  equipos: EquipoCatedra[];
  asigContext: (id: string) => AsigContext;
}): AspectosPaac {
  const { asignaturaId, contenido, ciclo, usuarios, equipos, asigContext } = opts;
  const ctx = asignaturaId ? asigContext(asignaturaId) : null;
  const asig = ctx?.asig;
  // "DACEFyN (Ciencias Exactas, Físicas y Naturales)" → nombre largo y sigla.
  const m = ctx?.depto?.nombre.match(/^(\S+) \((.+)\)$/);
  const deptoLargo = m ? `Departamento de ${m[2]} - ${m[1]}` : (ctx?.depto?.nombre ?? '');
  const equipo = equipos
    .filter((e) => e.asignaturaId === asignaturaId && e.cicloLectivo === ciclo)
    .sort((a, b) => ORDEN_CARGO.indexOf(a.cargo) - ORDEN_CARGO.indexOf(b.cargo))
    .map((e) => ({
      cargo: CARGO_CORTO[e.cargo] ?? e.cargo,
      nombre: nombreOficial(usuarios.find((u) => u.id === e.docenteId)),
      docenteId: e.docenteId,
      esResponsable: e.esResponsable,
    }));
  const nivelDb = asig?.nivelIntensidad?.trim() ?? '';
  const relacionDb = asig?.relacionTeoricaPractica?.trim() ?? '';

  return {
    sede: ctx?.sede ? `UNLaR - ${ctx.sede.nombre}` : '',
    departamento: deptoLargo || (ctx ? 'Sede regional (sin departamento)' : ''),
    departamentoEncabezado: m ? `Departamento Académico de ${m[2]}` : (ctx?.sede?.nombre ?? ''),
    carrera: ctx?.carrera?.nombre ?? '',
    planOrdenanza: ctx?.plan?.ordenanza.match(/\d+\/\d+/)?.[0] ?? ctx?.plan?.ordenanza ?? '',
    asignatura: asig?.nombre ?? '',
    curso: asig ? (CURSO[asig.anoCursada] ?? `${asig.anoCursada}.º Año`) : '',
    regimen: asig ? (REGIMEN[asig.regimenDictado] ?? asig.regimenDictado) : '',
    creditoHorario: asig ? `${asig.horasTotales} horas / ${asig.horasSemanales} Hs semanales` : '',
    equipo,
    contenidosMinimos: asig?.contenidosMinimos ?? '',
    nivelIntensidad: nivelDb || contenido.nivelIntensidad,
    relacionTP: relacionDb || contenido.relacionTP,
    nivelIntensidadFijo: !!nivelDb,
    relacionTPFija: !!relacionDb,
  };
}

// ---------------------------------------------------------------------------
// Cronograma
// ---------------------------------------------------------------------------

export type TotalesCronograma = Record<ColumnaHorasCronograma, number> & { total: number };

export function totalesCronograma(semanas: SemanaCronograma[]): TotalesCronograma {
  const t = Object.fromEntries(HORAS_CRONOGRAMA.map((k) => [k, semanas.reduce((s, w) => s + horasDe(w[k]), 0)])) as Record<
    ColumnaHorasCronograma,
    number
  >;
  return { ...t, total: HORAS_CRONOGRAMA.reduce((s, k) => s + t[k], 0) };
}

/** Completa el cronograma hasta `n` semanas sin borrar las ya cargadas. */
export function generarSemanas(actual: SemanaCronograma[], n: number): SemanaCronograma[] {
  if (actual.length >= n) return actual;
  return [...actual, ...Array.from({ length: n - actual.length }, (_, i) => semanaVacia(actual.length + i + 1))];
}

// ---------------------------------------------------------------------------
// Apartados, progreso y validación
// ---------------------------------------------------------------------------

export interface CampoProgreso {
  label: string;
  ok: boolean;
  /** Clave del campo para "Ir a" y observaciones. */
  fKey: string;
}

export interface ApartadoPaac {
  numero: number;
  titulo: string;
  corto: string;
  campos: CampoProgreso[];
}

export const TITULOS_PAAC: { numero: number; titulo: string; corto: string }[] = [
  { numero: 0, titulo: 'ASPECTOS GENERALES', corto: 'Aspectos generales' },
  { numero: 1, titulo: 'FUNDAMENTACIÓN – ANÁLISIS DE LA ASIGNATURA', corto: 'Fundamentación' },
  { numero: 2, titulo: 'DIAGNÓSTICO', corto: 'Diagnóstico' },
  { numero: 3, titulo: 'OBJETIVO, PROPÓSITO Y RESULTADOS DE APRENDIZAJE', corto: 'Objetivo, propósito y RA' },
  { numero: 4, titulo: 'METODOLOGÍA Y PROPUESTA PARA EL DESARROLLO DE COMPETENCIAS', corto: 'Metodología' },
  { numero: 5, titulo: 'CONTENIDOS', corto: 'Contenidos' },
  { numero: 6, titulo: 'PROGRAMA DE TRABAJOS PRÁCTICOS / LABORATORIO', corto: 'Trabajos prácticos' },
  { numero: 7, titulo: 'EVALUACIÓN Y RÉGIMEN DE APROBACIÓN', corto: 'Evaluación y aprobación' },
  { numero: 8, titulo: 'BIBLIOGRAFÍA', corto: 'Bibliografía' },
  { numero: 9, titulo: 'HORARIOS DE CLASES Y CRONOGRAMA', corto: 'Horarios y cronograma' },
];

const nivelOk = (n: NivelAporte | null | undefined) => n !== null && n !== undefined;

/** Campos obligatorios de cada apartado (los marcados "opcional" o "si corresponde" no cuentan). */
export function apartadosPaac(c: PaacContenido, aspectos: AspectosPaac, porCompetencias: boolean): ApartadoPaac[] {
  const campos: CampoProgreso[][] = [
    [
      { label: 'Nivel de intensidad', ok: !!aspectos.nivelIntensidad, fKey: 'aspectos' },
      { label: 'Relación teórica práctica', ok: !!aspectos.relacionTP, fKey: 'aspectos' },
    ],
    [
      { label: 'Importancia de la asignatura', ok: htmlTieneTexto(c.importancia), fKey: 'importancia' },
      ...(porCompetencias
        ? [
            {
              label: 'Nivel de las competencias generales',
              ok: COMPETENCIAS_GENERALES.every((g) => nivelOk(c.competenciasGenerales[g.codigo])),
              fKey: 'competenciasGenerales',
            },
            {
              label: 'Competencias específicas evaluadas',
              ok: c.competenciasEspecificas.length > 0 && c.competenciasEspecificas.every((e) => e.codigo.trim() && e.detalle.trim() && nivelOk(e.nivel)),
              fKey: 'competenciasEspecificas',
            },
          ]
        : []),
    ],
    [
      { label: 'Articulación con correlativas', ok: htmlTieneTexto(c.diagnostico.correlativas), fKey: 'diagnostico.correlativas' },
      { label: 'Articulación con materias del mismo año', ok: htmlTieneTexto(c.diagnostico.mismoAnio), fKey: 'diagnostico.mismoAnio' },
      { label: 'Infraestructura requerida', ok: htmlTieneTexto(c.diagnostico.infraestructura), fKey: 'diagnostico.infraestructura' },
    ],
    [
      { label: 'Objetivos de la carrera', ok: htmlTieneTexto(c.objetivosCarrera), fKey: 'objetivosCarrera' },
      { label: 'Propósito de la asignatura', ok: htmlTieneTexto(c.proposito), fKey: 'proposito' },
      { label: 'Resultados de aprendizaje', ok: c.resultados.some((r) => r.descripcion.trim()), fKey: 'resultados' },
    ],
    [
      { label: 'Metodología de enseñanza', ok: htmlTieneTexto(c.metodologia), fKey: 'metodologia' },
      { label: 'Propuesta para el desarrollo de competencias', ok: c.propuesta.length > 0, fKey: 'propuesta' },
    ],
    [{ label: 'Unidades temáticas', ok: c.unidades.some((u) => u.titulo.trim() && htmlTieneTexto(u.contenidos)), fKey: 'unidades' }],
    [{ label: 'Trabajos prácticos', ok: c.trabajosPracticos.some((t) => t.titulo.trim()), fKey: 'trabajosPracticos' }],
    [
      { label: 'Cuadro de evaluación', ok: c.evaluacion.length > 0, fKey: 'evaluacion' },
      { label: 'Alumnos promocionales', ok: htmlTieneTexto(c.regimen.promocionales), fKey: 'regimen.promocionales' },
      { label: 'Alumnos regulares', ok: htmlTieneTexto(c.regimen.regulares), fKey: 'regimen.regulares' },
      { label: 'Alumnos libres', ok: htmlTieneTexto(c.regimen.libres), fKey: 'regimen.libres' },
    ],
    [
      {
        label: 'Bibliografía básica',
        ok: c.bibliografia.basica.fisica.length + c.bibliografia.basica.digital.length > 0,
        fKey: 'bibliografia.basica',
      },
    ],
    [
      { label: 'Horarios de clases', ok: Object.values(c.horarios).some((f) => Object.values(f).some((v) => v.trim())), fKey: 'horarios' },
      { label: 'Cronograma semanal', ok: c.cronograma.length > 0, fKey: 'cronograma' },
    ],
  ];
  return TITULOS_PAAC.map((t, i) => ({ ...t, campos: campos[i] }));
}

export interface ProblemaPaac {
  numero: number;
  mensaje: string;
}

export function validarPaacContenido(opts: {
  apartados: ApartadoPaac[];
  contenido: PaacContenido;
  horasPlan: number | undefined;
  comments: ObservacionDoc[];
}): ProblemaPaac[] {
  const { apartados, contenido, horasPlan, comments } = opts;
  const problemas: ProblemaPaac[] = apartados.flatMap((a) =>
    a.campos.filter((f) => !f.ok).map((f) => ({ numero: a.numero, mensaje: `${a.numero}) ${a.corto}: completá «${f.label}».` }))
  );
  const total = totalesCronograma(contenido.cronograma).total;
  if (contenido.cronograma.length > 0 && horasPlan && total !== horasPlan) {
    problemas.push({ numero: 9, mensaje: `9) Cronograma: suma ${total} hs y el crédito horario de la asignatura es de ${horasPlan} hs.` });
  }
  const pendientes = comments.filter((o) => !o.resolved).length;
  if (pendientes > 0) {
    const sec = comments.find((o) => !o.resolved)?.section ?? 0;
    problemas.push({ numero: sec, mensaje: `Hay ${pendientes} observación(es) sin marcar como subsanadas.` });
  }
  return problemas;
}

// ---------------------------------------------------------------------------
// Migración de PAAC cargados con el esquema anterior (campos planos)
// ---------------------------------------------------------------------------

const txt = (v: unknown) => (typeof v === 'string' ? v : '');
const filas = (v: unknown): string[][] => (Array.isArray(v) ? (v as string[][]) : []);

export function paacDesdeDatosAnteriores(data: PaacData): PaacContenido {
  const c = paacVacio();
  const objetivos = [
    ['Conceptuales', txt(data.concept)],
    ['Procedimentales', txt(data.procedure)],
    ['Actitudinales', txt(data.attitude)],
  ].filter(([, v]) => v.trim());
  return {
    ...c,
    importancia: parrafo(txt(data.intro)),
    competenciasEspecificas: filas(data.competencias)
      .filter((r) => r[0] === 'Específica')
      .map((r) => {
        const [codigo, ...resto] = (r[1] ?? '').split(' · ');
        const n = Number(r[2]);
        return { id: nuevoId('ce'), codigo: resto.length ? codigo : '', detalle: resto.length ? resto.join(' · ') : (r[1] ?? ''), nivel: [0, 1, 2, 3].includes(n) ? (n as NivelAporte) : null };
      }),
    diagnostico: { ...c.diagnostico, correlativas: parrafo(txt(data.diag)) },
    proposito: objetivos.length ? `<ul>${objetivos.map(([k, v]) => `<li><strong>${k}:</strong> ${escaparHtml(v)}</li>`).join('')}</ul>` : '',
    metodologia: parrafo(txt(data.method)) + parrafo(txt(data.resources)),
    unidades: filas(data.units).map((r, i) => ({
      id: nuevoId('un'),
      numero: String(i + 1),
      titulo: (r[0] ?? '').replace(/^Unidad\s*\d+\s*:\s*/i, ''),
      contenidos: parrafo(r[1]),
      resultados: '',
    })),
    tpIntro: parrafo(txt(data.lab)),
    trabajosPracticos: filas(data.tp).map((r) => ({
      id: nuevoId('tp'),
      numero: r[0] ?? '',
      titulo: r[1] ?? '',
      proposito: r[5] ?? '',
      modalidad: r[2] ?? '',
      unidadTemas: '',
    })),
    evalDescripcion: parrafo(txt(data.eval)),
    evaluacion: filas(data.parciales).map((r) => ({
      id: nuevoId('ev'),
      tipo: 'Sumativa',
      criterios: '',
      ra: '',
      tecnica: [r[0], r[2], r[3]].filter(Boolean).join(' – '),
    })),
    regimen: { promocionales: parrafo(txt(data.promotion)), regulares: parrafo(txt(data.regular)), libres: parrafo(txt(data.free)) },
    bibliografia: filas(data.books).reduce(
      (acc, r) => {
        const bloque = r[0] === 'Complementaria' ? acc.complementaria : acc.basica;
        const enlace = r[5] ?? '';
        if (/^https?:\/\//.test(enlace)) {
          bloque.digital.push({ id: nuevoId('bd'), titulo: r[2] ?? '', autores: r[1] ?? '', editorial: r[3] ?? '', url: enlace, anio: r[4] ?? '' });
        } else {
          bloque.fisica.push({ id: nuevoId('bf'), titulo: r[2] ?? '', autores: r[1] ?? '', editorial: r[3] ?? '', ejemplares: enlace.match(/(\d+)\s*ej/)?.[1] ?? '', anio: r[4] ?? '' });
        }
        return acc;
      },
      { basica: { fisica: [], digital: [] }, complementaria: { fisica: [], digital: [] } } as PaacContenido['bibliografia']
    ),
  };
}

/** Porcentaje de campos completos del PAAC (misma cuenta que el índice del editor). */
export function progresoPaac(c: PaacContenido, aspectos: AspectosPaac, porCompetencias: boolean): number {
  const campos = apartadosPaac(c, aspectos, porCompetencias).flatMap((a) => a.campos);
  return campos.length ? Math.round((campos.filter((f) => f.ok).length / campos.length) * 100) : 100;
}
