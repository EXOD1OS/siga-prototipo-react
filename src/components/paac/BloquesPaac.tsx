import { Fragment, useId, type ReactNode } from 'react';
import { RichTextEditor, RichTextView } from '../shared/RichTextEditor';
import { InfoTip } from '../paad/CamposPaad';
import { BotonAgregar, BotonEliminar } from './TablaEditable';
import { generarSemanas, INFO_PAAC, totalesCronograma, type AspectosPaac } from '../../lib/paac';
import { DIAS_PAAD, DIA_LABEL, horasDe } from '../../types/paad';
import {
  COMPETENCIAS_GENERALES,
  FILAS_HORARIO,
  FILA_HORARIO_LABEL,
  GRUPO_CG_LABEL,
  NIVELES_APORTE,
  NIVEL_APORTE_LABEL,
  nuevoId,
  semanaVacia,
  type ColumnaHorasCronograma,
  type CompetenciaEspecifica,
  type GrupoCompetencia,
  type HorarioClases,
  type NivelAporte,
  type SemanaCronograma,
  type UnidadTematica,
} from '../../types/paac';

const inputCls =
  'w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-ink outline-none transition placeholder:text-muted focus:border-primary';

/** Rótulo de un subcampo con su ícono de guía. */
export function Rotulo({ children, info, titulo }: { children: ReactNode; info?: string; titulo?: string }) {
  return (
    <span className="flex items-start gap-2">
      <span>{children}</span>
      {info && <InfoTip titulo={titulo ?? String(children)} texto={info} />}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Aspectos generales
// ---------------------------------------------------------------------------

export function FichaAspectosPaac({
  aspectos,
  editable,
  onNivel,
  onRelacion,
}: {
  aspectos: AspectosPaac;
  editable: boolean;
  onNivel: (v: string) => void;
  onRelacion: (v: string) => void;
}) {
  const filas: [string, string][] = [
    ['Sede / Delegación', aspectos.sede],
    ['Departamento Académico', aspectos.departamento],
    ['Carrera', aspectos.carrera],
    ['Plan de Estudio Ordenanza N°', aspectos.planOrdenanza],
    ['Asignatura', aspectos.asignatura],
    ['Curso / Año', aspectos.curso],
    ['Régimen', aspectos.regimen],
    ['Crédito Horario', aspectos.creditoHorario],
  ];
  const dato = (v: string) => <dd className={`mt-0.5 text-xs ${v ? 'font-medium text-ink' : 'italic text-muted'}`}>{v || 'Sin datos'}</dd>;
  const etiqueta = 'text-[10px] font-bold uppercase tracking-wider text-muted';

  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
      {filas.map(([k, v]) => (
        <div key={k} className="bg-surface px-4 py-2.5">
          <dt className={etiqueta}>{k}</dt>
          {dato(v)}
        </div>
      ))}

      <div className="bg-surface px-4 py-2.5 sm:col-span-2">
        <dt className={`${etiqueta} flex items-center gap-2`}>
          Equipo de Cátedra <InfoTip titulo="Equipo de Cátedra" texto={INFO_PAAC.equipo} />
        </dt>
        <dd className="mt-1.5">
          {aspectos.equipo.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {aspectos.equipo.map((e) => (
                <li key={e.docenteId} className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-ink">
                  <span className="font-semibold text-primary">{e.cargo}:</span> {e.nombre}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-xs italic text-muted">Sin integrantes registrados.</span>
          )}
        </dd>
      </div>

      <div className="bg-surface px-4 py-2.5 sm:col-span-2">
        <dt className={etiqueta}>Contenidos Mínimos</dt>
        <dd className="mt-0.5 text-xs leading-relaxed text-ink">{aspectos.contenidosMinimos || <span className="italic text-muted">Sin datos</span>}</dd>
      </div>

      <div className="bg-surface px-4 py-2.5">
        <dt className={`${etiqueta} flex items-center gap-2`}>
          <label htmlFor="paac-nivel">Nivel de Intensidad</label> <InfoTip titulo="Nivel de Intensidad" texto={INFO_PAAC.nivelIntensidad} />
        </dt>
        {editable && !aspectos.nivelIntensidadFijo ? (
          <dd className="mt-1">
            <select id="paac-nivel" value={aspectos.nivelIntensidad} onChange={(e) => onNivel(e.target.value)} className={`${inputCls} max-w-[180px]`}>
              <option value="">Seleccionar…</option>
              {['1', '2', '3'].map((n) => (
                <option key={n} value={n}>
                  Nivel {n}
                </option>
              ))}
            </select>
          </dd>
        ) : (
          dato(aspectos.nivelIntensidad ? `Nivel ${aspectos.nivelIntensidad}` : '')
        )}
      </div>
      <div className="bg-surface px-4 py-2.5">
        <dt className={`${etiqueta} flex items-center gap-2`}>
          <label htmlFor="paac-relacion">Relación Teórica Práctica</label> <InfoTip titulo="Relación Teórica Práctica" texto={INFO_PAAC.relacionTP} />
        </dt>
        {editable && !aspectos.relacionTPFija ? (
          <dd className="mt-1">
            <input
              id="paac-relacion"
              list="paac-relaciones"
              value={aspectos.relacionTP}
              placeholder="Ej. T = P"
              onChange={(e) => onRelacion(e.target.value)}
              className={`${inputCls} max-w-[180px]`}
            />
            <datalist id="paac-relaciones">
              {['T = P', 'T > P', 'T < P'].map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </dd>
        ) : (
          dato(aspectos.relacionTP)
        )}
      </div>
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Competencias
// ---------------------------------------------------------------------------

export function LeyendaNiveles() {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" aria-label="Codificación del nivel de contribución">
      {NIVELES_APORTE.map((n) => (
        <div key={n} className="rounded-lg border border-border bg-background px-2.5 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-soft text-[10px] text-primary">{n}</span>
            {NIVEL_APORTE_LABEL[n].nombre}
          </div>
          <p className="mt-1 text-[10px] leading-snug text-muted">{NIVEL_APORTE_LABEL[n].detalle}</p>
        </div>
      ))}
    </div>
  );
}

function CeldasNivel({ nombre, etiqueta, valor, editable, onChange }: { nombre: string; etiqueta: string; valor: NivelAporte | null; editable: boolean; onChange: (n: NivelAporte) => void }) {
  return (
    <>
      {NIVELES_APORTE.map((n) => (
        <td key={n} className="w-16 px-1 py-2 text-center">
          {editable ? (
            <label className="flex cursor-pointer items-center justify-center">
              <span className="sr-only">
                {etiqueta}: nivel {n}
              </span>
              <input
                type="radio"
                name={nombre}
                checked={valor === n}
                onChange={() => onChange(n)}
                className="h-4 w-4 cursor-pointer accent-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </label>
          ) : valor === n ? (
            <span className="font-bold text-primary" aria-label={`Nivel ${n}`}>
              X
            </span>
          ) : null}
        </td>
      ))}
    </>
  );
}

const thNiveles = NIVELES_APORTE.map((n) => (
  <th key={n} scope="col" className="w-16 px-1 py-2.5 text-center font-semibold">
    Nivel {n}
  </th>
));

export function TablaCompetenciasGenerales({
  niveles,
  editable,
  onChange,
}: {
  niveles: Record<string, NivelAporte | null>;
  editable: boolean;
  onChange: (n: Record<string, NivelAporte | null>) => void;
}) {
  const uid = useId();
  const grupos: GrupoCompetencia[] = ['tecnologicas', 'sociales'];
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] border-collapse text-xs">
        <caption className="sr-only">Cuadro 1: Competencias generales y nivel de contribución</caption>
        <thead>
          <tr className="bg-background text-[11px] text-muted">
            <th scope="col" className="w-16 px-2.5 py-2.5 text-left font-semibold">Código</th>
            <th scope="col" className="px-2.5 py-2.5 text-left font-semibold">Competencia general</th>
            {thNiveles}
          </tr>
        </thead>
        {grupos.map((g) => (
          <tbody key={g} className="divide-y divide-border border-t border-border">
            <tr className="bg-soft">
              <th colSpan={6} scope="colgroup" className="px-2.5 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider text-primary">
                {GRUPO_CG_LABEL[g]}
              </th>
            </tr>
            {COMPETENCIAS_GENERALES.filter((c) => c.grupo === g).map((c) => (
              <tr key={c.codigo} className="transition-colors hover:bg-background">
                <th scope="row" className="px-2.5 py-2 text-left font-bold text-ink">
                  {c.codigo}
                </th>
                <td className="px-2.5 py-2 leading-snug text-ink">{c.texto}</td>
                <CeldasNivel
                  nombre={`${uid}-${c.codigo}`}
                  etiqueta={c.codigo}
                  valor={niveles[c.codigo] ?? null}
                  editable={editable}
                  onChange={(n) => onChange({ ...niveles, [c.codigo]: n })}
                />
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

export function TablaCompetenciasEspecificas({
  filas,
  editable,
  onChange,
}: {
  filas: CompetenciaEspecifica[];
  editable: boolean;
  onChange: (f: CompetenciaEspecifica[]) => void;
}) {
  const uid = useId();
  const set = (i: number, patch: Partial<CompetenciaEspecifica>) => onChange(filas.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[700px] border-collapse text-xs">
          <caption className="sr-only">Cuadro 2: Competencias específicas y nivel de contribución</caption>
          <thead>
            <tr className="bg-background text-[11px] text-muted">
              <th scope="col" className="w-24 px-2.5 py-2.5 text-left font-semibold">N°</th>
              <th scope="col" className="px-2.5 py-2.5 text-left font-semibold">Detalle de la competencia específica</th>
              {thNiveles}
              {editable && (
                <th scope="col" className="w-12">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filas.length === 0 && (
              <tr>
                <td colSpan={editable ? 7 : 6} className="px-3 py-5 text-center text-muted">
                  Todavía no se agregaron competencias específicas.
                </td>
              </tr>
            )}
            {filas.map((f, i) => (
              <tr key={f.id} className="align-middle transition-colors hover:bg-background">
                {editable ? (
                  <>
                    <td className="px-1.5 py-1.5">
                      <input aria-label={`Código, fila ${i + 1}`} value={f.codigo} placeholder="CE1.1" onChange={(e) => set(i, { codigo: e.target.value })} className={inputCls} />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <textarea
                        rows={2}
                        aria-label={`Detalle, fila ${i + 1}`}
                        value={f.detalle}
                        placeholder="Detalle según el Diseño Curricular"
                        onChange={(e) => set(i, { detalle: e.target.value })}
                        className={`${inputCls} resize-y`}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <th scope="row" className="px-2.5 py-2 text-left font-bold text-ink">
                      {f.codigo || '—'}
                    </th>
                    <td className="px-2.5 py-2 leading-snug text-ink">{f.detalle || '—'}</td>
                  </>
                )}
                <CeldasNivel nombre={`${uid}-${f.id}`} etiqueta={f.codigo || `Fila ${i + 1}`} valor={f.nivel} editable={editable} onChange={(n) => set(i, { nivel: n })} />
                {editable && (
                  <td className="px-1.5 text-center">
                    <BotonEliminar etiqueta={`Eliminar competencia ${f.codigo || i + 1}`} onClick={() => onChange(filas.filter((_, idx) => idx !== i))} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable && (
        <BotonAgregar onClick={() => onChange([...filas, { id: nuevoId('ce'), codigo: '', detalle: '', nivel: null }])}>Agregar Competencia Específica</BotonAgregar>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unidades temáticas
// ---------------------------------------------------------------------------

export function ListaUnidades({ unidades, editable, onChange }: { unidades: UnidadTematica[]; editable: boolean; onChange: (u: UnidadTematica[]) => void }) {
  const set = (i: number, patch: Partial<UnidadTematica>) => onChange(unidades.map((u, idx) => (idx === i ? { ...u, ...patch } : u)));
  return (
    <div className="space-y-3">
      {unidades.length === 0 && <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted">Todavía no se agregaron unidades.</p>}
      {unidades.map((u, i) => (
        <article key={u.id} className="rounded-xl border border-border bg-background p-4">
          {editable ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-end gap-2">
                <label className="w-28 text-[11px] font-semibold text-muted">
                  Unidad N°
                  <input value={u.numero} inputMode="numeric" onChange={(e) => set(i, { numero: e.target.value.replace(/[^\d]/g, '') })} className={`${inputCls} mt-1`} />
                </label>
                <label className="min-w-[200px] flex-1 text-[11px] font-semibold text-muted">
                  Título de la unidad
                  <input value={u.titulo} placeholder="Ej. Introducción a los algoritmos" onChange={(e) => set(i, { titulo: e.target.value })} className={`${inputCls} mt-1`} />
                </label>
                <BotonEliminar etiqueta={`Eliminar unidad ${u.numero || i + 1}`} onClick={() => onChange(unidades.filter((_, idx) => idx !== i))} />
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold text-muted">Contenidos</div>
                <RichTextEditor
                  editable
                  ariaLabel={`Contenidos de la unidad ${u.numero || i + 1}`}
                  value={u.contenidos}
                  placeholder="Contenidos analíticos de la unidad (podés usar viñetas)…"
                  minH="min-h-[80px]"
                  onChange={(v) => set(i, { contenidos: v })}
                />
              </div>
              <label className="block text-[11px] font-semibold text-muted">
                Resultados de aprendizaje de la unidad <span className="font-normal">(opcional)</span>
                <input value={u.resultados} placeholder="Ej. RA1, RA2" onChange={(e) => set(i, { resultados: e.target.value })} className={`${inputCls} mt-1`} />
              </label>
            </div>
          ) : (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-ink">
                Unidad N° {u.numero}: {u.titulo}
              </h4>
              <RichTextView html={u.contenidos} vacio="Sin contenidos." />
              {u.resultados && (
                <p className="text-[11px] text-muted">
                  <strong className="text-ink">Resultados de aprendizaje:</strong> {u.resultados}
                </p>
              )}
            </div>
          )}
        </article>
      ))}
      {editable && (
        <BotonAgregar
          onClick={() =>
            onChange([...unidades, { id: nuevoId('un'), numero: String(unidades.length + 1), titulo: '', contenidos: '', resultados: '' }])
          }
        >
          Agregar Unidad
        </BotonAgregar>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horarios de clases
// ---------------------------------------------------------------------------

export function MatrizHorarios({ horarios, editable, onChange }: { horarios: HorarioClases; editable: boolean; onChange: (h: HorarioClases) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[720px] border-collapse text-xs">
        <caption className="sr-only">Horarios de clases por día</caption>
        <thead>
          <tr className="bg-background text-[11px] text-muted">
            <th scope="col" className="w-36 px-3 py-2.5 text-left font-semibold">
              <span className="sr-only">Tipo de clase</span>
            </th>
            {DIAS_PAAD.map((d) => (
              <th key={d} scope="col" className="px-2 py-2.5 text-center font-semibold">
                {DIA_LABEL[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {FILAS_HORARIO.map((f) => (
            <tr key={f}>
              <th scope="row" className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-ink">
                {FILA_HORARIO_LABEL[f]}
              </th>
              {DIAS_PAAD.map((d) => {
                const v = horarios[f][d];
                return (
                  <td key={d} className="px-1.5 py-1.5 text-center">
                    {editable ? (
                      <textarea
                        rows={2}
                        aria-label={`${FILA_HORARIO_LABEL[f]}, ${DIA_LABEL[d]}`}
                        value={v}
                        placeholder="—"
                        onChange={(e) => onChange({ ...horarios, [f]: { ...horarios[f], [d]: e.target.value } })}
                        className={`${inputCls} resize-none text-center ${v.trim() ? 'border-transparent bg-soft font-semibold' : ''}`}
                      />
                    ) : (
                      <span className={`whitespace-pre-wrap ${v ? 'font-medium text-ink' : 'text-muted'}`}>{v || '—'}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cronograma semanal
// ---------------------------------------------------------------------------

type ClaveSemana = Exclude<keyof SemanaCronograma, 'id'>;

const GRUPOS_CRONO: { titulo: string; num: { key: ClaveSemana; label: string; ancho: string }; horas: ColumnaHorasCronograma }[] = [
  { titulo: 'Clases teóricas', num: { key: 'unidad', label: 'Unidad N°', ancho: 'w-16' }, horas: 'horasTeoria' },
  { titulo: 'Clases prácticas', num: { key: 'tp', label: 'T.P. N°', ancho: 'w-16' }, horas: 'horasPractica' },
  { titulo: 'Clases de lab.', num: { key: 'tpl', label: 'T.P.L. N°', ancho: 'w-16' }, horas: 'horasLab' },
  { titulo: 'Prácticas de campo', num: { key: 'tplCampo', label: 'T.P.L. N°', ancho: 'w-16' }, horas: 'horasCampo' },
  { titulo: 'Evaluaciones parciales', num: { key: 'evaluacion', label: 'Instancia', ancho: 'w-32' }, horas: 'horasEval' },
];

export function TablaCronograma({
  semanas,
  notas,
  horasPlan,
  editable,
  onChange,
  onNotas,
}: {
  semanas: SemanaCronograma[];
  notas: string;
  horasPlan: number | undefined;
  editable: boolean;
  onChange: (s: SemanaCronograma[]) => void;
  onNotas: (v: string) => void;
}) {
  const t = totalesCronograma(semanas);
  const set = (i: number, k: ClaveSemana, v: string) => onChange(semanas.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));
  const coincide = !horasPlan || t.total === horasPlan;
  const celda = (s: SemanaCronograma, i: number, k: ClaveSemana, label: string, horas: boolean) =>
    editable ? (
      <input
        aria-label={`${label}, semana ${s.semana || i + 1}`}
        value={s[k]}
        inputMode={horas ? 'decimal' : undefined}
        placeholder={horas ? '0' : '—'}
        onChange={(e) => set(i, k, horas ? e.target.value.replace(/[^\d.,]/g, '') : e.target.value)}
        className={`${inputCls} px-1 text-center ${horas && horasDe(s[k]) > 0 ? 'border-transparent bg-soft font-semibold' : ''}`}
      />
    ) : (
      <span className={s[k] ? 'text-ink' : 'text-muted'}>{s[k] || '—'}</span>
    );

  return (
    <div className="space-y-3">
      {editable && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onChange(generarSemanas(semanas, 15))} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary hover:text-primary">
            Generar 15 semanas (Cuatrimestral)
          </button>
          <button type="button" onClick={() => onChange(generarSemanas(semanas, 30))} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary hover:text-primary">
            Generar 30 semanas (Anual)
          </button>
          <span className="self-center text-[11px] text-muted">Completa hasta esa cantidad sin borrar las semanas ya cargadas.</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[900px] border-collapse text-xs">
          <caption className="sr-only">Cronograma semanal de clases y evaluaciones</caption>
          <thead className="text-[11px] text-muted">
            <tr className="bg-background">
              <th scope="col" rowSpan={2} className="w-16 border-b border-r border-border px-2 py-2 text-center font-semibold">
                Semana N°
              </th>
              {GRUPOS_CRONO.map((g) => (
                <th key={g.titulo} scope="colgroup" colSpan={2} className="border-b border-r border-border px-2 py-1.5 text-center font-bold uppercase tracking-wide text-ink last:border-r-0">
                  {g.titulo}
                </th>
              ))}
              {editable && (
                <th rowSpan={2} className="w-10 border-b border-border">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
            <tr className="bg-background">
              {GRUPOS_CRONO.map((g) => (
                <FragmentoEncabezado key={g.titulo} num={g.num.label} ancho={g.num.ancho} />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {semanas.length === 0 && (
              <tr>
                <td colSpan={editable ? 12 : 11} className="px-3 py-5 text-center text-muted">
                  Sin semanas cargadas. Generá el cronograma o agregá semana por semana.
                </td>
              </tr>
            )}
            {semanas.map((s, i) => (
              <tr key={s.id} className="transition-colors hover:bg-background">
                <th scope="row" className="border-r border-border px-1.5 py-1.5 text-center font-bold text-ink">
                  {editable ? celda(s, i, 'semana', 'Semana N°', false) : s.semana}
                </th>
                {GRUPOS_CRONO.map((g) => (
                  <Fragment key={g.titulo}>
                    <td className="px-1 py-1.5 text-center">{celda(s, i, g.num.key, `${g.titulo}: ${g.num.label}`, false)}</td>
                    <td className="border-r border-border px-1 py-1.5 text-center last:border-r-0">{celda(s, i, g.horas, `${g.titulo}: horas`, true)}</td>
                  </Fragment>
                ))}
                {editable && (
                  <td className="px-1 text-center">
                    <BotonEliminar etiqueta={`Eliminar semana ${s.semana || i + 1}`} onClick={() => onChange(semanas.filter((_, idx) => idx !== i))} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-background font-bold text-ink">
              <th scope="row" className="border-r border-border px-2 py-2.5 text-center">
                TOTAL
              </th>
              {GRUPOS_CRONO.map((g) => (
                <Fragment key={g.titulo}>
                  <td />
                  <td className="border-r border-border px-1 py-2.5 text-center tabular-nums text-primary last:border-r-0">{t[g.horas]} hs</td>
                </Fragment>
              ))}
              {editable && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {editable && <BotonAgregar onClick={() => onChange([...semanas, semanaVacia(semanas.length + 1)])}>Agregar semana</BotonAgregar>}
        <p
          aria-live="polite"
          className={`ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold tabular-nums ${
            coincide ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
          }`}
        >
          Total del cronograma: {t.total} hs{horasPlan ? ` de ${horasPlan} hs del crédito horario` : ''}
          {coincide ? ' ✓' : ''}
        </p>
      </div>

      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold text-muted">Notas aclaratorias del cronograma</span>
        {editable ? (
          <textarea rows={2} value={notas} placeholder="Ej. feriados, semanas de mesas de examen, recuperatorios…" onChange={(e) => onNotas(e.target.value)} className={`${inputCls} resize-y`} />
        ) : (
          <span className="block whitespace-pre-wrap text-xs text-ink">{notas || <span className="italic text-muted">Sin notas.</span>}</span>
        )}
      </label>
    </div>
  );
}

function FragmentoEncabezado({ num, ancho }: { num: string; ancho: string }) {
  return (
    <>
      <th scope="col" className={`${ancho} border-b border-border px-1 py-1.5 text-center font-semibold`}>
        {num}
      </th>
      <th scope="col" className="w-16 border-b border-r border-border px-1 py-1.5 text-center font-semibold">
        Horas
      </th>
    </>
  );
}
