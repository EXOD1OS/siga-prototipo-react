import { useId, useState } from 'react';
import { StatusBadge } from '../shared/StatusBadge';
import { AvisoEstado } from '../shared/AvisoEstado';
import { btnAprobar, btnObservar, btnSecundario, type InfoRevision } from '../shared/PanelRevision';
import { InformeDisciplinarForm, InformePedagogicoForm } from '../informes/InformesOficiales';
import { InformeLectura } from '../informes/InformeLectura';
import { IconCheck, IconRefresh, IconReturn } from '../layout/icons';
import { dictamenDe, DICTAMEN_BADGE, DICTAMEN_LABELS, type InformeEvaluacion, type PaacDoc } from '../../types/planificacion';
import type { AsigContext, EquipoCatedra } from '../../types/estructura';
import type { InformeDisciplinarDatos, InformePedagogicoDatos } from '../../types/informes';
import { AREA_LABEL, type AreaRevision } from '../../lib/revision';
import {
  encabezadoInforme,
  integrantesEquipo,
  observacionSugerida,
  sugerirInformeDisciplinar,
  sugerirInformePedagogico,
  type DocPaadResumen,
} from '../../lib/informes';

interface Props {
  d: PaacDoc;
  asigContext: (id: string) => AsigContext;
  /** Equipo de cátedra del ciclo vigente. */
  equipo: EquipoCatedra[];
  /** Documentos del sistema (para saber qué integrantes presentaron su PAAD). */
  docs: DocPaadResumen[];
  fullName: (id: string) => string;
  /** Cierre de revisión de la sesión (null si no le corresponde revisar). */
  revision: InfoRevision | null;
  onBackToDoc: (id: string) => void;
}

const META: Record<AreaRevision, { titulo: string; tono: string; informe: 'pedReport' | 'discReport'; aprobado: 'pedApproved' | 'discApproved' }> = {
  direccion: { titulo: 'Informe Disciplinar · Dirección de Carrera', tono: 'text-primary', informe: 'discReport', aprobado: 'discApproved' },
  uap: { titulo: 'Informe Pedagógico · UAP', tono: 'text-amber-700 dark:text-amber-400', informe: 'pedReport', aprobado: 'pedApproved' },
};

function Encabezado({ area, d }: { area: AreaRevision; d: PaacDoc }) {
  const m = META[area];
  const informe = d[m.informe];
  const dictamen = dictamenDe(d[m.aprobado], informe);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
      <div>
        <h2 className={`text-base font-bold ${m.tono}`}>{m.titulo}</h2>
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

/**
 * Informes Pedagógico (UAP, Anexo III) y Disciplinar (Dirección, Anexo IV) del PAAC — Ord. HCS N° 219/2022.
 * El área que revisa recibe su informe autocompletado desde el PAAC, lo ajusta y confirma el dictamen.
 */
export function ReportEvaluationView({ d, asigContext, equipo, docs, fullName, revision, onBackToDoc }: Props) {
  const ctx = asigContext(d.asignaturaId);
  const encabezado = encabezadoInforme(ctx, d.cycle);
  const integrantes = integrantesEquipo(equipo, fullName);
  const area = revision?.area ?? null;
  const idAyuda = useId();

  const sugerencia = () => ({
    disciplinar: sugerirInformeDisciplinar({ d, equipo, docs, fullName }),
    pedagogico: sugerirInformePedagogico(d),
  });
  const obsGuardada = (a: AreaRevision) => (a === 'uap' ? d.pedReport?.obsGenerales : d.discReport?.obsDisciplinares) ?? '';

  const [disc, setDisc] = useState<InformeDisciplinarDatos>(() => sugerencia().disciplinar);
  const [ped, setPed] = useState<InformePedagogicoDatos>(() => sugerencia().pedagogico);
  const [obs, setObs] = useState(() => (area ? obsGuardada(area) || observacionSugerida(d, area) : ''));
  const [restaurado, setRestaurado] = useState(false);

  const restaurar = () => {
    if (!area) return;
    const s = sugerencia();
    setDisc(s.disciplinar);
    setPed(s.pedagogico);
    setObs(observacionSugerida(d, area));
    setRestaurado(true);
  };

  const datosInforme = (): Partial<InformeEvaluacion> =>
    area === 'direccion' ? { disciplinar: disc, obsDisciplinares: obs.trim() } : { pedagogico: ped, obsGenerales: obs.trim() };

  const pendientes = revision?.pendientes ?? 0;
  // Devolver sin motivo deja al docente sin saber qué corregir: se pide una observación anclada o escrita.
  const puedeObservar = pendientes > 0 || obs.trim() !== '';
  const otraArea: AreaRevision = area === 'uap' ? 'direccion' : 'uap';

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <StatusBadge state={d.state} />
          <h1 className="mt-1 text-2xl font-bold text-ink">Informes de Evaluación · {ctx.asig?.nombre}</h1>
        </div>
        <button
          type="button"
          onClick={() => onBackToDoc(d.id)}
          className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          ← Volver al PAAC
        </button>
      </div>

      {revision && area ? (
        <>
          <AvisoEstado tono="revision" titulo={`Informe ${area === 'uap' ? 'Pedagógico' : 'Disciplinar'} autocompletado desde el PAAC.`}>
            Revisá los valores sugeridos y modificá cualquier selector o texto antes de confirmar. El dictamen favorable queda firme recién al presionar
            «Confirmar Informe y Emitir Dictamen Favorable».
          </AvisoEstado>

          <section className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6">
            <Encabezado area={area} d={d} />
            {area === 'direccion' ? (
              <InformeDisciplinarForm encabezado={encabezado} datos={disc} obs={obs} readOnly={false} onChange={setDisc} onObs={setObs} />
            ) : (
              <InformePedagogicoForm encabezado={encabezado} equipo={integrantes} datos={ped} obs={obs} readOnly={false} onChange={setPed} onObs={setObs} />
            )}

            <div className="mt-4 space-y-3 rounded-xl border border-border bg-background p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button type="button" onClick={restaurar} className={`${btnSecundario} flex items-center justify-center gap-2`}>
                  <IconRefresh className="h-4 w-4" />
                  Restaurar autocompletado sugerido
                </button>
                <span role="status" className="text-[11px] text-muted sm:mr-auto">
                  {restaurado ? 'Se regeneraron los valores a partir del PAAC.' : ''}
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={!puedeObservar}
                  onClick={() => revision.onFinalizar('OBSERVADO', datosInforme())}
                  aria-describedby={idAyuda}
                  title={`Devuelve el PAAC al docente con las observaciones de ${AREA_LABEL[area].corto}`}
                  className={btnObservar}
                >
                  <IconReturn className="h-4 w-4" />
                  Enviar con revisiones (Observado)
                </button>
                <button
                  type="button"
                  disabled={pendientes > 0}
                  onClick={() => revision.onFinalizar('FAVORABLE', datosInforme())}
                  aria-describedby={idAyuda}
                  className={btnAprobar}
                >
                  <IconCheck className="h-4 w-4" />
                  Confirmar Informe y Emitir Dictamen Favorable
                </button>
              </div>
              <p id={idAyuda} className="text-[11px] text-muted">
                {pendientes > 0
                  ? `Tenés ${pendientes} observación(es) anclada(s) sin subsanar: el dictamen favorable se habilita cuando el docente las corrija o las elimines.`
                  : !puedeObservar
                    ? 'Para enviar con revisiones, anclá observaciones en el PAAC o escribí el motivo en «Observación».'
                    : `Al confirmar se guarda el informe y se registra el ${AREA_LABEL[area].dictamen} favorable.`}
              </p>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6">
            <Encabezado area={otraArea} d={d} />
            <InformeLectura area={otraArea} d={d} encabezado={encabezado} equipo={integrantes} />
          </section>
        </>
      ) : (
        <>
          {d.state === 'OBSERVADO' ? (
            <AvisoEstado tono="observado" titulo="PAAC devuelto al docente con observaciones.">
              La revisión se reabre cuando el docente subsane y vuelva a presentar.
            </AvisoEstado>
          ) : (
            <AvisoEstado tono="lectura" titulo="Informes en modo lectura.">
              Solo la UAP y la Dirección de la carrera emiten informes mientras el PAAC está en revisión.
            </AvisoEstado>
          )}
          {(['direccion', 'uap'] as const).map((a) => (
            <section key={a} className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6">
              <Encabezado area={a} d={d} />
              <InformeLectura area={a} d={d} encabezado={encabezado} equipo={integrantes} />
            </section>
          ))}
        </>
      )}
    </div>
  );
}
