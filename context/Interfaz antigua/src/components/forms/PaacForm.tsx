'use client';

import { useState, useTransition } from 'react';
import { actualizarPaac } from '@/actions/planificacion.actions';
import { ObservationFieldWrapper } from '@/components/ObservationFieldWrapper';
import { AspectosGeneralesInfo } from './AspectosGeneralesInfo';
import {
  TextField,
  TextAreaField,
  ListField,
  NumberField,
  SelectField,
  CheckboxGroupField,
  SectionCard,
  RepeatableList,
} from './fields';
import type { PaacTraditionalData, PaacCompetenciasData } from '@/types/planificacion';

interface Observacion {
  id: string;
  campoPath: string;
  mensaje: string;
  rolAutor: string;
  resuelto: boolean;
}

interface InfoGeneral {
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

interface Props {
  planificacionId: string;
  data: PaacTraditionalData | PaacCompetenciasData;
  enfoque: string;
  editable: boolean;
  canObserve: boolean;
  canResolve: boolean;
  observaciones: Observacion[];
  infoGeneral: InfoGeneral;
}

function obsFor(observaciones: Observacion[], path: string) {
  return observaciones.filter((o) => o.campoPath === path);
}

export function PaacForm({ planificacionId, data, enfoque, editable, canObserve, canResolve, observaciones, infoGeneral }: Props) {
  const [form, setForm] = useState<any>(data);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const esCompetencias = enfoque === 'COMPETENCIAS';

  function update(updater: (draft: any) => void) {
    setForm((prev: any) => {
      const draft = structuredClone(prev);
      updater(draft);
      return draft;
    });
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await actualizarPaac(planificacionId, form);
      setSaved(true);
    });
  }

  const wrap = (path: string, node: React.ReactNode) => (
    <ObservationFieldWrapper
      planificacionId={planificacionId}
      documentoTipo="PAAC"
      fieldPath={path}
      observaciones={obsFor(observaciones, path)}
      canObserve={canObserve}
      canResolve={canResolve}
    >
      {node}
    </ObservationFieldWrapper>
  );

  return (
    <div className="space-y-5">
      <AspectosGeneralesInfo {...infoGeneral} />

      {esCompetencias ? (
        <PaacCompetenciasFields form={form} update={update} wrap={wrap} editable={editable} />
      ) : (
        <PaacTraditionalFields form={form} update={update} wrap={wrap} editable={editable} />
      )}

      {editable && (
        <div className="flex items-center gap-3 sticky bottom-4">
          <button
            type="button"
            disabled={pending}
            onClick={handleSave}
            className="bg-primary hover:bg-primary-hover transition-colors text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50 shadow-lg"
          >
            {pending ? 'Guardando...' : 'Guardar PAAC'}
          </button>
          {saved && !pending && <span className="text-xs text-success">Guardado.</span>}
        </div>
      )}
    </div>
  );
}

type Updater = (updater: (draft: any) => void) => void;
type Wrap = (path: string, node: React.ReactNode) => React.ReactNode;

// ============================================================================
// Variante Tradicional — Ord. HCS 171/2019 Anexo II + Ord. HCS 219/2022
// ============================================================================

function PaacTraditionalFields({
  form,
  update,
  wrap,
  editable,
}: {
  form: PaacTraditionalData;
  update: Updater;
  wrap: Wrap;
  editable: boolean;
}) {
  return (
    <>
      <SectionCard title="Fundamentación">
        {wrap(
          'fundamentacion.introduccion.importancia',
          <TextAreaField
            label="Importancia de la asignatura"
            value={form.fundamentacion.introduccion.importancia}
            disabled={!editable}
            onChange={(v) => update((d) => (d.fundamentacion.introduccion.importancia = v))}
          />
        )}
        {wrap(
          'fundamentacion.introduccion.relacionPerfil',
          <TextAreaField
            label="Relación con el perfil profesional"
            value={form.fundamentacion.introduccion.relacionPerfil}
            disabled={!editable}
            onChange={(v) => update((d) => (d.fundamentacion.introduccion.relacionPerfil = v))}
          />
        )}
        <div className="grid grid-cols-1 gap-4">
          {wrap(
            'fundamentacion.diagnostico.articulacionCorrelativas',
            <TextAreaField
              label="Articulación con correlativas"
              rows={2}
              value={form.fundamentacion.diagnostico.articulacionCorrelativas}
              disabled={!editable}
              onChange={(v) => update((d) => (d.fundamentacion.diagnostico.articulacionCorrelativas = v))}
            />
          )}
          {wrap(
            'fundamentacion.diagnostico.articulacionMismoAno',
            <TextAreaField
              label="Articulación con asignaturas del mismo año"
              rows={2}
              value={form.fundamentacion.diagnostico.articulacionMismoAno}
              disabled={!editable}
              onChange={(v) => update((d) => (d.fundamentacion.diagnostico.articulacionMismoAno = v))}
            />
          )}
          {wrap(
            'fundamentacion.diagnostico.infraestructura',
            <TextAreaField
              label="Infraestructura requerida"
              rows={2}
              value={form.fundamentacion.diagnostico.infraestructura}
              disabled={!editable}
              onChange={(v) => update((d) => (d.fundamentacion.diagnostico.infraestructura = v))}
            />
          )}
        </div>
      </SectionCard>

      <SectionCard title="Objetivos (Anexo II)">
        {wrap(
          'objetivos.catedra.conceptuales',
          <ListField
            label="Conceptuales"
            value={form.objetivos.catedra.conceptuales}
            disabled={!editable}
            onChange={(v) => update((d) => (d.objetivos.catedra.conceptuales = v))}
          />
        )}
        {wrap(
          'objetivos.catedra.procedimentales',
          <ListField
            label="Procedimentales"
            value={form.objetivos.catedra.procedimentales}
            disabled={!editable}
            onChange={(v) => update((d) => (d.objetivos.catedra.procedimentales = v))}
          />
        )}
        {wrap(
          'objetivos.catedra.actitudinales',
          <ListField
            label="Actitudinales"
            value={form.objetivos.catedra.actitudinales}
            disabled={!editable}
            onChange={(v) => update((d) => (d.objetivos.catedra.actitudinales = v))}
          />
        )}
        {wrap(
          'objetivos.especificos',
          <ListField
            label="Objetivos específicos"
            value={form.objetivos.especificos}
            disabled={!editable}
            onChange={(v) => update((d) => (d.objetivos.especificos = v))}
          />
        )}
      </SectionCard>

      <SectionCard title="Metodología de Enseñanza">
        {wrap(
          'metodologiaEnsenanza.clasesTeoricas',
          <TextAreaField
            label="Clases teóricas"
            rows={2}
            value={form.metodologiaEnsenanza.clasesTeoricas}
            disabled={!editable}
            onChange={(v) => update((d) => (d.metodologiaEnsenanza.clasesTeoricas = v))}
          />
        )}
        {wrap(
          'metodologiaEnsenanza.clasesPracticas',
          <TextAreaField
            label="Clases prácticas"
            rows={2}
            value={form.metodologiaEnsenanza.clasesPracticas}
            disabled={!editable}
            onChange={(v) => update((d) => (d.metodologiaEnsenanza.clasesPracticas = v))}
          />
        )}
        {wrap(
          'metodologiaEnsenanza.recursosDidacticos',
          <ListField
            label="Recursos didácticos"
            value={form.metodologiaEnsenanza.recursosDidacticos}
            disabled={!editable}
            onChange={(v) => update((d) => (d.metodologiaEnsenanza.recursosDidacticos = v))}
          />
        )}
      </SectionCard>

      <SectionCard title="Metodología de Evaluación">
        {wrap(
          'metodologiaEvaluacion.tipos',
          <CheckboxGroupField
            label="Tipos de evaluación"
            value={form.metodologiaEvaluacion.tipos}
            options={['INICIAL', 'DE_PROCESO', 'FINAL']}
            disabled={!editable}
            onChange={(v) => update((d) => (d.metodologiaEvaluacion.tipos = v))}
          />
        )}
        {wrap(
          'metodologiaEvaluacion.modalidades',
          <CheckboxGroupField
            label="Modalidades"
            value={form.metodologiaEvaluacion.modalidades}
            options={[
              'ORAL_INDIVIDUAL',
              'ORAL_GRUPAL',
              'ESCRITA_INDIVIDUAL',
              'ESCRITA_GRUPAL',
              'INFORME_MONOGRAFIA',
              'TRABAJOS_PRACTICOS',
            ]}
            disabled={!editable}
            onChange={(v) => update((d) => (d.metodologiaEvaluacion.modalidades = v))}
          />
        )}
        {wrap(
          'metodologiaEvaluacion.criterios',
          <TextAreaField
            label="Criterios de evaluación"
            rows={2}
            value={form.metodologiaEvaluacion.criterios}
            disabled={!editable}
            onChange={(v) => update((d) => (d.metodologiaEvaluacion.criterios = v))}
          />
        )}
        <div className="grid grid-cols-1 gap-3">
          {wrap(
            'metodologiaEvaluacion.regimenAprobacion.promocional',
            <TextField
              label="Régimen promocional"
              value={form.metodologiaEvaluacion.regimenAprobacion.promocional}
              disabled={!editable}
              onChange={(v) => update((d) => (d.metodologiaEvaluacion.regimenAprobacion.promocional = v))}
            />
          )}
          {wrap(
            'metodologiaEvaluacion.regimenAprobacion.regular',
            <TextField
              label="Régimen regular"
              value={form.metodologiaEvaluacion.regimenAprobacion.regular}
              disabled={!editable}
              onChange={(v) => update((d) => (d.metodologiaEvaluacion.regimenAprobacion.regular = v))}
            />
          )}
          {wrap(
            'metodologiaEvaluacion.regimenAprobacion.libre',
            <TextField
              label="Régimen libre"
              value={form.metodologiaEvaluacion.regimenAprobacion.libre}
              disabled={!editable}
              onChange={(v) => update((d) => (d.metodologiaEvaluacion.regimenAprobacion.libre = v))}
            />
          )}
        </div>
      </SectionCard>

      <SectionCard title="Trabajos Prácticos">
        {wrap(
          'trabajosPracticos.detalleTp',
          <TextAreaField
            label="Detalle de TP"
            value={form.trabajosPracticos.detalleTp}
            disabled={!editable}
            onChange={(v) => update((d) => (d.trabajosPracticos.detalleTp = v))}
          />
        )}
        {wrap(
          'trabajosPracticos.laboratorio',
          <TextAreaField
            label="Laboratorio (opcional)"
            rows={2}
            value={form.trabajosPracticos.laboratorio ?? ''}
            disabled={!editable}
            onChange={(v) => update((d) => (d.trabajosPracticos.laboratorio = v))}
          />
        )}
      </SectionCard>

      <SectionCard title="Bibliografía">
        {(['basica', 'complementaria'] as const).map((tipo) => (
          <RepeatableList
            key={tipo}
            label={tipo === 'basica' ? 'Bibliografía básica' : 'Bibliografía complementaria'}
            items={form.bibliografia[tipo]}
            disabled={!editable}
            newItem={() => ({ autor: '', titulo: '', ano: new Date().getFullYear(), editorial: '' })}
            onChange={(items) => update((d) => (d.bibliografia[tipo] = items))}
            renderItem={(item, patch) => (
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-3">
                  <TextField label="Autor" value={item.autor} disabled={!editable} onChange={(v) => patch({ autor: v })} />
                </div>
                <div className="col-span-4">
                  <TextField label="Título" value={item.titulo} disabled={!editable} onChange={(v) => patch({ titulo: v })} />
                </div>
                <div className="col-span-2">
                  <NumberField label="Año" value={item.ano} disabled={!editable} onChange={(v) => patch({ ano: v })} />
                </div>
                <div className="col-span-3">
                  <TextField
                    label="Editorial"
                    value={item.editorial}
                    disabled={!editable}
                    onChange={(v) => patch({ editorial: v })}
                  />
                </div>
              </div>
            )}
          />
        ))}
      </SectionCard>

      <SectionCard title="Distribución Horaria">
        <div className="grid grid-cols-3 gap-4">
          <NumberField
            label="Horas semanales"
            value={form.distribucionHoraria.horasSemanales}
            disabled={!editable}
            onChange={(v) => update((d) => (d.distribucionHoraria.horasSemanales = v))}
          />
          <NumberField
            label="Horas totales"
            value={form.distribucionHoraria.horasTotales}
            disabled={!editable}
            onChange={(v) => update((d) => (d.distribucionHoraria.horasTotales = v))}
          />
          <TextField
            label="Cronograma"
            value={form.distribucionHoraria.cronograma}
            disabled={!editable}
            onChange={(v) => update((d) => (d.distribucionHoraria.cronograma = v))}
          />
        </div>
      </SectionCard>
    </>
  );
}

// ============================================================================
// Variante por Competencias — planes nuevos de ISI y LSI
// ============================================================================

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'] as const;

function PaacCompetenciasFields({
  form,
  update,
  wrap,
  editable,
}: {
  form: PaacCompetenciasData;
  update: Updater;
  wrap: Wrap;
  editable: boolean;
}) {
  return (
    <>
      <SectionCard title="Fundamentación">
        {wrap(
          'fundamentacion.importanciaAsignatura',
          <TextAreaField
            label="Importancia de la asignatura en el plan de estudios"
            rows={4}
            value={form.fundamentacion.importanciaAsignatura}
            disabled={!editable}
            onChange={(v) => update((d) => (d.fundamentacion.importanciaAsignatura = v))}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          {wrap(
            'encabezado.nivelIntensidad',
            <SelectField
              label="Nivel de intensidad"
              value={String(form.encabezado.nivelIntensidad)}
              disabled={!editable}
              options={[0, 1, 2, 3].map((n) => ({ value: String(n), label: `Nivel ${n}` }))}
              onChange={(v) => update((d) => (d.encabezado.nivelIntensidad = Number(v)))}
            />
          )}
          {wrap(
            'encabezado.relacionTeoricoPractica',
            <TextField
              label="Relación teórico-práctica"
              value={form.encabezado.relacionTeoricoPractica}
              disabled={!editable}
              onChange={(v) => update((d) => (d.encabezado.relacionTeoricoPractica = v))}
            />
          )}
        </div>

        <RepeatableList
          label="Matriz de competencias de egreso (nivel de aporte de la asignatura)"
          items={form.fundamentacion.matrizCompetencias}
          disabled={!editable}
          newItem={() => ({ codigo: '', tipo: 'ESPECIFICA' as const, detalle: '', nivelAporte: 1 as const })}
          onChange={(items) => update((d) => (d.fundamentacion.matrizCompetencias = items))}
          renderItem={(item, patch) => (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-2">
                  <TextField label="Código" value={item.codigo} disabled={!editable} onChange={(v) => patch({ codigo: v })} />
                </div>
                <div className="col-span-5">
                  <SelectField
                    label="Tipo"
                    value={item.tipo}
                    disabled={!editable}
                    options={[
                      { value: 'GENERAL_TECNOLOGICA', label: 'General Tecnológica' },
                      { value: 'GENERAL_SOCIAL_POLITICA_ACTITUDINAL', label: 'General Social/Política/Actitudinal' },
                      { value: 'ESPECIFICA', label: 'Específica' },
                    ]}
                    onChange={(v) => patch({ tipo: v as any })}
                  />
                </div>
                <div className="col-span-5">
                  <SelectField
                    label="Nivel de aporte"
                    value={String(item.nivelAporte)}
                    disabled={!editable}
                    options={[0, 1, 2, 3].map((n) => ({ value: String(n), label: String(n) }))}
                    onChange={(v) => patch({ nivelAporte: Number(v) as any })}
                  />
                </div>
              </div>
              <TextAreaField label="Detalle" rows={2} value={item.detalle} disabled={!editable} onChange={(v) => patch({ detalle: v })} />
            </div>
          )}
        />

        <div className="grid grid-cols-1 gap-4">
          {wrap(
            'fundamentacion.diagnostico.articulacionCorrelativas',
            <TextAreaField
              label="Articulación con asignaturas correlativas"
              rows={2}
              value={form.fundamentacion.diagnostico.articulacionCorrelativas}
              disabled={!editable}
              onChange={(v) => update((d) => (d.fundamentacion.diagnostico.articulacionCorrelativas = v))}
            />
          )}
          {wrap(
            'fundamentacion.diagnostico.articulacionMismoAno',
            <TextAreaField
              label="Articulación con materias del mismo año"
              rows={2}
              value={form.fundamentacion.diagnostico.articulacionMismoAno}
              disabled={!editable}
              onChange={(v) => update((d) => (d.fundamentacion.diagnostico.articulacionMismoAno = v))}
            />
          )}
          {wrap(
            'fundamentacion.diagnostico.analisisEstudiantes',
            <TextAreaField
              label="Análisis de los estudiantes"
              rows={3}
              value={form.fundamentacion.diagnostico.analisisEstudiantes}
              disabled={!editable}
              onChange={(v) => update((d) => (d.fundamentacion.diagnostico.analisisEstudiantes = v))}
            />
          )}
          {wrap(
            'fundamentacion.diagnostico.infraestructuraRequerida',
            <TextAreaField
              label="Infraestructura requerida"
              rows={2}
              value={form.fundamentacion.diagnostico.infraestructuraRequerida}
              disabled={!editable}
              onChange={(v) => update((d) => (d.fundamentacion.diagnostico.infraestructuraRequerida = v))}
            />
          )}
        </div>
      </SectionCard>

      <SectionCard title="Objetivo, Propósito y Resultados de Aprendizaje">
        {wrap(
          'objetivosPropositoRA.objetivosCarrera',
          <TextAreaField
            label="Objetivos de la carrera"
            rows={3}
            value={form.objetivosPropositoRA.objetivosCarrera}
            disabled={!editable}
            onChange={(v) => update((d) => (d.objetivosPropositoRA.objetivosCarrera = v))}
          />
        )}
        {wrap(
          'objetivosPropositoRA.propositoAsignatura',
          <ListField
            label="Propósito de la asignatura"
            value={form.objetivosPropositoRA.propositoAsignatura}
            disabled={!editable}
            onChange={(v) => update((d) => (d.objetivosPropositoRA.propositoAsignatura = v))}
          />
        )}
        <RepeatableList
          label="Resultados de aprendizaje (RA)"
          items={form.objetivosPropositoRA.resultadosAprendizaje}
          disabled={!editable}
          newItem={() => ({ codigo: `RA${form.objetivosPropositoRA.resultadosAprendizaje.length + 1}`, detalle: '' })}
          onChange={(items) => update((d) => (d.objetivosPropositoRA.resultadosAprendizaje = items))}
          renderItem={(item, patch) => (
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-2">
                <TextField label="Código" value={item.codigo} disabled={!editable} onChange={(v) => patch({ codigo: v })} />
              </div>
              <div className="col-span-10">
                <TextAreaField label="Detalle" rows={2} value={item.detalle} disabled={!editable} onChange={(v) => patch({ detalle: v })} />
              </div>
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Metodología">
        {wrap(
          'metodologia.enfoque',
          <TextAreaField
            label="Enfoque de enseñanza"
            rows={3}
            value={form.metodologia.enfoque}
            disabled={!editable}
            onChange={(v) => update((d) => (d.metodologia.enfoque = v))}
          />
        )}
        <RepeatableList
          label="Propuesta para el desarrollo de las competencias"
          items={form.metodologia.propuestaDesarrolloCompetencias}
          disabled={!editable}
          newItem={() => ({
            competencia: '',
            resultadoAprendizaje: '',
            unidadTema: '',
            guiaTp: '',
            actividadFormativa: '',
            estrategiaEnsenanza: '',
          })}
          onChange={(items) => update((d) => (d.metodologia.propuestaDesarrolloCompetencias = items))}
          renderItem={(item, patch) => (
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Competencia" value={item.competencia} disabled={!editable} onChange={(v) => patch({ competencia: v })} />
              <TextField
                label="Resultado de aprendizaje"
                value={item.resultadoAprendizaje}
                disabled={!editable}
                onChange={(v) => patch({ resultadoAprendizaje: v })}
              />
              <TextField label="Unidad/Tema" value={item.unidadTema} disabled={!editable} onChange={(v) => patch({ unidadTema: v })} />
              <TextField label="Guía de TP" value={item.guiaTp} disabled={!editable} onChange={(v) => patch({ guiaTp: v })} />
              <TextField
                label="Actividad formativa"
                value={item.actividadFormativa}
                disabled={!editable}
                onChange={(v) => patch({ actividadFormativa: v })}
              />
              <TextField
                label="Estrategia de enseñanza"
                value={item.estrategiaEnsenanza}
                disabled={!editable}
                onChange={(v) => patch({ estrategiaEnsenanza: v })}
              />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Contenidos">
        <RepeatableList
          label="Unidades"
          items={form.contenidos}
          disabled={!editable}
          newItem={() => ({ unidad: form.contenidos.length + 1, titulo: '', detalle: '' })}
          onChange={(items) => update((d) => (d.contenidos = items))}
          renderItem={(item, patch) => (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-2">
                  <NumberField label="Unidad N°" value={item.unidad} disabled={!editable} onChange={(v) => patch({ unidad: v })} />
                </div>
                <div className="col-span-10">
                  <TextField label="Título" value={item.titulo} disabled={!editable} onChange={(v) => patch({ titulo: v })} />
                </div>
              </div>
              <TextAreaField label="Detalle" rows={3} value={item.detalle} disabled={!editable} onChange={(v) => patch({ detalle: v })} />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Programa de Trabajos Prácticos">
        <RepeatableList
          label="Trabajos prácticos"
          items={form.programaTrabajosPracticos}
          disabled={!editable}
          newItem={() => ({
            numero: form.programaTrabajosPracticos.length + 1,
            titulo: '',
            proposito: [],
            modalidad: '',
            unidadTemas: '',
          })}
          onChange={(items) => update((d) => (d.programaTrabajosPracticos = items))}
          renderItem={(item, patch) => (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-2">
                  <NumberField label="TP N°" value={item.numero} disabled={!editable} onChange={(v) => patch({ numero: v })} />
                </div>
                <div className="col-span-6">
                  <TextField label="Título" value={item.titulo} disabled={!editable} onChange={(v) => patch({ titulo: v })} />
                </div>
                <div className="col-span-4">
                  <TextField label="Modalidad" value={item.modalidad} disabled={!editable} onChange={(v) => patch({ modalidad: v })} />
                </div>
              </div>
              <ListField label="Propósito" value={item.proposito} disabled={!editable} onChange={(v) => patch({ proposito: v })} />
              <TextField
                label="Unidad/Temas"
                value={item.unidadTemas}
                disabled={!editable}
                onChange={(v) => patch({ unidadTemas: v })}
              />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Evaluación">
        {wrap(
          'evaluacion.tipos',
          <CheckboxGroupField
            label="Tipos de evaluación"
            value={form.evaluacion.tipos}
            options={['INICIAL', 'DE_PROCESO', 'FINAL']}
            disabled={!editable}
            onChange={(v) => update((d) => (d.evaluacion.tipos = v))}
          />
        )}
        {wrap(
          'evaluacion.criterios',
          <ListField
            label="Criterios de evaluación"
            value={form.evaluacion.criterios}
            disabled={!editable}
            onChange={(v) => update((d) => (d.evaluacion.criterios = v))}
          />
        )}
        {wrap(
          'evaluacion.tecnicas',
          <ListField
            label="Técnicas de evaluación"
            value={form.evaluacion.tecnicas}
            disabled={!editable}
            onChange={(v) => update((d) => (d.evaluacion.tecnicas = v))}
          />
        )}
        <div className="grid grid-cols-1 gap-3">
          {wrap(
            'evaluacion.regimenAprobacion.promocional',
            <TextField
              label="Régimen promocional"
              value={form.evaluacion.regimenAprobacion.promocional}
              disabled={!editable}
              onChange={(v) => update((d) => (d.evaluacion.regimenAprobacion.promocional = v))}
            />
          )}
          {wrap(
            'evaluacion.regimenAprobacion.regular',
            <TextField
              label="Régimen regular"
              value={form.evaluacion.regimenAprobacion.regular}
              disabled={!editable}
              onChange={(v) => update((d) => (d.evaluacion.regimenAprobacion.regular = v))}
            />
          )}
          {wrap(
            'evaluacion.regimenAprobacion.libre',
            <TextField
              label="Régimen libre"
              value={form.evaluacion.regimenAprobacion.libre}
              disabled={!editable}
              onChange={(v) => update((d) => (d.evaluacion.regimenAprobacion.libre = v))}
            />
          )}
        </div>
      </SectionCard>

      <SectionCard title="Bibliografía">
        {(['basica', 'complementaria'] as const).map((tipo) => (
          <RepeatableList
            key={tipo}
            label={tipo === 'basica' ? 'Bibliografía básica' : 'Bibliografía complementaria'}
            items={form.bibliografia[tipo]}
            disabled={!editable}
            newItem={() => ({ titulo: '', autores: '', editorial: '', enlace: '', ano: new Date().getFullYear() })}
            onChange={(items) => update((d) => (d.bibliografia[tipo] = items))}
            renderItem={(item, patch) => (
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <TextField label="Título" value={item.titulo} disabled={!editable} onChange={(v) => patch({ titulo: v })} />
                </div>
                <div className="col-span-3">
                  <TextField label="Autores" value={item.autores} disabled={!editable} onChange={(v) => patch({ autores: v })} />
                </div>
                <div className="col-span-2">
                  <TextField label="Editorial" value={item.editorial} disabled={!editable} onChange={(v) => patch({ editorial: v })} />
                </div>
                <div className="col-span-3">
                  <NumberField label="Año" value={item.ano} disabled={!editable} onChange={(v) => patch({ ano: v })} />
                </div>
                <div className="col-span-12">
                  <TextField label="Enlace (opcional)" value={item.enlace ?? ''} disabled={!editable} onChange={(v) => patch({ enlace: v })} />
                </div>
              </div>
            )}
          />
        ))}
      </SectionCard>

      <SectionCard title="Horarios de Clases">
        <RepeatableList
          label="Días de dictado"
          items={form.horariosClases}
          disabled={!editable}
          newItem={() => ({ dia: 'LUNES' as const, horasTeoricas: '', horasPracticas: '' })}
          onChange={(items) => update((d) => (d.horariosClases = items))}
          renderItem={(item, patch) => (
            <div className="grid grid-cols-3 gap-2">
              <SelectField
                label="Día"
                value={item.dia}
                disabled={!editable}
                options={DIAS.map((d) => ({ value: d, label: d.charAt(0) + d.slice(1).toLowerCase() }))}
                onChange={(v) => patch({ dia: v as any })}
              />
              <TextField
                label="Horas teóricas"
                value={item.horasTeoricas ?? ''}
                disabled={!editable}
                onChange={(v) => patch({ horasTeoricas: v })}
              />
              <TextField
                label="Horas prácticas"
                value={item.horasPracticas ?? ''}
                disabled={!editable}
                onChange={(v) => patch({ horasPracticas: v })}
              />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Cronograma">
        <RepeatableList
          label="Semanas"
          items={form.cronograma}
          disabled={!editable}
          newItem={() => ({ semana: form.cronograma.length + 1 }) as PaacCompetenciasData['cronograma'][number]}
          onChange={(items) => update((d) => (d.cronograma = items))}
          renderItem={(item, patch) => (
            <div className="grid grid-cols-5 gap-2">
              <NumberField label="Semana" value={item.semana} disabled={!editable} onChange={(v) => patch({ semana: v })} />
              <NumberField label="Unidad" value={item.unidad ?? 0} disabled={!editable} onChange={(v) => patch({ unidad: v })} />
              <NumberField
                label="Hs. teóricas"
                value={item.horasTeoricas ?? 0}
                disabled={!editable}
                onChange={(v) => patch({ horasTeoricas: v })}
              />
              <NumberField label="TP N°" value={item.tpNumero ?? 0} disabled={!editable} onChange={(v) => patch({ tpNumero: v })} />
              <NumberField
                label="Hs. prácticas"
                value={item.horasPracticas ?? 0}
                disabled={!editable}
                onChange={(v) => patch({ horasPracticas: v })}
              />
              <div className="col-span-5">
                <TextField
                  label="Evaluación (opcional)"
                  value={item.evaluacion ?? ''}
                  disabled={!editable}
                  onChange={(v) => patch({ evaluacion: v })}
                />
              </div>
            </div>
          )}
        />
      </SectionCard>
    </>
  );
}
