import { Modal, ModalButton } from './Modal';
import { StatusBadge } from './StatusBadge';
import { AvisoEstado } from './AvisoEstado';
import { IconCheck } from '../layout/icons';
import { BotonImprimir, PaadDocumentoOficial } from '../paad/PaadDocumentoOficial';
import type { InformeEvaluacion } from '../../types/planificacion';
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
  /** Abre el formulario completo del PAAD (único lugar donde se observa o se aprueba). */
  onAbrirDetalle?: () => void;
  onClose: () => void;
}

/** El PAAD no tiene doble conformidad: indica qué área lo aprobó (basta con una). */
function Aprobacion({ paad }: { paad: PaadResumen }) {
  if (paad.state !== 'APROBADO') return null;
  const quien = paad.pedApproved ? 'UAP' : paad.discApproved ? 'Dirección de Carrera' : null;
  const informe = paad.pedApproved ? paad.pedReport : paad.discReport;
  return (
    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
      <IconCheck className="h-3 w-3" />
      Aprobado{quien && ` por ${quien}`}
      {informe?.fecha && ` · ${informe.fecha}`}
    </span>
  );
}
/** Vista rápida del PAAD con el formato del documento oficial (Anexo III). Las decisiones se toman en el formulario. */
export function PaadModal({ paad, aspectos, docenteName, carreraEvalName, onAbrirDetalle, onClose }: Props) {
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
            <Aprobacion paad={paad} />
          </span>
          {onAbrirDetalle && <ModalButton onClick={onAbrirDetalle}>Ver PAAD</ModalButton>}
          <BotonImprimir />
          <ModalButton variant="primary" onClick={onClose}>
            Cerrar
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        {enCorreccion && (
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
