import { DocumentShell, DocSection, DocField, DocTable } from './DocumentShell';
import type { PaadData } from '@/types/planificacion';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
const DIA_LABELS: Record<(typeof DIAS)[number], string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
};
const ACTIVIDAD_LABELS: Record<string, string> = {
  ENSENANZA: 'Enseñanza',
  INVESTIGACION: 'Investigación',
  EXTENSION: 'Extensión',
  FORMACION: 'Formación',
  GESTION: 'Gestión',
};

export function PaadDocumentView({ data, docenteNombre, cargo }: { data: PaadData; docenteNombre: string; cargo: string }) {
  return (
    <DocumentShell title="Plan Anual de Actividades del Docente (PAAD)" subtitle={`Anexo III — Ord. HCS 171/2019 · ${docenteNombre} (${cargo})`}>
      <DocSection title="1) Actividad de Enseñanza">
        <DocField label="Cursos y/o asignaturas atendidos" value={data.actividadEnsenanza.cursosAtendidos.join('; ')} />
        <p className="text-xs text-gray-500 mt-2 mb-1">Capacitaciones</p>
        <DocTable
          headers={['Nombre', 'Temática', 'Área', 'Lugar', 'Fecha']}
          rows={data.actividadEnsenanza.capacitaciones.map((c) => [c.nombreCapacitacion, c.tematica, c.areaConocimiento, c.lugar, c.fecha])}
        />
        <p className="text-xs text-gray-500 mt-2 mb-1">Material elaborado</p>
        <DocTable
          headers={['Área', 'Tipo', 'Autores', 'Fecha']}
          rows={data.actividadEnsenanza.materialElaborado.map((m) => [m.areaConocimiento, m.tipo, m.autores, m.fecha])}
        />
        <p className="text-xs text-gray-500 mt-2 mb-1">Otros trabajos docentes</p>
        <DocTable
          headers={['Área temática', 'Lugar', 'Fecha', 'Destinatarios', 'Nivel']}
          rows={data.actividadEnsenanza.otrosTrabajosDocentes.map((o) => [o.areaTematica, o.lugar, o.fecha, o.destinatarios, o.nivel])}
        />
      </DocSection>

      <DocSection title="2) Actividades de Investigación">
        <DocTable
          headers={['Proyecto', 'Descripción', 'Cargo', 'N° Resolución', 'Etapa']}
          rows={data.investigacion.map((i) => [i.proyecto, i.descripcion, i.cargo, i.numeroResolucion, i.etapa])}
        />
      </DocSection>

      <DocSection title="3) Formación de Recursos Humanos">
        <DocField label="Detalle" value={data.formacionRecursosHumanos.detalle} />
      </DocSection>

      <DocSection title="4) Formación Académica y/o Especialización Profesional">
        <DocField label="Detalle" value={data.formacionAcademica.detalle} />
      </DocSection>

      <DocSection title="5) Actividades de Extensión">
        <DocTable
          headers={['Proyecto', 'Destinatarios', 'Tiempo y lugar', 'Alumnos', 'Informe']}
          rows={data.extension.map((e) => [e.proyecto, e.destinatarios, e.tiempoLugar, e.alumnosInvolucrados, e.informe])}
        />
      </DocSection>

      <DocSection title="6) Actividades de Administración y Gobierno Universitario">
        <DocField label="Detalle" value={data.gestion.detalle} />
      </DocSection>

      <DocSection title="7) Otras Actividades No Previstas">
        <DocField label="Detalle" value={data.otrasActividades.join('; ')} />
      </DocSection>

      <DocSection title="8) Distribución Horaria de sus Actividades">
        <DocTable
          headers={['Actividad', ...DIAS.map((d) => DIA_LABELS[d])]}
          rows={data.distribucionHoraria.map((fila) => [
            ACTIVIDAD_LABELS[fila.actividad] ?? fila.actividad,
            ...DIAS.map((d) => (fila as any)[d] ?? ''),
          ])}
        />
      </DocSection>
    </DocumentShell>
  );
}
