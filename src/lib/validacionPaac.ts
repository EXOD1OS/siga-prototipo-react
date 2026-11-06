import { HORAS_ACTIVIDADES, type ColumnSpec, type SchemaField, type SchemaSection } from '../data/mockData';
import type { Asignatura } from '../types/estructura';
import type { ObservacionDoc, PaacData } from '../types/planificacion';

export interface ProblemaPaac {
  /** Índice del apartado donde corregir. */
  section: number;
  fieldKey: string;
  mensaje: string;
}

export interface ResumenHoras {
  /** Semanas de cursada según el plan (horas totales / horas semanales). */
  semanas: number;
  filas: { semanales: number; totales: number }[];
  dictadoSemanal: number;
  dictadoTotal: number;
  consultaSemanal: number;
  planSemanales: number;
  planTotales: number;
  coincide: boolean;
}

export const aNumero = (v: string | undefined) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

const vacio = (v: string | undefined) => String(v ?? '').trim() === '';

/** Celda obligatoria vacía o número inválido. */
export function celdaInvalida(col: ColumnSpec, valor: string | undefined): boolean {
  if (col.required && vacio(valor)) return true;
  if (col.type === 'number' && !vacio(valor)) {
    const n = aNumero(valor);
    return Number.isNaN(n) || n < 0;
  }
  return false;
}

/** Totales de la Distribución Horaria: el total de cada fila = horas semanales × semanas del plan. */
export function calcularHoras(rows: string[][] | undefined, asig: Pick<Asignatura, 'horasSemanales' | 'horasTotales'> | undefined): ResumenHoras {
  const planSemanales = asig?.horasSemanales ?? 0;
  const planTotales = asig?.horasTotales ?? 0;
  const semanas = planSemanales > 0 ? Math.round(planTotales / planSemanales) : 0;
  const filas = HORAS_ACTIVIDADES.map((_, i) => {
    const s = aNumero(rows?.[i]?.[0]);
    const semanales = Number.isNaN(s) ? 0 : s;
    return { semanales, totales: semanales * semanas };
  });
  const dictadoSemanal = filas.reduce((acc, f, i) => acc + (HORAS_ACTIVIDADES[i].computa ? f.semanales : 0), 0);
  const consultaSemanal = filas.reduce((acc, f, i) => acc + (HORAS_ACTIVIDADES[i].computa ? 0 : f.semanales), 0);
  return {
    semanas,
    filas,
    dictadoSemanal,
    dictadoTotal: dictadoSemanal * semanas,
    consultaSemanal,
    planSemanales,
    planTotales,
    coincide: planSemanales > 0 && dictadoSemanal === planSemanales,
  };
}

function columnasDe(f: SchemaField): ColumnSpec[] {
  return f.columns ?? (f.cols ?? []).map((label) => ({ label }));
}

/**
 * Validación previa a "Presentar PAAC": campos obligatorios, filas mínimas,
 * celdas obligatorias, coherencia de horas con el plan y observaciones sin subsanar.
 */
export function validarPaac(
  schema: SchemaSection[],
  data: PaacData,
  opts: { asig?: Asignatura; enfoque?: string; comments: ObservacionDoc[] }
): ProblemaPaac[] {
  const problemas: ProblemaPaac[] = [];
  const admitePromocion = String(data.regimenAprob ?? '').startsWith('Promoción');

  schema.forEach((sec, section) => {
    for (const f of sec.fields) {
      const add = (mensaje: string) => problemas.push({ section, fieldKey: f.key, mensaje: `${f.label}: ${mensaje}` });
      const valor = data[f.key];
      const requerido =
        f.required ||
        (f.key === 'promotion' && admitePromocion) ||
        (f.key === 'competencias' && opts.enfoque === 'COMPETENCIAS');

      if (f.type === 'text' || f.type === 'select') {
        if (requerido && (typeof valor !== 'string' || vacio(valor))) add(f.type === 'select' ? 'seleccioná una opción.' : 'campo obligatorio sin completar.');
        continue;
      }

      if (f.type === 'horas') {
        const r = calcularHoras(Array.isArray(valor) ? valor : undefined, opts.asig);
        if (!r.coincide) {
          add(`las horas de dictado suman ${r.dictadoSemanal} hs/semana y el plan exige ${r.planSemanales} hs/semana (${r.planTotales} hs totales).`);
        }
        continue;
      }

      // Tablas
      const filas = Array.isArray(valor) ? valor : [];
      const minimo = f.minRows ?? (requerido ? 1 : 0);
      if (requerido && filas.length < minimo) {
        add(`cargá al menos ${minimo} fila(s).`);
        continue;
      }
      const cols = columnasDe(f);
      const invalidas = filas.reduce((acc, row) => acc + cols.filter((c, ci) => celdaInvalida(c, row[ci])).length, 0);
      if (invalidas > 0) add(`${invalidas} celda(s) obligatoria(s) vacía(s) o con valores inválidos.`);
    }
  });

  const pendientes = opts.comments.filter((o) => !o.resolved);
  if (pendientes.length > 0) {
    problemas.push({
      section: pendientes[0].section ?? 0,
      fieldKey: pendientes[0].field ?? '',
      mensaje: `Hay ${pendientes.length} observación(es) de UAP / Dirección sin marcar como subsanadas.`,
    });
  }
  return problemas;
}
