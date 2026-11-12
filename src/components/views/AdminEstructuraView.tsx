import { useMemo, useState } from 'react';
import { TreeItem } from '../admin/TreeItem';
import { EquipoCatedraModal } from '../admin/EquipoCatedraModal';
import { CarreraDetalleModal } from '../admin/CarreraDetalleModal';
import type {
  AsigContext,
  Asignatura,
  Carrera,
  Departamento,
  DocumentoResumen,
  EquipoCatedra,
  IntegranteBorrador,
  PeriodoAcademico,
  PlanEstudio,
  Regimen,
  Sede,
  TipoPeriodo,
  Usuario,
} from '../../types/estructura';

export interface EstructuraData {
  cycle: number;
  sedes: Sede[];
  departamentos: Departamento[];
  carreras: Carrera[];
  planes: PlanEstudio[];
  asignaturas: Asignatura[];
  usuarios: Usuario[];
  equiposCatedra: EquipoCatedra[];
  periodos: PeriodoAcademico[];
  docs: DocumentoResumen[];
}

interface AdminEstructuraProps {
  S: EstructuraData;
  asigContext: (id: string) => AsigContext;
  equipoDeAsig: (id: string) => EquipoCatedra[];
  fullName: (id: string) => string;
  /** Reemplaza el equipo de la asignatura en el ciclo vigente. */
  onSaveEquipo: (asigId: string, integrantes: IntegranteBorrador[]) => void;
  onLotePeriodo: (tipoPeriodo: TipoPeriodo) => void;
}

type FiltroRegimen = 'ALL' | Regimen;

const DEFAULT_EXPANDED: Record<string, boolean> = {
  'sede-cap': true,
  'sede-cham': true,
  'depto-exactas': true,
  'car-isi': true,
  'car-tui': true,
  'plan-isi-448': true,
  'plan-tui-171': true,
};

const BADGE_NEUTRO = 'border-border bg-surface text-muted';
const BADGE_PRIMARIO = 'border-primary bg-soft text-primary';
const BADGE_MATRICIAL = 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';
const BADGE_OK = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
const BADGE_PENDIENTE = 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';

const rowActionCls =
  'px-2.5 py-1 rounded-lg border border-border bg-surface text-primary hover:bg-primary hover:text-white hover:border-primary text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';

export function AdminEstructuraView({
  S,
  asigContext,
  equipoDeAsig,
  fullName,
  onSaveEquipo,
  onLotePeriodo,
}: AdminEstructuraProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCarrera, setFilterCarrera] = useState('ALL');
  const [filterRegimen, setFilterRegimen] = useState<FiltroRegimen>('ALL');
  const [expanded, setExpanded] = useState<Record<string, boolean>>(DEFAULT_EXPANDED);

  const [modalAsigId, setModalAsigId] = useState<string | null>(null);
  const [carreraDetalleId, setCarreraDetalleId] = useState<string | null>(null);
  // Si el equipo se abrió desde el detalle de una carrera, al cerrarlo se vuelve a ese detalle.
  const [origenCarreraId, setOrigenCarreraId] = useState<string | null>(null);

  const docentes = useMemo(
    () => S.usuarios.filter((u) => u.rol === 'Docente' && u.activo),
    [S.usuarios]
  );

  const toggleNode = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    [...S.sedes, ...S.departamentos, ...S.carreras, ...S.planes].forEach((x) => {
      all[x.id] = true;
    });
    setExpanded(all);
  };

  const collapseAll = () => setExpanded({});

  const resetFiltros = () => {
    setSearchQuery('');
    setFilterCarrera('ALL');
    setFilterRegimen('ALL');
  };

  const isSearching = searchQuery.trim().length > 0 || filterCarrera !== 'ALL' || filterRegimen !== 'ALL';
  const isOpen = (id: string) => isSearching || !!expanded[id];

  // Asignaturas que cumplen buscador + filtros de carrera y régimen.
  const matchingAsigIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return new Set(
      S.asignaturas
        .filter((a) => {
          const ctx = asigContext(a.id);
          if (filterCarrera !== 'ALL' && ctx.carrera?.id !== filterCarrera) return false;
          if (filterRegimen !== 'ALL' && a.regimenDictado !== filterRegimen) return false;
          if (!q) return true;
          const docentesTxt = equipoDeAsig(a.id)
            .map((e) => fullName(e.docenteId))
            .join(' ');
          const haystack = [
            a.nombre,
            ctx.carrera?.codigo,
            ctx.carrera?.nombre,
            ctx.plan?.ordenanza,
            ctx.depto?.nombre,
            ctx.sede?.nombre,
            a.regimenDictado,
            docentesTxt,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        })
        .map((a) => a.id)
    );
    // asigContext/equipoDeAsig/fullName se recrean en cada render de App; dependen de estos datos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S.asignaturas, S.equiposCatedra, S.usuarios, searchQuery, filterCarrera, filterRegimen]);

  // Nodos visibles por nivel (si hay búsqueda, solo las ramas con coincidencias).
  const asigsDePlan = (planId: string) =>
    S.asignaturas
      .filter((a) => a.planEstudioId === planId && (!isSearching || matchingAsigIds.has(a.id)))
      .sort((a, b) => a.anoCursada - b.anoCursada);
  const planesDeCarrera = (carId: string) =>
    S.planes.filter((p) => p.carreraId === carId && (!isSearching || asigsDePlan(p.id).length > 0));
  const carrerasVisibles = (list: Carrera[]) =>
    list.filter((c) => !isSearching || planesDeCarrera(c.id).length > 0);

  const deptoNombre = (id: string | null) => (id ? S.departamentos.find((d) => d.id === id)?.nombre : undefined);

  const renderAsignatura = (asig: Asignatura, car: Carrera) => {
    const eq = equipoDeAsig(asig.id);
    const resp = eq.find((x) => x.esResponsable);
    const isMat = !!asig.departamentoRadicacionId && asig.departamentoRadicacionId !== car.departamentoId;
    return (
      <TreeItem
        key={asig.id}
        label={`${asig.anoCursada}.º año · ${asig.nombre}`}
        sublabel={`Régimen: ${asig.regimenDictado} (${asig.horasTotales} hs) · Responsable: ${
          resp ? fullName(resp.docenteId) : 'Sin asignar'
        }`}
        badge={isMat ? 'Matricial' : `${eq.length} docente(s)`}
        badgeCls={isMat ? BADGE_MATRICIAL : eq.length > 0 ? BADGE_OK : BADGE_PENDIENTE}
        active={modalAsigId === asig.id}
        onSelect={() => setModalAsigId(asig.id)}
        actions={
          <button type="button" onClick={() => setModalAsigId(asig.id)} className={rowActionCls}>
            Equipo de cátedra
          </button>
        }
      />
    );
  };

  const renderCarrera = (car: Carrera) => {
    const planes = planesDeCarrera(car.id);
    return (
      <TreeItem
        key={car.id}
        branch
        label={`${car.codigo} — ${car.nombre}`}
        badge={`${planes.length} plan(es)`}
        badgeCls={BADGE_NEUTRO}
        open={isOpen(car.id)}
        onToggle={() => toggleNode(car.id)}
        active={carreraDetalleId === car.id}
        actions={
          <button
            type="button"
            onClick={() => setCarreraDetalleId(car.id)}
            className={rowActionCls}
            aria-label={`Ver detalle de ${car.nombre}`}
          >
            Detalle
          </button>
        }
      >
        {planes.map((plan) => (
          <TreeItem
            key={plan.id}
            branch
            label={plan.ordenanza}
            badge={plan.enfoque === 'COMPETENCIAS' ? 'Competencias' : 'Tradicional'}
            badgeCls={BADGE_NEUTRO}
            open={isOpen(plan.id)}
            onToggle={() => toggleNode(plan.id)}
          >
            {asigsDePlan(plan.id).map((asig) => renderAsignatura(asig, car))}
          </TreeItem>
        ))}
      </TreeItem>
    );
  };

  const renderSede = (sede: Sede) => {
    const carrerasSede = S.carreras.filter((c) => c.sedeId === sede.id);
    if (isSearching && carrerasVisibles(carrerasSede).length === 0) return null;

    // Sede Capital: Sede → Departamento → Carrera. Sedes regionales: Sede → Carrera.
    const contenido = sede.esCapital
      ? S.departamentos
          .filter((d) => d.sedeId === sede.id)
          .map((depto) => {
            const cars = carrerasVisibles(carrerasSede.filter((c) => c.departamentoId === depto.id));
            if (isSearching && cars.length === 0) return null;
            return (
              <TreeItem
                key={depto.id}
                branch
                label={depto.nombre}
                badge={`${cars.length} carrera(s)`}
                badgeCls={BADGE_NEUTRO}
                open={isOpen(depto.id)}
                onToggle={() => toggleNode(depto.id)}
              >
                {cars.map(renderCarrera)}
              </TreeItem>
            );
          })
      : carrerasVisibles(carrerasSede).map(renderCarrera);

    return (
      <TreeItem
        key={sede.id}
        branch
        label={sede.nombre}
        badge={sede.esCapital ? 'Con departamentos' : 'Sede regional (directa)'}
        badgeCls={BADGE_PRIMARIO}
        open={isOpen(sede.id)}
        onToggle={() => toggleNode(sede.id)}
      >
        {contenido}
      </TreeItem>
    );
  };

  // ---- Datos de los modales ----
  const modalCtx = modalAsigId ? asigContext(modalAsigId) : null;
  const carreraDetalle = carreraDetalleId ? S.carreras.find((c) => c.id === carreraDetalleId) : undefined;

  const cerrarEquipo = () => {
    setModalAsigId(null);
    if (origenCarreraId) {
      setCarreraDetalleId(origenCarreraId);
      setOrigenCarreraId(null);
    }
  };

  const selectCls =
    'rounded-xl bg-surface border border-border px-3 py-2 text-xs text-ink outline-none focus:border-primary';

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Estructura Académica y Equipos de Cátedra</h1>
          <p className="text-xs text-muted mt-0.5">
            Navegá el árbol institucional (Sede → Departamento → Carrera → Plan → Asignatura). Usá “Detalle” en una
            carrera o “Equipo de cátedra” en una asignatura para gestionarla.
          </p>
        </div>
      </div>

      {/* Períodos académicos (1C y 2C) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {S.periodos.map((per) => {
          const count = S.docs.filter((d) => d.type === 'PAAC' && d.periodo === per.tipoPeriodo).length;
          return (
            <div
              key={per.id}
              className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between gap-4 shadow-sm"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-soft text-primary font-bold text-xs border border-primary">
                    Período {per.tipoPeriodo} · {per.cicloLectivo}
                  </span>
                  <span className="text-xs text-muted">{per.alcance}</span>
                </div>
                <div className="text-xs text-ink mt-1.5">
                  Vencimiento: <strong>{per.fechaLimite}</strong> · Planificaciones instanciadas: <strong>{count}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onLotePeriodo(per.tipoPeriodo)}
                className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shrink-0 transition shadow-sm"
              >
                Disparar Lote {per.tipoPeriodo}
              </button>
            </div>
          );
        })}
      </div>

      {/* Explorador de estructura */}
      <section className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-background flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <label htmlFor="estructura-search" className="sr-only">
              Buscar asignatura
            </label>
            <input
              id="estructura-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por asignatura, carrera, plan, departamento o docente…"
              className="w-full rounded-xl bg-surface border border-border px-3.5 pr-9 py-2 text-xs text-ink outline-none focus:border-primary shadow-sm transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="filtro-carrera" className="sr-only">
              Filtrar por carrera
            </label>
            <select
              id="filtro-carrera"
              value={filterCarrera}
              onChange={(e) => setFilterCarrera(e.target.value)}
              className={selectCls}
            >
              <option value="ALL">Todas las carreras</option>
              {S.carreras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} — {c.nombre}
                </option>
              ))}
            </select>

            <label htmlFor="filtro-regimen" className="sr-only">
              Filtrar por régimen
            </label>
            <select
              id="filtro-regimen"
              value={filterRegimen}
              onChange={(e) => setFilterRegimen(e.target.value as FiltroRegimen)}
              className={selectCls}
            >
              <option value="ALL">Todos los regímenes</option>
              <option value="ANUAL">Anual</option>
              <option value="1C">1.º Cuatrimestre (1C)</option>
              <option value="2C">2.º Cuatrimestre (2C)</option>
            </select>

            <div className="flex items-center gap-1.5 pl-2 border-l border-border text-xs">
              <button
                type="button"
                onClick={expandAll}
                disabled={isSearching}
                className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-soft border border-border text-primary font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Expandir
              </button>
              <button
                type="button"
                onClick={collapseAll}
                disabled={isSearching}
                className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-background border border-border text-muted hover:text-ink transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Contraer
              </button>
            </div>
          </div>
        </div>

        {isSearching && (
          <div
            aria-live="polite"
            className="px-5 py-2 bg-soft border-b border-border flex items-center justify-between text-xs"
          >
            <span className="text-primary font-semibold">
              Mostrando {matchingAsigIds.size} de {S.asignaturas.length} asignatura(s)
            </span>
            <button type="button" onClick={resetFiltros} className="text-[11px] text-primary hover:underline font-semibold">
              Restablecer filtros
            </button>
          </div>
        )}

        <div className="p-5 space-y-2">
          {matchingAsigIds.size === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-ink">No encontramos asignaturas con esos criterios</p>
              <p className="mt-1 text-xs text-muted">Probá con otro término o quitá algún filtro.</p>
              <button
                type="button"
                onClick={resetFiltros}
                className="mt-4 rounded-lg px-3 py-2 text-xs font-medium text-primary hover:bg-soft transition"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            S.sedes.map(renderSede)
          )}
        </div>
      </section>

      {/* Modal: detalle de carrera */}
      {carreraDetalle && (
        <CarreraDetalleModal
          carrera={carreraDetalle}
          sede={S.sedes.find((s) => s.id === carreraDetalle.sedeId)}
          departamento={S.departamentos.find((d) => d.id === carreraDetalle.departamentoId) ?? null}
          directorNombre={fullName(carreraDetalle.directorId)}
          planes={S.planes.filter((p) => p.carreraId === carreraDetalle.id)}
          asignaturas={S.asignaturas.filter((a) =>
            S.planes.some((p) => p.carreraId === carreraDetalle.id && p.id === a.planEstudioId)
          )}
          equipoDeAsig={equipoDeAsig}
          departamentoNombre={deptoNombre}
          cycle={S.cycle}
          onGestionarEquipo={(asigId) => {
            setOrigenCarreraId(carreraDetalle.id);
            setCarreraDetalleId(null);
            setModalAsigId(asigId);
          }}
          onClose={() => setCarreraDetalleId(null)}
        />
      )}

      {/* Modal: equipo de cátedra (key reinicia el borrador al cambiar de asignatura) */}
      {modalAsigId && modalCtx?.asig && (
        <EquipoCatedraModal
          key={modalAsigId}
          ctx={modalCtx}
          cycle={S.cycle}
          equipo={equipoDeAsig(modalAsigId)}
          docentes={docentes}
          onSave={onSaveEquipo}
          onClose={cerrarEquipo}
        />
      )}
    </div>
  );
}
