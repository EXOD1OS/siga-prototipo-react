import { useId } from 'react';
import { PEDITEMS, DISCITEMS } from '../../data/mockData';
import { StatusBadge } from '../shared/StatusBadge';
import { AvisoEstado } from '../shared/AvisoEstado';
import { PanelRevision, type InfoRevision } from '../shared/PanelRevision';
import { dictamenDe, DICTAMEN_BADGE, DICTAMEN_LABELS, type InformeEvaluacion, type PaacDoc } from '../../types/planificacion';
import type { AsigContext } from '../../types/estructura';
import type { AreaRevision } from '../../lib/revision';

interface Props {
  d: PaacDoc;
  asigContext: (id: string) => AsigContext;
  /** Cierre de revisión de la sesión (null si no le corresponde revisar). */
  revision: InfoRevision | null;
  onBackToDoc: (id: string) => void;
  onUpdatePedItem: (idx: number, val: string) => void;
  onUpdateDiscItem: (idx: number, val: string) => void;
  onUpdateObs: (area: AreaRevision, texto: string) => void;
}

const controlCls =
  'w-full rounded-lg border border-border bg-background p-2.5 text-xs text-ink outline-none transition focus:border-primary read-only:cursor-default disabled:cursor-default disabled:opacity-80';

function Encabezado({ titulo, tono, aprobado, informe }: { titulo: string; tono: string; aprobado: boolean; informe?: InformeEvaluacion }) {
  const dictamen = dictamenDe(aprobado, informe);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
      <div>
        <h2 className={`text-base font-bold ${tono}`}>{titulo}</h2>
        {informe?.by && (
          <p className="text-[11px] text-muted">
            Emitido por {informe.by}
            {informe.fecha && ` · ${informe.fecha}`}
          </p>
        )}
      </div>
      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${DICTAMEN_BADGE[dictamen]}`}>{DICTAMEN_LABELS[dictamen]}</span>
    </div>
  );
}

/** Informes Pedagógico (UAP) y Disciplinar (Dirección) de un PAAC, con el cierre de revisión. */
export function ReportEvaluationView({ d, asigContext, revision, onBackToDoc, onUpdatePedItem, onUpdateDiscItem, onUpdateObs }: Props) {
  const ctx = asigContext(d.asignaturaId);
  const uid = useId();
  const editaUap = revision?.area === 'uap';
  const editaDir = revision?.area === 'direccion';

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <StatusBadge state={d.state} />
          <h1 className="mt-1 text-2xl font-bold text-ink">Informes de Evaluación · {ctx.asig?.nombre}</h1>
        </div>
        <button type="button" onClick={() => onBackToDoc(d.id)} className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-ink hover:bg-background">
          ← Volver al PAAC
        </button>
      </div>

      {revision ? (
        <PanelRevision revision={revision} tipo="PAAC" />
      ) : d.state === 'OBSERVADO' ? (
        <AvisoEstado tono="observado" titulo="PAAC devuelto al docente con observaciones.">
          La revisión se reabre cuando el docente subsane y vuelva a presentar.
        </AvisoEstado>
      ) : (
        <AvisoEstado tono="lectura" titulo="Informes en modo lectura.">
          Solo la UAP y la Dirección de la carrera emiten informes mientras el PAAC está en revisión.
        </AvisoEstado>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <Encabezado titulo="Informe Pedagógico UAP (Anexo III)" tono="text-amber-700 dark:text-amber-400" aprobado={d.pedApproved} informe={d.pedReport} />
          {PEDITEMS.map((item, idx) => (
            <div key={idx}>
              <label htmlFor={`${uid}-ped-${idx}`} className="mb-1 block text-xs font-semibold text-ink">
                {item}
              </label>
              <textarea
                id={`${uid}-ped-${idx}`}
                rows={2}
                readOnly={!editaUap}
                value={d.pedReport.items[idx] || ''}
                onChange={(e) => onUpdatePedItem(idx, e.target.value)}
                className={controlCls}
              />
            </div>
          ))}
          <div>
            <label htmlFor={`${uid}-ped-obs`} className="mb-1 block text-xs font-semibold text-ink">
              Sugerencias y observaciones generales
            </label>
            <textarea
              id={`${uid}-ped-obs`}
              rows={3}
              readOnly={!editaUap}
              value={d.pedReport.obsGenerales ?? ''}
              placeholder={editaUap ? 'Motivos de la devolución o del dictamen favorable…' : ''}
              onChange={(e) => onUpdateObs('uap', e.target.value)}
              className={controlCls}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <Encabezado titulo="Informe Disciplinar Dirección (Anexo IV)" tono="text-primary" aprobado={d.discApproved} informe={d.discReport} />
          {DISCITEMS.map((item, idx) => (
            <div key={idx}>
              <label htmlFor={`${uid}-disc-${idx}`} className="mb-1 block text-xs font-semibold text-ink">
                {item}
              </label>
              <select
                id={`${uid}-disc-${idx}`}
                disabled={!editaDir}
                value={d.discReport.items[idx] || ''}
                onChange={(e) => onUpdateDiscItem(idx, e.target.value)}
                className={controlCls}
              >
                <option value="">Seleccionar verificación…</option>
                {['Cumple', 'Cumple parcialmente', 'Requiere corrección'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div>
            <label htmlFor={`${uid}-disc-obs`} className="mb-1 block text-xs font-semibold text-ink">
              Observaciones y resolución de la Dirección
            </label>
            <textarea
              id={`${uid}-disc-obs`}
              rows={3}
              readOnly={!editaDir}
              value={d.discReport.obsDisciplinares ?? ''}
              placeholder={editaDir ? 'Motivos de la devolución o del dictamen favorable…' : ''}
              onChange={(e) => onUpdateObs('direccion', e.target.value)}
              className={controlCls}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
