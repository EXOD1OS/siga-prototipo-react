import { Modal, ModalButton } from './Modal';
import { StatusBadge } from './StatusBadge';
import { AvisoEstado } from './AvisoEstado';
import { PanelRevision, type InfoRevision } from './PanelRevision';
import { IconAlert, IconCheck, IconClock } from '../layout/icons';
import { BotonImprimir, PaadDocumentoOficial } from '../paad/PaadDocumentoOficial';
import { dictamenDe, DICTAMEN_LABELS, type InformeEvaluacion } from '../../types/planificacion';
import { paadVacio, type AspectosGeneralesPaad, type PaadContenido } from '../../types/paad';

interface PaadResumen {
  state: string;
  cycle: number;
  pedApproved: boolean;
  discApproved: boolean;
  pedReport?: InformeEvaluacion;
  discReport?: InformeEvaluacion;
  comments: { resolved: boolean }[];
  paad?: PaadContenido;
}

interface Props {
  paad: PaadResumen;
  aspectos: AspectosGeneralesPaad;
  docenteName: string;
  carreraEvalName: string;
  /** Cierre de revisión para UAP / Dirección (null si la sesión no revisa este PAAD). */
  revision?: InfoRevision | null;
  /** Abre el PAAD completo para anclar observaciones por apartado. */
  onAbrirDetalle?: () => void;
  onClose: () => void;
}

function Conformidad({ area, aprobado, informe }: { area: string; aprobado: boolean; informe?: InformeEvaluacion }) {
  const d = dictamenDe(aprobado, informe);
  const estilo =
    d === 'FAVORABLE'
      ? { cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', Icon: IconCheck }
      : d === 'CON_OBSERVACIONES'
        ? { cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', Icon: IconAlert }
        : { cls: 'bg-slate-500/15 text-muted', Icon: IconClock };
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${estilo.cls}`}>
      <estilo.Icon className="h-3 w-3" />
      {area}: {DICTAMEN_LABELS[d]}
    </span>
  );
}

/** Vista rápida del PAAD, con el formato del documento oficial (Anexo III) y la decisión de revisión. */
export function PaadModal({ paad, aspectos, docenteName, carreraEvalName, revision, onAbrirDetalle, onClose }: Props) {
  const enCorreccion = paad.state === 'OBSERVADO';
  return (
    <Modal
      open
      onClose={onClose}
      title={`PAAD · ${docenteName}`}
      widthClass="max-w-4xl"
      headerExtra={
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <StatusBadge state={paad.state} />
          <span>
            Anexo III · Ciclo {paad.cycle} · Evalúa: <strong className="text-ink">{carreraEvalName}</strong>
          </span>
        </div>
      }
      footer={
        <>
          <span className="mr-auto flex flex-wrap gap-2">
            <Conformidad area="UAP" aprobado={paad.pedApproved} informe={paad.pedReport} />
            <Conformidad area="Dirección" aprobado={paad.discApproved} informe={paad.discReport} />
          </span>
          {onAbrirDetalle && <ModalButton onClick={onAbrirDetalle}>Observar por apartado</ModalButton>}
          <BotonImprimir />
          <ModalButton variant="primary" onClick={onClose}>
            Cerrar
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        {revision && <PanelRevision revision={revision} tipo="PAAD" />}
        {!revision && enCorreccion && (
          <AvisoEstado tono="observado" titulo="PAAD devuelto al docente con observaciones.">
            Queda pendiente de corrección: {paad.comments.filter((o) => !o.resolved).length} observación(es) sin subsanar.
          </AvisoEstado>
        )}
        <div className="max-h-[62vh] overflow-y-auto rounded-xl bg-[#e6e8ec] p-3 sm:p-6 print:max-h-none print:overflow-visible print:bg-transparent print:p-0">
          <PaadDocumentoOficial aspectos={aspectos} contenido={paad.paad ?? paadVacio()} />
        </div>
      </div>
    </Modal>
  );
}
