import { PEDITEMS, DISCITEMS } from '../../data/mockData';
import { StatusBadge } from '../shared/StatusBadge';

export function ReportEvaluationView({
  d, role, asigContext, onBackToDoc, onUpdatePedItem, onUpdateDiscItem, onEmitObserved, onEmitApprovedUap, onEmitApprovedDir,
}: any) {
  const ctx = asigContext(d.asignaturaId);
  const isUap = role === 'UAP';
  const isDir = role === 'DIRECCION_CARRERA';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <StatusBadge state={d.state} />
          <h1 className="text-2xl font-bold text-ink mt-1">Informes de Evaluación · {ctx.asig?.nombre}</h1>
        </div>
        <button onClick={() => onBackToDoc(d.id)} className="px-3.5 py-2 rounded-lg bg-surface border border-border text-xs text-ink font-medium">← Volver al PAAC</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-base font-bold text-amber-700 dark:text-amber-400">Informe Pedagógico UAP (Anexo III)</h2>
            <span className={`text-xs font-semibold ${d.pedApproved ? 'text-emerald-600' : 'text-muted'}`}>{d.pedApproved ? '✓ APROBADO' : 'Pendiente'}</span>
          </div>
          {PEDITEMS.map((item, idx) => (
            <div key={idx}>
              <label className="block text-xs font-semibold text-ink mb-1">{item}</label>
              <textarea
                rows={2}
                readOnly={!isUap || d.pedApproved}
                value={d.pedReport.items[idx] || ''}
                onChange={(e) => onUpdatePedItem(idx, e.target.value)}
                className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-ink"
              />
            </div>
          ))}
          {isUap && !d.pedApproved && (
            <div className="flex gap-2.5 pt-3">
              <button onClick={onEmitObserved} className="flex-1 py-2 rounded-lg bg-rose-500/15 text-rose-700 border border-rose-500/30 text-xs font-semibold">Observar</button>
              <button onClick={onEmitApprovedUap} className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-semibold">Dictamen Pedagógico Favorable</button>
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-base font-bold text-primary">Informe Disciplinar Dirección (Anexo IV)</h2>
            <span className={`text-xs font-semibold ${d.discApproved ? 'text-emerald-600' : 'text-muted'}`}>{d.discApproved ? '✓ APROBADO' : 'Pendiente'}</span>
          </div>
          {DISCITEMS.map((item, idx) => (
            <div key={idx}>
              <label className="block text-xs font-semibold text-ink mb-1">{item}</label>
              <select
                disabled={!isDir || d.discApproved}
                value={d.discReport.items[idx] || ''}
                onChange={(e) => onUpdateDiscItem(idx, e.target.value)}
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-ink"
              >
                <option value="">Seleccionar verificación…</option>
                {['Cumple', 'Cumple parcialmente', 'Requiere corrección'].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          ))}
          {isDir && !d.discApproved && (
            <div className="flex gap-2.5 pt-3">
              <button onClick={onEmitObserved} className="flex-1 py-2 rounded-lg bg-rose-500/15 text-rose-700 border border-rose-500/30 text-xs font-semibold">Observar</button>
              <button onClick={onEmitApprovedDir} className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-semibold">Dictamen Disciplinar Favorable</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}