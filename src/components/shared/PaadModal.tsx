import { Modal, ModalButton } from './Modal';
import { StatusBadge } from './StatusBadge';
import { BotonImprimir, PaadDocumentoOficial } from '../paad/PaadDocumentoOficial';
import { paadVacio, type AspectosGeneralesPaad, type PaadContenido } from '../../types/paad';

interface PaadResumen {
  state: string;
  cycle: number;
  pedApproved: boolean;
  discApproved: boolean;
  paad?: PaadContenido;
}

interface Props {
  paad: PaadResumen;
  aspectos: AspectosGeneralesPaad;
  docenteName: string;
  carreraEvalName: string;
  onClose: () => void;
}

function Conformidad({ area, ok }: { area: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
        ok ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-slate-500/15 text-muted'
      }`}
    >
      {area}: {ok ? '✓ Conformidad' : 'Pendiente'}
    </span>
  );
}

/** Vista rápida del PAAD presentado, con el formato del documento oficial (Anexo III). */
export function PaadModal({ paad, aspectos, docenteName, carreraEvalName, onClose }: Props) {
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
            <Conformidad area="UAP" ok={paad.pedApproved} />
            <Conformidad area="Dirección" ok={paad.discApproved} />
          </span>
          <BotonImprimir />
          <ModalButton variant="primary" onClick={onClose}>
            Cerrar
          </ModalButton>
        </>
      }
    >
      <div className="max-h-[70vh] overflow-y-auto rounded-xl bg-[#e6e8ec] p-3 sm:p-6 print:max-h-none print:overflow-visible print:bg-transparent print:p-0">
        <PaadDocumentoOficial aspectos={aspectos} contenido={paad.paad ?? paadVacio()} />
      </div>
    </Modal>
  );
}
