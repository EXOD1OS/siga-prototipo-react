import { useRef } from 'react';

/** Claves de T cuyo valor es texto. */
export type ClaveTexto<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T] & string;

export interface ColumnaTabla<T> {
  key: ClaveTexto<T>;
  label: string;
  tipo?: 'text' | 'textarea' | 'select' | 'number' | 'url';
  opciones?: readonly string[];
  /** Ancho sugerido (clase Tailwind). */
  ancho?: string;
  placeholder?: string;
  centrar?: boolean;
}

interface Props<T extends { id: string }> {
  caption: string;
  filas: T[];
  columnas: ColumnaTabla<T>[];
  editable: boolean;
  /** Fila nueva (recibe la cantidad actual de filas). */
  nueva: (n: number) => T;
  etiquetaAgregar: string;
  vacio: string;
  onChange: (filas: T[]) => void;
  minW?: string;
}

const inputCls =
  'w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-ink outline-none transition placeholder:text-muted focus:border-primary';

/** Tabla con filas dinámicas: se edita en la misma celda, se agregan y se quitan filas. */
export function TablaEditable<T extends { id: string }>({
  caption,
  filas,
  columnas,
  editable,
  nueva,
  etiquetaAgregar,
  vacio,
  onChange,
  minW = 'min-w-[640px]',
}: Props<T>) {
  const tablaRef = useRef<HTMLTableElement>(null);
  const valor = (f: T, k: ClaveTexto<T>) => String(f[k] ?? '');
  const set = (i: number, k: ClaveTexto<T>, v: string) => onChange(filas.map((f, idx) => (idx === i ? ({ ...f, [k]: v } as T) : f)));

  const agregar = () => {
    onChange([...filas, nueva(filas.length)]);
    // Lleva el foco a la primera celda de la fila nueva.
    requestAnimationFrame(() => {
      const ultimas = tablaRef.current?.querySelectorAll<HTMLElement>('tbody tr:last-child input, tbody tr:last-child textarea, tbody tr:last-child select');
      ultimas?.[0]?.focus();
    });
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table ref={tablaRef} className={`w-full ${minW} border-collapse text-xs`}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-background text-[11px] text-muted">
              {columnas.map((c) => (
                <th key={c.key} scope="col" className={`px-2.5 py-2.5 text-left font-semibold ${c.ancho ?? ''} ${c.centrar ? 'text-center' : ''}`}>
                  {c.label}
                </th>
              ))}
              {editable && (
                <th scope="col" className="w-12 px-2 py-2.5">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filas.length === 0 && (
              <tr>
                <td colSpan={columnas.length + (editable ? 1 : 0)} className="px-3 py-5 text-center text-xs text-muted">
                  {vacio}
                </td>
              </tr>
            )}
            {filas.map((f, i) => (
              <tr key={f.id} className="align-top transition-colors hover:bg-background">
                {columnas.map((c) => {
                  const v = valor(f, c.key);
                  const aria = `${c.label}, fila ${i + 1}`;
                  if (!editable) {
                    return (
                      <td key={c.key} className={`whitespace-pre-wrap px-2.5 py-2 text-ink ${c.centrar ? 'text-center' : ''}`}>
                        {c.tipo === 'url' && v ? (
                          <a href={v} target="_blank" rel="noreferrer" className="break-all text-primary underline-offset-2 hover:underline">
                            {v}
                          </a>
                        ) : (
                          v || <span className="text-muted">—</span>
                        )}
                      </td>
                    );
                  }
                  return (
                    <td key={c.key} className="px-1.5 py-1.5">
                      {c.tipo === 'textarea' ? (
                        <textarea rows={2} aria-label={aria} value={v} placeholder={c.placeholder} onChange={(e) => set(i, c.key, e.target.value)} className={`${inputCls} resize-y`} />
                      ) : c.tipo === 'select' ? (
                        <select aria-label={aria} value={v} onChange={(e) => set(i, c.key, e.target.value)} className={inputCls}>
                          <option value="">Seleccionar…</option>
                          {(c.opciones ?? []).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={c.tipo === 'url' ? 'url' : 'text'}
                          inputMode={c.tipo === 'number' ? 'numeric' : undefined}
                          aria-label={aria}
                          value={v}
                          placeholder={c.placeholder}
                          onChange={(e) => set(i, c.key, c.tipo === 'number' ? e.target.value.replace(/[^\d]/g, '') : e.target.value)}
                          className={`${inputCls} ${c.centrar ? 'text-center' : ''}`}
                        />
                      )}
                    </td>
                  );
                })}
                {editable && (
                  <td className="px-1.5 py-1.5 text-center">
                    <BotonEliminar etiqueta={`Eliminar fila ${i + 1}`} onClick={() => onChange(filas.filter((_, idx) => idx !== i))} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable && <BotonAgregar onClick={agregar}>{etiquetaAgregar}</BotonAgregar>}
    </div>
  );
}

export function BotonAgregar({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <span aria-hidden className="text-sm leading-none">+</span>
      {children}
    </button>
  );
}

export function BotonEliminar({ etiqueta, onClick }: { etiqueta: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title="Eliminar"
      className="rounded-md p-1.5 text-muted transition-colors hover:bg-red-500/10 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5">
        <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
