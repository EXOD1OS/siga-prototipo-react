import { useState } from 'react';
import { PAAC_SCHEMA, PAAD_SCHEMA } from '../../data/mockData';
import { StatusBadge } from '../shared/StatusBadge';
import { ObservationFieldWrapper } from '../shared/ObservationFieldWrapper';

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
  onUpdateTableCell,
  onAddRow,
  onRemoveRow,
  onSaveDraft,
  onSubmitDoc,
  onAddObs,
  onResolveObs,
  onOpenReport,
  onOpenPaadModal,
}: any) {
  const [section, setSection] = useState(0);
  const secs = d.type === 'PAAC' ? PAAC_SCHEMA : PAAD_SCHEMA;
  const activeSec = Math.min(section, secs.length - 1);
  const ctx = d.type === 'PAAC' ? asigContext(d.asignaturaId) : null;

  const allFields = secs.flatMap((s) => s.fields);
  const doneCount = allFields.filter((f) => {
    const val = d.data[f.key];
    return Array.isArray(val) ? val.length > 0 : String(val ?? '').trim() !== '';
  }).length;
  const pct = allFields.length ? Math.round((doneCount / allFields.length) * 100) : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <StatusBadge state={d.state} />
            <span className="text-xs text-muted">
              {d.type} · Ciclo {d.cycle} · Persistencia JSONB:{' '}
              <code className="text-primary font-semibold">{d.type === 'PAAC' ? 'datosPaac' : 'datosPaad'}</code>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-ink">
            {d.type === 'PAAC' ? ctx?.asig?.nombre : `Mi PAAD Anual · ${fullName(d.owner)}`}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onBack}
            className="px-3.5 py-2 rounded-lg bg-surface border border-border text-xs text-ink font-medium"
          >
            ← Volver
          </button>

          {canEdit && (
            <button
              onClick={onSaveDraft}
              className="px-3.5 py-2 rounded-lg bg-surface hover:bg-background border border-border text-xs font-medium text-ink"
            >
              Guardar borrador
            </button>
          )}

          {canEdit && canSubmit && (
            <button
              onClick={onSubmitDoc}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm"
            >
              {d.state === 'OBSERVADO' ? 'Subsanar y reenviar a revisión' : `Presentar ${d.type}`}
            </button>
          )}

          {canEdit && !canSubmit && d.type === 'PAAC' && (
            <span className="px-3 py-2 rounded-lg bg-background border border-border text-[11px] text-muted">
              Edición colaborativa · Presenta el Docente Responsable
            </span>
          )}

          {d.type === 'PAAC' && ['UAP', 'DIRECCION_CARRERA'].includes(role) && (
            <button
              onClick={() => onOpenReport(d.id)}
              className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold"
            >
              Ir al Informe de Evaluación
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-3 bg-surface border border-border rounded-xl p-3.5 lg:sticky lg:top-20 space-y-3 shadow-sm">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted">Apartados {d.type}</div>
          <nav className="space-y-1">
            {secs.map((s, idx) => {
              const secObs = d.comments.filter((o: any) => !o.resolved && o.section === idx).length;
              const isAct = activeSec === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSection(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition ${
                    isAct
                      ? 'bg-soft text-primary font-semibold border border-primary/25'
                      : 'text-muted hover:text-ink hover:bg-background'
                  }`}
                >
                  <span className="truncate">{s.title}</span>
                  {secObs > 0 && (
                    <span className="w-5 h-5 rounded-full bg-danger text-white text-[10px] flex items-center justify-center font-bold">
                      {secObs}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="pt-3 border-t border-border px-2">
            <div className="flex justify-between text-[11px] text-muted mb-1">
              <span>Campos completados</span>
              <strong className="text-ink">{pct}%</strong>
            </div>
            <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
              <div className="bg-primary h-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </aside>

        <div className="lg:col-span-9 bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border bg-background/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Apartado {activeSec + 1} de {secs.length}
            </span>
            <h2 className="text-lg font-bold text-ink mt-0.5">{secs[activeSec].norm}</h2>
          </div>

          <div className="p-6">
            {activeSec === 0 && d.type === 'PAAC' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] text-muted mb-1">Sede</label>
                    <input readOnly value={ctx?.sede?.nombre || ''} className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-ink" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted mb-1">Departamento</label>
                    <input readOnly value={ctx?.depto?.nombre || 'Sede Regional'} className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-ink" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted mb-1">Carrera</label>
                    <input readOnly value={ctx?.carrera?.nombre || ''} className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-ink" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted mb-1">Plan / Enfoque</label>
                    <input readOnly value={`${ctx?.plan?.ordenanza} (${ctx?.plan?.enfoque})`} className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-ink" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted mb-1">Asignatura</label>
                    <input readOnly value={ctx?.asig?.nombre || ''} className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-ink" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted mb-1">Crédito y Régimen</label>
                    <input readOnly value={`${ctx?.asig?.anoCursada}.º Año · ${ctx?.asig?.regimenDictado} · ${ctx?.asig?.horasTotales} hs`} className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-ink" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5">
                    Equipo Docente de la Cátedra y Acceso a PAADs Presentados
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-background text-muted border-b border-border">
                          <th className="p-3">Docente</th>
                          <th className="p-3">Cargo</th>
                          <th className="p-3">Permisos en PAAC</th>
                          <th className="p-3">Estado PAAD ({S.cycle})</th>
                          <th className="p-3 text-right">Consulta PAAD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {equipoDeAsig(d.asignaturaId).map((eq: any) => {
                          const p = S.docs.find((x: any) => x.type === 'PAAD' && x.owner === eq.docenteId);
                          const isPresented = p && p.state !== 'BORRADOR';
                          // REGLA DE PRIVACIDAD: El Profesor Auxiliar NO puede ver los PAADs del resto de los profesores
                          const canSeeThisPaad = role !== 'DOCENTE_AUXILIAR' || eq.docenteId === uid;

                          return (
                            <tr key={eq.id}>
                              <td className="p-3 font-medium text-ink">{fullName(eq.docenteId)}</td>
                              <td className="p-3 text-ink">{eq.cargo}</td>
                              <td className="p-3">
                                {eq.esResponsable ? (
                                  <span className="text-primary font-semibold">Responsable (Edita y Presenta)</span>
                                ) : (
                                  <span className="text-ink">Integrante (Edita colaborativamente)</span>
                                )}
                              </td>
                              <td className="p-3">{p ? <StatusBadge state={p.state} /> : '—'}</td>
                              <td className="p-3 text-right">
                                {!canSeeThisPaad ? (
                                  <span className="text-[11px] text-muted italic">Acceso restringido (Auxiliar)</span>
                                ) : isPresented ? (
                                  <button
                                    onClick={() => onOpenPaadModal(p.id)}
                                    className="px-2.5 py-1 rounded-md bg-soft hover:bg-primary hover:text-white text-primary border border-primary/30 font-semibold text-[11px] transition"
                                  >
                                    Ver PAAD (Modal) ↗
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

            {activeSec === 0 && d.type === 'PAAD' && (
              <div className="space-y-4 mb-6 pb-6 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                  1.a) Asignaturas atendidas en el ciclo lectivo (Autocompletado desde Equipos de Cátedra)
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-background text-muted border-b border-border">
                        <th className="p-3">Carrera</th>
                        <th className="p-3">Asignatura</th>
                        <th className="p-3">Cargo</th>
                        <th className="p-3">Horas Totales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {S.equiposCatedra
                        .filter((e: any) => e.docenteId === d.owner && e.cicloLectivo === S.cycle)
                        .map((eq: any) => {
                          const c = asigContext(eq.asignaturaId);
                          return (
                            <tr key={eq.id}>
                              <td className="p-3 font-semibold text-primary">{c.carrera?.codigo}</td>
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
                label={f.label}
                campoPath={f.campoPath}
                notes={d.comments.filter((o: any) => o.field === f.key)}
                canEdit={canEdit}
                canObserve={canObserve}
                role={role}
                onAddObs={(k, path, txt) => onAddObs(k, path, txt, activeSec)}
                onResolveObs={onResolveObs}
              >
                {f.type === 'table' && f.cols ? (
                  <div>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-background text-muted border-b border-border text-[11px]">
                            {f.cols.map((c) => (
                              <th key={c} className="p-2.5">
                                {c}
                              </th>
                            ))}
                            {canEdit && <th className="p-2.5 w-10 text-center">Quitar</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-surface">
                          {(d.data[f.key] || []).length > 0 ? (
                            (d.data[f.key] || []).map((r: string[], rIdx: number) => (
                              <tr key={rIdx}>
                                {f.cols!.map((_, cIdx) => (
                                  <td key={cIdx} className="p-2">
                                    {canEdit ? (
                                      <input
                                        value={r[cIdx] || ''}
                                        onChange={(e) => onUpdateTableCell(f.key, rIdx, cIdx, e.target.value)}
                                        placeholder={f.cols![cIdx]}
                                        className="w-full bg-background border border-border focus:border-primary rounded px-2.5 py-1.5 text-xs text-ink outline-none"
                                      />
                                    ) : (
                                      <span className="text-ink">{r[cIdx] || ''}</span>
                                    )}
                                  </td>
                                ))}
                                {canEdit && (
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => onRemoveRow(f.key, rIdx)}
                                      title="Eliminar fila"
                                      className="px-2 py-1 rounded hover:bg-rose-500/10 text-danger font-bold transition"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={f.cols.length + (canEdit ? 1 : 0)} className="p-4 text-center text-muted">
                                Sin registros cargados. Usa "+ Agregar fila" para añadir elementos.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => onAddRow(f.key, f.cols!.length)}
                        className="mt-2.5 px-3.5 py-1.5 rounded-lg bg-soft hover:bg-primary hover:text-white border border-primary/30 text-xs text-primary font-semibold transition"
                      >
                        + Agregar fila
                      </button>
                    )}
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    readOnly={!canEdit}
                    value={d.data[f.key] || ''}
                    onChange={(e) => onUpdateField(f.key, e.target.value)}
                    placeholder="Completar campo reglamentario…"
                    className="w-full rounded-lg bg-background border border-border focus:border-primary p-3 text-xs text-ink leading-relaxed outline-none transition"
                  />
                )}
              </ObservationFieldWrapper>
            ))}
          </div>

          <div className="px-6 py-4 bg-background/60 border-t border-border flex justify-between items-center">
            <span className="text-[11px] text-muted">
              {canEdit ? 'Edición colaborativa activa · Los campos sin observaciones ocupan el ancho total' : 'Vista de consulta'}
            </span>
            <div className="flex gap-2">
              {activeSec > 0 && (
                <button
                  onClick={() => setSection(activeSec - 1)}
                  className="px-3.5 py-2 rounded-lg bg-surface border border-border text-xs font-medium text-ink"
                >
                  ← Anterior
                </button>
              )}
              {activeSec < secs.length - 1 && (
                <button
                  onClick={() => setSection(activeSec + 1)}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
                >
                  Siguiente apartado →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}