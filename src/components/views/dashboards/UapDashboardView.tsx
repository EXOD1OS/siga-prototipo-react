import { StatusBadge } from '../../shared/StatusBadge';
import { IconAlert, IconArrowRight, IconCheck, IconClock, IconDocs, IconUserDoc } from '../../layout/icons';
import { BarraAvance, ChipConteo, KpiCard, Panel, SaludoDashboard, linkCls, pct } from './DashboardKit';
import { ESTADOS_REVISION_PAAC, contar, estadosPaad, paacsDe, type DatosDashboard, type NavDashboard } from './datos';

/**
 * Inicio de la UAP: supervisión pedagógica transversal a todas las carreras del departamento.
 * Cada métrica abre el listado correspondiente ya filtrado.
 */
export function UapDashboardView({ datos, nav }: { datos: DatosDashboard; nav: NavDashboard }) {
  const { nombre, ciclo, carreras, asigContext, fullName } = datos;
  const paacs = datos.paacs.filter((d) => d.cycle === ciclo);
  const paads = datos.paads.filter((d) => d.cycle === ciclo);
  const total = paacs.length;

  // Pendientes de dictamen UAP: en revisión (o con el disciplinar ya emitido) sin el pedagógico.
  const pendientesUap = paacs.filter((d) => ESTADOS_REVISION_PAAC.includes(d.state) && !d.pedApproved);
  const observados = contar(paacs, (d) => d.state === 'OBSERVADO');
  const borrador = contar(paacs, (d) => d.state === 'BORRADOR');
  const emitidos = contar(paacs, (d) => d.pedApproved);
  const ep = estadosPaad(paads);
  const f = { ciclo };

  // Prioridad: re-evaluaciones (vuelven tras correcciones) primero, después por antigüedad del pedido.
  const prioridad = [...pendientesUap].sort(
    (a, b) => Number(b.pedReport?.dictamen === 'REEVALUACION') - Number(a.pedReport?.dictamen === 'REEVALUACION')
  );

  return (
    <div className="space-y-6">
      <SaludoDashboard nombre={nombre} subtitulo={`Unidad de Asesoramiento Pedagógico (UAP) · Supervisión Curricular y Pedagógica Ciclo ${ciclo}`} />

      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          titulo="PAAC en revisión (pendientes de dictamen UAP)"
          valor={pendientesUap.length}
          detalle={`${pct(pendientesUap.length, total)}% de las cátedras`}
          tono="revision"
          icono={<IconClock className="h-4 w-4" />}
          onClick={() => nav.goToPlanificaciones({ ...f, state: 'ENVIADO_A_REVISION' })}
        />
        <KpiCard
          titulo="PAAC observados (en correcciones)"
          valor={observados}
          detalle={`${pct(observados, total)}% de las cátedras`}
          tono="observado"
          icono={<IconAlert className="h-4 w-4" />}
          onClick={() => nav.goToPlanificaciones({ ...f, state: 'OBSERVADO' })}
        />
        <KpiCard
          titulo="PAAC no presentados (borrador)"
          valor={borrador}
          detalle={`${pct(borrador, total)}% de las cátedras`}
          tono="borrador"
          icono={<IconDocs className="h-4 w-4" />}
          onClick={() => nav.goToPlanificaciones({ ...f, state: 'BORRADOR' })}
        />
        <KpiCard
          titulo="PAAD no presentados / en revisión"
          valor={
            <span className="flex items-baseline gap-2">
              {ep.borrador}
              <span className="text-sm font-semibold text-muted">/ {ep.revision}</span>
            </span>
          }
          detalle={
            <span className="mt-1 flex flex-wrap gap-1.5">
              <ChipConteo label="Borrador" valor={ep.borrador} tono="borrador" onClick={() => nav.goToPaads({ state: 'BORRADOR' })} />
              <ChipConteo label="En revisión" valor={ep.revision} tono="revision" onClick={() => nav.goToPaads({ state: 'ENVIADO_A_REVISION' })} />
            </span>
          }
          tono="borrador"
          icono={<IconUserDoc className="h-4 w-4" />}
        />
        <KpiCard
          titulo="Informes Pedagógicos emitidos (Anexo III)"
          valor={`${emitidos} / ${total}`}
          detalle={
            <span className="mt-1 block space-y-1">
              <span className="block">{pct(emitidos, total)}% de avance de la UAP en el ciclo</span>
              <BarraAvance valor={pct(emitidos, total)} etiqueta="Avance de informes pedagógicos" />
            </span>
          }
          tono="aprobado"
          icono={<IconCheck className="h-4 w-4" />}
          onClick={() => nav.goToPlanificaciones(f)}
          accion="Ver planificaciones"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Desglose por carrera */}
        <Panel titulo="Desglose por carrera" className="lg:col-span-8">
          <ul className="space-y-3.5">
            {carreras.map((c) => {
              const pc = paacsDe(paacs, c.id, asigContext);
              const pd = paads.filter((d) => d.evalCareer === c.id);
              const e = estadosPaad(pd);
              const conInforme = contar(pc, (d) => d.pedApproved);
              const fc = { ...f, careerId: c.id };
              return (
                <li key={c.id} className="space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-bold text-ink">
                        <span className="rounded bg-soft px-2 py-0.5 text-[11px] font-bold text-primary">{c.sigla}</span>
                        <span className="truncate">{c.nombre}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {pc.length} PAAC · {pd.length} PAAD evaluados por esta Dirección
                      </p>
                    </div>
                    <div className="w-40 space-y-1 text-right">
                      <p className="text-[11px] text-muted">
                        Informes UAP <strong className="tabular-nums text-ink">{pct(conInforme, pc.length)}%</strong>
                      </p>
                      <BarraAvance valor={pct(conInforme, pc.length)} etiqueta={`Informes pedagógicos emitidos en ${c.sigla}`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">PAAC</span>
                    <div className="flex flex-wrap gap-1.5">
                      <ChipConteo label="No presentados" valor={contar(pc, (d) => d.state === 'BORRADOR')} tono="borrador" onClick={() => nav.goToPlanificaciones({ ...fc, state: 'BORRADOR' })} />
                      <ChipConteo label="En revisión" valor={contar(pc, (d) => d.state === 'ENVIADO_A_REVISION')} tono="revision" onClick={() => nav.goToPlanificaciones({ ...fc, state: 'ENVIADO_A_REVISION' })} />
                      <ChipConteo label="Observados" valor={contar(pc, (d) => d.state === 'OBSERVADO')} tono="observado" onClick={() => nav.goToPlanificaciones({ ...fc, state: 'OBSERVADO' })} />
                      <ChipConteo label="Aprobados UAP" valor={conInforme} tono="aprobado" onClick={() => nav.goToPlanificaciones(fc)} titulo="Abre todas las planificaciones de la carrera" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">PAAD</span>
                    <div className="flex flex-wrap gap-1.5">
                      <ChipConteo label="No presentados" valor={e.borrador} tono="borrador" onClick={() => nav.goToPaads({ careerId: c.id, state: 'BORRADOR' })} />
                      <ChipConteo label="En revisión" valor={e.revision} tono="revision" onClick={() => nav.goToPaads({ careerId: c.id, state: 'ENVIADO_A_REVISION' })} />
                      <ChipConteo label="Observados" valor={e.observado} tono="observado" onClick={() => nav.goToPaads({ careerId: c.id, state: 'OBSERVADO' })} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Bandeja rápida */}
        <Panel
          titulo="Prioridad UAP"
          className="lg:col-span-4"
          accion={<span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted">{prioridad.length}</span>}
        >
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="mb-3 text-[11px] text-muted">Cátedras listas para emitir el Informe Pedagógico o revisar correcciones. Hacé clic para abrir el PAAC.</p>
            {prioridad.length === 0 ? (
              <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                <IconCheck className="h-4 w-4" />
                No hay PAAC pendientes de dictamen UAP.
              </p>
            ) : (
              <ul className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                {prioridad.map((d) => {
                  const ctx = asigContext(d.asignaturaId);
                  const reeval = d.pedReport?.dictamen === 'REEVALUACION';
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => nav.onOpenDoc(d.id)}
                        className="group w-full rounded-xl border border-border bg-background p-3 text-left transition hover:border-primary/40 hover:border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)] hover:bg-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-ink group-hover:text-primary">{ctx.asig?.nombre ?? d.asignaturaId}</span>
                          <IconArrowRight className="h-3.5 w-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                          <span className="font-semibold text-primary">{ctx.carrera?.sigla}</span>
                          <span>· {fullName(d.owner)}</span>
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <StatusBadge state={d.state} />
                          {reeval && (
                            <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-px text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                              Correcciones a revisar
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <button type="button" onClick={() => nav.goToPlanificaciones({ ...f, state: 'ENVIADO_A_REVISION' })} className={`mt-3 ${linkCls}`}>
              Ver todas en revisión →
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
