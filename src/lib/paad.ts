import type { AsigContext, EquipoCatedra, Usuario } from '../types/estructura';
import type { ObservacionDoc } from '../types/planificacion';
import {
  ACTIVIDADES_PAAD,
  DIAS_PAAD,
  horasDe,
  type AspectosGeneralesPaad,
  type ListaPaad,
  type PaadContenido,
} from '../types/paad';

/** Una lista de ítems dentro de un apartado. */
export interface ListaDef {
  key: ListaPaad;
  /** Rótulo interno cuando el subapartado tiene más de una lista. */
  etiqueta?: string;
  placeholder: string;
}

export interface SubapartadoDef {
  /** Letra del subapartado (a, b, c) o vacío si el apartado no tiene subdivisiones. */
  letra?: string;
  titulo: string;
  /** Guía oficial de llenado (texto reglamentario exacto). */
  info: string;
  listas: ListaDef[];
}

export interface ApartadoDef {
  id: string;
  numero: number;
  titulo: string;
  subapartados: SubapartadoDef[];
}

/** Apartados 1 a 7 del Anexo III, estrictamente separados como en el documento oficial. */
export const APARTADOS_PAAD: ApartadoDef[] = [
  {
    id: 'ensenanza',
    numero: 1,
    titulo: 'ACTIVIDAD DE ENSEÑANZA',
    subapartados: [
      {
        letra: 'a',
        titulo: 'Curso/s y/o Asignatura/s atendido/s:',
        info: 'Detallar capacitaciones en las que participará: lugar; fecha; temática y área de conocimiento, y nombre de la capacitación.',
        listas: [
          { key: 'cursos', etiqueta: 'Cursos y/o asignaturas atendidos', placeholder: 'Ej. Análisis Matemático I – 1.º año ISI – comisiones A y B' },
          { key: 'capacitaciones', etiqueta: 'Capacitaciones en las que participará', placeholder: 'Nombre – lugar – fecha – temática y área de conocimiento' },
        ],
      },
      {
        letra: 'b',
        titulo: 'Preparación de Manuales, Guías de Trabajos Prácticos, Nuevos Programas de Estudios, etc.:',
        info: 'Detallar área de conocimiento, tipo de manual si es mediado, o dossier, autores, fecha de emisión.',
        listas: [{ key: 'materiales', placeholder: 'Área de conocimiento – tipo (mediado / dossier) – autores – fecha de emisión' }],
      },
      {
        letra: 'c',
        titulo: 'Otros trabajos de índole específicamente Docente que se consideren pertinentes:',
        info: 'Detallar capacitaciones o jornadas de trabajo que no involucren a su actividad docente en la UNLaR. Detallar área temática, lugar y fecha, destinatarios, nivel del curso (curso, posgrado, especialización, diplomatura).',
        listas: [{ key: 'otrosDocentes', placeholder: 'Área temática – lugar y fecha – destinatarios – nivel' }],
      },
    ],
  },
  {
    id: 'investigacion',
    numero: 2,
    titulo: 'ACTIVIDADES DE INVESTIGACIÓN',
    subapartados: [
      {
        titulo: 'ACTIVIDADES DE INVESTIGACIÓN',
        info: 'Detallar nombre del Proyecto de Investigación en el que participa, descripción mínima del mismo, cargo que ocupa, número de Resolución de Aprobación, etapa en la que se encuentra.',
        listas: [{ key: 'investigacion', placeholder: 'Proyecto – descripción – cargo – Res. de aprobación – etapa' }],
      },
    ],
  },
  {
    id: 'recursosHumanos',
    numero: 3,
    titulo: 'ACTIVIDAD DE FORMACIÓN DE RECURSOS HUMANOS',
    subapartados: [
      {
        titulo: 'ACTIVIDAD DE FORMACIÓN DE RECURSOS HUMANOS',
        info: 'Detallar que en su cátedra se desempeñan ayudantes de 1º y ayudantes de 2º, docentes adscriptos, J.T.P.- desde cuándo se desempeñan y qué actividades realizan en la misma. Modos de Evaluación que implementa. Informes finales de sus desempeños.',
        listas: [{ key: 'recursosHumanos', placeholder: 'Cargo y nombre – desde cuándo – actividades – modo de evaluación' }],
      },
    ],
  },
  {
    id: 'formacionAcademica',
    numero: 4,
    titulo: 'ACTIVIDADES DE FORMACIÓN ACADÉMICA Y/O ESPECIALIZACIÓN PROFESIONAL',
    subapartados: [
      {
        titulo: 'ACTIVIDADES DE FORMACIÓN ACADÉMICA Y/O ESPECIALIZACIÓN PROFESIONAL',
        info: 'Detallar formación específica de su área temática actual o que haya cursado a nivel de educación cuaternaria. Detallar títulos, módulos aprobados y enumeración de trabajos realizados y aprobados y si están publicados nombrar dónde.',
        listas: [{ key: 'formacionAcademica', placeholder: 'Título / posgrado – módulos aprobados – trabajos y publicaciones' }],
      },
    ],
  },
  {
    id: 'extension',
    numero: 5,
    titulo: 'ACTIVIDADES DE EXTENSIÓN',
    subapartados: [
      {
        titulo: 'ACTIVIDADES DE EXTENSIÓN',
        info: 'Detallar nombre del proyecto, a quién está dirigido, tiempo y lugar a donde se desarrolla. Detallar los alumnos involucrados. Presentar informe de finalización.',
        listas: [{ key: 'extension', placeholder: 'Proyecto – destinatarios – tiempo y lugar – alumnos involucrados' }],
      },
    ],
  },
  {
    id: 'gestion',
    numero: 6,
    titulo: 'ACTIVIDADES DE ADMINISTRACIÓN Y GOBIERNO UNIVERSITARIO',
    subapartados: [
      {
        titulo: 'ACTIVIDADES DE ADMINISTRACIÓN Y GOBIERNO UNIVERSITARIO',
        info: 'Detallar toda actividad de gestión (director de carrera, miembro del consejo consultivo y/o directivo, actividad de consultoría, actividad de reuniones de equipos).',
        listas: [{ key: 'gestion', placeholder: 'Actividad de gestión – órgano o equipo – período' }],
      },
    ],
  },
  {
    id: 'otras',
    numero: 7,
    titulo: 'OTRAS ACTIVIDADES NO PREVISTAS EN LOS APARTADOS ANTERIORES',
    subapartados: [
      {
        titulo: 'OTRAS ACTIVIDADES NO PREVISTAS EN LOS APARTADOS ANTERIORES',
        info: 'Detallar cualquier otra actividad académica o institucional no contemplada en los puntos previos (ej. desarrollo de materiales, clases de consulta, participación en congresos o comisiones de plan de estudio).',
        listas: [{ key: 'otras', placeholder: 'Actividad – detalle' }],
      },
    ],
  },
];

/** Punto 8) del PAAD: sigue a los apartados 1) a 7) con la misma numeración. */
export const NUMERO_DISTRIBUCION = APARTADOS_PAAD.length + 1;
export const TITULO_DISTRIBUCION = 'DISTRIBUCIÓN HORARIA DE SUS ACTIVIDADES';

const CURSO: Record<number, string> = { 1: 'Primer Año', 2: 'Segundo Año', 3: 'Tercer Año', 4: 'Cuarto Año', 5: 'Quinto Año', 6: 'Sexto Año' };
const REGIMEN: Record<string, string> = { '1C': 'Primer Cuatrimestre', '2C': 'Segundo Cuatrimestre', ANUAL: 'Anual' };

/** "Lastra Mariana Soledad" (apellido primero, como en el documento oficial). */
export const nombreOficial = (u: Pick<Usuario, 'nombre' | 'apellido'> | undefined) => (u ? `${u.apellido} ${u.nombre}` : '');

/** Lo que necesita la proyección de los Aspectos Generales (estado de la app). */
export interface FuentePaad {
  ciclo: number;
  usuarios: Usuario[];
  equipos: EquipoCatedra[];
  asigContext: (id: string) => AsigContext;
}

/** Una cátedra del docente en el ciclo, con su designación y su contexto académico. */
export interface CatedraPaad {
  asignaturaId: string;
  eq: EquipoCatedra;
  ctx: AsigContext;
  /** "ISI · Programación I" para selectores. */
  label: string;
}

export const FUNCION_CATEDRA = {
  responsable: 'Docente Responsable de Cátedra (Titular / a cargo)',
  integrante: 'Integrante del Equipo de Cátedra',
} as const;

/** Cátedras en las que participa el docente en el ciclo (primero aquellas de las que es responsable). */
export function catedrasDocente(docenteId: string, f: FuentePaad): CatedraPaad[] {
  return f.equipos
    .filter((e) => e.docenteId === docenteId && e.cicloLectivo === f.ciclo)
    .sort((a, b) => Number(b.esResponsable) - Number(a.esResponsable))
    .map((eq) => {
      const ctx = f.asigContext(eq.asignaturaId);
      return { asignaturaId: eq.asignaturaId, eq, ctx, label: `${ctx.carrera?.sigla ?? ''} · ${ctx.asig?.nombre ?? eq.asignaturaId}` };
    });
}

/**
 * Cátedra con la que se abre el PAAD: la pedida (si el docente la integra), si no la primera
 * de la carrera preferida (Dirección o filtro de la bandeja) y, en último caso, donde es responsable.
 */
export function catedraInicial(catedras: CatedraPaad[], opts: { asignaturaId?: string | null; carreraId?: string | null } = {}): string | null {
  if (opts.asignaturaId && catedras.some((c) => c.asignaturaId === opts.asignaturaId)) return opts.asignaturaId;
  const deCarrera = opts.carreraId ? catedras.find((c) => c.ctx.carrera?.id === opts.carreraId) : undefined;
  return (deCarrera ?? catedras[0])?.asignaturaId ?? null;
}

/**
 * Aspectos Generales del PAAD proyectados para una cátedra: sede, departamento, carrera, plan,
 * asignatura, curso, régimen y crédito horario salen de la asignatura; cargo y función, de la
 * designación del docente en ese Equipo de Cátedra. Sin cátedra, solo quedan los datos del docente.
 */
export function getDynamicPaadHeader(docenteId: string, contextAsigId: string | null | undefined, f: FuentePaad): AspectosGeneralesPaad {
  const userBy = (id: string) => f.usuarios.find((u) => u.id === id);
  const docente = userBy(docenteId);
  const ctx = contextAsigId ? f.asigContext(contextAsigId) : null;
  const equipo = contextAsigId ? f.equipos.filter((e) => e.asignaturaId === contextAsigId && e.cicloLectivo === f.ciclo) : [];
  const eq = equipo.find((e) => e.docenteId === docenteId);
  const aCargo = equipo.find((e) => e.esResponsable) ?? equipo.find((e) => e.cargo === 'Profesor Titular');
  const asig = ctx?.asig;

  return {
    profesorACargo: aCargo ? nombreOficial(userBy(aCargo.docenteId)) : '',
    presentadoPor: nombreOficial(docente),
    dni: docente?.dni ?? '',
    anio: String(f.ciclo),
    sede: ctx?.sede?.nombre.replace(/^Sede Regional /, 'Delegación ').replace(/^Sede /, '') ?? '',
    departamento: ctx?.depto?.nombre.split(' (')[0] ?? (ctx ? '—' : ''),
    carrera: ctx?.carrera?.nombre ?? '',
    planEstudio: ctx?.plan?.ordenanza ?? '',
    asignatura: asig?.nombre ?? '',
    curso: asig ? (CURSO[asig.anoCursada] ?? `${asig.anoCursada}.º Año`) : '',
    regimen: asig ? (REGIMEN[asig.regimenDictado] ?? asig.regimenDictado) : '',
    creditoHorario: asig ? `${asig.horasSemanales} hs semanales · ${asig.horasTotales} hs totales` : '',
    cargo: eq?.cargo ?? '',
    funcion: eq ? (eq.esResponsable ? FUNCION_CATEDRA.responsable : FUNCION_CATEDRA.integrante) : '',
  };
}

export const CAMPOS_ASPECTOS: { key: keyof AspectosGeneralesPaad; label: string }[] = [
  { key: 'profesorACargo', label: 'Profesor Titular / a cargo' },
  { key: 'presentadoPor', label: 'Plan presentado por' },
  { key: 'dni', label: 'DNI' },
  { key: 'anio', label: 'Año' },
  { key: 'sede', label: 'Sede / Delegación' },
  { key: 'departamento', label: 'Departamento Académico' },
  { key: 'carrera', label: 'Carrera' },
  { key: 'planEstudio', label: 'Plan de Estudio' },
  { key: 'asignatura', label: 'Asignatura' },
  { key: 'curso', label: 'Curso' },
  { key: 'regimen', label: 'Régimen' },
  { key: 'creditoHorario', label: 'Crédito horario' },
  { key: 'cargo', label: 'Cargo en la cátedra' },
  { key: 'funcion', label: 'Función en la cátedra' },
];
export const totalHoras = (c: PaadContenido) =>
  ACTIVIDADES_PAAD.reduce((acc, a) => acc + DIAS_PAAD.reduce((s, d) => s + horasDe(c.horas[a][d]), 0), 0);

/** Requisitos mínimos para presentar el PAAD. */
export function validarPaad(c: PaadContenido, comments: ObservacionDoc[]): string[] {
  const problemas: string[] = [];
  if (c.listas.cursos.length === 0) problemas.push('1) a) Cargá al menos un curso o asignatura atendido.');
  if (totalHoras(c) === 0) problemas.push(`${NUMERO_DISTRIBUCION}) Distribución horaria: cargá las horas semanales de tus actividades.`);
  const pendientes = comments.filter((o) => !o.resolved).length;
  if (pendientes > 0) problemas.push(`Hay ${pendientes} observación(es) sin marcar como subsanadas.`);
  return problemas;
}
