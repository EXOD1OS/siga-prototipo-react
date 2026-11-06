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

/** Acciones del circuito disponibles para la sesión actual (null = no corresponde). */
export interface AccionesInforme {
  onEvaluar: (() => void) | null;
  onElevar: (() => void) | null;
  onFormalizar: (() => void) | null;
}

interface InformesModalProps {
  doc: PaacDoc;
  ctx: AsigContext;
  responsable: string;
  acciones: AccionesInforme;
  onClose: () => void;
}

type Tab = 'disc' | 'ped';

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
  tituloObs,
}: {
  informe: InformeEvaluacion | undefined;
  dictamen: Dictamen;
  items: string[];
  observaciones?: string;
  titulo: string;
  quien: string;
  tituloObs: string;
}) {
  if (!informe || dictamen === 'PENDIENTE') return <Pendiente quien={quien} />;
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

      <Section title={tituloObs}>
        <p
          className={`rounded-lg border border-border bg-background px-3 py-2.5 text-xs leading-relaxed ${
            observaciones ? 'text-ink' : 'text-muted italic'
          }`}
        >
          {observaciones || 'Sin observaciones.'}
        </p>
      </Section>

      <Section title="Valoración por ítem">
        <dl className="divide-y divide-border rounded-lg border border-border px-3">
          {items.map((item, i) => {
            const v = informe.items[i];
            return (
              <div key={item} className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-3">
                <dt className="text-[11px] font-medium text-muted">{item}</dt>
                <dd className={`text-xs leading-relaxed ${v ? 'text-ink' : 'text-muted italic'}`}>{v || 'Sin valorar'}</dd>
              </div>
            );
          })}
        </dl>
      </Section>
    </div>
  );
}

/**
 * Visor de dictámenes de una planificación: Informe Disciplinar (Dirección de Carrera)
 * e Informe Pedagógico (UAP). El PAAC se abre desde su propia columna en la bandeja.
 */
export function InformesModal({ doc, ctx, responsable, acciones, onClose }: InformesModalProps) {
  const disc = dictamenDe(doc.discApproved, doc.discReport);
  const ped = dictamenDe(doc.pedApproved, doc.pedReport);
  const [tab, setTab] = useState<Tab>('disc');
  const uid = useId();

  const tabs: { key: Tab; label: string; badge: Dictamen }[] = [
    { key: 'disc', label: 'Informe Disciplinar', badge: disc },
    { key: 'ped', label: 'Informe Pedagógico', badge: ped },
  ];

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next: Tab = tab === 'disc' ? 'ped' : 'disc';
    setTab(next);
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  };

  const hayAcciones = !!(acciones.onEvaluar || acciones.onElevar || acciones.onFormalizar);

  return (
    <Modal
      open
      onClose={onClose}
      title={`Informes de evaluación · ${ctx.asig?.nombre ?? doc.asignaturaId}`}
      widthClass="max-w-2xl"
      headerExtra={
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <StatusBadge state={doc.state} />
          <span>
            {ctx.asig?.codigo} · {ctx.carrera?.sigla} · Ciclo {doc.cycle} · Responsable: {responsable}
          </span>
        </div>
      }
      footer={
        <>
          {hayAcciones && (
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
          )}
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
              <DictamenBadge value={t.badge} />
            </button>
          );
        })}
      </div>

      <div id={`${uid}-panel-${tab}`} role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`} className="max-h-[60vh] overflow-y-auto pr-1">
        {tab === 'disc' ? (
          <InformeArea
            informe={doc.discReport}
            dictamen={disc}
            items={DISCITEMS}
            observaciones={doc.discReport?.obsDisciplinares}
            titulo="Informe Disciplinar · Dirección de Carrera (Anexo IV — Ord. 219/22)"
            tituloObs="Observaciones y resolución de la Dirección"
            quien="la Dirección de Carrera"
          />
        ) : (
          <InformeArea
            informe={doc.pedReport}
            dictamen={ped}
            items={PEDITEMS}
            observaciones={doc.pedReport?.obsGenerales}
            titulo="Informe Pedagógico · UAP (Anexo III — Ord. 219/22)"
            tituloObs="Sugerencias y observaciones de la UAP"
            quien="la UAP"
          />
        )}
      </div>
    </Modal>
  );
}
