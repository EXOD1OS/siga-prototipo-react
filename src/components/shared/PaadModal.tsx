import { useId, useState } from 'react';
import { Modal, ModalButton } from './Modal';
import { StatusBadge } from './StatusBadge';
import { AvisoEstado } from './AvisoEstado';
import { IconCheck } from '../layout/icons';
import { BotonImprimir, PaadDocumentoOficial } from '../paad/PaadDocumentoOficial';
import { SelectorCatedraPaad, TablaCatedrasPaad } from '../paad/CamposPaad';
import type { CatedraPaad } from '../../lib/paad';
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
  /** Cátedras del docente en el ciclo: el mismo PAAD se proyecta en cada una. */
  catedras: CatedraPaad[];
  /** Cátedra desde la que se abrió (PAAC) o la inicial. */
  catedraInicial: string | null;
  aspectosDe: (asignaturaId: string | null) => AspectosGeneralesPaad;
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
export function PaadModal({ paad, catedras, catedraInicial, aspectosDe, docenteName, carreraEvalName, onAbrirDetalle, onClose }: Props) {
  const enCorreccion = paad.state === 'OBSERVADO';
  const uid = useId();
  const [asigVista, setAsigVista] = useState<string | null>(catedraInicial);
  const aspectos = aspectosDe(asigVista);
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
        <div className="no-print space-y-3 rounded-xl border border-border bg-background p-3">
          <SelectorCatedraPaad
            id={`${uid}-catedra`}
            etiqueta="Viendo presentación para la cátedra:"
            catedras={catedras}
            value={asigVista}
            onChange={setAsigVista}
          />
          {catedras.length > 1 && (
            <details className="group">
              <summary className="cursor-pointer select-none text-[11px] font-semibold text-primary hover:underline">
                Otras asignaturas del docente en el ciclo ({catedras.length})
              </summary>
              <div className="mt-2">
                <TablaCatedrasPaad catedras={catedras} activa={asigVista} onElegir={setAsigVista} />
              </div>
            </details>
          )}
        </div>
        <div className="max-h-[62vh] overflow-y-auto rounded-xl bg-[#e6e8ec] p-3 sm:p-6 print:max-h-none print:overflow-visible print:bg-transparent print:p-0">
          <PaadDocumentoOficial aspectos={aspectos} contenido={paad.paad ?? paadVacio()} />
        </div>
      </div>
    </Modal>
  );
}
