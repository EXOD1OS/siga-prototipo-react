import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { CAMPOS_ASPECTOS } from '../../lib/paad';
import {
  ACTIVIDADES_PAAD,
  ACTIVIDAD_LABEL,
  DIAS_PAAD,
  DIA_LABEL,
  horasDe,
  type AspectosGeneralesPaad,
  type MatrizHoras,
} from '../../types/paad';

// ---------------------------------------------------------------------------
// Ícono de información con la guía oficial de llenado
// ---------------------------------------------------------------------------

/** Se muestra al pasar el cursor o con foco; un clic lo deja fijo. Escape lo cierra. */
export function InfoTip({ texto, titulo }: { texto: string; titulo: string }) {
  const [fijo, setFijo] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  const abierto = fijo || hover;

  useEffect(() => {
    if (!fijo) return;
    const fuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFijo(false);
    };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [fijo]);

  return (
    <span ref={ref} className="relative inline-flex align-middle" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        type="button"
        aria-label={`Guía de llenado: ${titulo}`}
        aria-describedby={abierto ? id : undefined}
        aria-expanded={abierto}
        onClick={() => setFijo((f) => !f)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setFijo(false);
            setHover(false);
          }
        }}
        className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold italic transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
          abierto ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-muted hover:border-primary hover:text-primary'
        }`}
      >
        i
      </button>
      <span
        id={id}
        role="tooltip"
        className={`absolute left-1/2 top-full z-40 mt-2 w-72 -translate-x-1/2 rounded-xl border border-border bg-surface p-3 text-left text-[11px] font-normal normal-case leading-relaxed tracking-normal text-ink shadow-xl transition-all duration-150 ${
          abierto ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
        }`}
      >
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-primary">Guía de llenado</span>
        {texto}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Lista dinámica: agregar, editar y eliminar ítems de a uno
// ---------------------------------------------------------------------------

interface ListaItemsProps {
  etiqueta?: string;
  items: string[];
  placeholder: string;
  editable: boolean;
  onChange: (items: string[]) => void;
}

export function ListaItems({ etiqueta, items, placeholder, editable, onChange }: ListaItemsProps) {
  const [nuevo, setNuevo] = useState('');
  const [editando, setEditando] = useState<number | null>(null);
  const [borrador, setBorrador] = useState('');
  const inputId = useId();

  const agregar = () => {
    const v = nuevo.trim();
    if (!v) return;
    onChange([...items, v]);
    setNuevo('');
  };
  const guardarEdicion = () => {
    if (editando === null) return;
    const v = borrador.trim();
    onChange(v ? items.map((it, i) => (i === editando ? v : it)) : items.filter((_, i) => i !== editando));
    setEditando(null);
  };
  const onKeyNuevo = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      agregar();
    }
  };
  const onKeyEdicion = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      guardarEdicion();
    } else if (e.key === 'Escape') {
      setEditando(null);
    }
  };

  return (
    <div className="space-y-2">
      {etiqueta && <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{etiqueta}</div>}

      {items.length > 0 ? (
        <ol className="space-y-1.5">
          {items.map((it, i) => (
            <li key={`${i}-${it}`} className="group flex items-start gap-2.5 rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:border-primary">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-soft text-[10px] font-bold text-primary">{i + 1}</span>
              {editando === i ? (
                <div className="flex-1 space-y-2">
                  <textarea
                    autoFocus
                    rows={2}
                    aria-label={`Editar ítem ${i + 1}`}
                    value={borrador}
                    onChange={(e) => setBorrador(e.target.value)}
                    onKeyDown={onKeyEdicion}
                    className="w-full rounded-lg border border-primary bg-surface px-3 py-2 text-xs text-ink outline-none"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={guardarEdicion} className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-primary-hover">
                      Guardar
                    </button>
                    <button type="button" onClick={() => setEditando(null)} className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-surface">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="flex-1 whitespace-pre-wrap text-xs leading-relaxed text-ink">{it}</p>
                  {editable && (
                    <span className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditando(i);
                          setBorrador(it);
                        }}
                        aria-label={`Editar ítem ${i + 1}`}
                        title="Editar"
                        className="rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-primary"
                      >
                        <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5">
                          <path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                        aria-label={`Eliminar ítem ${i + 1}`}
                        title="Eliminar"
                        className="rounded-md p-1 text-muted transition-colors hover:bg-red-500/10 hover:text-danger"
                      >
                        <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5">
                          <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted">
          {editable ? 'Todavía no agregaste ítems en este apartado.' : 'Sin actividades declaradas.'}
        </p>
      )}

      {editable && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <label htmlFor={inputId} className="sr-only">
            Nuevo ítem{etiqueta ? ` de ${etiqueta}` : ''}
          </label>
          <textarea
            id={inputId}
            rows={1}
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={onKeyNuevo}
            placeholder={placeholder}
            className="min-h-[38px] flex-1 resize-y rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink outline-none transition focus:border-primary"
          />
          <button
            type="button"
            onClick={agregar}
            disabled={!nuevo.trim()}
            className="shrink-0 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Agregar ítem
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Matriz de distribución horaria (Actividad × Día)
// ---------------------------------------------------------------------------

export function MatrizHorasPaad({
  horas,
  editable,
  onChange,
}: {
  horas: MatrizHoras;
  editable: boolean;
  onChange: (h: MatrizHoras) => void;
}) {
  const setCelda = (a: (typeof ACTIVIDADES_PAAD)[number], d: (typeof DIAS_PAAD)[number], v: string) =>
    onChange({ ...horas, [a]: { ...horas[a], [d]: v.replace(/[^\d.,]/g, '') } });
  const subtotal = (a: (typeof ACTIVIDADES_PAAD)[number]) => DIAS_PAAD.reduce((s, d) => s + horasDe(horas[a][d]), 0);
  const totalDia = (d: (typeof DIAS_PAAD)[number]) => ACTIVIDADES_PAAD.reduce((s, a) => s + horasDe(horas[a][d]), 0);
  const total = ACTIVIDADES_PAAD.reduce((s, a) => s + subtotal(a), 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[720px] border-collapse text-xs">
        <caption className="sr-only">Distribución horaria semanal por actividad y día</caption>
        <thead>
          <tr className="bg-background text-[11px] text-muted">
            <th scope="col" className="px-3 py-2.5 text-left font-semibold">Actividad</th>
            {DIAS_PAAD.map((d) => (
              <th key={d} scope="col" className="px-2 py-2.5 text-center font-semibold">
                {DIA_LABEL[d]}
              </th>
            ))}
            <th scope="col" className="bg-soft px-3 py-2.5 text-center font-semibold text-primary">Subtotal semanal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ACTIVIDADES_PAAD.map((a) => (
            <tr key={a}>
              <th scope="row" className="px-3 py-2 text-left font-semibold text-ink">
                {ACTIVIDAD_LABEL[a]}
              </th>
              {DIAS_PAAD.map((d) => {
                const v = horas[a][d];
                return (
                  <td key={d} className="px-1.5 py-1.5 text-center">
                    {editable ? (
                      <div className="relative">
                        <input
                          inputMode="decimal"
                          aria-label={`${ACTIVIDAD_LABEL[a]}, ${DIA_LABEL[d]}: horas`}
                          value={v}
                          placeholder="—"
                          onChange={(e) => setCelda(a, d, e.target.value)}
                          className={`w-full rounded-md border bg-surface py-1.5 pl-2 pr-7 text-center text-xs tabular-nums text-ink outline-none transition focus:border-primary ${
                            horasDe(v) > 0 ? 'border-transparent bg-soft font-semibold' : 'border-border'
                          }`}
                        />
                        <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted">
                          hs
                        </span>
                      </div>
                    ) : (
                      <span className={horasDe(v) > 0 ? 'font-semibold text-ink' : 'text-muted'}>{horasDe(v) > 0 ? `${horasDe(v)} hs` : '—'}</span>
                    )}
                  </td>
                );
              })}
              <td className="bg-soft px-3 py-2 text-center font-bold tabular-nums text-primary">{subtotal(a)} hs</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border bg-background">
            <th scope="row" className="px-3 py-2.5 text-left font-semibold text-muted">Total por día</th>
            {DIAS_PAAD.map((d) => (
              <td key={d} className="px-2 py-2.5 text-center font-semibold tabular-nums text-ink">
                {totalDia(d)} hs
              </td>
            ))}
            <td className="bg-primary px-3 py-2.5 text-center font-bold tabular-nums text-white">{total} hs</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ficha de Aspectos Generales (solo lectura)
// ---------------------------------------------------------------------------

export function FichaAspectos({ aspectos }: { aspectos: AspectosGeneralesPaad }) {
  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
      {CAMPOS_ASPECTOS.map(({ key, label }) => (
        <div key={key} className="bg-surface px-4 py-2.5">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</dt>
          <dd className={`mt-0.5 text-xs ${aspectos[key] ? 'font-medium text-ink' : 'italic text-muted'}`}>{aspectos[key] || 'Sin datos'}</dd>
        </div>
      ))}
    </dl>
  );
}
