import { DISCITEMS, PEDITEMS } from '../../data/mockData';
import { InformeDisciplinarForm, InformePedagogicoForm, type EncabezadoInforme } from './InformesOficiales';
import { dictamenDe, type InformeEvaluacion, type PaacDoc } from '../../types/planificacion';
import type { AreaRevision } from '../../lib/revision';

export const CLAVES_AREA: Record<AreaRevision, { informe: 'pedReport' | 'discReport'; aprobado: 'pedApproved' | 'discApproved' }> = {
  direccion: { informe: 'discReport', aprobado: 'discApproved' },
  uap: { informe: 'pedReport', aprobado: 'pedApproved' },
};

/** Informe emitido antes del modelo oficial (valoración por ítem). */
function InformeLegado({ informe, items, obs }: { informe: InformeEvaluacion; items: string[]; obs?: string }) {
  return (
    <div className="space-y-3 text-xs">
      <dl className="divide-y divide-border rounded-lg border border-border px-3">
        {items.map((item, i) => (
          <div key={item} className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-2 sm:gap-3">
            <dt className="font-medium text-muted">{item}</dt>
            <dd className={informe.items[i] ? 'text-ink' : 'italic text-muted'}>{informe.items[i] || 'Sin valorar'}</dd>
          </div>
        ))}
      </dl>
      <p className={`rounded-lg border border-border bg-background px-3 py-2.5 ${obs ? 'text-ink' : 'italic text-muted'}`}>{obs || 'Sin observaciones.'}</p>
    </div>
  );
}

/** Informe de un área en lectura: modelo oficial (Anexo III / IV), formato anterior o pendiente. */
export function InformeLectura({
  area,
  d,
  encabezado,
  equipo,
}: {
  area: AreaRevision;
  d: Pick<PaacDoc, 'pedReport' | 'discReport' | 'pedApproved' | 'discApproved'>;
  encabezado: EncabezadoInforme;
  equipo: { docenteId: string; nombre: string; cargo: string }[];
}) {
  const { informe, aprobado } = CLAVES_AREA[area];
  const inf = d[informe];
  const dictamen = dictamenDe(d[aprobado], inf);
  if (area === 'direccion' && inf?.disciplinar) {
    return <InformeDisciplinarForm encabezado={encabezado} datos={inf.disciplinar} obs={inf.obsDisciplinares ?? ''} readOnly />;
  }
  if (area === 'uap' && inf?.pedagogico) {
    return <InformePedagogicoForm encabezado={encabezado} equipo={equipo} datos={inf.pedagogico} obs={inf.obsGenerales ?? ''} readOnly />;
  }
  if (!inf || dictamen === 'PENDIENTE' || dictamen === 'REEVALUACION') {
    return (
      <div className="rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center text-xs">
        <p className="font-medium text-ink">{dictamen === 'REEVALUACION' ? 'En revisión' : 'Pendiente de evaluación'}</p>
        <p className="mt-1 text-muted">
          Este informe lo emite {area === 'uap' ? 'la UAP' : 'la Dirección de Carrera'} al cerrar su revisión del PAAC. Todavía no fue emitido.
        </p>
      </div>
    );
  }
  return area === 'uap' ? (
    <InformeLegado informe={inf} items={PEDITEMS} obs={inf.obsGenerales} />
  ) : (
    <InformeLegado informe={inf} items={DISCITEMS} obs={inf.obsDisciplinares} />
  );
}
