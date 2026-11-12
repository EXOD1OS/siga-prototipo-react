import { useState } from 'react';
import { StatusBadge } from '../../shared/StatusBadge';
import { IconCheck, IconClock, IconDocs, IconSeal } from '../../layout/icons';
import { BarraAvance, BarraSegmentos, KpiCard, Panel, SaludoDashboard, pct } from './DashboardKit';
import { ESTADOS_FAVORABLES, contar, paacsDe, type DatosDashboard, type NavDashboard } from './datos';
import type { FiltrosPaac } from '../../../types/navegacion';

interface Props {
  datos: DatosDashboard;
  nav: NavDashboard;
  /** Asigna expediente y Resolución CD (mismo circuito que el listado). */
  onFormalizar: (id: string) => void;
}

const REGIMEN: Record<string, string> = { '1C': '1C', '2C': '2C', ANUAL: 'Anual' };

/**
 * Inicio del Consejo Departamental: cátedras evaluadas favorablemente, elevadas y protocolizadas.
 * Puede verse sobre el ciclo vigente o sobre todos los ciclos (las finalizadas suelen ser de ciclos anteriores).
 */
export function ConsejoDashboardView({ datos, nav, onFormalizar }: Props) {
  const { nombre, ciclo, carreras, asigContext, fullName } = datos;
  const [alcance, setAlcance] = useState<'ciclo' | 'todos'>('ciclo');
  const paacs = alcance === 'ciclo' ? datos.paacs.filter((d) => d.cycle === ciclo) : datos.paacs;
  const f: FiltrosPaac = alcance === 'ciclo' ? { ciclo } : {};

  const total = paacs.length;
  const pendientesSesion = paacs.filter((d) => ['APROBADO_PLENO', 'ELEVADO_AL_CONSEJO'].includes(d.state) && !d.expediente);
  const finalizadas = contar(paacs, (d) => d.state === 'FINALIZADO');
  const favorables = paacs.filter((d) => ESTADOS_FAVORABLES.includes(d.state));
  const previas = total - favorables.length;

  const listado = [...favorables].sort(
    (a, b) => ESTADOS_FAVORABLES.indexOf(a.state) - ESTADOS_FAVORABLES.indexOf(b.state) || b.cycle - a.cycle
  );

  return (
    <div className="space-y-6">
      <SaludoDashboard
        nombre={nombre}
        subtitulo={`Honorable Consejo Departamental · DACEFyN UNLaR · Protocolización y Resoluciones Ciclo ${ciclo}`}
        extra={
          <div role="radiogroup" aria-label="Alcance del panel" className="inline-flex self-start rounded-lg border border-border bg-background p-0.5 text-xs sm:self-auto">
            {(
              [
                ['ciclo', `Ciclo ${ciclo}`],
                ['todos', 'Todos los ciclos'],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={alcance === k}
                onClick={() => setAlcance(k)}
                className={`rounded-md px-3 py-1.5 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                  alcance === k ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Elevados para tratamiento en sesión"
          valor={pendientesSesion.length}
          detalle="Pendientes de Expediente y Resolución CD"
          tono="revision"
          icono={<IconClock className="h-4 w-4" />}
          onClick={() => nav.goToPlanificaciones({ ...f, state: 'ELEVADO_AL_CONSEJO' })}
        />
        <KpiCard
          titulo="Cátedras finalizadas (con Resolución CD)"
          valor={finalizadas}
          detalle={`${pct(finalizadas, total)}% del padrón de asignaturas`}
          tono="finalizado"
          icono={<IconSeal className="h-4 w-4" />}
          onClick={() => nav.goToPlanificaciones({ ...f, state: 'FINALIZADO' })}
        />
        <KpiCard
          titulo="Total evaluadas favorablemente"
          valor={favorables.length}
          detalle="Dictamen UAP y de Dirección favorables (plenas, elevadas y finalizadas)"
          tono="aprobado"
          icono={<IconCheck className="h-4 w-4" />}
          onClick={() => nav.goToPlanificaciones({ ...f, vista: 'historicas' })}
        />
        <KpiCard
          titulo="Avance del padrón curricular"
          valor={`${pct(favorables.length, total)}%`}
          detalle={
            <span className="mt-1 block space-y-1">
              <span className="block">
                {favorables.length} con dictámenes completos · {previas} en circuito previo
              </span>
              <BarraAvance valor={pct(favorables.length, total)} etiqueta="Cátedras con dictámenes completos" />
            </span>
          }
          tono="neutro"
          icono={<IconDocs className="h-4 w-4" />}
        />
      </div>

      <Panel titulo="Progreso de protocolización por carrera">
        <ul className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          {carreras.map((c) => {
            const lista = paacsDe(paacs, c.id, asigContext);
            const fin = contar(lista, (d) => d.state === 'FINALIZADO');
            const evaluadas = contar(lista, (d) => d.state === 'APROBADO_PLENO' || d.state === 'ELEVADO_AL_CONSEJO');
            const previa = lista.length - fin - evaluadas;
            const fc = { ...f, careerId: c.id };
            return (
              <li key={c.id} className="space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-2 text-sm font-bold text-ink">
                    <span className="rounded bg-soft px-2 py-0.5 text-[11px] font-bold text-primary">{c.sigla}</span>
                    <span className="truncate">{c.nombre}</span>
                  </p>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted">{lista.length} cátedras</span>
                </div>
                <BarraSegmentos
                  etiqueta={`Protocolización de ${c.sigla}`}
                  segmentos={[
                    { key: 'fin', label: 'Finalizadas con Resolución', valor: fin, tono: 'finalizado', onClick: () => nav.goToPlanificaciones({ ...fc, state: 'FINALIZADO' }) },
                    { key: 'eval', label: 'Evaluadas / elevadas', valor: evaluadas, tono: 'aprobado', onClick: () => nav.goToPlanificaciones({ ...fc, vista: 'historicas' }) },
                    { key: 'previa', label: 'Instancia previa', valor: previa, tono: 'borrador', onClick: () => nav.goToPlanificaciones({ ...fc, vista: 'activas' }) },
                  ]}
                />
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel titulo="Cátedras evaluadas favorablemente y finalizadas" accion={<span className="text-[11px] tabular-nums text-muted">{listado.length} cátedras</span>}>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[960px] table-fixed border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-background text-[11px] text-muted">
                <th scope="col" className="w-[22%] px-4 py-3 font-semibold">Asignatura</th>
                <th scope="col" className="w-[13%] px-3 py-3 font-semibold">Carrera · Plan</th>
                <th scope="col" className="w-[7%] px-3 py-3 font-semibold">Régimen</th>
                <th scope="col" className="w-[15%] px-3 py-3 font-semibold">Responsable</th>
                <th scope="col" className="w-[14%] px-3 py-3 font-semibold">Estado</th>
                <th scope="col" className="w-[13%] px-3 py-3 font-semibold">Informes</th>
                <th scope="col" className="w-[16%] px-4 py-3 text-right font-semibold">Expediente / Resolución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listado.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    No hay cátedras evaluadas favorablemente {alcance === 'ciclo' ? `en el ciclo ${ciclo}` : 'todavía'}.
                  </td>
                </tr>
              )}
              {listado.map((d) => {
                const ctx = asigContext(d.asignaturaId);
                return (
                  <tr key={d.id} className="transition-colors hover:bg-background">
                    <td className="min-w-0 px-4 py-3">
                      <span className="block truncate font-semibold text-ink" title={ctx.asig?.nombre}>
                        {ctx.asig?.nombre ?? d.asignaturaId}
                      </span>
                      <span className="block text-[11px] text-muted">Ciclo {d.cycle}</span>
                    </td>
                    <td className="min-w-0 px-3 py-3">
                      <span className="block font-semibold text-primary">{ctx.carrera?.sigla}</span>
                      <span className="block truncate text-[11px] text-muted" title={ctx.plan?.ordenanza}>
                        {ctx.plan?.ordenanza}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-ink">{ctx.asig ? REGIMEN[ctx.asig.regimenDictado] : '—'}</td>
                    <td className="min-w-0 px-3 py-3">
                      <span className="block truncate text-ink" title={fullName(d.owner)}>
                        {fullName(d.owner)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge state={d.state} />
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                          <IconCheck className="h-3 w-3" /> UAP (Anexo III)
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                          <IconCheck className="h-3 w-3" /> Dirección (Anexo IV)
                        </span>
                        <button
                          type="button"
                          onClick={() => nav.onOpenReport(d.id)}
                          className="text-[11px] font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          Ver informes (PDF)
                        </button>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {d.state === 'FINALIZADO' ? (
                        <span className="block">
                          <span className="block font-mono font-semibold text-primary">{d.expediente || '—'}</span>
                          <span className="block text-[11px] text-muted">{d.resolucion || 'Resolución en trámite'}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onFormalizar(d.id)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          Formalizar expediente
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
