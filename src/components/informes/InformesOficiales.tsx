import { useId, type ReactNode } from 'react';
import {
  OPC_ACORDE,
  OPC_COMPLETITUD,
  OPC_CUMPLE,
  OPC_PAAD,
  OPC_PRESENTA,
  SUGERENCIAS_PED,
  type InformeDisciplinarDatos,
  type InformePedagogicoDatos,
  type ItemValorado,
} from '../../types/informes';
import type { encabezadoInforme } from '../../lib/informes';

export type EncabezadoInforme = ReturnType<typeof encabezadoInforme>;

// ---------------------------------------------------------------------------
// Piezas comunes
// ---------------------------------------------------------------------------

const POSITIVOS = new Set(['Cumple', 'Acorde', 'Presenta', 'Presentó', 'Presenta Completa']);
const INTERMEDIOS = new Set(['Presenta Parcialmente', 'No corresponde']);

function tonoValor(v: string) {
  if (POSITIVOS.has(v)) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
  if (INTERMEDIOS.has(v)) return v === 'No corresponde' ? 'bg-slate-500/15 text-muted' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
  if (v) return 'bg-rose-500/15 text-rose-700 dark:text-rose-400';
  return 'text-muted italic';
}

const controlCls =
  'w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink outline-none transition focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary';

const celdaCls = 'border border-border px-3 py-2 align-middle text-xs';
const rotuloCls = `${celdaCls} bg-background font-semibold text-ink text-left`;

/** Valor discreto oficial: selector en edición, chip en lectura. */
function Selector({
  id,
  etiqueta,
  opciones,
  value,
  onChange,
  readOnly,
}: {
  id: string;
  etiqueta: string;
  opciones: readonly string[];
  value: string;
  onChange: (v: string) => void;
  readOnly: boolean;
}) {
  if (readOnly) {
    return <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${tonoValor(value)}`}>{value || 'Sin valorar'}</span>;
  }
  return (
    <select id={id} aria-label={etiqueta} value={value} onChange={(e) => onChange(e.target.value)} className={`${controlCls} max-w-[13rem]`}>
      {opciones.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** Texto libre con sugerencias desplegables (datalist). */
function TextoSugerido({
  id,
  etiqueta,
  value,
  sugerencias,
  onChange,
  readOnly,
}: {
  id: string;
  etiqueta: string;
  value: string;
  sugerencias?: readonly string[];
  onChange: (v: string) => void;
  readOnly: boolean;
}) {
  if (readOnly) return <span className={value ? 'text-ink' : 'italic text-muted'}>{value || 'Sin valorar'}</span>;
  return (
    <>
      <input id={id} aria-label={etiqueta} list={sugerencias ? `${id}-sug` : undefined} value={value} onChange={(e) => onChange(e.target.value)} className={controlCls} />
      {sugerencias && (
        <datalist id={`${id}-sug`}>
          {sugerencias.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </>
  );
}

function Observacion({ id, value, onChange, readOnly, placeholder }: { id: string; value: string; onChange: (v: string) => void; readOnly: boolean; placeholder: string }) {
  if (readOnly) return <p className={`whitespace-pre-line leading-relaxed ${value ? 'text-ink' : 'italic text-muted'}`}>{value || 'Sin observaciones.'}</p>;
  return <textarea id={id} rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${controlCls} py-2`} />;
}

const Ref = ({ n }: { n: number }) => (
  <sup className="ml-0.5 text-[9px] font-bold text-primary" aria-label={`referencia ${n}`}>
    ({n})
  </sup>
);

/** Encabezado institucional común (solo lectura). */
function TablaEncabezado({ filas }: { filas: [string, ReactNode][] }) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {filas.map(([k, v]) => (
          <tr key={k}>
            <th scope="row" className={`${rotuloCls} w-44`}>
              {k}
            </th>
            <td className={`${celdaCls} text-ink`}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Membrete({ anexo, titulo, emisor }: { anexo: string; titulo: string; emisor: string }) {
  return (
    <header className="space-y-0.5 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
        UNLaR · DACEFyN · Ord. HCS N° 219/2022 · {anexo}
      </p>
      <h3 className="text-sm font-bold uppercase tracking-wide text-ink">{titulo}</h3>
      <p className="text-[11px] text-muted">{emisor}</p>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Anexo IV — Informe Disciplinar (Dirección de Carrera)
// ---------------------------------------------------------------------------

export const REFERENCIAS_DISCIPLINAR = [
  'PAAD: Presentó / No Presentó. Indica si cada integrante del equipo de cátedra presentó su Plan Anual de Actividades Docentes del año académico.',
  'Observaciones: consignar las sugerencias o correcciones que la Dirección de Carrera considere pertinentes.',
  'Contenidos: Cumple / No Cumple. Determina si el PAAC cumple con los contenidos mínimos de la Ord. C.S. del plan de estudio.',
  'Trabajos Prácticos: Acorde / No Acorde. Equidad en relación a los contenidos teóricos y a las actividades disciplinares (TP, laboratorio y campo).',
  'Bibliografía: Presenta / No Presenta. Bibliografía obligatoria, actualizada y clásica (básica y complementaria).',
];

export function InformeDisciplinarForm({
  encabezado,
  datos,
  obs,
  readOnly,
  onChange,
  onObs,
}: {
  encabezado: EncabezadoInforme;
  datos: InformeDisciplinarDatos;
  obs: string;
  readOnly: boolean;
  onChange?: (d: InformeDisciplinarDatos) => void;
  onObs?: (v: string) => void;
}) {
  const uid = useId();
  const set = <K extends keyof InformeDisciplinarDatos>(k: K, v: InformeDisciplinarDatos[K]) => onChange?.({ ...datos, [k]: v });
  const sel = (k: 'contenidos' | 'tp' | 'tpLab' | 'tpCampo' | 'bibBasica' | 'bibComplementaria', etiqueta: string, opciones: readonly string[]) => (
    <Selector id={`${uid}-${k}`} etiqueta={etiqueta} opciones={opciones} value={datos[k]} onChange={(v) => set(k, v)} readOnly={readOnly} />
  );

  return (
    <div className="space-y-4">
      <Membrete anexo="Anexo IV" titulo="Informe Disciplinar" emisor="Dirección de Carrera" />
      <TablaEncabezado
        filas={[
          ['Sede', encabezado.sede],
          ['Carrera', encabezado.carrera],
          ['Plan de Estudios', encabezado.plan],
          ['Año Académico', encabezado.anio],
          ['Asignatura', encabezado.asignatura],
        ]}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse">
          <caption className="pb-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted">Análisis del PAAC</caption>
          <thead>
            <tr>
              <th scope="col" className={rotuloCls} colSpan={2}>
                Aspecto
              </th>
              <th scope="col" className={`${rotuloCls} w-56`}>
                Valoración
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" colSpan={2} className={rotuloCls}>
                Contenidos
                <Ref n={3} />
              </th>
              <td className={celdaCls}>{sel('contenidos', 'Contenidos', OPC_CUMPLE)}</td>
            </tr>
            {(
              [
                ['tp', 'TP'],
                ['tpLab', 'Lab.'],
                ['tpCampo', 'Campo'],
              ] as const
            ).map(([k, l], i) => (
              <tr key={k}>
                {i === 0 && (
                  <th scope="rowgroup" rowSpan={3} className={`${rotuloCls} w-40`}>
                    Trabajos Prácticos
                    <Ref n={4} />
                  </th>
                )}
                <th scope="row" className={`${celdaCls} font-medium text-muted`}>
                  {l}
                </th>
                <td className={celdaCls}>{sel(k, `Trabajos Prácticos ${l}`, OPC_ACORDE)}</td>
              </tr>
            ))}
            {(
              [
                ['bibBasica', 'Básica'],
                ['bibComplementaria', 'Complementaria'],
              ] as const
            ).map(([k, l], i) => (
              <tr key={k}>
                {i === 0 && (
                  <th scope="rowgroup" rowSpan={2} className={rotuloCls}>
                    Bibliografía
                    <Ref n={5} />
                  </th>
                )}
                <th scope="row" className={`${celdaCls} font-medium text-muted`}>
                  {l}
                </th>
                <td className={celdaCls}>{sel(k, `Bibliografía ${l}`, OPC_PRESENTA)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse">
          <caption className="pb-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted">
            PAAD del equipo de cátedra
            <Ref n={1} />
          </caption>
          <thead>
            <tr>
              <th scope="col" className={rotuloCls}>
                Integrante
              </th>
              <th scope="col" className={rotuloCls}>
                Cargo
              </th>
              <th scope="col" className={`${rotuloCls} w-56`}>
                PAAD
              </th>
            </tr>
          </thead>
          <tbody>
            {datos.paads.length === 0 ? (
              <tr>
                <td colSpan={3} className={`${celdaCls} italic text-muted`}>
                  La asignatura no tiene equipo de cátedra cargado para el ciclo.
                </td>
              </tr>
            ) : (
              datos.paads.map((p, i) => (
                <tr key={p.docenteId}>
                  <th scope="row" className={`${celdaCls} text-left font-medium text-ink`}>
                    {p.nombre}
                  </th>
                  <td className={`${celdaCls} text-muted`}>{p.cargo}</td>
                  <td className={celdaCls}>
                    <Selector
                      id={`${uid}-paad-${i}`}
                      etiqueta={`PAAD de ${p.nombre}`}
                      opciones={OPC_PAAD}
                      value={p.valor}
                      readOnly={readOnly}
                      onChange={(v) => set('paads', datos.paads.map((x, j) => (j === i ? { ...x, valor: v } : x)))}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-obs`} className="block text-[10px] font-bold uppercase tracking-wider text-muted">
          Observación
          <Ref n={2} />
        </label>
        <Observacion id={`${uid}-obs`} value={obs} readOnly={readOnly} onChange={(v) => onObs?.(v)} placeholder="Comentarios adicionales de la Dirección de Carrera…" />
      </div>

      <ol className="space-y-0.5 border-t border-border pt-2 text-[11px] text-muted">
        {REFERENCIAS_DISCIPLINAR.map((r, i) => (
          <li key={i}>
            ({i + 1}) {r}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Anexo III — Informe Pedagógico (UAP)
// ---------------------------------------------------------------------------

export function InformePedagogicoForm({
  encabezado,
  equipo,
  datos,
  obs,
  readOnly,
  onChange,
  onObs,
}: {
  encabezado: EncabezadoInforme;
  equipo: { docenteId: string; nombre: string; cargo: string }[];
  datos: InformePedagogicoDatos;
  obs: string;
  readOnly: boolean;
  onChange?: (d: InformePedagogicoDatos) => void;
  onObs?: (v: string) => void;
}) {
  const uid = useId();
  const set = <K extends keyof InformePedagogicoDatos>(k: K, v: InformePedagogicoDatos[K]) => onChange?.({ ...datos, [k]: v });

  const valorado = (k: 'introduccion' | 'diagnostico', etiqueta: string) => {
    const item: ItemValorado = datos[k];
    return (
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start">
        <Selector id={`${uid}-${k}`} etiqueta={etiqueta} opciones={OPC_COMPLETITUD} value={item.valor} readOnly={readOnly} onChange={(v) => set(k, { ...item, valor: v })} />
        <div className="min-w-0 flex-1">
          <TextoSugerido id={`${uid}-${k}-txt`} etiqueta={`${etiqueta}: comentario`} value={item.texto} readOnly={readOnly} onChange={(v) => set(k, { ...item, texto: v })} />
        </div>
      </div>
    );
  };
  const texto = (k: 'objetivos' | 'clase' | 'contenidos' | 'tp' | 'tpLab' | 'tpCampo' | 'evaluacion' | 'regimen', etiqueta: string, sugerencias?: readonly string[]) => (
    <TextoSugerido id={`${uid}-${k}`} etiqueta={etiqueta} value={datos[k]} sugerencias={sugerencias} readOnly={readOnly} onChange={(v) => set(k, v)} />
  );
  const presenta = (k: 'horarios' | 'distribucion', etiqueta: string) => (
    <Selector id={`${uid}-${k}`} etiqueta={etiqueta} opciones={OPC_PRESENTA} value={datos[k]} readOnly={readOnly} onChange={(v) => set(k, v)} />
  );

  const bloques: { titulo: string; filas: [string, ReactNode][] }[] = [
    {
      titulo: 'A. Aspectos generales',
      filas: [
        ['Introducción', valorado('introduccion', 'Introducción')],
        ['Diagnóstico', valorado('diagnostico', 'Diagnóstico')],
        ['Objetivos / Propósito / RA', texto('objetivos', 'Objetivos, propósito y resultados de aprendizaje', SUGERENCIAS_PED.objetivos)],
        ['Clase / Recursos didácticos', texto('clase', 'Clase y recursos didácticos', SUGERENCIAS_PED.clase)],
      ],
    },
    {
      titulo: 'B. Aspectos curriculares',
      filas: [
        ['Contenidos', texto('contenidos', 'Contenidos')],
        ['Trabajos Prácticos', texto('tp', 'Trabajos Prácticos', SUGERENCIAS_PED.tp)],
        ['Trabajos Prácticos de Laboratorio', texto('tpLab', 'Trabajos Prácticos de Laboratorio', SUGERENCIAS_PED.tp)],
        ['Trabajos de Campo', texto('tpCampo', 'Trabajos de Campo', SUGERENCIAS_PED.tp)],
        ['Evaluación (Inicial, Formativa y Sumativa)', texto('evaluacion', 'Evaluación', SUGERENCIAS_PED.evaluacion)],
        ['Régimen de Aprobación', texto('regimen', 'Régimen de aprobación')],
        ['Horarios', presenta('horarios', 'Horarios')],
        ['Distribución Horaria', presenta('distribucion', 'Distribución horaria')],
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <Membrete anexo="Anexo III" titulo="Informe Pedagógico" emisor="Unidad de Asesoramiento Pedagógico (UAP)" />
      <TablaEncabezado
        filas={[
          ['Sede', encabezado.sede],
          ['Carrera', encabezado.carrera],
          ['Plan de Estudios Ord. C.S. N°', encabezado.plan],
          ['Año Académico', encabezado.anio],
          [
            'Asignatura',
            <span key="a" className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold">{encabezado.asignatura}</span>
              <span className="text-muted">{encabezado.anioCursada}</span>
              <span className="text-muted">{encabezado.regimen}</span>
              <span className="text-muted">{encabezado.cargaHoraria}</span>
            </span>,
          ],
          [
            'Equipo de cátedra',
            equipo.length ? (
              <ul key="e" className="space-y-0.5">
                {equipo.map((e) => (
                  <li key={e.docenteId}>
                    <span className="text-muted">{e.cargo}:</span> {e.nombre}
                  </li>
                ))}
              </ul>
            ) : (
              <span key="e" className="italic text-muted">
                Sin equipo cargado
              </span>
            ),
          ],
        ]}
      />

      {bloques.map((b) => (
        <div key={b.titulo} className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse">
            <caption className="pb-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted">{b.titulo}</caption>
            <tbody>
              {b.filas.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row" className={`${rotuloCls} w-56`}>
                    {k}
                  </th>
                  <td className={celdaCls}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-obs`} className="block text-[10px] font-bold uppercase tracking-wider text-muted">
          Observación
        </label>
        <Observacion id={`${uid}-obs`} value={obs} readOnly={readOnly} onChange={(v) => onObs?.(v)} placeholder="Síntesis o comentario final de la UAP del DACEFyN…" />
      </div>
    </div>
  );
}
