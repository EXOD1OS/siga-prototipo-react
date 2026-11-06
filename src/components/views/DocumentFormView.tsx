import { useRef, useState } from 'react';
import { PAAC_SCHEMA, PAAD_SCHEMA, type SchemaField } from '../../data/mockData';
import { StatusBadge } from '../shared/StatusBadge';
import { ObservationFieldWrapper } from '../shared/ObservationFieldWrapper';
import { CampoSelect, CampoTexto, TablaDinamica, TablaHoras } from '../paac/CamposPaac';
import { validarPaac, type ProblemaPaac } from '../../lib/validacionPaac';
import type { AsigContext, DocumentoResumen, EquipoCatedra } from '../../types/estructura';
import type { DocumentoEditable } from '../../types/planificacion';

interface DocumentFormViewProps {
  d: DocumentoEditable;
  role: string;
  uid: string;
  canEdit: boolean;
  canSubmit: boolean;
  canObserve: boolean;
  asigContext: (id: string) => AsigContext;
  equipoDeAsig: (id: string) => EquipoCatedra[];
  fullName: (id: string) => string;
  S: { cycle: number; docs: DocumentoResumen[]; equiposCatedra: EquipoCatedra[] };
  onBack: () => void;
  onUpdateField: (fKey: string, val: string | string[][]) => void;
  onSaveDraft: () => void;
  onSubmitDoc: () => void;
  onAddObs: (fKey: string, path: string, txt: string, secIdx: number) => void;
  onResolveObs: (obsId: string) => void;
  onOpenReport: (id: string) => void;
  onOpenPaadModal: (paadId: string) => void;
}

const ESTADOS_EDITABLES = ['BORRADOR', 'OBSERVADO'];

const asTexto = (v: unknown) => (typeof v === 'string' ? v : '');
const asFilas = (v: unknown): string[][] => (Array.isArray(v) ? v : []);

function campoCompleto(f: SchemaField, v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0 && (f.type !== 'horas' || v.some((r) => String(r?.[0] ?? '').trim() !== ''));
  return String(v ?? '').trim() !== '';
}

export function DocumentFormView({
  d,
  role,
  uid,
  canEdit,
  canSubmit,
  canObserve,
  asigContext,
  equipoDeAsig,
  fullName,
  S,
  onBack,
  onUpdateField,
  onSaveDraft,
  onSubmitDoc,
  onAddObs,
  onResolveObs,
  onOpenReport,
  onOpenPaadModal,
}: DocumentFormViewProps) {
  const [section, setSection] = useState(0);
  const [intentoPresentar, setIntentoPresentar] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const problemasRef = useRef<HTMLDivElement>(null);

  const esPaac = d.type === 'PAAC';
  const ctx = esPaac && d.asignaturaId ? asigContext(d.asignaturaId) : null;
  const enfoque = ctx?.plan?.enfoque;
  // En planes tradicionales la matriz de competencias no aplica.
  const secs = (esPaac ? PAAC_SCHEMA : PAAD_SCHEMA).map((s) => ({
    ...s,
    fields: s.fields.filter((f) => !(f.key === 'competencias' && enfoque !== 'COMPETENCIAS')),
  }));
  const activeSec = Math.min(section, secs.length - 1);
  const equipo = esPaac && d.asignaturaId ? equipoDeAsig(d.asignaturaId) : [];
  const equipoNombres = equipo.map((e) => fullName(e.docenteId));

  const allFields = secs.flatMap((s) => s.fields);
  const doneCount = allFields.filter((f) => campoCompleto(f, d.data[f.key])).length;
  const pct = allFields.length ? Math.round((doneCount / allFields.length) * 100) : 100;

  const problemas: ProblemaPaac[] = esPaac ? validarPaac(secs, d.data, { asig: ctx?.asig, enfoque, comments: d.comments }) : [];
  const problemasDeSeccion = (i: number) => problemas.filter((p) => p.section === i).length;
  const mostrarErrores = intentoPresentar && canEdit;

  const motivoLectura = (() => {
    if (canEdit) return null;
    if (!ESTADOS_EDITABLES.includes(d.state)) return 'El documento ya fue presentado: se muestra en modo lectura.';
    if (role.startsWith('DOCENTE') && esPaac) return 'Modo lectura: solo el Docente Responsable de la cátedra edita y presenta el PAAC.';
    return 'Vista de consulta para evaluación.';
  })();

  const presentar = () => {
    if (esPaac && problemas.length > 0) {
      setIntentoPresentar(true);
      setConfirmar(false);
      requestAnimationFrame(() => problemasRef.current?.focus());
      return;
    }
    if (!confirmar) {
      setConfirmar(true);
      return;
    }
    setConfirmar(false);
    setIntentoPresentar(false);
    onSubmitDoc();
  };

  const renderCampo = (f: SchemaField) => {
    const id = `campo-${f.key}`;
    const valor = d.data[f.key];
    const invalido = mostrarErrores && problemas.some((p) => p.fieldKey === f.key);
    switch (f.type) {
      case 'text':
        return <CampoTexto id={id} value={asTexto(valor)} editable={canEdit} invalido={invalido} onChange={(v) => onUpdateField(f.key, v)} />;
      case 'select':
        return (
          <CampoSelect id={id} value={asTexto(valor)} options={f.options ?? []} editable={canEdit} invalido={invalido} onChange={(v) => onUpdateField(f.key, v)} />
        );
      case 'horas':
        return <TablaHoras rows={asFilas(valor)} editable={canEdit} asig={ctx?.asig} onChange={(rows) => onUpdateField(f.key, rows)} />;
      case 'table':
        return (
          <TablaDinamica
            label={f.label}
            columns={f.columns ?? (f.cols ?? []).map((label) => ({ label }))}
            rows={asFilas(valor)}
            editable={canEdit}
            mostrarErrores={mostrarErrores}
            equipo={equipoNombres}
            addLabel={f.addLabel}
            newRow={f.newRow}
            onChange={(rows) => onUpdateField(f.key, rows)}
          />
        );
    }
  };

  const estadoGuardado = d.sinGuardar ? 'Cambios sin guardar' : d.guardadoEn ? `Borrador guardado · ${d.guardadoEn}` : 'Sin cambios pendientes';

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2.5">
            <StatusBadge state={d.state} />
            <span className="text-xs text-muted">
              {d.type} · Ciclo {d.cycle}
              {ctx?.asig && ` · ${ctx.asig.codigo} · ${ctx.carrera?.sigla} · ${ctx.plan?.enfoque === 'COMPETENCIAS' ? 'Plan por competencias' : 'Plan tradicional'}`}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-ink">{esPaac ? ctx?.asig?.nombre : `Mi PAAD Anual · ${fullName(d.owner)}`}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onBack} className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-ink hover:bg-background">
            ← Volver
          </button>
          {esPaac && ['UAP', 'DIRECCION_CARRERA'].includes(role) && (
            <button type="button" onClick={() => onOpenReport(d.id)} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover">
              Ir al Informe de Evaluación
            </button>
          )}
        </div>
      </div>

      {motivoLectura && (
        <div role="note" className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-xs text-muted">
          <span aria-hidden>🔒</span> {motivoLectura}
        </div>
      )}

      {/* Problemas al presentar */}
      {mostrarErrores && problemas.length > 0 && (
        <div
          ref={problemasRef}
          tabIndex={-1}
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 outline-none"
        >
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            No se puede presentar todavía: hay {problemas.length} punto(s) por completar.
          </p>
          <ul className="mt-2 space-y-1">
            {problemas.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink">
                <span aria-hidden className="text-red-600">•</span>
                <span className="flex-1">{p.mensaje}</span>
                <button type="button" onClick={() => setSection(p.section)} className="shrink-0 font-semibold text-primary hover:underline">
                  Ir a {secs[p.section]?.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Índice de apartados */}
        <aside className="space-y-3 rounded-xl border border-border bg-surface p-3.5 shadow-sm lg:sticky lg:top-20 lg:col-span-3">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted">Apartados {d.type}</div>
          <nav aria-label={`Apartados del ${d.type}`} className="space-y-1">
            {secs.map((s, idx) => {
              const secObs = d.comments.filter((o) => !o.resolved && o.section === idx).length;
              const secProb = mostrarErrores ? problemasDeSeccion(idx) : 0;
              const isAct = activeSec === idx;
              return (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setSection(idx)}
                  aria-current={isAct ? 'step' : undefined}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                    isAct ? 'border-primary bg-soft font-semibold text-primary' : 'border-transparent text-muted hover:bg-background hover:text-ink'
                  }`}
                >
                  <span className="truncate">{s.title}</span>
                  <span className="flex shrink-0 gap-1">
                    {secProb > 0 && (
                      <span title={`${secProb} punto(s) por completar`} className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                        !
                      </span>
                    )}
                    {secObs > 0 && (
                      <span title={`${secObs} observación(es)`} className="flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                        {secObs}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="border-t border-border px-2 pt-3">
            <div className="mb-1 flex justify-between text-[11px] text-muted">
              <span>Campos completados</span>
              <strong className="text-ink">{pct}%</strong>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </aside>

        {/* Apartado activo */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm lg:col-span-9">
          <div className="border-b border-border bg-background p-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Apartado {activeSec + 1} de {secs.length}
            </span>
            <h2 className="mt-0.5 text-lg font-bold text-ink">{secs[activeSec].norm}</h2>
          </div>

          <div className="p-6">
            {activeSec === 0 && esPaac && ctx && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ['Sede', ctx.sede?.nombre],
                    ['Departamento', ctx.depto?.nombre ?? 'Sede Regional'],
                    ['Carrera', ctx.carrera?.nombre],
                    ['Plan / Enfoque', `${ctx.plan?.ordenanza ?? ''} (${ctx.plan?.enfoque ?? ''})`],
                    ['Asignatura', `${ctx.asig?.nombre ?? ''} (${ctx.asig?.codigo ?? ''})`],
                    ['Curso, régimen y crédito', `${ctx.asig?.anoCursada}.º año · ${ctx.asig?.regimenDictado} · ${ctx.asig?.horasSemanales} hs/sem · ${ctx.asig?.horasTotales} hs`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="mb-1 text-[11px] text-muted">{k}</div>
                      <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-ink">{v || '—'}</div>
                    </div>
                  ))}
                </div>
                {ctx.asig?.contenidosMinimos && (
                  <div>
                    <div className="mb-1 text-[11px] text-muted">Contenidos mínimos del plan</div>
                    <p className="rounded-lg border border-border bg-background px-3 py-2 text-xs leading-relaxed text-ink">{ctx.asig.contenidosMinimos}</p>
                  </div>
                )}

                <div>
                  <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted">Equipo docente de la cátedra y acceso a PAADs presentados</h3>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-border bg-background text-muted">
                          <th className="p-3">Docente</th>
                          <th className="p-3">Cargo</th>
                          <th className="p-3">Permisos en PAAC</th>
                          <th className="p-3">Estado PAAD ({S.cycle})</th>
                          <th className="p-3 text-right">Consulta PAAD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {equipo.map((eq) => {
                          const p = S.docs.find((x) => x.type === 'PAAD' && x.owner === eq.docenteId);
                          const isPresented = !!p && p.state !== 'BORRADOR';
                          // Privacidad: el Profesor Auxiliar solo ve su propio PAAD.
                          const canSeeThisPaad = role !== 'DOCENTE_AUXILIAR' || eq.docenteId === uid;
                          return (
                            <tr key={eq.id}>
                              <td className="p-3 font-medium text-ink">{fullName(eq.docenteId)}</td>
                              <td className="p-3 text-ink">{eq.cargo}</td>
                              <td className="p-3">
                                {eq.esResponsable ? (
                                  <span className="font-semibold text-primary">Responsable (edita y presenta)</span>
                                ) : (
                                  <span className="text-ink">Integrante (lectura)</span>
                                )}
                              </td>
                              <td className="p-3">{p ? <StatusBadge state={p.state} /> : '—'}</td>
                              <td className="p-3 text-right">
                                {!canSeeThisPaad ? (
                                  <span className="text-[11px] italic text-muted">Acceso restringido (Auxiliar)</span>
                                ) : isPresented && p ? (
                                  <button
                                    type="button"
                                    onClick={() => onOpenPaadModal(p.id)}
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
              </div>
            )}

            {activeSec === 0 && !esPaac && (
              <div className="mb-6 space-y-4 border-b border-border pb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                  1.a) Asignaturas atendidas en el ciclo lectivo (autocompletado desde Equipos de Cátedra)
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-background text-muted">
                        <th className="p-3">Carrera</th>
                        <th className="p-3">Asignatura</th>
                        <th className="p-3">Cargo</th>
                        <th className="p-3">Horas totales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {S.equiposCatedra
                        .filter((e) => e.docenteId === d.owner && e.cicloLectivo === S.cycle)
                        .map((eq) => {
                          const c = asigContext(eq.asignaturaId);
                          return (
                            <tr key={eq.id}>
                              <td className="p-3 font-semibold text-primary">{c.carrera?.sigla}</td>
                              <td className="p-3 font-medium text-ink">{c.asig?.nombre}</td>
                              <td className="p-3 text-ink">{eq.cargo}</td>
                              <td className="p-3 text-ink">{c.asig?.horasTotales} hs</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {secs[activeSec].fields.map((f) => (
              <ObservationFieldWrapper
                key={f.key}
                fKey={f.key}
                label={`${f.label}${f.required && canEdit ? ' *' : ''}`}
                campoPath={f.campoPath}
                notes={d.comments.filter((o) => o.field === f.key)}
                canEdit={canEdit}
                canObserve={canObserve}
                role={role}
                onAddObs={(k, path, txt) => onAddObs(k, path, txt, activeSec)}
                onResolveObs={onResolveObs}
              >
                {f.hint && canEdit && <p className="mb-2 text-[11px] text-muted">{f.hint}</p>}
                {renderCampo(f)}
              </ObservationFieldWrapper>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border bg-background px-6 py-4">
            <span className="text-[11px] text-muted">{canEdit ? 'Los campos marcados con * son obligatorios para presentar.' : 'Vista de consulta'}</span>
            <div className="flex gap-2">
              {activeSec > 0 && (
                <button type="button" onClick={() => setSection(activeSec - 1)} className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-ink hover:bg-background">
                  ← Anterior
                </button>
              )}
              {activeSec < secs.length - 1 && (
                <button type="button" onClick={() => setSection(activeSec + 1)} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover">
                  Siguiente apartado →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de acciones fija (solo en modo edición) */}
      {canEdit && (
        <div className="sticky bottom-4 z-30">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className={`flex items-center gap-1.5 font-medium ${d.sinGuardar ? 'text-amber-700 dark:text-amber-400' : 'text-muted'}`} aria-live="polite">
                <span aria-hidden className={`h-2 w-2 rounded-full ${d.sinGuardar ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {estadoGuardado}
              </span>
              {esPaac && (
                <span className={problemas.length ? 'text-muted' : 'font-medium text-emerald-700 dark:text-emerald-400'}>
                  {problemas.length ? `${problemas.length} punto(s) pendiente(s) para presentar` : '✓ Listo para presentar'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {confirmar ? (
                <>
                  <span className="text-[11px] font-medium text-ink">Al presentar se bloquea la edición. ¿Confirmás?</span>
                  <button type="button" onClick={() => setConfirmar(false)} className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-ink hover:bg-background">
                    Cancelar
                  </button>
                  <button type="button" onClick={presentar} autoFocus className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover">
                    Sí, presentar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onSaveDraft}
                    className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-ink hover:bg-background"
                  >
                    Guardar borrador
                  </button>
                  {canSubmit && (
                    <button type="button" onClick={presentar} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover">
                      {d.state === 'OBSERVADO' ? 'Subsanar y reenviar a revisión' : `Presentar ${d.type}`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
