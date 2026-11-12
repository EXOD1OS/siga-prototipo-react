// Piezas compartidas de los dashboards de Inicio (UAP, Dirección, Consejo).
// Colores de estado fijos por estado (nunca por posición) y siempre acompañados de texto y número.
import type { ReactNode } from 'react';
import { IconArrowRight } from '../../layout/icons';

export type TonoEstado = 'borrador' | 'revision' | 'observado' | 'aprobado' | 'finalizado' | 'neutro';

export const COLOR_TONO: Record<TonoEstado, string> = {
  borrador: '#94a3b8',
  revision: '#3b82f6',
  observado: '#f59e0b',
  aprobado: '#10b981',
  finalizado: '#047857',
  neutro: '#94a3b8',
};

const CHIP_TONO: Record<TonoEstado, string> = {
  borrador: 'border-border bg-background text-ink',
  revision: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  observado: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  aprobado: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  finalizado: 'border-emerald-600/30 bg-emerald-600/10 text-emerald-800 dark:text-emerald-200',
  neutro: 'border-border bg-background text-ink',
};

export const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

const foco = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export function SaludoDashboard({ nombre, subtitulo, extra }: { nombre: string; subtitulo: string; extra?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Hola, {nombre}</h1>
        <p className="mt-1 text-xs text-muted">{subtitulo}</p>
      </div>
      {extra}
    </header>
  );
}

/** Tarjeta KPI: si tiene `onClick` es un botón que abre el listado filtrado. */
export function KpiCard({
  titulo,
  valor,
  detalle,
  tono = 'neutro',
  icono,
  onClick,
  accion = 'Ver listado',
}: {
  titulo: string;
  valor: ReactNode;
  detalle?: ReactNode;
  tono?: TonoEstado;
  icono?: ReactNode;
  onClick?: () => void;
  accion?: string;
}) {
  const contenido = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold leading-snug text-muted">{titulo}</span>
        {icono && (
          <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-soft" style={{ color: COLOR_TONO[tono] }}>
            {icono}
          </span>
        )}
      </span>
      <span>
        <span className="block text-2xl font-bold tabular-nums text-ink">{valor}</span>
        {detalle && <span className="mt-0.5 block text-[11px] text-muted">{detalle}</span>}
        {onClick && (
          <span className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-muted transition-colors group-hover:text-primary">
            {accion} <IconArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </span>
    </>
  );
  const base = 'group relative flex h-full flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-5 text-left shadow-sm transition-all duration-200';
  const acento = <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: COLOR_TONO[tono] }} />;
  if (!onClick) {
    return (
      <div className={base}>
        {acento}
        {contenido}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} cursor-pointer hover:border-primary/50 hover:border-[color:color-mix(in_srgb,var(--primary)_50%,transparent)] hover:shadow-md ${foco}`}
    >
      {acento}
      {contenido}
    </button>
  );
}

/** Contador clickeable con color de estado; deshabilitado en cero. */
export function ChipConteo({ label, valor, tono, onClick, titulo }: { label: string; valor: number; tono: TonoEstado; onClick?: () => void; titulo?: string }) {
  const cls = `inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${CHIP_TONO[tono]}`;
  const cuerpo = (
    <>
      <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLOR_TONO[tono] }} />
      {label}
      <strong className="tabular-nums">{valor}</strong>
    </>
  );
  if (!onClick) return <span className={cls}>{cuerpo}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={valor === 0}
      title={titulo}
      className={`${cls} hover:brightness-95 hover:shadow-sm disabled:cursor-default disabled:opacity-50 dark:hover:brightness-125 ${foco}`}
    >
      {cuerpo}
    </button>
  );
}

export interface Segmento {
  key: string;
  label: string;
  valor: number;
  tono: TonoEstado;
  onClick?: () => void;
}

/** Barra segmentada (2px entre segmentos) con leyenda numérica; cada segmento puede abrir el listado. */
export function BarraSegmentos({ segmentos, etiqueta }: { segmentos: Segmento[]; etiqueta: string }) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  const visibles = segmentos.filter((s) => s.valor > 0);
  return (
    <div className="space-y-2">
      <div role="group" aria-label={etiqueta} className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-background">
        {total === 0 ? (
          <span className="h-full w-full" />
        ) : (
          visibles.map((s) => {
            const estilo = { width: `${(s.valor / total) * 100}%`, backgroundColor: COLOR_TONO[s.tono] };
            const texto = `${s.label}: ${s.valor} (${pct(s.valor, total)}%)`;
            return s.onClick ? (
              <button
                key={s.key}
                type="button"
                onClick={s.onClick}
                title={texto}
                aria-label={texto}
                className={`h-full transition-opacity first:rounded-l-full last:rounded-r-full hover:opacity-80 ${foco}`}
                style={estilo}
              />
            ) : (
              <span key={s.key} title={texto} className="h-full first:rounded-l-full last:rounded-r-full" style={estilo} />
            );
          })
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        {segmentos.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: COLOR_TONO[s.tono] }} />
            <span className="text-muted">{s.label}</span>
            <strong className="tabular-nums text-ink">{s.valor}</strong>
            <span className="tabular-nums text-muted">({pct(s.valor, total)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Panel con encabezado de altura fija (alinea columnas vecinas). */
export function Panel({ titulo, accion, children, className = '' }: { titulo: string; accion?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`space-y-3.5 ${className}`}>
      <div className="flex h-7 items-center justify-between gap-2">
        <h2 className="text-base font-bold text-ink">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

export function BarraAvance({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={100} aria-valuenow={valor} className="h-1.5 w-full overflow-hidden rounded-full bg-background">
      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${valor}%` }} />
    </div>
  );
}

export const linkCls = `text-xs font-semibold text-primary hover:underline ${foco}`;
