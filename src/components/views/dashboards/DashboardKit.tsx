// Kit visual de los dashboards de Inicio (UAP, Dirección, Consejo): mismo lenguaje que el dashboard docente.
// Colores fijos por estado (nunca por posición), siempre acompañados de etiqueta, cantidad y porcentaje.
import { useId, useState, type ReactNode } from 'react';
import { StatusBadge } from '../../shared/StatusBadge';
import { IconAlert, IconArrowRight, IconCheck, IconClock, IconLock } from '../../layout/icons';
import type { Carrera } from '../../../types/estructura';

export const COLOR = {
  aprobado: '#10b981',
  revision: '#3b82f6',
  observado: '#f59e0b',
  pendiente: '#64748b',
  elevado: '#8b5cf6',
  pleno: '#14b8a6',
} as const;

export const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

const foco = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

// `primary`, `soft`, `border` y `bg` son variables CSS sin canal alfa: los `/NN` de Tailwind no se generan
// para ellas. Junto a cada uno va su equivalente literal con color-mix.
const hoverTarjeta =
  'hover:border-primary/50 hover:border-[color:color-mix(in_srgb,var(--primary)_50%,transparent)] hover:bg-soft/30 hover:bg-[color:color-mix(in_srgb,var(--soft)_30%,var(--surface))] hover:shadow-md';

/** Botón principal estirado sobre toda la tarjeta: la tarjeta entera es clickeable sin anidar controles. */
const estirado = 'text-left after:absolute after:inset-0 after:rounded-2xl after:content-[""] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary';

// ---------------------------------------------------------------------------
// Encabezado, panel y barra simple
// ---------------------------------------------------------------------------

export function SaludoDashboard({ nombre, subtitulo, extra }: { nombre: string; subtitulo: string; extra?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Hola, {nombre}</h1>
        <p className="mt-1 text-xs text-muted">{subtitulo}</p>
      </div>
      {extra && <div className="flex shrink-0 flex-wrap items-center gap-2">{extra}</div>}
    </header>
  );
}

/** Chip de acción rápida del encabezado (ámbar: requiere atención). */
export function ChipAccion({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-500/20 dark:text-amber-200 ${foco}`}
    >
      <IconAlert className="h-4 w-4" />
      {children}
      <IconArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}

/** Pastillas de selección (alcance, ciclo). */
export function Pastillas<T extends string>({ etiqueta, opciones, valor, onChange }: { etiqueta: string; opciones: { key: T; label: string }[]; valor: T; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="inline-flex flex-wrap rounded-lg border border-border bg-background p-0.5 text-xs">
      {opciones.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={valor === o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-md px-3 py-1.5 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
            valor === o.key ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Columna con encabezado de altura fija (alinea columnas vecinas). */
export function Panel({ titulo, accion, children, className = '' }: { titulo: string; accion?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`space-y-3.5 ${className}`}>
      <div className="flex h-7 items-center justify-between gap-2">
        <h2 className="truncate text-base font-bold text-ink">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

export function BarraProgreso({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={100} aria-valuenow={valor} className="h-1.5 w-full overflow-hidden rounded-full bg-background">
      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${valor}%` }} />
    </div>
  );
}

/** Sub-panel de métrica secundaria con barra (pie de las tarjetas gráficas). */
export function MetricaBarra({ titulo, valor, total, texto }: { titulo: string; valor: number; total: number; texto?: string }) {
  return (
    <div className="space-y-1.5 rounded-xl border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-ink">{titulo}</span>
        <span className="tabular-nums text-muted">
          <strong className="text-ink">{pct(valor, total)}%</strong> · {texto ?? `${valor} de ${total}`}
        </span>
      </div>
      <BarraProgreso valor={pct(valor, total)} etiqueta={titulo} />
    </div>
  );
}

export const linkCls = `inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline ${foco}`;

// ---------------------------------------------------------------------------
// DonutChartCard
// ---------------------------------------------------------------------------

export interface Segmento {
  key: string;
  label: string;
  valor: number;
  color: string;
  /** Navega o filtra al elegir el ítem de la leyenda. */
  onClick?: () => void;
}

function Dona({ segmentos, total, centro, activo, onActivo }: { segmentos: Segmento[]; total: number; centro: string; activo: string | null; onActivo: (k: string | null) => void }) {
  const size = 128;
  const stroke = 15;
  const r = (size - stroke) / 2 - 1;
  const C = 2 * Math.PI * r;
  const visibles = segmentos.filter((s) => s.valor > 0);
  const gap = visibles.length > 1 ? 2 : 0; // 2px de separación entre segmentos
  let acumulado = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`${centro}: ${total}. ${segmentos.map((s) => `${s.label} ${s.valor}`).join(', ')}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-200 dark:stroke-slate-800" />
      {total > 0 &&
        visibles.map((s) => {
          const largo = (s.valor / total) * C;
          const tramo = Math.max(largo - gap, 0.5);
          const offset = -acumulado;
          acumulado += largo;
          return (
            <circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={activo === s.key ? stroke + 2 : stroke}
              strokeDasharray={`${tramo} ${C - tramo}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              opacity={activo !== null && activo !== s.key ? 0.35 : 1}
              className="transition-[opacity,stroke-width] duration-200"
              onMouseEnter={() => onActivo(s.key)}
              onMouseLeave={() => onActivo(null)}
            >
              <title>{`${s.label}: ${s.valor} (${pct(s.valor, total)}%)`}</title>
            </circle>
          );
        })}
      <text x={size / 2} y={size / 2 - 1} textAnchor="middle" className="fill-ink text-[26px] font-extrabold">
        {total}
      </text>
      <text x={size / 2} y={size / 2 + 16} textAnchor="middle" className="fill-muted text-[9px] font-semibold uppercase tracking-wider">
        {centro}
      </text>
    </svg>
  );
}

/** Barra apilada (2px entre segmentos), sincronizada con la dona y la leyenda. */
export function BarraApilada({ segmentos, activo, onActivo, etiqueta }: { segmentos: Segmento[]; activo?: string | null; onActivo?: (k: string | null) => void; etiqueta: string }) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  return (
    <div role="img" aria-label={`${etiqueta}: ${segmentos.map((s) => `${s.label} ${s.valor}`).join(', ')}`} className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-background">
      {total > 0 &&
        segmentos
          .filter((s) => s.valor > 0)
          .map((s) => (
            <span
              key={s.key}
              title={`${s.label}: ${s.valor} (${pct(s.valor, total)}%)`}
              onMouseEnter={() => onActivo?.(s.key)}
              onMouseLeave={() => onActivo?.(null)}
              className="h-full transition-opacity duration-200 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(s.valor / total) * 100}%`, backgroundColor: s.color, opacity: activo && activo !== s.key ? 0.35 : 1 }}
            />
          ))}
    </div>
  );
}

/** Tarjeta gráfica: dona + barra apilada + leyenda 2x2 clickeable + métrica secundaria al pie. */
export function DonutChartCard({
  titulo,
  centro,
  segmentos,
  pie,
  accion,
  vertical = false,
  className = '',
}: {
  titulo: string;
  /** Rótulo bajo el número central (ej. "PAAC"). */
  centro: string;
  segmentos: Segmento[];
  /** Métrica secundaria o acciones al pie (queda alineado al fondo de la tarjeta). */
  pie?: ReactNode;
  accion?: ReactNode;
  /** Apila la dona sobre la leyenda (columnas angostas). */
  vertical?: boolean;
  className?: string;
}) {
  const [activo, setActivo] = useState<string | null>(null);
  const idTitulo = useId();
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  return (
    <section aria-labelledby={idTitulo} className={`flex flex-col justify-between gap-5 rounded-2xl border border-border bg-surface p-6 shadow-sm ${className}`}>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-2">
          <h2 id={idTitulo} className="text-base font-bold text-ink">
            {titulo}
          </h2>
          {accion}
        </div>
        <div className={`flex flex-col gap-5 ${vertical ? 'items-center' : 'sm:flex-row sm:items-center'}`}>
          <Dona segmentos={segmentos} total={total} centro={centro} activo={activo} onActivo={setActivo} />
          <div className="w-full min-w-0 flex-1 space-y-4">
            <BarraApilada segmentos={segmentos} activo={activo} onActivo={setActivo} etiqueta={titulo} />
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {segmentos.map((s) => {
                const cuerpo = (
                  <>
                    <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="min-w-0 flex-1 truncate text-left text-ink" title={s.label}>
                      {s.label}
                    </span>
                    <span className="font-semibold tabular-nums text-ink">{s.valor}</span>
                    <span className="w-9 text-right tabular-nums text-muted">{pct(s.valor, total)}%</span>
                  </>
                );
                const cls = `flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${activo === s.key ? 'bg-background' : ''}`;
                return (
                  <li key={s.key} onMouseEnter={() => setActivo(s.key)} onMouseLeave={() => setActivo(null)}>
                    {s.onClick ? (
                      <button type="button" onClick={s.onClick} className={`${cls} hover:bg-background ${foco}`}>
                        {cuerpo}
                      </button>
                    ) : (
                      <div className={cls}>{cuerpo}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      {pie}
    </section>
  );
}

// ---------------------------------------------------------------------------
// KpiFilterCard
// ---------------------------------------------------------------------------

/** KPI uniforme: el clic filtra la lista del dashboard; "Ir a bandeja →" abre el listado filtrado. */
export function KpiFilterCard({
  titulo,
  valor,
  detalle,
  icono,
  color,
  activo,
  onFiltrar,
  onIr,
  irLabel = 'Ir a bandeja',
}: {
  titulo: string;
  valor: ReactNode;
  detalle: ReactNode;
  icono: ReactNode;
  color: string;
  activo: boolean;
  onFiltrar?: () => void;
  onIr?: () => void;
  irLabel?: string;
}) {
  return (
    <div
      className={`group relative flex h-full cursor-pointer flex-col justify-between gap-3 rounded-2xl border p-5 shadow-sm transition-all duration-200 ${
        activo
          ? 'border-primary bg-soft/25 bg-[color:color-mix(in_srgb,var(--soft)_25%,var(--surface))] ring-1 ring-primary/30 ring-[color:color-mix(in_srgb,var(--primary)_30%,transparent)]'
          : 'border-border bg-surface hover:border-primary/40 hover:border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        {onFiltrar ? (
          <button type="button" onClick={onFiltrar} aria-pressed={activo} className={`${estirado} text-[11px] font-semibold leading-snug text-muted`}>
            {titulo}
          </button>
        ) : (
          <span className="text-[11px] font-semibold leading-snug text-muted">{titulo}</span>
        )}
        <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-soft" style={{ color }}>
          {icono}
        </span>
      </div>
      <div>
        <span className="block text-2xl font-extrabold tabular-nums text-ink">{valor}</span>
        <span className="mt-0.5 flex items-end justify-between gap-2">
          <span className="text-[11px] text-muted">{detalle}</span>
          {onIr && (
            <button
              type="button"
              onClick={onIr}
              className={`relative z-10 inline-flex shrink-0 items-center gap-1 rounded text-[11px] font-semibold text-muted transition-colors hover:text-primary ${foco}`}
            >
              {irLabel} <IconArrowRight className="h-3 w-3" />
            </button>
          )}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CareerComparisonMatrix
// ---------------------------------------------------------------------------

export interface CeldaMatriz {
  key: string;
  label: string;
  valor: number;
  color: string;
  onClick?: () => void;
}

export interface FilaMatriz {
  carrera: Carrera;
  ordenanza?: string;
  /** % de avance global de la carrera (lo define cada dashboard). */
  avance: number;
  celdas: CeldaMatriz[];
  /** Motivo por el que la fila es solo de consulta (sin navegación). */
  soloConsulta?: string;
}

export interface ModoMatriz {
  key: string;
  label: string;
  /** Unidad contada en cada fila (ej. "PAAC", "PAAD"). */
  unidad: string;
  total: number;
  filas: FilaMatriz[];
}

const celdaCls =
  'flex items-center justify-between gap-2 rounded-xl border border-border border-[color:color-mix(in_srgb,var(--border)_70%,transparent)] bg-background/70 bg-[color:color-mix(in_srgb,var(--bg)_70%,var(--surface))] px-3 py-1.5 text-xs transition';

/** Comparativa por carrera: una sola métrica a la vez (toggle PAAC / PAAD), barra segmentada y 4 celdas clickeables. */
export function CareerComparisonMatrix({ titulo, modos, nota }: { titulo: string; modos: ModoMatriz[]; nota?: string }) {
  const [modo, setModo] = useState(modos[0]?.key ?? '');
  const actual = modos.find((m) => m.key === modo) ?? modos[0];
  if (!actual) return null;
  return (
    <section className="space-y-3.5">
      <div className="flex min-h-7 flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-ink">{titulo}</h2>
        {modos.length > 1 && (
          <Pastillas etiqueta="Métrica de la comparativa" opciones={modos.map((m) => ({ key: m.key, label: `${m.label} (${m.total})` }))} valor={actual.key} onChange={setModo} />
        )}
      </div>
      <ul className="space-y-3.5">
        {actual.filas.map((f) => {
          const total = f.celdas.reduce((s, c) => s + c.valor, 0);
          return (
            <li key={f.carrera.id} className="space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink">
                    <span className="rounded bg-soft px-2 py-0.5 text-[11px] font-bold text-primary">{f.carrera.sigla}</span>
                    <span className="truncate" title={f.carrera.nombre}>
                      {f.carrera.nombre}
                    </span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                    {f.ordenanza && <span>{f.ordenanza}</span>}
                    <span>
                      · {total} {actual.unidad}
                    </span>
                    {f.soloConsulta && (
                      <span className="inline-flex items-center gap-1" title={f.soloConsulta}>
                        · <IconLock className="h-3 w-3" /> Consulta
                      </span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-extrabold tabular-nums text-ink">{f.avance}%</span>
                  <span className="block text-[10px] text-muted">avance</span>
                </span>
              </div>
              <BarraApilada segmentos={f.celdas} etiqueta={`${f.carrera.sigla} · ${actual.label}`} />
              <div className={`grid grid-cols-2 gap-2 pt-1 ${f.celdas.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
                {f.celdas.map((c) => {
                  const cuerpo = (
                    <>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="truncate text-muted">{c.label}</span>
                      </span>
                      <strong className="tabular-nums text-ink">{c.valor}</strong>
                    </>
                  );
                  return c.onClick && !f.soloConsulta ? (
                    <button
                      key={c.key}
                      type="button"
                      onClick={c.onClick}
                      title={`${c.label} · ${f.carrera.sigla}: abrir el listado filtrado`}
                      className={`${celdaCls} hover:border-primary/40 hover:border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)] hover:bg-soft/50 hover:bg-[color:color-mix(in_srgb,var(--soft)_50%,var(--surface))] ${foco}`}
                    >
                      {cuerpo}
                    </button>
                  ) : (
                    <div key={c.key} className={celdaCls} title={f.soloConsulta}>
                      {cuerpo}
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      {nota && <p className="text-[11px] text-muted">{nota}</p>}
    </section>
  );
}

// ---------------------------------------------------------------------------
// SelectableCatedraCard
// ---------------------------------------------------------------------------

type EstadoArea = 'aprobado' | 'observado' | 'pendiente';

const CHIP_AREA: Record<EstadoArea, { texto: string; cls: string }> = {
  aprobado: { texto: 'Aprobado', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' },
  observado: { texto: 'Con observaciones', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25' },
  pendiente: { texto: 'Pendiente', cls: 'bg-background text-muted border-border' },
};

function ChipArea({ area, estado }: { area: string; estado: EstadoArea }) {
  const c = CHIP_AREA[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium ${c.cls}`}>
      {estado === 'aprobado' ? <IconCheck className="h-3 w-3" /> : estado === 'observado' ? <IconAlert className="h-3 w-3" /> : <IconClock className="h-3 w-3" />}
      {area}: {c.texto}
    </span>
  );
}

export interface CatedraTarjeta {
  id: string;
  state: string;
  asignatura: string;
  carrera?: string;
  ordenanza?: string;
  regimen?: string;
  responsable: string;
  avance: number;
  pendientes: number;
  uap: EstadoArea;
  direccion: EstadoArea;
  conInformes: boolean;
  /** Pie alternativo (expediente/resolución, acción del Consejo). */
  extra?: ReactNode;
  /** Color de acento lateral (estado). */
  acento: string;
}

/** Tarjeta de cátedra 100% clickeable (mismo diseño que el dashboard docente). Sin `onOpen` queda en consulta. */
export function SelectableCatedraCard({ c, onOpen, onReport }: { c: CatedraTarjeta; onOpen?: () => void; onReport?: () => void }) {
  const interactiva = !!onOpen;
  return (
    <li
      className={`relative flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 ${
        interactiva ? `group cursor-pointer ${hoverTarjeta}` : ''
      }`}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: c.acento }} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink transition-colors group-hover:text-primary">
            {interactiva ? (
              <button type="button" onClick={onOpen} className={`${estirado} min-w-0 truncate`} title={c.asignatura}>
                {c.asignatura}
              </button>
            ) : (
              <span className="min-w-0 truncate" title={c.asignatura}>
                {c.asignatura}
              </span>
            )}
            {interactiva && <IconArrowRight className="h-4 w-4 shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-primary" />}
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
            {c.carrera && <span className="rounded bg-soft px-1.5 py-px font-bold text-primary">{c.carrera}</span>}
            {c.ordenanza && <span>{c.ordenanza}</span>}
            {c.regimen && <span>· {c.regimen}</span>}
            <span className="truncate">· {c.responsable}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge state={c.state} />
          {c.pendientes > 0 && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              {c.pendientes} obs. pendiente(s)
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted">Progreso de carga</span>
          <span className="font-bold tabular-nums text-ink">{c.avance}%</span>
        </div>
        <BarraProgreso valor={c.avance} etiqueta={`Progreso de carga de ${c.asignatura}`} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border border-[color:color-mix(in_srgb,var(--border)_60%,transparent)] pt-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <ChipArea area="UAP" estado={c.uap} />
          <ChipArea area="Dirección" estado={c.direccion} />
        </div>
        <div className="flex items-center gap-3">
          {c.extra}
          {c.conInformes && onReport && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReport();
              }}
              className={`relative z-10 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-ink transition hover:bg-soft hover:text-primary ${foco}`}
            >
              Ver Informes
            </button>
          )}
          {interactiva ? (
            <span aria-hidden className="flex items-center gap-1 text-[11px] font-semibold text-muted transition-colors group-hover:text-primary">
              Abrir planificación <span>→</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <IconLock className="h-3 w-3" /> Consulta
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
