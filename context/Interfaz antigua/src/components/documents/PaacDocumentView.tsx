import { DocumentShell, DocSection, DocField, DocTable } from './DocumentShell';
import type { PaacTraditionalData, PaacCompetenciasData } from '@/types/planificacion';

export function PaacDocumentView({ data, enfoque }: { data: any; enfoque: string }) {
  if (enfoque === 'COMPETENCIAS') {
    return <PaacCompetenciasDocument data={data as PaacCompetenciasData} />;
  }
  return <PaacTraditionalDocument data={data as PaacTraditionalData} />;
}

function PaacTraditionalDocument({ data }: { data: PaacTraditionalData }) {
  return (
    <DocumentShell title="Plan Anual de Actividades de Cátedra (PAAC)" subtitle="Anexo II — Ord. HCS 171/2019">
      <DocSection title="Aspectos Generales">
        <DocField label="Asignatura" value={data.encabezado.asignatura} />
        <DocField label="Carrera" value={data.encabezado.carrera} />
        <DocField label="Plan de estudio" value={data.encabezado.planEstudio} />
        <DocField label="Curso" value={data.encabezado.curso} />
        <DocField label="Régimen" value={data.encabezado.regimen} />
      </DocSection>

      <DocSection title="Fundamentación">
        <DocField label="Importancia de la asignatura" value={data.fundamentacion.introduccion.importancia} />
        <DocField label="Relación con el perfil profesional" value={data.fundamentacion.introduccion.relacionPerfil} />
        <DocField label="Articulación con correlativas" value={data.fundamentacion.diagnostico.articulacionCorrelativas} />
        <DocField label="Articulación con el mismo año" value={data.fundamentacion.diagnostico.articulacionMismoAno} />
        <DocField label="Infraestructura requerida" value={data.fundamentacion.diagnostico.infraestructura} />
      </DocSection>

      <DocSection title="Objetivos">
        <DocField label="Conceptuales" value={data.objetivos.catedra.conceptuales.join('; ')} />
        <DocField label="Procedimentales" value={data.objetivos.catedra.procedimentales.join('; ')} />
        <DocField label="Actitudinales" value={data.objetivos.catedra.actitudinales.join('; ')} />
        <DocField label="Específicos" value={data.objetivos.especificos.join('; ')} />
      </DocSection>

      <DocSection title="Metodología de Enseñanza">
        <DocField label="Clases teóricas" value={data.metodologiaEnsenanza.clasesTeoricas} />
        <DocField label="Clases prácticas" value={data.metodologiaEnsenanza.clasesPracticas} />
        <DocField label="Recursos didácticos" value={data.metodologiaEnsenanza.recursosDidacticos.join('; ')} />
      </DocSection>

      <DocSection title="Metodología de Evaluación">
        <DocField label="Tipos" value={data.metodologiaEvaluacion.tipos.join(', ')} />
        <DocField label="Modalidades" value={data.metodologiaEvaluacion.modalidades.join(', ')} />
        <DocField label="Criterios" value={data.metodologiaEvaluacion.criterios} />
        <DocField label="Régimen promocional" value={data.metodologiaEvaluacion.regimenAprobacion.promocional} />
        <DocField label="Régimen regular" value={data.metodologiaEvaluacion.regimenAprobacion.regular} />
        <DocField label="Régimen libre" value={data.metodologiaEvaluacion.regimenAprobacion.libre} />
      </DocSection>

      <DocSection title="Trabajos Prácticos">
        <DocField label="Detalle" value={data.trabajosPracticos.detalleTp} />
        {data.trabajosPracticos.laboratorio && <DocField label="Laboratorio" value={data.trabajosPracticos.laboratorio} />}
      </DocSection>

      <DocSection title="Bibliografía Básica">
        <DocTable
          headers={['Autor', 'Título', 'Año', 'Editorial']}
          rows={data.bibliografia.basica.map((b) => [b.autor, b.titulo, b.ano, b.editorial])}
        />
      </DocSection>
      <DocSection title="Bibliografía Complementaria">
        <DocTable
          headers={['Autor', 'Título', 'Año', 'Editorial']}
          rows={data.bibliografia.complementaria.map((b) => [b.autor, b.titulo, b.ano, b.editorial])}
        />
      </DocSection>

      <DocSection title="Distribución Horaria">
        <DocField label="Horas semanales" value={data.distribucionHoraria.horasSemanales} />
        <DocField label="Horas totales" value={data.distribucionHoraria.horasTotales} />
        <DocField label="Cronograma" value={data.distribucionHoraria.cronograma} />
      </DocSection>
    </DocumentShell>
  );
}

function PaacCompetenciasDocument({ data }: { data: PaacCompetenciasData }) {
  return (
    <DocumentShell title="Plan Anual de Actividades de Cátedra (PAAC)" subtitle="Plan por competencias">
      <DocSection title="Aspectos Generales">
        <DocField label="Sede" value={data.encabezado.sede} />
        <DocField label="Carrera" value={data.encabezado.carrera} />
        <DocField label="Plan de estudio" value={data.encabezado.planEstudio} />
        <DocField label="Curso" value={data.encabezado.curso} />
        <DocField label="Asignatura" value={data.encabezado.asignatura} />
        <DocField label="Régimen" value={data.encabezado.regimen} />
        <DocField label="Crédito horario" value={`${data.encabezado.creditoHorario} hs.`} />
        <DocField label="Horas teóricas / prácticas" value={`${data.encabezado.horasTeoricas} / ${data.encabezado.horasPracticas}`} />
        <DocField label="Nivel de intensidad" value={`Nivel ${data.encabezado.nivelIntensidad}`} />
        <DocField label="Relación teórico-práctica" value={data.encabezado.relacionTeoricoPractica} />
        <DocField label="Equipo de cátedra" value={data.encabezado.equipoCatedra.map((e) => `${e.cargo}: ${e.nombre}`).join(' · ')} />
        <DocField label="Contenidos mínimos" value={data.encabezado.contenidosMinimos} />
      </DocSection>

      <DocSection title="Fundamentación">
        <DocField label="Importancia de la asignatura" value={data.fundamentacion.importanciaAsignatura} />
      </DocSection>

      <DocSection title="Matriz de Competencias">
        <DocTable
          headers={['Código', 'Tipo', 'Detalle', 'Nivel de aporte']}
          rows={data.fundamentacion.matrizCompetencias.map((c) => [c.codigo, c.tipo.replaceAll('_', ' '), c.detalle, c.nivelAporte])}
        />
      </DocSection>

      <DocSection title="Diagnóstico">
        <DocField label="Articulación con correlativas" value={data.fundamentacion.diagnostico.articulacionCorrelativas} />
        <DocField label="Articulación con el mismo año" value={data.fundamentacion.diagnostico.articulacionMismoAno} />
        <DocField label="Análisis de los estudiantes" value={data.fundamentacion.diagnostico.analisisEstudiantes} />
        <DocField label="Infraestructura requerida" value={data.fundamentacion.diagnostico.infraestructuraRequerida} />
      </DocSection>

      <DocSection title="Objetivo, Propósito y Resultados de Aprendizaje">
        <DocField label="Objetivos de la carrera" value={data.objetivosPropositoRA.objetivosCarrera} />
        <DocField label="Propósito de la asignatura" value={data.objetivosPropositoRA.propositoAsignatura.join('; ')} />
        <DocTable
          headers={['RA', 'Detalle']}
          rows={data.objetivosPropositoRA.resultadosAprendizaje.map((r) => [r.codigo, r.detalle])}
        />
      </DocSection>

      <DocSection title="Metodología">
        <DocField label="Enfoque de enseñanza" value={data.metodologia.enfoque} />
        <DocTable
          headers={['Competencia', 'RA', 'Unidad/Tema', 'Guía TP', 'Actividad formativa', 'Estrategia']}
          rows={data.metodologia.propuestaDesarrolloCompetencias.map((p) => [
            p.competencia,
            p.resultadoAprendizaje,
            p.unidadTema,
            p.guiaTp,
            p.actividadFormativa,
            p.estrategiaEnsenanza,
          ])}
        />
      </DocSection>

      <DocSection title="Contenidos">
        <DocTable headers={['Unidad', 'Título', 'Detalle']} rows={data.contenidos.map((c) => [c.unidad, c.titulo, c.detalle])} />
      </DocSection>

      <DocSection title="Programa de Trabajos Prácticos">
        <DocTable
          headers={['TP N°', 'Título', 'Propósito', 'Modalidad', 'Unidad/Temas']}
          rows={data.programaTrabajosPracticos.map((tp) => [tp.numero, tp.titulo, tp.proposito.join('; '), tp.modalidad, tp.unidadTemas])}
        />
      </DocSection>

      <DocSection title="Evaluación">
        <DocField label="Tipos" value={data.evaluacion.tipos.join(', ')} />
        <DocField label="Criterios" value={data.evaluacion.criterios.join('; ')} />
        <DocField label="Técnicas" value={data.evaluacion.tecnicas.join('; ')} />
        <DocField label="Régimen promocional" value={data.evaluacion.regimenAprobacion.promocional} />
        <DocField label="Régimen regular" value={data.evaluacion.regimenAprobacion.regular} />
        <DocField label="Régimen libre" value={data.evaluacion.regimenAprobacion.libre} />
      </DocSection>

      <DocSection title="Bibliografía Básica">
        <DocTable
          headers={['Título', 'Autores', 'Editorial', 'Año', 'Enlace']}
          rows={data.bibliografia.basica.map((b) => [b.titulo, b.autores, b.editorial, b.ano, b.enlace ?? ''])}
        />
      </DocSection>
      <DocSection title="Bibliografía Complementaria">
        <DocTable
          headers={['Título', 'Autores', 'Editorial', 'Año', 'Enlace']}
          rows={data.bibliografia.complementaria.map((b) => [b.titulo, b.autores, b.editorial, b.ano, b.enlace ?? ''])}
        />
      </DocSection>

      <DocSection title="Horarios de Clases">
        <DocTable
          headers={['Día', 'Horas teóricas', 'Horas prácticas']}
          rows={data.horariosClases.map((h) => [h.dia, h.horasTeoricas ?? '', h.horasPracticas ?? ''])}
        />
      </DocSection>

      <DocSection title="Cronograma">
        <DocTable
          headers={['Semana', 'Unidad', 'Hs. teóricas', 'TP N°', 'Hs. prácticas', 'Evaluación']}
          rows={data.cronograma.map((c) => [c.semana, c.unidad ?? '', c.horasTeoricas ?? '', c.tpNumero ?? '', c.horasPracticas ?? '', c.evaluacion ?? ''])}
        />
      </DocSection>
    </DocumentShell>
  );
}
