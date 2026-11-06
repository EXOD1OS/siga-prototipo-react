import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Modal, ModalButton } from '../shared/Modal';
import { StatusBadge } from '../shared/StatusBadge';
import { DISCITEMS, PEDITEMS } from '../../data/mockData';
import type { AsigContext } from '../../types/estructura';
import {
  DICTAMEN_BADGE,
  DICTAMEN_LABELS,
  dictamenDe,
  type Dictamen,
  type InformeEvaluacion,
  type PaacDoc,
} from '../../types/planificacion';

export interface IntegranteResumen {
  nombre: string;
  cargo: string;
  esResponsable: boolean;
}

/** Acciones del circuito disponibles para la sesión actual (null = no corresponde). */
export interface AccionesInforme {
  onAbrirPaac: () => void;
  onEvaluar: (() => void) | null;
  onElevar: (() => void) | null;
  onFormalizar: (() => void) | null;
}

interface InformesModalProps {
  doc: PaacDoc;
  ctx: AsigContext;
  responsable: string;
  equipo: IntegranteResumen[];
  acciones: AccionesInforme;
  onClose: () => void;
}

type Tab = 'paac' | 'disc' | 'ped';

function DictamenBadge({ value }: { value: Dictamen }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${DICTAMEN_BADGE[value]}`}>
      {DICTAMEN_LABELS[value]}
    </span>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value?: ReactNode }) {
  const vacio = value === undefined || value === null || value === '';
  return (
    <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-3">
      <dt className="text-[11px] font-medium text-muted">{label}</dt>
      <dd className={`text-xs leading-relaxed ${vacio ? 'text-muted italic' : 'text-ink'}`}>{vacio ? 'Sin completar' : value}</dd>
    </div>
  );
}

function Pendiente({ quien }: { quien: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center">
      <DictamenBadge value="PENDIENTE" />
      <p className="mt-2 text-sm font-medium text-ink">Pendiente de evaluación</p>
      <p className="mt-1 text-xs text-muted">
        Este informe lo elabora {quien} una vez que la planificación es enviada a revisión. Todavía no fue emitido.
      </p>
    </div>
  );
}

function InformeArea({
  informe,
  dictamen,
  items,
  observaciones,
  titulo,
  quien,
}: {
  informe: InformeEvaluacion;
  dictamen: Dictamen;
  items: string[];
  observaciones?: string;
  titulo: string;
  quien: string;
}) {
  if (dictamen === 'PENDIENTE') return <Pendiente quien={quien} />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
        <div>
          <div className="text-xs font-semibold text-ink">{titulo}</div>
          <div className="text-[11px] text-muted">
            {informe.by ? `Emitido por ${informe.by}` : 'Evaluador sin registrar'}
            {informe.fecha && ` · ${informe.fecha}`}
          </div>
        </div>
        <DictamenBadge value={dictamen} />
      </div>
      <Section title="Valoración por ítem">
        <dl className="divide-y divide-border rounded-lg border border-border px-3">
          {items.map((item, i) => (
            <Row key={item} label={item} value={informe.items[i]} />
          ))}
        </dl>
      </Section>
      <Section title="Observaciones / resolución">
        <p className={`rounded-lg border border-border bg-background px-3 py-2.5 text-xs leading-relaxed ${observaciones ? 'text-ink' : 'text-muted italic'}`}>
          {observaciones || 'Sin observaciones.'}
        </p>
      </Section>
    </div>
  );
}

const texto = (v: unknown) => (typeof v === 'string' ? v : undefined);
const filas = (v: unknown) => (Array.isArray(v) ? v.length : 0);

/** Visor de informes de una planificación: PAAC, Informe Disciplinar e Informe Pedagógico. */
export function InformesModal({ doc, ctx, responsable, equipo, acciones, onClose }: InformesModalProps) {
  const [tab, setTab] = useState<Tab>('paac');
  const uid = useId();
  const disc = dictamenDe(doc.discApproved, doc.discReport);
  const ped = dictamenDe(doc.pedApproved, doc.pedReport);
  const d = doc.data ?? {};

  const tabs: { key: Tab; label: string; badge?: Dictamen }[] = [
    { key: 'paac', label: 'PAAC' },
    { key: 'disc', label: 'Informe Disciplinar', badge: disc },
    { key: 'ped', label: 'Informe Pedagógico', badge: ped },
  ];

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = tabs.findIndex((t) => t.key === tab);
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length].key;
    setTab(next);
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Informes · ${ctx.asig?.nombre ?? doc.asignaturaId}`}
      widthClass="max-w-3xl"
      headerExtra={
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <StatusBadge state={doc.state} />
          <span>
            {ctx.asig?.codigo} · {ctx.carrera?.codigo} · Ciclo {doc.cycle}
          </span>
          {doc.expediente && <span className="font-mono text-primary font-semibold">{doc.expediente}</span>}
        </div>
      }
      footer={
        <>
          <span className="mr-auto flex flex-wrap gap-2">
            {acciones.onEvaluar && (
              <ModalButton variant="primary" onClick={acciones.onEvaluar}>
                Emitir / editar informe
              </ModalButton>
            )}
            {acciones.onElevar && (
              <ModalButton variant="primary" onClick={acciones.onElevar}>
                Elevar al Consejo
              </ModalButton>
            )}
            {acciones.onFormalizar && (
              <ModalButton variant="primary" onClick={acciones.onFormalizar}>
                Formalizar expediente
              </ModalButton>
            )}
          </span>
          <ModalButton onClick={acciones.onAbrirPaac}>Abrir PAAC completo</ModalButton>
          <ModalButton onClick={onClose}>Cerrar</ModalButton>
        </>
      }
    >
      <div role="tablist" aria-label="Informes de la planificación" className="-mt-1 mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => {
          const activo = tab === t.key;
          return (
            <button
              key={t.key}
              id={`${uid}-tab-${t.key}`}
              type="button"
              role="tab"
              aria-selected={activo}
              aria-controls={`${uid}-panel-${t.key}`}
              tabIndex={activo ? 0 : -1}
              onClick={() => setTab(t.key)}
              onKeyDown={onTabKey}
              className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                activo ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
              {t.badge && (
                <span
                  aria-label={DICTAMEN_LABELS[t.badge]}
                  className={`h-2 w-2 rounded-full ${
                    t.badge === 'FAVORABLE' ? 'bg-emerald-500' : t.badge === 'CON_OBSERVACIONES' ? 'bg-red-500' : 'bg-slate-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div id={`${uid}-panel-${tab}`} role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`} className="max-h-[60vh] overflow-y-auto pr-1">
        {tab === 'paac' && (
          <div className="space-y-5">
            <Section title="Aspectos generales">
              <dl className="divide-y divide-border rounded-lg border border-border px-3">
                <Row label="Asignatura" value={`${ctx.asig?.nombre ?? ''} (${ctx.asig?.codigo ?? '—'})`} />
                <Row label="Carrera" value={ctx.carrera ? `${ctx.carrera.nombre} (${ctx.carrera.codigo})` : undefined} />
                <Row label="Plan de estudio" value={ctx.plan ? `${ctx.plan.ordenanza} · ${ctx.plan.enfoque}` : undefined} />
                <Row
                  label="Curso / Régimen"
                  value={ctx.asig ? `${ctx.asig.anoCursada}.º año · ${ctx.asig.regimenDictado} · ${ctx.asig.horasTotales} hs` : undefined}
                />
                <Row label="Docente responsable" value={responsable} />
              </dl>
            </Section>

            <Section title={`Equipo de cátedra · ciclo ${doc.cycle}`}>
              {equipo.length ? (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {equipo.map((m) => (
                    <li key={m.nombre} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                      <span className="flex-1 text-ink">{m.nombre}</span>
                      <span className="text-muted">{m.cargo}</span>
                      {m.esResponsable && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          Responsable
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted">Sin integrantes registrados para ese ciclo.</p>
              )}
            </Section>

            <Section title="Fundamentación y objetivos">
              <dl className="divide-y divide-border rounded-lg border border-border px-3">
                <Row label="Fundamentación" value={texto(d.intro)} />
                <Row label="Diagnóstico" value={texto(d.diag)} />
                <Row label="Obj. conceptuales" value={texto(d.concept)} />
                <Row label="Obj. procedimentales" value={texto(d.procedure)} />
                <Row label="Obj. actitudinales" value={texto(d.attitude)} />
              </dl>
            </Section>

            <Section title="Metodología y evaluación">
              <dl className="divide-y divide-border rounded-lg border border-border px-3">
                <Row label="Metodología" value={texto(d.method)} />
                <Row label="Evaluación" value={texto(d.eval)} />
                <Row label="Regularidad" value={texto(d.regular)} />
                <Row label="Promoción" value={texto(d.promotion)} />
                <Row label="Libre" value={texto(d.free)} />
              </dl>
            </Section>

            <div className="grid grid-cols-3 gap-2">
              {[
                ['Unidades', filas(d.units)],
                ['Trabajos prácticos', filas(d.tp)],
                ['Bibliografía', filas(d.books)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-background px-3 py-2 text-center">
                  <div className="text-lg font-bold text-ink tabular-nums">{v}</div>
                  <div className="text-[10px] text-muted">{k}</div>
                </div>
              ))}
            </div>

            {(doc.expediente || doc.resolucion) && (
              <Section title="Resolución del Consejo">
                <dl className="divide-y divide-border rounded-lg border border-border px-3">
                  <Row label="Expediente" value={doc.expediente} />
                  <Row label="Resolución" value={doc.resolucion || 'En trámite'} />
                </dl>
              </Section>
            )}
          </div>
        )}

        {tab === 'disc' && (
          <InformeArea
            informe={doc.discReport}
            dictamen={disc}
            items={DISCITEMS}
            observaciones={doc.discReport?.obsDisciplinares}
            titulo="Informe Disciplinar · Dirección de Carrera (Anexo IV — Ord. 219/22)"
            quien="la Dirección de Carrera"
          />
        )}

        {tab === 'ped' && (
          <InformeArea
            informe={doc.pedReport}
            dictamen={ped}
            items={PEDITEMS}
            observaciones={doc.pedReport?.obsGenerales}
            titulo="Informe Pedagógico · UAP (Anexo III — Ord. 219/22)"
            quien="la UAP"
          />
        )}
      </div>
    </Modal>
  );
}
