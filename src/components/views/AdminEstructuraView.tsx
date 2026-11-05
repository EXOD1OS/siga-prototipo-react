import { useState, useMemo } from 'react';
import { StatusBadge } from '../shared/StatusBadge';

interface TreeItemProps {
  nodeId: string;
  label: string;
  sublabel?: string;
  badgeText?: string | null;
  badgeCls?: string;
  isLeaf?: boolean;
  isOpen?: boolean;
  onToggle?: (id: string) => void;
  onAction?: () => void;
  actionLabel?: string;
  children?: React.ReactNode;
}

function TreeItem({
  nodeId,
  label,
  sublabel,
  badgeText,
  badgeCls,
  isLeaf = false,
  isOpen = false,
  onToggle,
  onAction,
  actionLabel,
  children,
}: TreeItemProps) {
  return (
    <div className="select-none">
      <div
        onClick={() => (isLeaf ? onAction?.() : onToggle?.(nodeId))}
        className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all border ${
          isLeaf
            ? 'bg-surface hover:bg-soft/60 border-border hover:border-primary/40 shadow-sm'
            : 'bg-background/70 hover:bg-background border-border/60 hover:border-border'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {!isLeaf ? (
            <span
              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-muted bg-surface border border-border transition-transform ${
                isOpen ? 'rotate-90 text-primary border-primary/30' : ''
              }`}
            >
              ▶
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-primary/70 ml-1.5 mr-1 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className={`text-xs truncate ${isLeaf ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>
              {label}
            </div>
            {sublabel && <div className="text-[11px] text-muted truncate mt-0.5">{sublabel}</div>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {badgeText && (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badgeCls}`}>
              {badgeText}
            </span>
          )}
          {isLeaf && actionLabel && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction?.();
              }}
              className="px-3 py-1.5 rounded-lg bg-soft group-hover:bg-primary text-primary group-hover:text-white border border-primary/30 text-[11px] font-semibold transition"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      {!isLeaf && isOpen && (
        <div className="pl-4 sm:pl-6 ml-3 border-l-2 border-border/80 space-y-1.5 mt-1.5">{children}</div>
      )}
    </div>
  );
}

interface AdminEstructuraProps {
  S: any;
  asigContext: (id: string) => any;
  equipoDeAsig: (id: string) => any[];
  fullName: (id: string) => string;
  onAddMember: (asigId: string, docId: string, cargo: string, esResp: boolean) => void;
  onMakeResponsable: (asigId: string, eqId: string) => void;
  onRemoveMember: (eqId: string) => void;
  onLotePeriodo: (tipoPeriodo: string) => void;
  onCreateAsig?: (newAsig: any) => void;
  onUpdateAsig?: (asigId: string, updated: any) => void;
}

export function AdminEstructuraView({
  S,
  asigContext,
  equipoDeAsig,
  fullName,
  onAddMember,
  onMakeResponsable,
  onRemoveMember,
  onLotePeriodo,
}: AdminEstructuraProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCarrera, setFilterCarrera] = useState('ALL');
  const [filterRegimen, setFilterRegimen] = useState('ALL');

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'sede-cap': true,
    'sede-cham': true,
    'depto-exactas': true,
    'car-isi': true,
    'car-tui': true,
    'plan-isi-448': true,
    'plan-tui-171': true,
  });

  // Estado del Modal de Equipo de Cátedra
  const [modalAsigId, setModalAsigId] = useState<string | null>(null);
  const docentes = S.usuarios.filter((u: any) => u.rol.startsWith('DOCENTE') && u.activo);
  const [selDocente, setSelDocente] = useState(docentes[0]?.id || '');
  const [selCargo, setSelCargo] = useState('Profesor Titular');
  const [esResp, setEsResp] = useState(false);

  const toggleNode = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    [...S.sedes, ...S.departamentos, ...S.carreras, ...S.planes].forEach((x: any) => {
      all[x.id] = true;
    });
    setExpanded(all);
  };

  const collapseAll = () => setExpanded({});

  const isSearching =
    searchQuery.trim().length > 0 || filterCarrera !== 'ALL' || filterRegimen !== 'ALL';

  // Filtrado reactivo de asignaturas por buscador de materias, carrera o régimen
  const matchingAsigIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return new Set(
      S.asignaturas
        .filter((a: any) => {
          const ctx = asigContext(a.id);
          if (filterCarrera !== 'ALL' && ctx.carrera?.id !== filterCarrera) return false;
          if (filterRegimen !== 'ALL' && a.regimenDictado !== filterRegimen) return false;
          if (!q) return true;
          const eq = equipoDeAsig(a.id);
          const teachersText = eq.map((e: any) => fullName(e.docenteId)).join(' ');
          const haystack = `${a.nombre} ${ctx.carrera?.codigo} ${ctx.carrera?.nombre} ${ctx.plan?.ordenanza} ${a.regimenDictado} ${teachersText}`.toLowerCase();
          return haystack.includes(q);
        })
        .map((a: any) => a.id)
    );
  }, [S.asignaturas, S.equiposCatedra, searchQuery, filterCarrera, filterRegimen]);

  const renderCarreraNode = (car: any) => {
    const planes = S.planes.filter((p: any) => p.carreraId === car.id);
    const matchingPlanes = planes.filter((p: any) =>
      S.asignaturas.some((a: any) => a.planEstudioId === p.id && matchingAsigIds.has(a.id))
    );

    if (isSearching && matchingPlanes.length === 0) return null;
    const planesToRender = isSearching ? matchingPlanes : planes;

    return (
      <TreeItem
        key={car.id}
        nodeId={car.id}
        label={`${car.codigo} — ${car.nombre}`}
        badgeText={`${planesToRender.length} plan(es)`}
        badgeCls="bg-surface text-muted border-border"
        isOpen={isSearching ? true : !!expanded[car.id]}
        onToggle={toggleNode}
      >
        {planesToRender.map((plan: any) => {
          const asigs = S.asignaturas.filter(
            (a: any) => a.planEstudioId === plan.id && (!isSearching || matchingAsigIds.has(a.id))
          );
          return (
            <TreeItem
              key={plan.id}
              nodeId={plan.id}
              label={plan.ordenanza}
              badgeText={plan.enfoque}
              badgeCls="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25"
              isOpen={isSearching ? true : !!expanded[plan.id]}
              onToggle={toggleNode}
            >
              {asigs.map((asig: any) => {
                const eq = equipoDeAsig(asig.id);
                const resp = eq.find((x: any) => x.esResponsable);
                const isMat =
                  asig.departamentoRadicacionId && asig.departamentoRadicacionId !== car.departamentoId;
                return (
                  <TreeItem
                    key={asig.id}
                    nodeId={asig.id}
                    label={`${asig.anoCursada}.º Año · ${asig.nombre}`}
                    sublabel={`Régimen: ${asig.regimenDictado} (${asig.horasTotales} hs) · Responsable: ${
                      resp ? fullName(resp.docenteId) : 'Sin asignar'
                    }`}
                    badgeText={isMat ? 'Matricial' : `${eq.length} docente(s)`}
                    badgeCls={
                      isMat
                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                        : eq.length > 0
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                    }
                    isLeaf={true}
                    actionLabel="Equipo de Cátedra"
                    onAction={() => setModalAsigId(asig.id)}
                  />
                );
              })}
            </TreeItem>
          );
        })}
      </TreeItem>
    );
  };

  const activeModalCtx = modalAsigId ? asigContext(modalAsigId) : null;
  const activeModalEquipo = modalAsigId ? equipoDeAsig(modalAsigId) : [];

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Estructura Académica y Equipos de Cátedra
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Busca asignaturas o navega por el árbol institucional (Sede → Departamento → Carrera → Plan → Materia) y selecciona una asignatura para conformar su equipo en el modal.
          </p>
        </div>
      </div>

      {/* Tarjetas de Períodos Académicos (1C y 2C) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {S.periodos.map((per: any) => {
          const count = S.docs.filter(
            (d: any) => d.type === 'PAAC' && d.periodo === per.tipoPeriodo
          ).length;
          return (
            <div
              key={per.id}
              className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between gap-4 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-soft text-primary font-bold text-xs border border-primary/20">
                    Período {per.tipoPeriodo} · {per.cicloLectivo}
                  </span>
                  <span className="text-xs text-muted">{per.alcance}</span>
                </div>
                <div className="text-xs text-ink mt-1.5">
                  Vencimiento: <strong>{per.fechaLimite}</strong> · Planificaciones instanciadas:{' '}
                  <strong>{count}</strong>
                </div>
              </div>
              <button
                onClick={() => onLotePeriodo(per.tipoPeriodo)}
                className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shrink-0 transition shadow-sm"
              >
                Disparar Lote {per.tipoPeriodo}
              </button>
            </div>
          );
        })}
      </div>

      {/* Explorador de Estructura con Buscador por Materias Integrado */}
      <section className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Barra Superior con Buscador por Materias y Filtros */}
        <div className="p-4 border-b border-border bg-background/50 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar materia por nombre, carrera, plan o docente asignado…"
              className="w-full rounded-xl bg-surface border border-border px-3.5 pr-9 py-2 text-xs text-ink outline-none focus:border-primary shadow-sm transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterCarrera}
              onChange={(e) => setFilterCarrera(e.target.value)}
              className="rounded-xl bg-surface border border-border px-3 py-2 text-xs text-ink outline-none focus:border-primary"
            >
              <option value="ALL">Todas las carreras</option>
              {S.carreras.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} — {c.nombre}
                </option>
              ))}
            </select>

            <select
              value={filterRegimen}
              onChange={(e) => setFilterRegimen(e.target.value)}
              className="rounded-xl bg-surface border border-border px-3 py-2 text-xs text-ink outline-none focus:border-primary"
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
                className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-soft border border-border text-primary font-semibold transition"
              >
                Expandir
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-background border border-border text-muted hover:text-ink transition"
              >
                Contraer
              </button>
            </div>
          </div>
        </div>

        {/* Estado de resultados de búsqueda */}
        {isSearching && (
          <div className="px-5 py-2 bg-soft/60 border-b border-border flex items-center justify-between text-xs">
            <span className="text-primary font-semibold">
              Mostrando {matchingAsigIds.size} materia(s) encontrada(s)
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCarrera('ALL');
                setFilterRegimen('ALL');
              }}
              className="text-[11px] text-primary hover:underline font-semibold"
            >
              Restablecer filtros
            </button>
          </div>
        )}

        {/* Árbol Jerárquico de Sedes -> Departamentos -> Carreras -> Planes -> Materias */}
        <div className="p-5 space-y-2">
          {matchingAsigIds.size === 0 ? (
            <div className="p-8 text-center text-muted text-xs">
              No se encontraron materias que coincidan con "{searchQuery}".
            </div>
          ) : (
            S.sedes.map((sede: any) => {
              const carsInSede = S.carreras.filter((c: any) => c.sedeId === sede.id);
              const hasMatchesInSede = carsInSede.some((car: any) =>
                S.planes
                  .filter((p: any) => p.carreraId === car.id)
                  .some((p: any) =>
                    S.asignaturas.some((a: any) => a.planEstudioId === p.id && matchingAsigIds.has(a.id))
                  )
              );
              if (isSearching && !hasMatchesInSede) return null;

              return (
                <TreeItem
                  key={sede.id}
                  nodeId={sede.id}
                  label={sede.nombre}
                  badgeText={sede.esCapital ? 'Con Departamentos' : 'Sede Regional (Directa)'}
                  badgeCls="bg-soft text-primary border-primary/25"
                  isOpen={isSearching ? true : !!expanded[sede.id]}
                  onToggle={toggleNode}
                >
                  {sede.esCapital
                    ? S.departamentos
                        .filter((d: any) => d.sedeId === sede.id)
                        .map((depto: any) => {
                          const cars = S.carreras.filter((c: any) => c.departamentoId === depto.id);
                          const renderedCars = cars.map(renderCarreraNode).filter(Boolean);
                          if (isSearching && renderedCars.length === 0) return null;
                          return (
                            <TreeItem
                              key={depto.id}
                              nodeId={depto.id}
                              label={depto.nombre}
                              badgeText={`${cars.length} carrera(s)`}
                              badgeCls="bg-surface text-muted border-border"
                              isOpen={isSearching ? true : !!expanded[depto.id]}
                              onToggle={toggleNode}
                            >
                              {renderedCars}
                            </TreeItem>
                          );
                        })
                    : carsInSede.map(renderCarreraNode)}
                </TreeItem>
              );
            })
          )}
        </div>
      </section>

      {/* ========================================================================
          MODAL DEL EQUIPO DE CÁTEDRA
         ======================================================================== */}
      {modalAsigId && activeModalCtx?.asig && (
        <div
          onClick={() => setModalAsigId(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Cabecera del Modal */}
            <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4 bg-background/60">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-soft text-primary border border-primary/25">
                    {activeModalCtx.sede?.nombre}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface text-ink border border-border">
                    {activeModalCtx.carrera?.codigo} · {activeModalCtx.plan?.ordenanza} (
                    {activeModalCtx.plan?.enfoque})
                  </span>
                  {activeModalCtx.radicacion &&
                    activeModalCtx.depto &&
                    activeModalCtx.radicacion.id !== activeModalCtx.depto.id && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        Radicación Matricial: {activeModalCtx.radicacion.nombre}
                      </span>
                    )}
                </div>
                <h2 className="text-lg font-bold text-ink">{activeModalCtx.asig.nombre}</h2>
                <p className="text-xs text-muted mt-0.5">
                  {activeModalCtx.asig.anoCursada}.º Año · Régimen:{' '}
                  <strong>{activeModalCtx.asig.regimenDictado}</strong> · Carga:{' '}
                  {activeModalCtx.asig.horasSemanales} hs/sem ({activeModalCtx.asig.horasTotales} hs totales)
                </p>
              </div>
              <button
                onClick={() => setModalAsigId(null)}
                className="w-8 h-8 rounded-lg bg-surface hover:bg-soft border border-border flex items-center justify-center text-muted hover:text-ink font-bold shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Modal: Contenidos Mínimos + Equipo Docente + Incorporar Docente */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Bloque de Contenidos Mínimos */}
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Contenidos Mínimos Reglamentarios
                </div>
                <p className="text-xs text-ink leading-relaxed">
                  {activeModalCtx.asig.contenidosMinimos}
                </p>
              </div>

              {/* Listado de Docentes Asignados al Equipo */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                    Equipo de Cátedra Asignado · Ciclo {S.cycle}
                  </h3>
                  <span className="text-[11px] font-semibold text-muted">
                    {activeModalEquipo.length} integrante(s)
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-background text-muted border-b border-border text-[11px]">
                        <th className="p-3">Docente</th>
                        <th className="p-3">Cargo en Cátedra</th>
                        <th className="p-3">Responsabilidad PAAC</th>
                        <th className="p-3">Estado PAAD</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-surface">
                      {activeModalEquipo.length > 0 ? (
                        activeModalEquipo.map((eq: any) => {
                          const u = docentes.find((d: any) => d.id === eq.docenteId);
                          const paad = S.docs.find(
                            (d: any) => d.type === 'PAAD' && d.owner === eq.docenteId
                          );
                          return (
                            <tr key={eq.id}>
                              <td className="p-3">
                                <div className="font-semibold text-ink">
                                  {u ? `${u.nombre} ${u.apellido}` : eq.docenteId}
                                </div>
                                <div className="text-[11px] text-muted">{u?.email}</div>
                              </td>
                              <td className="p-3 font-medium text-ink">{eq.cargo}</td>
                              <td className="p-3">
                                {eq.esResponsable ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                    DOCENTE RESPONSABLE
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => onMakeResponsable(modalAsigId, eq.id)}
                                    className="text-[11px] text-primary hover:underline font-semibold"
                                  >
                                    Designar Responsable
                                  </button>
                                )}
                              </td>
                              <td className="p-3">
                                {paad ? <StatusBadge state={paad.state} /> : '—'}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => onRemoveMember(eq.id)}
                                  className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-danger text-[11px] font-semibold transition"
                                >
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-muted">
                            No hay docentes asignados a esta cátedra en el ciclo {S.cycle}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Formulario para Agregar Docente al Equipo */}
              <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                <div className="font-bold text-ink">+ Incorporar Docente al Equipo de Cátedra</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-muted mb-1">Seleccionar Docente</label>
                    <select
                      value={selDocente}
                      onChange={(e) => setSelDocente(e.target.value)}
                      className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-xs text-ink outline-none focus:border-primary"
                    >
                      {docentes.map((d: any) => (
                        <option key={d.id} value={d.id}>
                          {d.apellido}, {d.nombre} (DNI {d.dni})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted mb-1">Cargo Docente</label>
                    <select
                      value={selCargo}
                      onChange={(e) => setSelCargo(e.target.value)}
                      className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-xs text-ink outline-none focus:border-primary"
                    >
                      <option value="Profesor Titular">Profesor Titular</option>
                      <option value="Profesor Asociado">Profesor Asociado</option>
                      <option value="Profesor Adjunto">Profesor Adjunto</option>
                      <option value="Jefe de Trabajos Prácticos">Jefe de Trabajos Prácticos</option>
                      <option value="Ayudante de Primera">Ayudante de Primera</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-xs text-ink cursor-pointer pb-2">
                      <input
                        type="checkbox"
                        checked={esResp}
                        onChange={(e) => setEsResp(e.target.checked)}
                        className="w-4 h-4 rounded accent-primary"
                      />
                      <span>Es Responsable de PAAC</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      onAddMember(modalAsigId, selDocente, selCargo, esResp);
                      setEsResp(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition shadow-sm"
                  >
                    Asignar a la Cátedra
                  </button>
                </div>
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="px-6 py-3.5 border-t border-border bg-background/60 flex justify-end">
              <button
                onClick={() => setModalAsigId(null)}
                className="px-4 py-2 rounded-lg bg-surface border border-border text-xs font-semibold text-ink hover:bg-background transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}