import { useId, useState } from 'react';
import { StatusBadge } from '../shared/StatusBadge';
import { IconAlert, IconArrowRight, IconCheck, IconClock, IconDocs } from '../layout/icons';
import { armarAspectosPaac, paacDesdeDatosAnteriores, progresoPaac } from '../../lib/paac';
import { progresoPaad } from '../../lib/paad';
import type { AreaRevision } from '../../lib/revision';
import type { EstadoPlanif, InformeEvaluacion, ObservacionDoc, PaacDoc } from '../../types/planificacion';
import type { PaadContenido } from '../../types/paad';
import type { AsigContext, EquipoCatedra, Usuario } from '../../types/estructura';

interface PaadResumen {
  id: string;
  state: string;
  paad?: PaadContenido;
  comments: ObservacionDoc[];
}

interface Props {
  uid: string;
  activeUserName: string;
  ciclo: number;
  /** PAAC del sistema (se filtran las cátedras del docente en el ciclo). */
  paacs: PaacDoc[];
  /** PAAD anual del docente (undefined si todavía no existe). */
  paad: PaadResumen | undefined;
  usuarios: Usuario[];
  equiposCatedra: EquipoCatedra[];
  asigContext: (id: string) => AsigContext;
  onOpenDoc: (id: string) => void;
  onOpenReport: (id: string) => void;
  onVerPlanificaciones: () => void;
}

// ---------------------------------------------------------------------------
// Agrupación de estados del PAAC
// ---------------------------------------------------------------------------

type Grupo = 'aprobados' | 'revision' | 'observados' | 'borrador';
type Filtro = 'todos' | 'aprobados' | 'revision' | 'pendientes';

const GRUPO_DE: Record<EstadoPlanif, Grupo> = {
  APROBADO_PLENO: 'aprobados',
  ELEVADO_AL_CONSEJO: 'aprobados',
  FINALIZADO: 'aprobados',
  ENVIADO_A_REVISION: 'revision',
  APROBADO_PEDAGOGICO: 'revision',
  APROBADO_DISCIPLINAR: 'revision',
  OBSERVADO: 'observados',
  BORRADOR: 'borrador',
};

/** Colores de estado (fijos por estado, nunca por posición). */
const SERIE: Record<Grupo, { label: string; color: string }> = {
  aprobados: { label: 'Aprobados', color: '#10b981' },
  revision: { label: 'En revisión', color: '#3b82f6' },
  observados: { label: 'Observados / Correcciones', color: '#f59e0b' },
  borrador: { label: 'Pendientes en borrador', color: '#94a3b8' },
};
const ORDEN: Grupo[] = ['aprobados', 'revision', 'observados', 'borrador'];

const enFiltro = (g: Grupo, f: Filtro) =>
  f === 'todos' || (f === 'aprobados' && g === 'aprobados') || (f === 'revision' && g === 'revision') || (f === 'pendientes' && (g === 'observados' || g === 'borrador'));

const pctDe = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

const REGIMEN: Record<string, string> = { '1C': '1C', '2C': '2C', ANUAL: 'ANUAL' };

// `primary`, `soft` y `border` son variables CSS sin canal alfa: los modificadores `/NN` de Tailwind no se
// generan para ellas. Junto a cada uno va su equivalente literal con color-mix (Tailwind solo genera
// las clases que encuentra escritas tal cual).
const tarjetaCls =
  'group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md ' +
  'hover:bg-soft/40 hover:bg-[color:color-mix(in_srgb,var(--soft)_40%,var(--surface))] ' +
  'hover:border-primary/50 hover:border-[color:color-mix(in_srgb,var(--primary)_50%,transparent)] ' +
  'focus-within:border-primary';

/** Botón principal estirado sobre toda la tarjeta: la tarjeta entera es clickeable sin anidar controles. */
const estiradoCls =
  'text-left after:absolute after:inset-0 after:rounded-2xl after:content-[""] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary';

function BarraProgreso({ pct, etiqueta, relleno = 'bg-emerald-500 dark:bg-teal-500', alto = 'h-2' }: { pct: number; etiqueta: string; relleno?: string; alto?: string }) {
  return (
    <div role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className={`w-full overflow-hidden rounded-full bg-background ${alto}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${relleno}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chips de dictamen por área (misma altura siempre)
// ---------------------------------------------------------------------------

type EstadoArea = 'aprobado' | 'observado' | 'pendiente';

const CHIP_AREA: Record<EstadoArea, { texto: string; cls: string }> = {
  aprobado: { texto: 'Aprobado', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' },
  observado: { texto: 'Con observaciones', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25' },
  pendiente: { texto: 'Pendiente', cls: 'bg-background text-muted border-border' },
};

function estadoArea(aprobado: boolean, informe: InformeEvaluacion | undefined, comments: ObservacionDoc[], area: AreaRevision): EstadoArea {
  if (aprobado) return 'aprobado';
  if (informe?.dictamen === 'OBSERVADO' || comments.some((o) => !o.resolved && o.area === area)) return 'observado';
  return 'pendiente';
}

function ChipArea({ area, estado }: { area: string; estado: EstadoArea }) {
  const c = CHIP_AREA[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium ${c.cls}`}>
      {estado === 'aprobado' ? <IconCheck className="h-3 w-3" /> : estado === 'observado' ? <IconAlert className="h-3 w-3" /> : <IconClock className="h-3 w-3" />}
      {area}: {c.texto}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Gráficos (SVG / CSS sin librerías)
// ---------------------------------------------------------------------------

function Dona({ conteo, total, activo, onActivo }: { conteo: Record<Grupo, number>; total: number; activo: Grupo | null; onActivo: (g: Grupo | null) => void }) {
  const r = 46;
  const C = 2 * Math.PI * r;
  const GAP = 2; // separación de 2px entre segmentos
  const visibles = ORDEN.filter((g) => conteo[g] > 0);
  let acumulado = 0;
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={`Distribución de ${total} PAAC: ${ORDEN.map((g) => `${SERIE[g].label} ${conteo[g]}`).join(', ')}`} className="h-36 w-36 shrink-0">
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="14" className="stroke-slate-200 dark:stroke-slate-800" />
      {visibles.map((g) => {
        const largo = (conteo[g] / total) * C;
        const tramo = Math.max(largo - (visibles.length > 1 ? GAP : 0), 0.5);
        const offset = -acumulado;
        acumulado += largo;
        return (
          <circle
            key={g}
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={SERIE[g].color}
            strokeWidth={activo === g ? 16 : 14}
            strokeDasharray={`${tramo} ${C - tramo}`}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            className="transition-[opacity,stroke-width] duration-200"
            opacity={activo !== null && activo !== g ? 0.35 : 1}
            onMouseEnter={() => onActivo(g)}
            onMouseLeave={() => onActivo(null)}
          >
            <title>{`${SERIE[g].label}: ${conteo[g]} (${pctDe(conteo[g], total)}%)`}</title>
          </circle>
        );
      })}
      <text x="60" y="57" textAnchor="middle" className="fill-ink text-[22px] font-bold">
        {total}
      </text>
      <text x="60" y="73" textAnchor="middle" className="fill-muted text-[9px] font-semibold uppercase tracking-wider">
        PAAC
      </text>
    </svg>
  );
}

function BarraApilada({ conteo, total, activo, onActivo }: { conteo: Record<Grupo, number>; total: number; activo: Grupo | null; onActivo: (g: Grupo | null) => void }) {
  return (
    <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full" aria-hidden>
      {ORDEN.filter((g) => conteo[g] > 0).map((g) => (
        <div
          key={g}
          title={`${SERIE[g].label}: ${conteo[g]} (${pctDe(conteo[g], total)}%)`}
          onMouseEnter={() => onActivo(g)}
          onMouseLeave={() => onActivo(null)}
          className="h-full transition-opacity duration-200 first:rounded-l-full last:rounded-r-full"
          style={{ width: `${(conteo[g] / total) * 100}%`, backgroundColor: SERIE[g].color, opacity: activo !== null && activo !== g ? 0.35 : 1 }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/** Panel de inicio del docente: su PAAD anual, sus PAAC del ciclo y las observaciones a subsanar. */
export function DocenteDashboardView({
  uid,
  activeUserName,
  ciclo,
  paacs,
  paad,
  usuarios,
  equiposCatedra,
  asigContext,
  onOpenDoc,
  onOpenReport,
  onVerPlanificaciones,
}: Props) {
  const idBase = useId();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [activo, setActivo] = useState<Grupo | null>(null);

  const misEquipos = equiposCatedra.filter((e) => e.docenteId === uid && e.cicloLectivo === ciclo);

  // PAAC de las cátedras del docente en el ciclo, con su avance y su designación.
  const filas = paacs
    .filter((d) => d.cycle === ciclo)
    .map((d) => {
      const eq = misEquipos.find((e) => e.asignaturaId === d.asignaturaId);
      if (!eq) return null;
      const ctx = asigContext(d.asignaturaId);
      const contenido = d.paac ?? paacDesdeDatosAnteriores(d.data);
      const aspectos = armarAspectosPaac({ asignaturaId: d.asignaturaId, contenido, ciclo: d.cycle, usuarios, equipos: equiposCatedra, asigContext });
      return {
        d,
        eq,
        ctx,
        grupo: GRUPO_DE[d.state],
        pct: progresoPaac(contenido, aspectos, ctx.plan?.enfoque === 'COMPETENCIAS'),
        pendientes: d.comments.filter((o) => !o.resolved).length,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => Number(b.eq.esResponsable) - Number(a.eq.esResponsable));

  const total = filas.length;
  const conteo = ORDEN.reduce((acc, g) => ({ ...acc, [g]: filas.filter((f) => f.grupo === g).length }), {} as Record<Grupo, number>);
  const responsables = filas.filter((f) => f.eq.esResponsable).length;

  // Observaciones sin subsanar en el PAAD y en los PAAC del docente.
  const obsPaad = (paad?.comments ?? []).filter((o) => !o.resolved);
  const alertas = [
    ...(paad ? obsPaad.map((o) => ({ o, docId: paad.id, doc: 'Mi PAAD Anual' })) : []),
    ...filas.flatMap((f) => f.d.comments.filter((o) => !o.resolved).map((o) => ({ o, docId: f.d.id, doc: `PAAC · ${f.ctx.asig?.nombre ?? f.d.asignaturaId}` }))),
  ];
  const primerObservado = alertas[0]?.docId;

  // Salud de subsanaciones en las cátedras.
  const obsTotales = filas.reduce((s, f) => s + f.d.comments.length, 0);
  const obsResueltas = filas.reduce((s, f) => s + f.d.comments.filter((o) => o.resolved).length, 0);

  const progPaad = paad?.paad ? progresoPaad(paad.paad) : { completados: 0, total: 8, pct: 0 };
  // Un docente puede ser responsable en una cátedra e integrante en otra: se informa por cátedra.
  const respCount = misEquipos.filter((e) => e.esResponsable).length;
  const intCount = misEquipos.length - respCount;

  const kpis: { key: Filtro; titulo: string; valor: number; detalle: string; color?: string; Icon: typeof IconDocs }[] = [
    { key: 'todos', titulo: 'Cátedras afectadas', valor: total, detalle: `${responsables} como responsable · ${total - responsables} como integrante`, Icon: IconDocs },
    { key: 'aprobados', titulo: 'Aprobados / Finalizados', valor: conteo.aprobados, detalle: `${pctDe(conteo.aprobados, total)}% del total`, color: SERIE.aprobados.color, Icon: IconCheck },
    { key: 'revision', titulo: 'En revisión / Aprob. parcial', valor: conteo.revision, detalle: `${pctDe(conteo.revision, total)}% del total`, color: SERIE.revision.color, Icon: IconClock },
    {
      key: 'pendientes',
      titulo: 'Pendientes / Con observaciones',
      valor: conteo.observados + conteo.borrador,
      detalle: `${pctDe(conteo.observados + conteo.borrador, total)}% del total`,
      color: SERIE.observados.color,
      Icon: IconAlert,
    },
  ];

  const filasVisibles = filas.filter((f) => enFiltro(f.grupo, filtro));

  const accionPaad = !paad
    ? null
    : paad.state === 'BORRADOR'
      ? { label: 'Completar y presentar PAAD', cls: 'bg-primary text-white group-hover:bg-primary-hover' }
      : paad.state === 'OBSERVADO'
        ? { label: `Subsanar observaciones del PAAD (${obsPaad.length})`, cls: 'border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 group-hover:bg-amber-600 group-hover:text-white' }
        : { label: 'Consultar mi PAAD Anual', cls: 'border border-border bg-background text-ink group-hover:text-primary' };

  return (
    <div className="space-y-6">
      {/* A. Bienvenida */}
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Hola, {activeUserName}</h1>
          <p className="mt-1 text-xs text-muted">
            Ciclo Lectivo {ciclo} · {misEquipos.length} {misEquipos.length === 1 ? 'cátedra asignada' : 'cátedras asignadas'} ({respCount} como responsable ·{' '}
            {intCount} como integrante)
          </p>
        </div>
        {alertas.length > 0 && primerObservado && (
          <button
            type="button"
            onClick={() => onOpenDoc(primerObservado)}
            className="inline-flex items-center gap-2 self-start rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-500/20 dark:text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 sm:self-auto"
          >
            <IconAlert className="h-4 w-4" />
            Tienes {alertas.length} observación(es) pendiente(s) de subsanar
            <IconArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </header>

      {/* Grilla superior: Mi PAAD Anual + Estado de mis PAAC (misma altura, pies alineados) */}
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
        <section
          aria-labelledby={`${idBase}-paad`}
          className={`${paad ? tarjetaCls : 'relative flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-sm'} justify-between !p-6 lg:col-span-4`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Anexo III · Ord. 171/19</p>
                <h2 id={`${idBase}-paad`} className="text-base font-bold text-ink transition-colors group-hover:text-primary">
                  Mi PAAD Anual {ciclo}
                </h2>
              </div>
              {paad && <StatusBadge state={paad.state} />}
            </div>
            {paad ? (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted">Puntos 1 al 8 completados</span>
                    <span className="tabular-nums">
                      <strong className="font-bold text-ink">{progPaad.pct}%</strong>
                      <span className="ml-1 text-muted">
                        ({progPaad.completados}/{progPaad.total})
                      </span>
                    </span>
                  </div>
                  <BarraProgreso pct={progPaad.pct} etiqueta="Avance del PAAD" relleno="bg-primary" alto="h-1.5" />
                </div>
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border text-xs">
                  <div className="bg-surface px-3 py-2">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">Cátedras vinculadas</dt>
                    <dd className="mt-0.5 font-bold tabular-nums text-ink">{misEquipos.length}</dd>
                  </div>
                  <div className="bg-surface px-3 py-2">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">Obs. pendientes</dt>
                    <dd className={`mt-0.5 font-bold tabular-nums ${obsPaad.length ? 'text-amber-600 dark:text-amber-400' : 'text-ink'}`}>{obsPaad.length}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="text-xs text-muted">Todavía no tenés un PAAD para este ciclo.</p>
            )}
          </div>
          {paad && accionPaad && (
            // Botón estirado: toda la tarjeta abre el PAAD; el pie queda alineado al fondo.
            <button
              type="button"
              onClick={() => onOpenDoc(paad.id)}
              className={`${estiradoCls} flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-sm transition ${accionPaad.cls}`}
            >
              {accionPaad.label}
              <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </section>

        <section aria-labelledby={`${idBase}-dist`} className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-surface p-6 shadow-sm lg:col-span-8">
          <h2 id={`${idBase}-dist`} className="text-base font-bold text-ink">
            Estado de mis PAAC
          </h2>
          {total === 0 ? (
            <p className="text-xs text-muted">No integrás equipos de cátedra con PAAC en el ciclo {ciclo}.</p>
          ) : (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Dona conteo={conteo} total={total} activo={activo} onActivo={setActivo} />
              <div className="min-w-0 flex-1 space-y-4">
                <BarraApilada conteo={conteo} total={total} activo={activo} onActivo={setActivo} />
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ORDEN.map((g) => (
                    <li
                      key={g}
                      onMouseEnter={() => setActivo(g)}
                      onMouseLeave={() => setActivo(null)}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition-colors ${activo === g ? 'bg-background' : ''}`}
                    >
                      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: SERIE[g].color }} />
                      <span className="min-w-0 flex-1 truncate text-ink">{SERIE[g].label}</span>
                      <span className="font-semibold tabular-nums text-ink">{conteo[g]}</span>
                      <span className="w-9 text-right tabular-nums text-muted">{pctDe(conteo[g], total)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {/* Pie alineado con el pie de la tarjeta del PAAD */}
          <div className="space-y-1.5 rounded-xl border border-border bg-background p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">Salud de subsanaciones</span>
              <span className="tabular-nums text-muted">
                <strong className="text-ink">{obsResueltas}</strong> de {obsTotales} observaciones resueltas
              </span>
            </div>
            <BarraProgreso pct={obsTotales ? pctDe(obsResueltas, obsTotales) : 100} etiqueta="Observaciones resueltas en mis cátedras" alto="h-1.5" />
          </div>
        </section>
      </div>

      {/* KPIs: misma altura; activos sin mover el contenido (borde fijo de 1px + ring) */}
      <div role="group" aria-label="Filtrar mis PAAC por estado" className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const sel = filtro === k.key;
          return (
            <button
              key={k.key}
              type="button"
              aria-pressed={sel}
              aria-controls={`${idBase}-lista`}
              onClick={() => setFiltro(sel && k.key !== 'todos' ? 'todos' : k.key)}
              className={`flex h-full cursor-pointer flex-col justify-between gap-3 rounded-2xl border p-5 text-left shadow-sm transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                sel
                  ? 'border-primary bg-soft/20 bg-[color:color-mix(in_srgb,var(--soft)_20%,var(--surface))] ring-1 ring-primary/30 ring-[color:color-mix(in_srgb,var(--primary)_30%,transparent)]'
                  : 'border-border bg-surface hover:border-primary/50 hover:border-[color:color-mix(in_srgb,var(--primary)_50%,transparent)]'
              }`}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-semibold leading-snug text-muted">{k.titulo}</span>
                <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-soft text-primary" style={k.color ? { color: k.color } : undefined}>
                  <k.Icon className="h-4 w-4" />
                </span>
              </span>
              <span>
                <span className="block text-2xl font-bold tabular-nums text-ink">{k.valor}</span>
                <span className="mt-0.5 block text-[11px] text-muted">{k.detalle}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Grilla inferior: Mis PAAC + Observaciones (encabezados de igual altura) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section aria-labelledby={`${idBase}-lista-titulo`} className="space-y-3.5 lg:col-span-8">
          <div className="flex h-7 items-center justify-between gap-2">
            <h2 id={`${idBase}-lista-titulo`} className="text-base font-bold text-ink">
              Mis PAAC del ciclo
              {filtro !== 'todos' && <span className="ml-2 text-xs font-normal text-muted">· filtrado ({filasVisibles.length})</span>}
            </h2>
            <button type="button" onClick={onVerPlanificaciones} className="text-xs font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              Ver todas las planificaciones →
            </button>
          </div>

          <ul id={`${idBase}-lista`} className="space-y-3.5">
            {filasVisibles.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border bg-surface px-4 py-8 text-center text-xs text-muted">No hay PAAC en este estado.</li>
            )}
            {filasVisibles.map(({ d, eq, ctx, grupo, pct, pendientes }) => {
              const conInformes = d.pedApproved || d.discApproved;
              const nombre = ctx.asig?.nombre ?? d.asignaturaId;
              return (
                <li key={d.id} className={tarjetaCls}>
                  {/* Acento lateral según el estado */}
                  <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: SERIE[grupo].color }} />

                  {/* 1. Cabecera */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-2 text-base font-bold text-ink transition-colors group-hover:text-primary">
                        <button type="button" onClick={() => onOpenDoc(d.id)} className={`${estiradoCls} min-w-0 truncate`} title={nombre}>
                          {nombre}
                        </button>
                        <IconArrowRight className="h-4 w-4 shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-primary" />
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded bg-soft px-2 py-0.5 text-[11px] font-bold text-primary">{ctx.carrera?.codigo ?? '—'}</span>
                        <span className="text-muted">{ctx.plan?.ordenanza}</span>
                        <span aria-hidden className="text-muted">·</span>
                        <span className="font-medium text-ink">{ctx.asig ? REGIMEN[ctx.asig.regimenDictado] : '—'}</span>
                        <span aria-hidden className="text-muted">·</span>
                        <span className="text-ink">
                          {eq.cargo} · <span className={eq.esResponsable ? 'font-semibold text-primary' : 'text-muted'}>{eq.esResponsable ? 'Responsable de presentar' : 'Integrante'}</span>
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge state={d.state} />
                      {pendientes > 0 && (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          {pendientes} obs. pendiente(s)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Progreso */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted">Progreso de carga del PAAC</span>
                      <span className="font-bold tabular-nums text-ink">{pct}%</span>
                    </div>
                    <BarraProgreso pct={pct} etiqueta={`Progreso de carga del PAAC de ${nombre}`} relleno="bg-primary" alto="h-1.5" />
                  </div>

                  {/* 3. Pie: dictámenes + acciones */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border border-[color:color-mix(in_srgb,var(--border)_60%,transparent)] pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ChipArea area="UAP" estado={estadoArea(d.pedApproved, d.pedReport, d.comments, 'uap')} />
                      <ChipArea area="Dirección" estado={estadoArea(d.discApproved, d.discReport, d.comments, 'direccion')} />
                    </div>
                    <div className="flex items-center gap-3">
                      {conInformes && (
                        // Por encima del botón estirado: abre los informes sin abrir el PAAC.
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReport(d.id);
                          }}
                          className="relative z-10 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-ink transition hover:bg-soft hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          Ver Informes
                        </button>
                      )}
                      <span aria-hidden className="flex items-center gap-1 text-[11px] font-semibold text-muted transition-colors group-hover:text-primary">
                        Abrir planificación <span>→</span>
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <aside aria-labelledby={`${idBase}-obs`} className="space-y-3.5 lg:col-span-4">
          <div className="flex h-7 items-center justify-between gap-2">
            <h2 id={`${idBase}-obs`} className="text-base font-bold text-ink">
              Observaciones recientes
            </h2>
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted">{alertas.length}</span>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm lg:sticky lg:top-20">
            <p className="mb-3 text-[11px] text-muted">Pendientes de subsanar en tu PAAD y en tus PAAC. Hacé clic para abrir el documento.</p>
            {alertas.length === 0 ? (
              <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                <IconCheck className="h-4 w-4" />
                No tenés observaciones pendientes.
              </p>
            ) : (
              <ul className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                {alertas.map(({ o, docId, doc }) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => onOpenDoc(docId)}
                      className="group/obs w-full cursor-pointer rounded-xl border border-border bg-background p-3 text-left transition hover:border-primary/40 hover:border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)] hover:bg-soft/30 hover:bg-[color:color-mix(in_srgb,var(--soft)_30%,var(--bg))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-semibold text-ink group-hover/obs:text-primary">{doc}</span>
                        <span
                          className={`shrink-0 rounded px-1.5 py-px text-[10px] font-bold ${
                            o.area === 'uap' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' : 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                          }`}
                        >
                          {o.area === 'uap' ? 'UAP' : 'Dirección'}
                        </span>
                      </span>
                      {(o.campoPath || o.field) && <span className="mt-1 block truncate font-mono text-[10px] text-muted">{o.campoPath ?? o.field}</span>}
                      <span className="mt-1 line-clamp-2 block text-xs text-ink">{o.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
