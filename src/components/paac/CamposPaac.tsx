import { HORAS_ACTIVIDADES, type ColumnSpec } from '../../data/mockData';
import { calcularHoras, celdaInvalida } from '../../lib/validacionPaac';
import type { Asignatura } from '../../types/estructura';

const cellCls = (invalida: boolean) =>
  `w-full rounded border bg-background px-2 py-1.5 text-xs text-ink outline-none transition focus:border-primary ${
    invalida ? 'border-danger' : 'border-border'
  }`;

// ---------------------------------------------------------------------------
// Texto y selección
// ---------------------------------------------------------------------------

export function CampoTexto({
  id,
  value,
  editable,
  invalido,
  onChange,
}: {
  id: string;
  value: string;
  editable: boolean;
  invalido: boolean;
  onChange: (v: string) => void;
}) {
  if (!editable) {
    return (
      <p id={id} className={`whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-xs leading-relaxed ${value ? 'text-ink' : 'text-muted italic'}`}>
        {value || 'Sin completar.'}
      </p>
    );
  }
  return (
    <textarea
      id={id}
      rows={4}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={invalido}
      placeholder="Completar campo reglamentario…"
      className={`w-full rounded-lg border bg-background p-3 text-xs leading-relaxed text-ink outline-none transition focus:border-primary ${
        invalido ? 'border-danger' : 'border-border'
      }`}
    />
  );
}

export function CampoSelect({
  id,
  value,
  options,
  editable,
  invalido,
  onChange,
}: {
  id: string;
  value: string;
  options: string[];
  editable: boolean;
  invalido: boolean;
  onChange: (v: string) => void;
}) {
  if (!editable) {
    return <p id={id} className={`text-xs ${value ? 'text-ink font-medium' : 'text-muted italic'}`}>{value || 'Sin seleccionar.'}</p>;
  }
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={invalido}
      className={`w-full max-w-md rounded-lg border bg-background px-3 py-2 text-xs text-ink outline-none focus:border-primary ${
        invalido ? 'border-danger' : 'border-border'
      }`}
    >
      <option value="">Seleccionar…</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Tabla dinámica (agregar, editar y quitar filas)
// ---------------------------------------------------------------------------

interface TablaDinamicaProps {
  label: string;
  columns: ColumnSpec[];
  rows: string[][];
  editable: boolean;
  /** Marca celdas obligatorias vacías (tras intentar presentar). */
  mostrarErrores: boolean;
  /** Opciones para columnas de tipo `equipo`. */
  equipo: string[];
  addLabel?: string;
  newRow?: (n: number) => string[];
  onChange: (rows: string[][]) => void;
}

export function TablaDinamica({
  label,
  columns,
  rows,
  editable,
  mostrarErrores,
  equipo,
  addLabel = 'Agregar fila',
  newRow,
  onChange,
}: TablaDinamicaProps) {
  const setCelda = (r: number, c: number, v: string) =>
    onChange(rows.map((row, ri) => (ri === r ? columns.map((_, ci) => (ci === c ? v : (row[ci] ?? ''))) : row)));
  const agregar = () => onChange([...rows, newRow ? newRow(rows.length) : columns.map(() => '')]);
  const quitar = (r: number) => onChange(rows.filter((_, ri) => ri !== r));

  const renderCelda = (col: ColumnSpec, r: number, c: number, valor: string) => {
    const invalida = mostrarErrores && celdaInvalida(col, valor);
    const aria = `${col.label}, fila ${r + 1}`;
    if (!editable) {
      return <span className={valor ? 'text-ink' : 'text-muted'}>{valor || '—'}</span>;
    }
    if (col.type === 'select' || col.type === 'equipo') {
      const opciones = col.type === 'equipo' ? ['Todo el equipo', ...equipo] : (col.options ?? []);
      // Conserva valores que ya no están en las opciones (p. ej. un docente que dejó el equipo).
      const lista = valor && !opciones.includes(valor) ? [valor, ...opciones] : opciones;
      return (
        <select aria-label={aria} value={valor} onChange={(e) => setCelda(r, c, e.target.value)} aria-invalid={invalida} className={cellCls(invalida)}>
          <option value="">—</option>
          {lista.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        aria-label={aria}
        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
        min={col.type === 'number' ? 0 : undefined}
        inputMode={col.type === 'number' ? 'decimal' : undefined}
        value={valor}
        placeholder={col.placeholder ?? col.label}
        onChange={(e) => setCelda(r, c, e.target.value)}
        aria-invalid={invalida}
        className={cellCls(invalida)}
      />
    );
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr className="border-b border-border bg-background text-[11px] text-muted">
              {columns.map((col) => (
                <th key={col.label} scope="col" className={`p-2.5 font-semibold ${col.width ?? ''}`}>
                  {col.label}
                  {col.required && editable && <span className="text-danger" aria-hidden> *</span>}
                </th>
              ))}
              {editable && (
                <th scope="col" className="w-12 p-2.5 text-center">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {rows.map((row, r) => (
              <tr key={r}>
                {columns.map((col, c) => (
                  <td key={col.label} className="p-1.5 align-top">
                    {renderCelda(col, r, c, row[c] ?? '')}
                  </td>
                ))}
                {editable && (
                  <td className="p-1.5 text-center align-top">
                    <button
                      type="button"
                      onClick={() => quitar(r)}
                      aria-label={`Eliminar fila ${r + 1} de ${label}`}
                      title="Eliminar fila"
                      className="rounded px-2 py-1 font-bold text-danger transition hover:bg-red-500/10"
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (editable ? 1 : 0)} className="p-4 text-center text-muted">
                  {editable ? `Sin registros. Usá “+ ${addLabel}” para comenzar.` : 'Sin registros cargados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editable && (
        <button
          type="button"
          onClick={agregar}
          className="mt-2.5 rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-primary transition hover:border-primary hover:bg-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          + {addLabel}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Distribución horaria con totales calculados
// ---------------------------------------------------------------------------

export function TablaHoras({
  rows,
  editable,
  asig,
  onChange,
}: {
  rows: string[][] | undefined;
  editable: boolean;
  asig?: Asignatura;
  onChange: (rows: string[][]) => void;
}) {
  const r = calcularHoras(rows, asig);
  const setSemanal = (i: number, v: string) =>
    onChange(HORAS_ACTIVIDADES.map((_, idx) => [idx === i ? v : (rows?.[idx]?.[0] ?? '')]));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[520px] border-collapse text-left text-xs">
          <caption className="sr-only">Distribución horaria por actividad</caption>
          <thead>
            <tr className="border-b border-border bg-background text-[11px] text-muted">
              <th scope="col" className="p-2.5 font-semibold">Actividad</th>
              <th scope="col" className="w-36 p-2.5 font-semibold">Horas semanales</th>
              <th scope="col" className="w-40 p-2.5 font-semibold">Horas totales ({r.semanas} sem.)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {HORAS_ACTIVIDADES.map((act, i) => (
              <tr key={act.label}>
                <th scope="row" className="p-2.5 font-medium text-ink">
                  {act.label}
                  {!act.computa && <span className="block text-[10px] font-normal text-muted">No computa en la carga del plan</span>}
                </th>
                <td className="p-1.5">
                  {editable ? (
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      inputMode="decimal"
                      aria-label={`${act.label}: horas semanales`}
                      value={rows?.[i]?.[0] ?? ''}
                      onChange={(e) => setSemanal(i, e.target.value)}
                      className={cellCls(false)}
                    />
                  ) : (
                    <span className="text-ink tabular-nums">{r.filas[i].semanales} hs</span>
                  )}
                </td>
                <td className="p-2.5 tabular-nums text-ink">{r.filas[i].totales} hs</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-background font-semibold">
              <th scope="row" className="p-2.5 text-ink">Total de dictado</th>
              <td className="p-2.5 tabular-nums text-ink">{r.dictadoSemanal} hs</td>
              <td className="p-2.5 tabular-nums text-ink">{r.dictadoTotal} hs</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div
        role="status"
        className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${
          r.coincide
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
        }`}
      >
        <span className="font-semibold">
          {r.coincide ? '✓ Coincide con el plan de estudios' : '⚠ No coincide con el plan de estudios'}
        </span>
        <span>
          Plan: {r.planSemanales} hs/semana · {r.planTotales} hs totales
          {!r.coincide && ` · Diferencia: ${r.dictadoSemanal - r.planSemanales > 0 ? '+' : ''}${r.dictadoSemanal - r.planSemanales} hs/semana`}
        </span>
      </div>
      {r.consultaSemanal > 0 && (
        <p className="text-[11px] text-muted">
          Consulta y tutoría: {r.consultaSemanal} hs/semana ({r.consultaSemanal * r.semanas} hs en el período), adicionales a la carga de dictado.
        </p>
      )}
    </div>
  );
}
