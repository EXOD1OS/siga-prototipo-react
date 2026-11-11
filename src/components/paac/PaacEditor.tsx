import { createContext, useContext, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { StatusBadge } from '../shared/StatusBadge';
import { ObservationFieldWrapper } from '../shared/ObservationFieldWrapper';
import { RichTextEditor } from '../shared/RichTextEditor';
import { InfoTip } from '../paad/CamposPaad';
import { BotonImprimir } from '../paad/PaadDocumentoOficial';
import { FichaAspectosPaac, LeyendaNiveles, ListaUnidades, MatrizHorarios, Rotulo, TablaCompetenciasEspecificas, TablaCompetenciasGenerales, TablaCronograma } from './BloquesPaac';
import { TablaEditable } from './TablaEditable';
import { PaacDocumentoOficial } from './PaacDocumentoOficial';
import { apartadosPaac, INFO_PAAC, validarPaacContenido, type AspectosPaac } from '../../lib/paac';
import {
  MODALIDADES_TP,
  nuevoId,
  TIPOS_EVALUACION,
  type BloqueBibliografia,
  type LibroDigital,
  type LibroFisico,
  type PaacContenido,
} from '../../types/paac';
import type { DocumentoEditable, ObservacionDoc } from '../../types/planificacion';

export interface IntegrantePaad {
  docenteId: string;
  nombre: string;
  cargo: string;
  esResponsable: boolean;
  paadId?: string;
  paadEstado?: string;
  /** Privacidad: el Profesor Auxiliar solo puede abrir su propio PAAD. */
  puedeVer: boolean;
}

interface Props {
  d: DocumentoEditable;
  contenido: PaacContenido;
  aspectos: AspectosPaac;
  porCompetencias: boolean;
  /** Crédito horario total de la asignatura (para controlar el cronograma). */
  horasPlan: number | undefined;
  /** Sigla y código para el encabezado (ej. "ISI · ISI-1.02"). */
  subtitulo: string;
  responsable: string;
  integrantes: IntegrantePaad[];
  role: string;
  canEdit: boolean;
  canSubmit: boolean;
  canObserve: boolean;
  puedeIrAlInforme: boolean;
  onBack: () => void;
  onOpenReport: () => void;
  onOpenPaadModal: (paadId: string) => void;
  onUpdatePaac: (c: PaacContenido) => void;
  onSaveDraft: () => void;
  onSubmitDoc: () => void;
  onAddObs: (fKey: string, path: string, txt: string, secIdx: number) => void;
  onResolveObs: (obsId: string) => void;
}

type Vista = 'form' | 'preview';

// ---------------------------------------------------------------------------
// Piezas de formulario (fuera del componente para no remontarse en cada tecla)
// ---------------------------------------------------------------------------

interface ContextoCampos {
  uid: string;
  canEdit: boolean;
  canObserve: boolean;
  role: string;
  comments: ObservacionDoc[];
  invalido: (fKey: string) => boolean;
  onAddObs: (fKey: string, path: string, txt: string, secIdx: number) => void;
  onResolveObs: (obsId: string) => void;
}

const CamposCtx = createContext<ContextoCampos | null>(null);

function useCampos(): ContextoCampos {
  const ctx = useContext(CamposCtx);
  if (!ctx) throw new Error('Los campos del PAAC deben usarse dentro de PaacEditor.');
  return ctx;
}

/** Campo con observaciones ancladas y rótulo con guía de llenado. */
function Campo({ fKey, sec, label, info, children }: { fKey: string; sec: number; label: string | null; info?: string; children: ReactNode }) {
  const ctx = useCampos();
  return (
    <ObservationFieldWrapper
      fKey={fKey}
      label={label === null ? null : <Rotulo info={info} titulo={label}>{label}</Rotulo>}
      campoPath={`paac.${fKey}`}
      notes={ctx.comments.filter((o) => o.field === fKey)}
      canEdit={ctx.canEdit}
      canObserve={ctx.canObserve}
      role={ctx.role}
      onAddObs={(k, path, txt) => ctx.onAddObs(k, path, txt, sec)}
      onResolveObs={ctx.onResolveObs}
    >
      {children}
    </ObservationFieldWrapper>
  );
}

/** Campo narrativo con editor de texto enriquecido. */
function Rico({ fKey, sec, label, info, value, onChange, placeholder }: { fKey: string; sec: number; label: string; info?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ctx = useCampos();
  return (
    <Campo fKey={fKey} sec={sec} label={label} info={info}>
      <RichTextEditor editable={ctx.canEdit} ariaLabel={label} value={value} onChange={onChange} placeholder={placeholder} invalido={ctx.invalido(fKey)} />
    </Campo>
  );
}

function Seccion({ n, titulo, descripcion, info, children }: { n: number; titulo: string; descripcion?: string; info?: string; children: ReactNode }) {
  const { uid } = useCampos();
  return (
    <section id={`${uid}-ap-${n}`} aria-labelledby={`${uid}-h-${n}`} className="scroll-mt-24 rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4">
        <h2 id={`${uid}-h-${n}`} className="flex items-center gap-2 text-sm font-bold text-ink">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] text-white">{n}</span>
          {titulo}
          {info && <InfoTip titulo={titulo} texto={info} />}
        </h2>
        {descripcion && <p className="ml-8 mt-0.5 text-[11px] text-muted">{descripcion}</p>}
      </div>
      {children}
    </section>
  );
}

export function PaacEditor({
  d,
  contenido: c,
  aspectos,
  porCompetencias,
  horasPlan,
  subtitulo,
  responsable,
  integrantes,
  role,
  canEdit,
  canSubmit,
  canObserve,
  puedeIrAlInforme,
  onBack,
  onOpenReport,
  onOpenPaadModal,
  onUpdatePaac,
  onSaveDraft,
  onSubmitDoc,
  onAddObs,
  onResolveObs,
}: Props) {
  const [vista, setVista] = useState<Vista>('form');
  const [intento, setIntento] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const problemasRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  const apartados = apartadosPaac(c, aspectos, porCompetencias);
  const problemas = validarPaacContenido({ apartados, contenido: c, horasPlan, comments: d.comments });
  const campos = apartados.flatMap((a) => a.campos);
  const completos = campos.filter((f) => f.ok).length;
  const pct = campos.length ? Math.round((completos / campos.length) * 100) : 100;
  const apartadosCompletos = apartados.filter((a) => a.campos.every((f) => f.ok)).length;

  const set = <K extends keyof PaacContenido>(k: K, v: PaacContenido[K]) => onUpdatePaac({ ...c, [k]: v });
  const ir = (n: number) => document.getElementById(`${uid}-ap-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const presentar = () => {
    if (problemas.length > 0) {
      setIntento(true);
      setConfirmar(false);
      requestAnimationFrame(() => problemasRef.current?.focus());
      return;
    }
    if (!confirmar) {
      setConfirmar(true);
      return;
    }
    setConfirmar(false);
    setIntento(false);
    onSubmitDoc();
  };

  const motivoLectura = !canEdit
    ? ['BORRADOR', 'OBSERVADO'].includes(d.state)
      ? role.startsWith('DOCENTE')
        ? 'Modo lectura: solo el Docente Responsable de la cátedra edita y presenta el PAAC.'
        : 'Vista de consulta para evaluación.'
      : 'El PAAC ya fue presentado: se muestra en modo lectura.'
    : null;

  const obsPendientesSec = (sec: number) => d.comments.filter((o) => !o.resolved && o.section === sec).length;
  const mostrarErrores = intento && canEdit;
  const ctxCampos: ContextoCampos = {
    uid,
    canEdit,
    canObserve,
    role,
    comments: d.comments,
    invalido: (fKey) => mostrarErrores && apartados.some((a) => a.campos.some((f) => f.fKey === fKey && !f.ok)),
    onAddObs,
    onResolveObs,
  };

  const setBiblio = (tipo: 'basica' | 'complementaria', b: BloqueBibliografia) => set('bibliografia', { ...c.bibliografia, [tipo]: b });

  const bloqueBiblio = (tipo: 'basica' | 'complementaria', titulo: string) => {
    const b = c.bibliografia[tipo];
    return (
      <Campo fKey={`bibliografia.${tipo}`} sec={8} label={titulo}>
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Catálogo físico / UNLaR</div>
            <TablaEditable<LibroFisico>
              caption={`${titulo}: catálogo físico`}
              filas={b.fisica}
              editable={canEdit}
              etiquetaAgregar="Agregar libro del catálogo físico"
              vacio="Sin libros del catálogo físico."
              nueva={() => ({ id: nuevoId('bf'), titulo: '', autores: '', editorial: '', ejemplares: '', anio: '' })}
              onChange={(fisica) => setBiblio(tipo, { ...b, fisica })}
              columnas={[
                { key: 'titulo', label: 'Título', tipo: 'textarea' },
                { key: 'autores', label: 'Autores', tipo: 'textarea' },
                { key: 'editorial', label: 'Editorial', ancho: 'w-32' },
                { key: 'ejemplares', label: 'Ejemplares disponibles', tipo: 'number', ancho: 'w-24', centrar: true },
                { key: 'anio', label: 'Año de edición', tipo: 'number', ancho: 'w-24', centrar: true },
              ]}
            />
          </div>
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Plataforma digital / eLibro</div>
            <TablaEditable<LibroDigital>
              caption={`${titulo}: plataforma digital`}
              filas={b.digital}
              editable={canEdit}
              etiquetaAgregar="Agregar libro digital"
              vacio="Sin libros digitales."
              nueva={() => ({ id: nuevoId('bd'), titulo: '', autores: '', editorial: '', url: '', anio: '' })}
              onChange={(digital) => setBiblio(tipo, { ...b, digital })}
              columnas={[
                { key: 'titulo', label: 'Título', tipo: 'textarea' },
                { key: 'autores', label: 'Autores', tipo: 'textarea' },
                { key: 'editorial', label: 'Editorial', ancho: 'w-32' },
                { key: 'url', label: 'Enlace (URL)', tipo: 'url', placeholder: 'https://elibro.net/…', ancho: 'w-48' },
                { key: 'anio', label: 'Año de edición', tipo: 'number', ancho: 'w-24', centrar: true },
              ]}
            />
          </div>
        </div>
      </Campo>
    );
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const next: Vista = vista === 'form' ? 'preview' : 'form';
      setVista(next);
      document.getElementById(`${uid}-tab-${next}`)?.focus();
    }
  };

  const estadoGuardado = d.sinGuardar ? 'Cambios sin guardar' : d.guardadoEn ? `Borrador guardado · ${d.guardadoEn}` : 'Sin cambios pendientes';

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="no-print flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2.5">
            <StatusBadge state={d.state} />
            <span className="text-xs text-muted">
              PAAC · Ciclo {d.cycle} · {subtitulo} · {porCompetencias ? 'Plan por competencias' : 'Plan tradicional'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-ink">{aspectos.asignatura || 'Programa de Actividades Académicas de la Cátedra'}</h1>
          <p className="mt-0.5 text-xs text-muted">Programa de Actividades Académicas de la Cátedra · Responsable: {responsable || '—'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button type="button" onClick={onBack} className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-ink transition-colors hover:bg-background">
            ← Volver
          </button>
          {puedeIrAlInforme && (
            <button type="button" onClick={onOpenReport} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover">
              Ir al Informe de Evaluación
            </button>
          )}
        </div>
      </div>

      {/* Pestañas */}
      <div role="tablist" aria-label="Modo de visualización del PAAC" className="no-print inline-flex rounded-xl border border-border bg-background p-1 text-xs">
        {(
          [
            ['form', 'Detalle / Edición'],
            ['preview', 'Vista previa documento / PDF'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            id={`${uid}-tab-${key}`}
            type="button"
            role="tab"
            aria-selected={vista === key}
            tabIndex={vista === key ? 0 : -1}
            onClick={() => setVista(key)}
            onKeyDown={onTabKey}
            className={`rounded-lg px-4 py-2 font-semibold transition-all duration-200 ${vista === key ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {vista === 'preview' ? (
        <div className="space-y-4">
          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">Así se verá el documento institucional con los datos cargados. Para PDF, elegí “Guardar como PDF” al imprimir.</p>
            <BotonImprimir />
          </div>
          <div className="rounded-2xl bg-[#e6e8ec] p-3 sm:p-8 print:bg-transparent print:p-0">
            <PaacDocumentoOficial aspectos={aspectos} contenido={c} ciclo={d.cycle} porCompetencias={porCompetencias} />
          </div>
        </div>
      ) : (
        <CamposCtx.Provider value={ctxCampos}>
          {motivoLectura && (
            <div role="note" className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-xs text-muted">
              <span aria-hidden>🔒</span> {motivoLectura}
            </div>
          )}

          {mostrarErrores && problemas.length > 0 && (
            <div ref={problemasRef} tabIndex={-1} role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 outline-none">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">No se puede presentar todavía: hay {problemas.length} punto(s) por completar.</p>
              <ul className="mt-2 space-y-1">
                {problemas.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-ink">
                    <span aria-hidden className="text-red-600">•</span>
                    <span className="flex-1">{p.mensaje}</span>
                    <button type="button" onClick={() => ir(p.numero)} className="shrink-0 font-semibold text-primary hover:underline">
                      Ir al apartado
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Índice de apartados */}
            <nav aria-label="Apartados del PAAC" className="space-y-1 rounded-xl border border-border bg-surface p-3 shadow-sm lg:sticky lg:top-20 lg:col-span-3">
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Apartados</div>
              {apartados.map((a) => {
                const obs = obsPendientesSec(a.numero);
                const ok = a.campos.filter((f) => f.ok).length;
                const lleno = ok === a.campos.length;
                const conError = mostrarErrores && !lleno;
                return (
                  <button
                    key={a.numero}
                    type="button"
                    onClick={() => ir(a.numero)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-muted transition-colors hover:bg-background hover:text-ink"
                  >
                    <span className="truncate">
                      {a.numero}) {a.corto}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      {obs > 0 && (
                        <span title={`${obs} observación(es)`} className="flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                          {obs}
                        </span>
                      )}
                      <span
                        aria-label={lleno ? 'Completo' : `${ok} de ${a.campos.length} campos`}
                        className={`min-w-[1.75rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums ${
                          lleno ? 'bg-soft text-primary' : conError ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' : 'bg-background text-muted'
                        }`}
                      >
                        {lleno ? '✓' : `${ok}/${a.campos.length}`}
                      </span>
                    </span>
                  </button>
                );
              })}

              {/* Progreso de completitud */}
              <div className="mt-2 border-t border-border px-2.5 pt-3">
                <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="text-muted">Campos completados</span>
                  <span className="tabular-nums">
                    <strong className={pct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink'}>{pct}%</strong>
                    <span className="ml-1 text-[10px] text-muted">
                      {completos}/{campos.length} campos
                    </span>
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Progreso del PAAC"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  aria-valuetext={`${completos} de ${campos.length} campos obligatorios completos`}
                  className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                >
                  <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out dark:bg-teal-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-[10px] text-muted">
                  {apartadosCompletos}/{apartados.length} apartados completos
                </p>
              </div>
            </nav>

            <div className="space-y-5 lg:col-span-9">
              {/* 0) Aspectos generales */}
              <Seccion n={0} titulo="Aspectos Generales" descripcion="Se completan automáticamente con los datos de la cátedra registrados en la base de datos.">
                <Campo fKey="aspectos" sec={0} label={null}>
                  <FichaAspectosPaac
                    aspectos={aspectos}
                    editable={canEdit}
                    onNivel={(v) => set('nivelIntensidad', v)}
                    onRelacion={(v) => set('relacionTP', v)}
                  />
                </Campo>
                <div className="mt-2">
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Equipo de cátedra y PAAD presentados</h3>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full min-w-[560px] border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-background text-[11px] text-muted">
                          <th className="px-3 py-2.5 font-semibold">Docente</th>
                          <th className="px-3 py-2.5 font-semibold">Cargo</th>
                          <th className="px-3 py-2.5 font-semibold">Permisos en PAAC</th>
                          <th className="px-3 py-2.5 font-semibold">PAAD ({d.cycle})</th>
                          <th className="px-3 py-2.5 text-right font-semibold">Consulta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {integrantes.map((it) => {
                          const presentado = !!it.paadId && it.paadEstado !== 'BORRADOR';
                          return (
                            <tr key={it.docenteId}>
                              <td className="px-3 py-2 font-medium text-ink">{it.nombre}</td>
                              <td className="px-3 py-2 text-ink">{it.cargo}</td>
                              <td className="px-3 py-2">
                                {it.esResponsable ? <span className="font-semibold text-primary">Responsable (edita y presenta)</span> : <span className="text-ink">Integrante (lectura)</span>}
                              </td>
                              <td className="px-3 py-2">{it.paadEstado ? <StatusBadge state={it.paadEstado} /> : '—'}</td>
                              <td className="px-3 py-2 text-right">
                                {!it.puedeVer ? (
                                  <span className="text-[11px] italic text-muted">Acceso restringido</span>
                                ) : presentado && it.paadId ? (
                                  <button
                                    type="button"
                                    onClick={() => onOpenPaadModal(it.paadId!)}
                                    className="rounded-md border border-border bg-soft px-2.5 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary hover:text-white"
                                  >
                                    Ver PAAD ↗
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-muted">Aún no presentado</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Seccion>

              {/* 1) Fundamentación */}
              <Seccion n={1} titulo="Fundamentación – Análisis de la Asignatura">
                <Rico fKey="importancia" sec={1} label="Importancia de la asignatura en el Plan de Estudios" info={INFO_PAAC.importancia} value={c.importancia} onChange={(v) => set('importancia', v)} />
                {porCompetencias ? (
                  <>
                    <div className="border-b border-border py-6">
                      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink">
                        Relación de la asignatura con las Competencias de Egreso de la Carrera
                        <InfoTip titulo="Competencias de egreso" texto={INFO_PAAC.competencias} />
                      </h3>
                      <p className="mb-2 text-[11px] text-muted">Tabla guía de referencia del nivel de contribución:</p>
                      <LeyendaNiveles />
                    </div>
                    <Campo fKey="competenciasGenerales" sec={1} label="Cuadro 1: Competencias Generales" info={INFO_PAAC.competencias}>
                      <TablaCompetenciasGenerales niveles={c.competenciasGenerales} editable={canEdit} onChange={(v) => set('competenciasGenerales', v)} />
                    </Campo>
                    <Campo fKey="competenciasEspecificas" sec={1} label="Cuadro 2: Competencias Específicas" info={INFO_PAAC.competenciasEspecificas}>
                      <TablaCompetenciasEspecificas filas={c.competenciasEspecificas} editable={canEdit} onChange={(v) => set('competenciasEspecificas', v)} />
                    </Campo>
                  </>
                ) : (
                  <p className="mt-4 rounded-lg border border-border bg-background px-4 py-2.5 text-xs text-muted">
                    El plan de estudio de esta carrera no está organizado por competencias: los cuadros de competencias de egreso no aplican.
                  </p>
                )}
              </Seccion>

              {/* 2) Diagnóstico */}
              <Seccion n={2} titulo="Diagnóstico">
                <Rico fKey="diagnostico.correlativas" sec={2} label="Articulación con las asignaturas correlativas" info={INFO_PAAC.correlativas} value={c.diagnostico.correlativas} onChange={(v) => set('diagnostico', { ...c.diagnostico, correlativas: v })} />
                <Rico fKey="diagnostico.mismoAnio" sec={2} label="Articulación con las materias del mismo año" info={INFO_PAAC.mismoAnio} value={c.diagnostico.mismoAnio} onChange={(v) => set('diagnostico', { ...c.diagnostico, mismoAnio: v })} />
                <Rico fKey="diagnostico.estudiantes" sec={2} label="Análisis de los estudiantes (si corresponde)" info={INFO_PAAC.estudiantes} value={c.diagnostico.estudiantes} onChange={(v) => set('diagnostico', { ...c.diagnostico, estudiantes: v })} />
                <Rico fKey="diagnostico.infraestructura" sec={2} label="Infraestructura requerida" info={INFO_PAAC.infraestructura} value={c.diagnostico.infraestructura} onChange={(v) => set('diagnostico', { ...c.diagnostico, infraestructura: v })} />
              </Seccion>

              {/* 3) Objetivo, propósito y RA */}
              <Seccion n={3} titulo="Objetivo, Propósito y Resultados de Aprendizaje">
                <Rico fKey="objetivosCarrera" sec={3} label="Objetivos de la Carrera" info={INFO_PAAC.objetivosCarrera} value={c.objetivosCarrera} onChange={(v) => set('objetivosCarrera', v)} />
                <Rico fKey="proposito" sec={3} label="Propósito de la Asignatura" info={INFO_PAAC.proposito} value={c.proposito} onChange={(v) => set('proposito', v)} />
                <Campo fKey="resultados" sec={3} label="Resultados de Aprendizaje (RA)" info={INFO_PAAC.resultados}>
                  <TablaEditable
                    caption="Resultados de aprendizaje"
                    filas={c.resultados}
                    editable={canEdit}
                    etiquetaAgregar="Agregar Resultado de Aprendizaje"
                    vacio="Todavía no se agregaron resultados de aprendizaje."
                    nueva={(n) => ({ id: nuevoId('ra'), codigo: `RA${n + 1}`, descripcion: '' })}
                    onChange={(v) => set('resultados', v)}
                    minW="min-w-[480px]"
                    columnas={[
                      { key: 'codigo', label: 'Código', ancho: 'w-24' },
                      { key: 'descripcion', label: 'Descripción', tipo: 'textarea', placeholder: 'Verbo de desempeño + objeto + condición…' },
                    ]}
                  />
                </Campo>
              </Seccion>

              {/* 4) Metodología */}
              <Seccion n={4} titulo="Metodología y Propuesta para el Desarrollo de Competencias">
                <Rico fKey="metodologia" sec={4} label="Metodología de Enseñanza" info={INFO_PAAC.metodologia} value={c.metodologia} onChange={(v) => set('metodologia', v)} />
                <Campo fKey="propuesta" sec={4} label="Propuesta para el desarrollo de las competencias" info={INFO_PAAC.propuesta}>
                  <TablaEditable
                    caption="Propuesta para el desarrollo de las competencias"
                    filas={c.propuesta}
                    editable={canEdit}
                    etiquetaAgregar="Agregar fila"
                    vacio="Todavía no se cargó la propuesta."
                    nueva={() => ({ id: nuevoId('pr'), competencia: '', ra: '', unidades: '', guiaTp: '', actividad: '', estrategia: '' })}
                    onChange={(v) => set('propuesta', v)}
                    minW="min-w-[900px]"
                    columnas={[
                      { key: 'competencia', label: 'Competencia', placeholder: 'CG1, CE1.1', ancho: 'w-28' },
                      { key: 'ra', label: 'Resultado de Aprendizaje (RA)', placeholder: 'RA1', ancho: 'w-28' },
                      { key: 'unidades', label: 'Unidades / Temas', tipo: 'textarea' },
                      { key: 'guiaTp', label: 'Guía de Trabajo Práctico', tipo: 'textarea' },
                      { key: 'actividad', label: 'Actividad Formativa', tipo: 'textarea' },
                      { key: 'estrategia', label: 'Estrategia de Enseñanza', tipo: 'textarea' },
                    ]}
                  />
                </Campo>
              </Seccion>

              {/* 5) Contenidos */}
              <Seccion n={5} titulo="Contenidos (Programa Analítico por Unidades)">
                <div className="mb-2 rounded-lg border border-border bg-background px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Contenidos mínimos (referencia del plan)</div>
                  <p className="mt-1 text-xs leading-relaxed text-ink">{aspectos.contenidosMinimos || 'Sin datos'}</p>
                </div>
                <Campo fKey="unidades" sec={5} label="Unidades Temáticas" info={INFO_PAAC.unidades}>
                  <ListaUnidades unidades={c.unidades} editable={canEdit} onChange={(v) => set('unidades', v)} />
                </Campo>
              </Seccion>

              {/* 6) Trabajos prácticos */}
              <Seccion n={6} titulo="Programa de Trabajos Prácticos / Laboratorio">
                <Rico fKey="tpIntro" sec={6} label="Introducción / Modalidad pedagógica práctica (opcional)" value={c.tpIntro} onChange={(v) => set('tpIntro', v)} />
                <Campo fKey="trabajosPracticos" sec={6} label="Trabajos Prácticos" info={INFO_PAAC.trabajosPracticos}>
                  <TablaEditable
                    caption="Trabajos prácticos"
                    filas={c.trabajosPracticos}
                    editable={canEdit}
                    etiquetaAgregar="Agregar Trabajo Práctico"
                    vacio="Todavía no se agregaron trabajos prácticos."
                    nueva={(n) => ({ id: nuevoId('tp'), numero: String(n + 1), titulo: '', proposito: '', modalidad: '', unidadTemas: '' })}
                    onChange={(v) => set('trabajosPracticos', v)}
                    minW="min-w-[820px]"
                    columnas={[
                      { key: 'numero', label: 'T.P. N°', tipo: 'number', ancho: 'w-16', centrar: true },
                      { key: 'titulo', label: 'Título', tipo: 'textarea' },
                      { key: 'proposito', label: 'Propósito', tipo: 'textarea' },
                      { key: 'modalidad', label: 'Modalidad', tipo: 'select', opciones: MODALIDADES_TP, ancho: 'w-44' },
                      { key: 'unidadTemas', label: 'Unidad / Temas', tipo: 'textarea', ancho: 'w-40' },
                    ]}
                  />
                </Campo>
              </Seccion>

              {/* 7) Evaluación */}
              <Seccion n={7} titulo="Evaluación y Régimen de Aprobación">
                <Rico fKey="evalDescripcion" sec={7} label="Descripción general de la evaluación (opcional)" value={c.evalDescripcion} onChange={(v) => set('evalDescripcion', v)} />
                <Campo fKey="evaluacion" sec={7} label="Cuadro de evaluación por Resultado de Aprendizaje" info={INFO_PAAC.evaluacion}>
                  <TablaEditable
                    caption="Cuadro de evaluación por resultado de aprendizaje"
                    filas={c.evaluacion}
                    editable={canEdit}
                    etiquetaAgregar="Agregar fila de evaluación"
                    vacio="Todavía no se cargó el cuadro de evaluación."
                    nueva={() => ({ id: nuevoId('ev'), tipo: '', criterios: '', ra: '', tecnica: '' })}
                    onChange={(v) => set('evaluacion', v)}
                    minW="min-w-[720px]"
                    columnas={[
                      { key: 'tipo', label: 'Tipo de Evaluación', tipo: 'select', opciones: TIPOS_EVALUACION, ancho: 'w-40' },
                      { key: 'criterios', label: 'Criterios de Evaluación', tipo: 'textarea' },
                      { key: 'ra', label: 'RA N°', ancho: 'w-24', placeholder: 'RA1' },
                      { key: 'tecnica', label: 'Técnica e Instrumento de Evaluación', tipo: 'textarea' },
                    ]}
                  />
                </Campo>
                <div className="pt-6">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-ink">
                    Régimen de Aprobación <InfoTip titulo="Régimen de Aprobación" texto={INFO_PAAC.regimen} />
                  </h3>
                </div>
                <Rico fKey="regimen.promocionales" sec={7} label="a) Alumnos Promocionales" placeholder="Requisitos de promoción directa…" value={c.regimen.promocionales} onChange={(v) => set('regimen', { ...c.regimen, promocionales: v })} />
                <Rico fKey="regimen.regulares" sec={7} label="b) Alumnos Regulares" placeholder="Requisitos de regularidad y modalidad del examen final…" value={c.regimen.regulares} onChange={(v) => set('regimen', { ...c.regimen, regulares: v })} />
                <Rico fKey="regimen.libres" sec={7} label="c) Alumnos Libres" placeholder="Requisitos y características del examen libre…" value={c.regimen.libres} onChange={(v) => set('regimen', { ...c.regimen, libres: v })} />
              </Seccion>

              {/* 8) Bibliografía */}
              <Seccion n={8} titulo="Bibliografía" info={INFO_PAAC.bibliografia} descripcion="Básica y complementaria, en catálogo físico de la UNLaR y en plataforma digital (eLibro).">
                {bloqueBiblio('basica', 'Bibliografía Básica')}
                {bloqueBiblio('complementaria', 'Bibliografía Complementaria')}
              </Seccion>

              {/* 9) Horarios y cronograma */}
              <Seccion n={9} titulo="Horarios de Clases y Cronograma">
                <Campo fKey="horarios" sec={9} label="Horarios de Clases" info={INFO_PAAC.horarios}>
                  <MatrizHorarios horarios={c.horarios} editable={canEdit} onChange={(v) => set('horarios', v)} />
                </Campo>
                <Campo fKey="cronograma" sec={9} label="Cronograma Semanal" info={INFO_PAAC.cronograma}>
                  <TablaCronograma
                    semanas={c.cronograma}
                    notas={c.notasCronograma}
                    horasPlan={horasPlan}
                    editable={canEdit}
                    onChange={(v) => set('cronograma', v)}
                    onNotas={(v) => set('notasCronograma', v)}
                  />
                </Campo>
              </Seccion>
            </div>
          </div>

          {/* Barra de acciones */}
          {canEdit && (
            <div className="no-print sticky bottom-4 z-30">
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-xl sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className={`flex items-center gap-1.5 font-medium ${d.sinGuardar ? 'text-amber-700 dark:text-amber-400' : 'text-muted'}`} aria-live="polite">
                    <span aria-hidden className={`h-2 w-2 rounded-full ${d.sinGuardar ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    {estadoGuardado}
                  </span>
                  <span className={problemas.length ? 'text-muted' : 'font-medium text-emerald-700 dark:text-emerald-400'}>
                    {problemas.length ? `${problemas.length} punto(s) pendiente(s) para presentar` : '✓ Listo para presentar'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {confirmar ? (
                    <>
                      <span className="text-[11px] font-medium text-ink">Al presentar se bloquea la edición. ¿Confirmás?</span>
                      <button type="button" onClick={() => setConfirmar(false)} className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-ink hover:bg-background">
                        Cancelar
                      </button>
                      <button type="button" onClick={presentar} autoFocus className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover">
                        Sí, presentar
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setVista('preview')} className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-ink hover:bg-background">
                        Vista previa
                      </button>
                      <button type="button" onClick={onSaveDraft} className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-ink hover:bg-background">
                        Guardar borrador
                      </button>
                      {canSubmit && (
                        <button type="button" onClick={presentar} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover">
                          {d.state === 'OBSERVADO' ? 'Subsanar y reenviar' : 'Presentar PAAC'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </CamposCtx.Provider>
      )}
    </div>
  );
}
