import { useId, useState, type KeyboardEvent } from 'react';
import { Modal, ModalButton } from '../shared/Modal';
import { StatusBadge } from '../shared/StatusBadge';
import { PanelRevision, type InfoRevision } from '../shared/PanelRevision';
import { InformeLectura } from '../informes/InformeLectura';
import { encabezadoInforme, integrantesEquipo, type DocPaadResumen } from '../../lib/informes';
import {
  BTN_DESCARGAR_PDF,
  BTN_VER_PDF,
  BTN_VOLVER_DIGITAL,
  HojaOficial,
  imprimirInforme,
  informePresentado,
  type FuenteHojaInforme,
  type TipoInforme,
} from '../informes/HojasInformeOficial';
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
  /** Documentos del sistema (estado de los PAAD del equipo para la hoja oficial). */
  docs: DocPaadResumen[];
  acciones: AccionesInforme;
  onClose: () => void;
}

type ViewMode = 'digital' | 'pdf';

const TABS: { key: TipoInforme; label: string; titulo: string }[] = [
  { key: 'pedagogico', label: 'Informe Pedagógico (UAP)', titulo: 'Informe Pedagógico · UAP (Anexo III — Ord. 219/22)' },
  { key: 'disciplinar', label: 'Informe Disciplinar (Dirección)', titulo: 'Informe Disciplinar · Dirección de Carrera (Anexo IV — Ord. 219/22)' },
];

function DictamenBadge({ value }: { value: Dictamen }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${DICTAMEN_BADGE[value]}`}>
      {DICTAMEN_LABELS[value]}
    </span>
  );
}

/**
 * Visor de dictámenes de una planificación: Informe Pedagógico (UAP) e Informe Disciplinar (Dirección).
 * En el mismo modal se alterna entre la vista digital y la hoja oficial A4 (PDF) del informe presentado.
 */
export function InformesModal({ doc, ctx, responsable, equipo, fullName, docs, acciones, onClose }: InformesModalProps) {
  const [activeTab, setActiveTab] = useState<TipoInforme>('pedagogico');
  const [viewMode, setViewMode] = useState<ViewMode>('digital');
  const uid = useId();

  const presentado = informePresentado(doc, activeTab);
  // Un informe sin presentar no tiene hoja oficial: se muestra siempre en vista digital.
  const modo: ViewMode = presentado ? viewMode : 'digital';
  const informe = activeTab === 'disciplinar' ? doc.discReport : doc.pedReport;
  const fuente: FuenteHojaInforme = { d: doc, ctx, equipo, docs, fullName };
  const titulo = TABS.find((t) => t.key === activeTab)?.titulo ?? '';

  const cambiarTab = (t: TipoInforme) => {
    setActiveTab(t);
    if (!informePresentado(doc, t)) setViewMode('digital');
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next: TipoInforme = activeTab === 'pedagogico' ? 'disciplinar' : 'pedagogico';
    cambiarTab(next);
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  };

  const hayAcciones = !!(acciones.onEvaluar || acciones.onElevar || acciones.onFormalizar);

  return (
    <Modal
      open
      onClose={onClose}
      title={`Informes de evaluación · ${ctx.asig?.nombre ?? doc.asignaturaId}`}
      widthClass={modo === 'pdf' ? 'max-w-6xl' : 'max-w-3xl'}
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
      {acciones.revision && modo === 'digital' && (
        <div className="mb-4">
          <PanelRevision revision={acciones.revision} tipo="PAAC" />
        </div>
      )}

      <div className="-mt-1 mb-4 flex flex-col gap-2 border-b border-border sm:flex-row sm:items-end sm:justify-between">
        <div role="tablist" aria-label="Informes de la planificación" className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const activo = activeTab === t.key;
            const badge = t.key === 'disciplinar' ? dictamenDe(doc.discApproved, doc.discReport) : dictamenDe(doc.pedApproved, doc.pedReport);
            return (
              <button
                key={t.key}
                id={`${uid}-tab-${t.key}`}
                type="button"
                role="tab"
                aria-selected={activo}
                aria-controls={`${uid}-panel`}
                tabIndex={activo ? 0 : -1}
                onClick={() => cambiarTab(t.key)}
                onKeyDown={onTabKey}
                className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                  activo ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {t.label}
                <DictamenBadge value={badge} />
              </button>
            );
          })}
        </div>

        {presentado && (
          <div className="flex flex-wrap gap-2 pb-2">
            {modo === 'digital' ? (
              <button type="button" onClick={() => setViewMode('pdf')} className={BTN_VER_PDF}>
                Ver PDF
              </button>
            ) : (
              <button type="button" onClick={() => setViewMode('digital')} className={BTN_VOLVER_DIGITAL}>
                ← Volver a vista digital
              </button>
            )}
            <button type="button" onClick={imprimirInforme} title="Abre la impresión de la hoja oficial: elegí «Guardar como PDF»" className={BTN_DESCARGAR_PDF}>
              Descargar PDF
            </button>
          </div>
        )}
      </div>

      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${activeTab}`} className="max-h-[60vh] overflow-y-auto pr-1">
        {modo === 'digital' && (
          <>
            <h3 className="mb-3 text-xs font-semibold text-ink">
              {titulo}
              {informe?.by && (
                <span className="block text-[11px] font-normal text-muted">
                  Emitido por {informe.by}
                  {informe.fecha && ` · ${informe.fecha}`}
                </span>
              )}
            </h3>
            <InformeLectura
              area={activeTab === 'disciplinar' ? 'direccion' : 'uap'}
              d={doc}
              encabezado={encabezadoInforme(ctx, doc.cycle)}
              equipo={integrantesEquipo(equipo, fullName)}
            />
          </>
        )}
        {/* La copia de impresión se monta siempre que haya hoja: «Descargar PDF» funciona también desde la vista digital. */}
        {presentado && <HojaOficial tipo={activeTab} fuente={fuente} visible={modo === 'pdf'} />}
      </div>
    </Modal>
  );
}