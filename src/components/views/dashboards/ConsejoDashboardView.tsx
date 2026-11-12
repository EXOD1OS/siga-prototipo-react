import { useState, type ReactNode } from 'react';
import { IconCheck, IconClock, IconDocs, IconSeal } from '../../layout/icons';
import {
  BarraProgreso,
  COLOR,
  CareerComparisonMatrix,
  DonutChartCard,
  KpiFilterCard,
  MetricaBarra,
  Panel,
  Pastillas,
  SaludoDashboard,
  SelectableCatedraCard,
  linkCls,
  pct,
} from './DashboardKit';
import { ESTADOS_FAVORABLES, contar, ordenanzaDe, paacsDe, tarjetaDe, type DatosDashboard, type NavDashboard } from './datos';
import type { FiltrosPaac } from '../../../types/navegacion';
import type { PaacDoc } from '../../../types/planificacion';

interface Props {
  datos: DatosDashboard;
  nav: NavDashboard;
  /** Asigna expediente y Resolución CD (mismo circuito que el listado). */
  onFormalizar: (id: string) => void;
}

type FiltroConsejo = 'pendientes' | 'finalizadas' | 'favorables';
const PENDIENTES = ['APROBADO_PLENO', 'ELEVADO_AL_CONSEJO'];

/**
 * Inicio del Consejo Departamental: cátedras evaluadas favorablemente, elevadas y protocolizadas.
 * Puede verse sobre el ciclo vigente o sobre todos los ciclos (las finalizadas suelen ser de ciclos anteriores).
 */
export function ConsejoDashboardView({ datos, nav, onFormalizar }: Props) {
  const { nombre, ciclo, asigContext } = datos;
  const [alcance, setAlcance] = useState<'ciclo' | 'todos'>('ciclo');
  const [filtro, setFiltro] = useState<FiltroConsejo>('pendientes');
  const paacs = alcance === 'ciclo' ? datos.paacs.filter((d) => d.cycle === ciclo) : datos.paacs;
  const f: FiltrosPaac = alcance === 'ciclo' ? { ciclo } : {};
  const total = paacs.length;

  const finalizadas = paacs.filter((d) => d.state === 'FINALIZADO');
  const elevadas = paacs.filter((d) => d.state === 'ELEVADO_AL_CONSEJO');
  const plenas = paacs.filter((d) => d.state === 'APROBADO_PLENO');
  const favorables = paacs.filter((d) => ESTADOS_FAVORABLES.includes(d.state));
  const previas = total - favorables.length;
  const grupos: Record<FiltroConsejo, PaacDoc[]> = {
    pendientes: paacs.filter((d) => PENDIENTES.includes(d.state)),
    finalizadas,
    favorables,
  };
  const lista = [...grupos[filtro]].sort((a, b) => ESTADOS_FAVORABLES.indexOf(a.state) - ESTADOS_FAVORABLES.indexOf(b.state) || b.cycle - a.cycle);

  const kpis: { key: FiltroConsejo | 'previas'; titulo: string; valor: number; detalle: string; color: string; icono: ReactNode; ir: () => void }[] = [
    { key: 'pendientes', titulo: 'Pendientes de protocolizar', valor: grupos.pendientes.length, detalle: 'Elevados y con aprobación plena', color: COLOR.elevado, icono: <IconClock className="h-4 w-4" />, ir: () => nav.goToPlanificaciones({ ...f, state: 'ELEVADO_AL_CONSEJO' }) },
    { key: 'finalizadas', titulo: 'Finalizadas con Resolución', valor: finalizadas.length, detalle: `${pct(finalizadas.length, total)}% del padrón`, color: COLOR.aprobado, icono: <IconSeal className="h-4 w-4" />, ir: () => nav.goToPlanificaciones({ ...f, state: 'FINALIZADO' }) },
    { key: 'favorables', titulo: 'Total evaluadas favorablemente', valor: favorables.length, detalle: `${pct(favorables.length, total)}% del padrón`, color: COLOR.pleno, icono: <IconCheck className="h-4 w-4" />, ir: () => nav.goToPlanificaciones({ ...f, vista: 'historicas' }) },
    { key: 'previas', titulo: 'En circuito previo', valor: previas, detalle: 'Borrador, revisión u observadas', color: COLOR.pendiente, icono: <IconDocs className="h-4 w-4" />, ir: () => nav.goToPlanificaciones({ ...f, vista: 'activas' }) },
  ];

  const informes = [
    { key: 'uap', label: 'Informe Pedagógico UAP (Anexo III)', valor: contar(paacs, (d) => d.pedApproved) },
    { key: 'dir', label: 'Informe Disciplinar Dirección (Anexo IV)', valor: contar(paacs, (d) => d.discApproved) },
  ];

  return (
    <div className="space-y-6">
      <SaludoDashboard
        nombre={nombre}
        subtitulo={`Honorable Consejo Departamental · DACEFyN UNLaR · Protocolización Ciclo ${ciclo}`}
        extra={
          <>
            <Pastillas
              etiqueta="Alcance del panel"
              valor={alcance}
              onChange={setAlcance}
              opciones={[
                { key: 'ciclo', label: `Ciclo ${ciclo}` },
                { key: 'todos', label: 'Todos los ciclos' },
              ]}
            />
            <button
              type="button"
              onClick={() => nav.goToPlanificaciones({ ...f, state: 'ELEVADO_AL_CONSEJO' })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Elevados al Consejo →
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
        <DonutChartCard
          className="lg:col-span-8"
          titulo="Embudo de protocolización curricular (padrón departamental)"
          centro="Cátedras"
          segmentos={[
            { key: 'fin', label: 'Finalizados con Resolución CD', valor: finalizadas.length, color: COLOR.aprobado, onClick: () => setFiltro('finalizadas') },
            { key: 'elev', label: 'Elevados para tratamiento en sesión', valor: elevadas.length, color: COLOR.elevado, onClick: () => setFiltro('pendientes') },
            { key: 'plena', label: 'Con aprobación plena (listos para elevar)', valor: plenas.length, color: COLOR.pleno, onClick: () => setFiltro('pendientes') },
            { key: 'previo', label: 'En circuito previo', valor: previas, color: COLOR.pendiente, onClick: () => nav.goToPlanificaciones({ ...f, vista: 'activas' }) },
          ]}
          pie={
            <MetricaBarra
              titulo="Cobertura de resoluciones sobre cátedras evaluadas favorablemente"
              valor={finalizadas.length}
              total={favorables.length}
              texto={`${finalizadas.length} de ${favorables.length} protocolizadas`}
            />
          }
        />

        <section className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-surface p-6 shadow-sm lg:col-span-4">
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-ink">Estado de informes reglamentarios</h2>
              <p className="mt-0.5 text-[11px] text-muted">Ord. HCS N° 219/2022 · {total} cátedras</p>
            </div>
            <ul className="space-y-4">
              {informes.map((i) => (
                <li key={i.key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-ink">{i.label}</span>
                    <span className="tabular-nums">
                      <strong className="text-ink">{pct(i.valor, total)}%</strong>
                      <span className="ml-1 text-[11px] text-muted">
                        ({i.valor}/{total})
                      </span>
                    </span>
                  </div>
                  <BarraProgreso valor={pct(i.valor, total)} etiqueta={i.label} />
                </li>
              ))}
            </ul>
          </div>
          <button type="button" onClick={() => nav.goToPlanificaciones({ ...f, state: 'APROBADO_PLENO' })} className={linkCls}>
            Ver cátedras con aprobación plena →
          </button>
        </section>
      </div>

      <div role="group" aria-label="Filtrar las cátedras evaluadas" className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiFilterCard
            key={k.key}
            titulo={k.titulo}
            valor={k.valor}
            detalle={k.detalle}
            icono={k.icono}
            color={k.color}
            activo={filtro === k.key}
            // "En circuito previo" no está en la lista de evaluadas: lleva al listado.
            onFiltrar={k.key === 'previas' ? k.ir : () => setFiltro(k.key as FiltroConsejo)}
            onIr={k.key === 'previas' ? undefined : k.ir}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <CareerComparisonMatrix
            titulo="Protocolización por carrera"
            modos={[
              {
                key: 'proto',
                label: 'Protocolización',
                unidad: 'cátedras',
                total,
                filas: datos.carreras.map((c) => {
                  const l = paacsDe(paacs, c.id, asigContext);
                  const fin = contar(l, (d) => d.state === 'FINALIZADO');
                  const fc = { ...f, careerId: c.id };
                  return {
                    carrera: c,
                    ordenanza: ordenanzaDe(paacs, c.id, asigContext),
                    avance: pct(fin, l.length),
                    celdas: [
                      { key: 'fin', label: 'Finalizadas', valor: fin, color: COLOR.aprobado, onClick: () => nav.goToPlanificaciones({ ...fc, state: 'FINALIZADO' }) },
                      { key: 'elev', label: 'Elevadas / plenas', valor: contar(l, (d) => PENDIENTES.includes(d.state)), color: COLOR.elevado, onClick: () => nav.goToPlanificaciones({ ...fc, state: 'ELEVADO_AL_CONSEJO' }) },
                      { key: 'previo', label: 'Circuito previo', valor: contar(l, (d) => !ESTADOS_FAVORABLES.includes(d.state)), color: COLOR.pendiente, onClick: () => nav.goToPlanificaciones({ ...fc, vista: 'activas' }) },
                    ],
                  };
                }),
              },
            ]}
            nota="Avance: cátedras finalizadas con Resolución CD sobre el total de la carrera."
          />
        </div>

        <Panel
          titulo={filtro === 'finalizadas' ? 'Cátedras finalizadas' : filtro === 'pendientes' ? 'Pendientes de protocolizar' : 'Cátedras evaluadas favorablemente'}
          className="lg:col-span-7"
          accion={<span className="text-[11px] tabular-nums text-muted">{lista.length}</span>}
        >
          {lista.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-8 text-center text-xs text-muted">
              No hay cátedras en este estado {alcance === 'ciclo' ? `en el ciclo ${ciclo}` : ''}.
            </p>
          ) : (
            <ul className="space-y-3.5">
              {lista.map((d) => {
                const tarjeta = tarjetaDe(d, datos);
                tarjeta.acento = d.state === 'FINALIZADO' ? COLOR.aprobado : d.state === 'ELEVADO_AL_CONSEJO' ? COLOR.elevado : COLOR.pleno;
                tarjeta.extra =
                  d.state === 'FINALIZADO' ? (
                    <span className="text-right text-[11px] leading-tight">
                      <span className="block font-mono font-semibold text-primary">{d.expediente || '—'}</span>
                      <span className="block text-muted">{d.resolucion || 'Resolución en trámite'}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFormalizar(d.id);
                      }}
                      className="relative z-10 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      Formalizar Expediente y Resolución
                    </button>
                  );
                return <SelectableCatedraCard key={d.id} c={tarjeta} onOpen={() => nav.onOpenDoc(d.id)} onReport={() => nav.onOpenReport(d.id)} />;
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
