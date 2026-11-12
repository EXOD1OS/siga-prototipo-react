import { IconAlert, IconCheck, IconClock, IconDocs, IconSeal, IconUserDoc } from '../../layout/icons';
import { BarraAvance, ChipConteo, KpiCard, Panel, SaludoDashboard, pct } from './DashboardKit';
import { ESTADOS_FAVORABLES, ESTADOS_REVISION_PAAC, contar, estadosPaad, paacsDe, type DatosDashboard, type NavDashboard } from './datos';
import type { Asignatura, EquipoCatedra, PlanEstudio } from '../../../types/estructura';

interface Props {
  datos: DatosDashboard;
  nav: NavDashboard;
  /** Carrera de la Dirección activa. */
  careerId: string;
  asignaturas: Asignatura[];
  planes: PlanEstudio[];
  equipos: EquipoCatedra[];
}

/**
 * Inicio de la Dirección de Carrera: control disciplinar, cumplimiento docente y elevación al Consejo.
 * Las métricas de su carrera abren los listados filtrados; la comparativa con otras carreras es de consulta
 * (la Dirección solo accede a las planificaciones de su carrera).
 */
export function DireccionDashboardView({ datos, nav, careerId, asignaturas, planes, equipos }: Props) {
  const { nombre, ciclo, carreras, asigContext } = datos;
  const carrera = carreras.find((c) => c.id === careerId);
  const paacsCiclo = datos.paacs.filter((d) => d.cycle === ciclo);
  const paadsCiclo = datos.paads.filter((d) => d.cycle === ciclo);

  const pc = paacsDe(paacsCiclo, careerId, asigContext);
  const pd = paadsCiclo.filter((d) => d.evalCareer === careerId);
  const e = estadosPaad(pd);
  const f = { ciclo };

  const borrador = contar(pc, (d) => d.state === 'BORRADOR');
  const revisionPaac = contar(pc, (d) => ESTADOS_REVISION_PAAC.includes(d.state) && !d.discApproved);
  const observadosPaac = contar(pc, (d) => d.state === 'OBSERVADO');
  const listos = contar(pc, (d) => d.state === 'APROBADO_PLENO');
  const conDisciplinar = contar(pc, (d) => d.discApproved);

  // Cobertura: asignaturas de los planes de la carrera con Docente Responsable designado en el ciclo.
  const planesCarrera = new Set(planes.filter((p) => p.carreraId === careerId).map((p) => p.id));
  const asigsCarrera = asignaturas.filter((a) => planesCarrera.has(a.planEstudioId));
  const sinResponsable = asigsCarrera.filter((a) => !equipos.some((eq) => eq.asignaturaId === a.id && eq.cicloLectivo === ciclo && eq.esResponsable));
  const cubiertas = asigsCarrera.length - sinResponsable.length;

  return (
    <div className="space-y-6">
      <SaludoDashboard
        nombre={nombre}
        subtitulo={`Dirección de Carrera · Seguimiento Disciplinar y Cumplimiento Docente Ciclo ${ciclo}`}
        extra={
          carrera && (
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface px-3 py-1.5 text-xs sm:self-auto">
              <span className="rounded bg-soft px-1.5 py-px text-[11px] font-bold text-primary">{carrera.sigla}</span>
              <span className="text-ink">{carrera.nombre}</span>
            </span>
          )
        }
      />

      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          titulo="PAAC no presentados (borrador)"
          valor={borrador}
          detalle={`${pct(borrador, pc.length)}% de las cátedras de la carrera`}
          tono="borrador"
          icono={<IconDocs className="h-4 w-4" />}
          onClick={() => nav.goToPlanificaciones({ ...f, state: 'BORRADOR' })}
        />
        <KpiCard
          titulo="PAAD no presentados (borrador)"
          valor={e.borrador}
          detalle={`${pct(e.borrador, pd.length)}% de los PAAD que evalúa la Dirección`}
          tono="borrador"
          icono={<IconUserDoc className="h-4 w-4" />}
          onClick={() => nav.goToPaads({ careerId, state: 'BORRADOR' })}
        />
        <KpiCard
          titulo="En revisión disciplinar"
          valor={revisionPaac + e.revision}
          detalle={`${revisionPaac} PAAC · ${e.revision} PAAD pendientes de dictamen`}
          tono="revision"
          icono={<IconClock className="h-4 w-4" />}
          onClick={() => nav.goToPlanificaciones({ ...f, state: 'ENVIADO_A_REVISION' })}
        />
        <KpiCard
          titulo="Observados"
          valor={observadosPaac + e.observado}
          detalle={`${observadosPaac} PAAC · ${e.observado} PAAD con observaciones a subsanar`}
          tono="observado"
          icono={<IconAlert className="h-4 w-4" />}
          onClick={() => nav.goToPlanificaciones({ ...f, state: 'OBSERVADO' })}
        />
        <KpiCard
          titulo="Aprobación plena · listos para elevar"
          valor={listos}
          detalle="Doble dictamen favorable: elevar al Consejo Departamental"
          tono="aprobado"
          icono={<IconSeal className="h-4 w-4" />}
          onClick={() => nav.goToPlanificaciones({ ...f, state: 'APROBADO_PLENO' })}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Panel titulo={`Estado de ${carrera?.sigla ?? 'la carrera'}`} className="lg:col-span-7">
          <div className="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted">PAAC por estado · {pc.length} cátedras</h3>
              <div className="flex flex-wrap gap-1.5">
                <ChipConteo label="No presentados" valor={borrador} tono="borrador" onClick={() => nav.goToPlanificaciones({ ...f, state: 'BORRADOR' })} />
                <ChipConteo label="En revisión" valor={contar(pc, (d) => d.state === 'ENVIADO_A_REVISION')} tono="revision" onClick={() => nav.goToPlanificaciones({ ...f, state: 'ENVIADO_A_REVISION' })} />
                <ChipConteo label="Observados" valor={observadosPaac} tono="observado" onClick={() => nav.goToPlanificaciones({ ...f, state: 'OBSERVADO' })} />
                <ChipConteo
                  label="Con Informe Disciplinar aprobado"
                  valor={conDisciplinar}
                  tono="aprobado"
                  onClick={() => nav.goToPlanificaciones(f)}
                  titulo="Abre todas las planificaciones de la carrera"
                />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted">PAAD por estado · {pd.length} docentes</h3>
              <div className="flex flex-wrap gap-1.5">
                <ChipConteo label="No presentados" valor={e.borrador} tono="borrador" onClick={() => nav.goToPaads({ careerId, state: 'BORRADOR' })} />
                <ChipConteo label="En revisión" valor={e.revision} tono="revision" onClick={() => nav.goToPaads({ careerId, state: 'ENVIADO_A_REVISION' })} />
                <ChipConteo label="Observados" valor={e.observado} tono="observado" onClick={() => nav.goToPaads({ careerId, state: 'OBSERVADO' })} />
                <ChipConteo label="Aprobados" valor={e.aprobado} tono="aprobado" onClick={() => nav.goToPaads({ careerId, state: 'APROBADO' })} />
              </div>
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-background p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">Cobertura de Equipos de Cátedra</span>
                <span className="tabular-nums text-muted">
                  <strong className="text-ink">{cubiertas}</strong> de {asigsCarrera.length} asignaturas con responsable
                </span>
              </div>
              <BarraAvance valor={pct(cubiertas, asigsCarrera.length)} etiqueta="Asignaturas con Docente Responsable designado" />
              {sinResponsable.length > 0 ? (
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Sin responsable: {sinResponsable.map((a) => a.nombre).join(', ')}
                </p>
              ) : (
                <p className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                  <IconCheck className="h-3 w-3" /> Todas las asignaturas tienen responsable designado.
                </p>
              )}
            </div>
          </div>
        </Panel>

        <Panel titulo="Comparativa del departamento" className="lg:col-span-5">
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
            <table className="w-full min-w-[420px] table-fixed border-collapse text-left text-xs">
              <caption className="sr-only">PAAC del ciclo por carrera y estado</caption>
              <thead>
                <tr className="border-b border-border bg-background text-[11px] text-muted">
                  <th scope="col" className="w-[22%] px-3 py-2.5 font-semibold">Carrera</th>
                  <th scope="col" className="w-[13%] px-2 py-2.5 text-right font-semibold" title="No presentados">Borr.</th>
                  <th scope="col" className="w-[13%] px-2 py-2.5 text-right font-semibold" title="En revisión">Rev.</th>
                  <th scope="col" className="w-[13%] px-2 py-2.5 text-right font-semibold" title="Observados">Obs.</th>
                  <th scope="col" className="w-[13%] px-2 py-2.5 text-right font-semibold" title="Aprobación plena, elevados y finalizados">Fav.</th>
                  <th scope="col" className="w-[26%] px-3 py-2.5 font-semibold">Cumplimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {carreras.map((c) => {
                  const lista = paacsDe(paacsCiclo, c.id, asigContext);
                  const presentados = contar(lista, (d) => d.state !== 'BORRADOR');
                  const propia = c.id === careerId;
                  return (
                    <tr key={c.id} className={propia ? 'bg-soft' : undefined} aria-current={propia ? 'true' : undefined}>
                      <th scope="row" className="px-3 py-2 font-semibold text-ink" title={c.nombre}>
                        {c.sigla}
                        {propia && <span className="ml-1 text-[10px] font-normal text-primary">(tu carrera)</span>}
                      </th>
                      <td className="px-2 py-2 text-right tabular-nums text-ink">{contar(lista, (d) => d.state === 'BORRADOR')}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-ink">{contar(lista, (d) => ESTADOS_REVISION_PAAC.includes(d.state))}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-ink">{contar(lista, (d) => d.state === 'OBSERVADO')}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-ink">{contar(lista, (d) => ESTADOS_FAVORABLES.includes(d.state))}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <BarraAvance valor={pct(presentados, lista.length)} etiqueta={`PAAC presentados en ${c.sigla}`} />
                          <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted">{pct(presentados, lista.length)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-border px-3 py-2 text-[10px] text-muted">Cumplimiento: PAAC presentados sobre el total de la carrera en el ciclo.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
