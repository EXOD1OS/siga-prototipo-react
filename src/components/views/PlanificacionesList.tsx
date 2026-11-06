import { useMemo, useState } from 'react';
import { StatusBadge } from '../shared/StatusBadge';
import { InformesModal, type AccionesInforme } from '../planificaciones/InformesModal';
import { ROLES_DEPARTAMENTALES, esSesionDocente, puedeVerPlanificacion } from '../../lib/visibilidad';
import type { AsigContext, Carrera, EquipoCatedra } from '../../types/estructura';
import {
  DICTAMEN_BADGE,
  DICTAMEN_LABELS,
  ESTADO_LABELS,
  ESTADOS_ACTIVOS,
  ESTADOS_HISTORICOS,
  dictamenDe,
  esHistorica,
  type Dictamen,
  type EstadoPlanif,
  type PaacDoc,
} from '../../types/planificacion';

interface PlanificacionesListProps {
  paacs: PaacDoc[];
  /** Perfil de la sesión (selector "Vista de Rol"). */
  role: string;
  uid: string;
  careerId: string;
  cycle: number;
  carreras: Carrera[];
  equiposCatedra: EquipoCatedra[];
  asigContext: (id: string) => AsigContext;
  fullName: (id: string) => string;
  onOpenDoc: (id: string) => void;
  onOpenReport: (id: string) => void;
  onElevarPaac: (id: string) => void;
  onOpenFormalizarModal: (id: string) => void;
  onViewFinal: (id: string) => void;
}

type Vista = 'activas' | 'historicas';
const TODOS = 'ALL';
const POR_PAGINA = 10;
const ESTADOS_EN_REVISION: EstadoPlanif[] = ['ENVIADO_A_REVISION', 'APROBADO_PEDAGOGICO', 'APROBADO_DISCIPLINAR'];

const controlCls =
  'w-full rounded-lg bg-surface border border-border px-3 py-2 text-xs text-ink outline-none transition focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed';
const labelCls = 'mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted';
const thCls = 'px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide';

function DictamenChip({ area, value }: { area: string; value: Dictamen }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${DICTAMEN_BADGE[value]}`}>
      <span className="opacity-70">{area}:</span> {DICTAMEN_LABELS[value]}
    </span>
  );
}

const DESCRIPCION_ALCANCE: Record<string, string> = {
  DIRECCION_CARRERA: 'Planificaciones de tu carrera, en proceso e históricas.',
  UAP: 'Todas las carreras y departamentos (unidad transversal).',
  CONSEJO_DEPARTAMENTAL: 'Todas las planificaciones del departamento.',
  ADMINISTRADOR: 'Todas las planificaciones del departamento.',
};

export function PlanificacionesList({
  paacs,
  role,
  uid,
  careerId,
  cycle,
  carreras,
  equiposCatedra,
  asigContext,
  fullName,
  onOpenDoc,
  onOpenReport,
  onElevarPaac,
  onOpenFormalizarModal,
  onViewFinal,
}: PlanificacionesListProps) {
  const esDireccion = role === 'DIRECCION_CARRERA';
  const [vista, setVista] = useState<Vista>('activas');
  const [query, setQuery] = useState('');
  const [filtroCarrera, setFiltroCarrera] = useState(TODOS);
  const [filtroCiclo, setFiltroCiclo] = useState<number | typeof TODOS>(TODOS);
  const [filtroEstado, setFiltroEstado] = useState<EstadoPlanif | typeof TODOS>(TODOS);
  const [pagina, setPagina] = useState(1);
  const [informesId, setInformesId] = useState<string | null>(null);

  // 1. Visibilidad por rol de la sesión.
  const visibles = useMemo(
    () =>
      paacs.filter((d) =>
        puedeVerPlanificacion(
          d,
          { role, uid, careerId },
          { carreraId: asigContext(d.asignaturaId).carrera?.id, equipos: equiposCatedra, cicloVigente: cycle }
        )
      ),
    // asigContext se recrea en cada render de App; depende de los datos ya listados.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paacs, role, uid, careerId, equiposCatedra, cycle]
  );

  const enVista = visibles.filter((d) => (vista === 'historicas' ? esHistorica(d) : !esHistorica(d)));
  const totalActivas = visibles.filter((d) => !esHistorica(d)).length;

  // Opciones de filtros.
  const carreraFija = esDireccion ? careerId : null;
  const carrerasOpciones = ROLES_DEPARTAMENTALES.includes(role)
    ? carreras
    : carreras.filter((c) => visibles.some((d) => asigContext(d.asignaturaId).carrera?.id === c.id));
  const ciclos = [...new Set([cycle, ...visibles.map((d) => d.cycle)])].sort((a, b) => b - a);
  const estadosOpciones = vista === 'historicas' ? ESTADOS_HISTORICOS : ESTADOS_ACTIVOS;
  const carreraActiva = carreraFija ?? filtroCarrera;

  // 2. Filtros de la barra.
  const q = query.trim().toLocaleLowerCase('es');
  const filtradas = enVista
    .filter((d) => {
      const ctx = asigContext(d.asignaturaId);
      if (carreraActiva !== TODOS && ctx.carrera?.id !== carreraActiva) return false;
      if (filtroCiclo !== TODOS && d.cycle !== filtroCiclo) return false;
      if (filtroEstado !== TODOS && d.state !== filtroEstado) return false;
      if (!q) return true;
      return `${ctx.asig?.nombre ?? ''} ${ctx.asig?.codigo ?? ''} ${fullName(d.owner)}`.toLocaleLowerCase('es').includes(q);
    })
    .sort((a, b) => b.cycle - a.cycle || (asigContext(a.asignaturaId).asig?.nombre ?? '').localeCompare(asigContext(b.asignaturaId).asig?.nombre ?? '', 'es'));

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filas = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);
  const hayFiltros = q !== '' || (!carreraFija && filtroCarrera !== TODOS) || filtroCiclo !== TODOS || filtroEstado !== TODOS;

  const conReset =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPagina(1);
    };

  const limpiarFiltros = () => {
    setQuery('');
    setFiltroCarrera(TODOS);
    setFiltroCiclo(TODOS);
    setFiltroEstado(TODOS);
    setPagina(1);
  };

  const cambiarVista = (v: Vista) => {
    setVista(v);
    setFiltroEstado(TODOS);
    setPagina(1);
  };

  const alcance = esSesionDocente(role)
    ? 'Planificaciones donde sos responsable o integrás el equipo de cátedra (ciclo actual e históricos).'
    : (DESCRIPCION_ALCANCE[role] ?? '');

  // ---- Modal de informes ----
  const docInformes = informesId ? visibles.find((d) => d.id === informesId) : undefined;
  const accionesPara = (d: PaacDoc): AccionesInforme => {
    const ctx = asigContext(d.asignaturaId);
    const enRevision = ESTADOS_EN_REVISION.includes(d.state);
    const puedeEvaluar =
      enRevision && ((role === 'UAP' && !d.pedApproved) || (esDireccion && ctx.carrera?.id === careerId && !d.discApproved));
    const cerrarY = (fn: (id: string) => void) => () => {
      setInformesId(null);
      fn(d.id);
    };
    return {
      onAbrirPaac: cerrarY(onOpenDoc),
      onEvaluar: puedeEvaluar ? cerrarY(onOpenReport) : null,
      onElevar: esDireccion && d.state === 'APROBADO_PLENO' ? cerrarY(onElevarPaac) : null,
      onFormalizar:
        role === 'CONSEJO_DEPARTAMENTAL' && ['APROBADO_PLENO', 'ELEVADO_AL_CONSEJO'].includes(d.state)
          ? cerrarY(onOpenFormalizarModal)
          : null,
    };
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Planificaciones (PAAC)</h1>
        <p className="text-xs text-muted mt-0.5">{alcance}</p>
      </div>

      <section aria-labelledby="bandeja-heading" className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Cabecera + selector de vista */}
        <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
          <div className="flex items-center gap-2">
            <h2 id="bandeja-heading" className="text-sm font-bold text-ink">
              Bandeja de planificaciones
            </h2>
            <span aria-live="polite" className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-muted">
              {filtradas.length} {filtradas.length === 1 ? 'planificación' : 'planificaciones'}
            </span>
          </div>
          <div role="tablist" aria-label="Vista de planificaciones" className="inline-flex rounded-lg border border-border bg-background p-0.5 text-xs">
            {(
              [
                ['activas', 'En proceso', totalActivas],
                ['historicas', 'Históricas / Aprobadas', visibles.length - totalActivas],
              ] as const
            ).map(([key, label, n]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={vista === key}
                onClick={() => cambiarVista(key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition ${
                  vista === key ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {label}
                <span className="tabular-nums text-[10px] opacity-70">{n}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Barra de filtros */}
        <div role="search" aria-label="Filtros de planificaciones" className="grid grid-cols-1 gap-3 border-b border-border px-4 py-3 sm:grid-cols-2 sm:px-5 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end">
          <div>
            <label htmlFor="pl-buscar" className={labelCls}>
              Buscar
            </label>
            <input
              id="pl-buscar"
              type="search"
              value={query}
              onChange={(e) => conReset(setQuery)(e.target.value)}
              placeholder="Asignatura, código o responsable…"
              className={controlCls}
            />
          </div>
          <div>
            <label htmlFor="pl-carrera" className={labelCls}>
              Carrera {carreraFija && <span className="normal-case font-normal">(tu dirección)</span>}
            </label>
            <select
              id="pl-carrera"
              value={carreraActiva}
              onChange={(e) => conReset(setFiltroCarrera)(e.target.value)}
              disabled={!!carreraFija}
              className={controlCls}
            >
              {!carreraFija && <option value={TODOS}>Todas</option>}
              {(carreraFija ? carreras.filter((c) => c.id === carreraFija) : carrerasOpciones).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} — {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pl-ciclo" className={labelCls}>
              Ciclo lectivo
            </label>
            <select
              id="pl-ciclo"
              value={filtroCiclo}
              onChange={(e) => conReset(setFiltroCiclo)(e.target.value === TODOS ? TODOS : Number(e.target.value))}
              className={controlCls}
            >
              <option value={TODOS}>Todos</option>
              {ciclos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pl-estado" className={labelCls}>
              Estado en el circuito
            </label>
            <select
              id="pl-estado"
              value={filtroEstado}
              onChange={(e) => conReset(setFiltroEstado)(e.target.value as EstadoPlanif | typeof TODOS)}
              className={controlCls}
            >
              <option value={TODOS}>Todos</option>
              {estadosOpciones.map((s) => (
                <option key={s} value={s}>
                  {ESTADO_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={limpiarFiltros}
            disabled={!hayFiltros}
            className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:text-ink hover:bg-background transition disabled:opacity-40 disabled:pointer-events-none"
          >
            ↺ Limpiar
          </button>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-xs">
            <thead>
              <tr className="bg-background text-muted border-b border-border">
                <th scope="col" className={`${thCls} pl-4 sm:pl-5`}>Asignatura</th>
                <th scope="col" className={thCls}>Carrera</th>
                <th scope="col" className={thCls}>Ciclo</th>
                <th scope="col" className={thCls}>Responsable</th>
                <th scope="col" className={thCls}>Estado en el circuito</th>
                <th scope="col" className={thCls}>Dictámenes</th>
                <th scope="col" className={thCls}>Expediente</th>
                <th scope="col" className={`${thCls} pr-4 text-right sm:pr-5`}>Informes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filas.map((d) => {
                const ctx = asigContext(d.asignaturaId);
                const obs = d.comments.filter((c) => !c.resolved).length;
                return (
                  <tr key={d.id} className="transition-colors hover:bg-background">
                    <td className="px-3 py-3 pl-4 sm:pl-5 max-w-[260px]">
                      <button
                        type="button"
                        onClick={() => onOpenDoc(d.id)}
                        className="block max-w-full text-left font-semibold text-ink hover:text-primary truncate rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        title={`Abrir PAAC de ${ctx.asig?.nombre}`}
                      >
                        {ctx.asig?.nombre ?? d.asignaturaId}
                      </button>
                      <span className="block text-[11px] font-mono text-muted">{ctx.asig?.codigo}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-semibold text-ink">{ctx.carrera?.codigo}</span>
                      <span className="block text-[11px] text-muted truncate max-w-[160px]" title={ctx.carrera?.nombre}>
                        {ctx.carrera?.nombre}
                      </span>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-ink">{d.cycle}</td>
                    <td className="px-3 py-3 text-ink">{fullName(d.owner)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge state={d.state} />
                        {obs > 0 && <span className="text-[10px] font-semibold text-danger">{obs} obs. activa(s)</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <DictamenChip area="Disc." value={dictamenDe(d.discApproved, d.discReport)} />
                        <DictamenChip area="Ped." value={dictamenDe(d.pedApproved, d.pedReport)} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {d.expediente ? (
                        <div>
                          <span className="font-mono font-semibold text-primary">{d.expediente}</span>
                          <span className="block text-[10px] text-muted">{d.resolucion || 'Resolución en trámite'}</span>
                          {d.state === 'FINALIZADO' && (
                            <button type="button" onClick={() => onViewFinal(d.id)} className="text-[10px] font-semibold text-primary hover:underline">
                              Ver documento final
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 pr-4 text-right sm:pr-5">
                      <button
                        type="button"
                        onClick={() => setInformesId(d.id)}
                        aria-label={`Ver informes de ${ctx.asig?.nombre}`}
                        className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-primary hover:bg-primary hover:text-white hover:border-primary text-[11px] font-semibold transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        Informes
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <p className="text-sm font-medium text-ink">No hay planificaciones para mostrar</p>
                    <p className="mt-1 text-xs text-muted">
                      {hayFiltros
                        ? 'Probá cambiar o quitar alguno de los filtros.'
                        : vista === 'activas'
                          ? 'No hay planificaciones en proceso. Revisá la pestaña de históricas.'
                          : 'Todavía no hay planificaciones aprobadas o finalizadas.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtradas.length > 0 && (
          <nav aria-label="Paginación de planificaciones" className="flex flex-col gap-2 border-t border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-[11px] text-muted tabular-nums">
              Mostrando {(paginaActual - 1) * POR_PAGINA + 1}–{Math.min(paginaActual * POR_PAGINA, filtradas.length)} de {filtradas.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={paginaActual <= 1}
                onClick={() => setPagina(paginaActual - 1)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[11px] font-medium text-ink hover:bg-soft disabled:opacity-40 disabled:pointer-events-none"
              >
                Anterior
              </button>
              <span className="min-w-[96px] text-center text-[11px] text-muted tabular-nums">
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[11px] font-medium text-ink hover:bg-soft disabled:opacity-40 disabled:pointer-events-none"
              >
                Siguiente
              </button>
            </div>
          </nav>
        )}
      </section>

      {docInformes && (
        <InformesModal
          key={docInformes.id}
          doc={docInformes}
          ctx={asigContext(docInformes.asignaturaId)}
          responsable={fullName(docInformes.owner)}
          equipo={equiposCatedra
            .filter((e) => e.asignaturaId === docInformes.asignaturaId && e.cicloLectivo === docInformes.cycle)
            .map((e) => ({ nombre: fullName(e.docenteId), cargo: e.cargo, esResponsable: e.esResponsable }))}
          acciones={accionesPara(docInformes)}
          onClose={() => setInformesId(null)}
        />
      )}
    </div>
  );
}
