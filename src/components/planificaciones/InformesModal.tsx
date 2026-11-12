import { useId, useState, type KeyboardEvent } from 'react';
import { Modal, ModalButton } from '../shared/Modal';
import { StatusBadge } from '../shared/StatusBadge';
import { PanelRevision, type InfoRevision } from '../shared/PanelRevision';
import { InformeLectura } from '../informes/InformeLectura';
import { encabezadoInforme, integrantesEquipo } from '../../lib/informes';
import type { AsigContext, EquipoCatedra } from '../../types/estructura';
import {
  DICTAMEN_BADGE,
  DICTAMEN_LABELS,
  dictamenDe,
  type Dictamen,
  type PaacDoc,
} from '../../types/planificacion';

/** Acciones del circuito disponibles para la sesión actual (null = no corresponde). */
export interface AccionesInforme {
  onEvaluar: (() => void) | null;
  onElevar: (() => void) | null;
  onFormalizar: (() => void) | null;
  /** Cierre de revisión de la UAP o la Dirección. */
  revision: InfoRevision | null;
}

interface InformesModalProps {
  doc: PaacDoc;
  ctx: AsigContext;
  responsable: string;
  /** Equipo de cátedra del ciclo (encabezado del Informe Pedagógico). */
  equipo: EquipoCatedra[];
  fullName: (id: string) => string;
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

/**
 * Visor de dictámenes de una planificación: Informe Disciplinar (Dirección de Carrera)
 * e Informe Pedagógico (UAP). El PAAC se abre desde su propia columna en la bandeja.
 */
export function InformesModal({ doc, ctx, responsable, equipo, fullName, acciones, onClose }: InformesModalProps) {
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

  const informeTab = tab === 'disc' ? doc.discReport : doc.pedReport;
  const hayAcciones = !!(acciones.onEvaluar || acciones.onElevar || acciones.onFormalizar);

  return (
    <Modal
      open
      onClose={onClose}
      title={`Informes de evaluación · ${ctx.asig?.nombre ?? doc.asignaturaId}`}
      widthClass="max-w-3xl"
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
      {acciones.revision && (
        <div className="mb-4">
          <PanelRevision revision={acciones.revision} tipo="PAAC" />
        </div>
      )}

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
        <h3 className="mb-3 text-xs font-semibold text-ink">
          {tab === 'disc' ? 'Informe Disciplinar · Dirección de Carrera (Anexo IV — Ord. 219/22)' : 'Informe Pedagógico · UAP (Anexo III — Ord. 219/22)'}
          {informeTab?.by && (
            <span className="block text-[11px] font-normal text-muted">
              Emitido por {informeTab.by}
              {informeTab.fecha && ` · ${informeTab.fecha}`}
            </span>
          )}
        </h3>
        <InformeLectura area={tab === 'disc' ? 'direccion' : 'uap'} d={doc} encabezado={encabezadoInforme(ctx, doc.cycle)} equipo={integrantesEquipo(equipo, fullName)} />
      </div>
    </Modal>
  );
}
