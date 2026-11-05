import { SectionCard } from './fields';

interface Props {
  sede?: string;
  carrera: string;
  planEstudio: string;
  asignatura: string;
  curso: string;
  regimen: string;
  creditoHorario: number;
  horasTeoricas?: number;
  horasPracticas?: number;
  contenidosMinimos: string;
  equipoCatedra: { cargo: string; nombre: string }[];
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm py-1">
      <dt className="text-gray-500">{label}</dt>
      <dd className="col-span-2 text-gray-300">{value || <span className="text-gray-600">—</span>}</dd>
    </div>
  );
}

export function AspectosGeneralesInfo({
  sede,
  carrera,
  planEstudio,
  asignatura,
  curso,
  regimen,
  creditoHorario,
  horasTeoricas,
  horasPracticas,
  contenidosMinimos,
  equipoCatedra,
}: Props) {
  return (
    <SectionCard title="Aspectos Generales">
      <p className="text-xs text-gray-500 -mt-2">
        Estos datos se completan automáticamente a partir de la estructura académica cargada por el Administrador y no son
        editables ni observables desde este formulario.
      </p>
      <dl className="divide-y divide-border">
        {sede && <Row label="Sede" value={sede} />}
        <Row label="Carrera" value={carrera} />
        <Row label="Plan de estudio" value={planEstudio} />
        <Row label="Asignatura" value={asignatura} />
        <Row label="Curso" value={curso} />
        <Row label="Régimen" value={regimen} />
        <Row label="Crédito horario" value={`${creditoHorario} hs.`} />
        {(horasTeoricas || horasPracticas) && (
          <Row label="Horas teóricas / prácticas" value={`${horasTeoricas ?? 0} / ${horasPracticas ?? 0}`} />
        )}
        <Row label="Contenidos mínimos" value={contenidosMinimos} />
        <Row label="Equipo de cátedra" value={equipoCatedra.map((e) => `${e.cargo}: ${e.nombre}`).join(' · ')} />
      </dl>
    </SectionCard>
  );
}
