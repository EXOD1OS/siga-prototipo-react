import { PAAD_SCHEMA } from '../../data/mockData';
import { StatusBadge } from './StatusBadge';

interface Props {
  paad: any;
  docenteName: string;
  carreraEvalName: string;
  misEquipos: any[];
  asigContext: (id: string) => any;
  onClose: () => void;
}

export function PaadModal({
  paad,
  docenteName,
  carreraEvalName,
  misEquipos,
  asigContext,
  onClose,
}: Props) {
  if (!paad) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge state={paad.state} />
              <span className="text-xs text-muted">
                PAAD Anual (Anexo III) · Ciclo {paad.cycle} · Evalúa: <strong>{carreraEvalName}</strong>
              </span>
            </div>
            <h3 className="text-lg font-bold text-ink">PAAD · {docenteName}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-background hover:bg-soft border border-border flex items-center justify-center text-muted hover:text-ink font-bold"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo scrolleable con todos los apartados del PAAD */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          <div>
            <h4 className="font-bold uppercase tracking-wider text-primary mb-2">
              1.a) Asignaturas atendidas en el ciclo lectivo
            </h4>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background text-muted border-b border-border">
                    <th className="p-2.5">Carrera</th>
                    <th className="p-2.5">Asignatura</th>
                    <th className="p-2.5">Régimen</th>
                    <th className="p-2.5">Cargo en Cátedra</th>
                    <th className="p-2.5">Carga Horaria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {misEquipos.map((eq: any) => {
                    const c = asigContext(eq.asignaturaId);
                    return (
                      <tr key={eq.id}>
                        <td className="p-2.5 font-semibold text-primary">{c.carrera?.codigo}</td>
                        <td className="p-2.5 font-medium text-ink">{c.asig?.nombre}</td>
                        <td className="p-2.5 text-muted">{c.asig?.regimenDictado}</td>
                        <td className="p-2.5 text-ink">{eq.cargo}</td>
                        <td className="p-2.5 text-ink">{c.asig?.horasTotales} hs</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {PAAD_SCHEMA.map((sec, idx) => (
            <div key={idx} className="space-y-3 pt-4 border-t border-border">
              <h4 className="font-bold text-ink text-sm">{sec.norm}</h4>
              {sec.fields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <div className="font-semibold text-muted">{f.label}</div>
                  {f.type === 'table' && f.cols ? (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-background text-muted border-b border-border">
                            {f.cols.map((col) => (
                              <th key={col} className="p-2">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {(paad.data[f.key] || []).map((row: string[], rIdx: number) => (
                            <tr key={rIdx}>
                              {f.cols!.map((_, cIdx) => (
                                <td key={cIdx} className="p-2 text-ink">
                                  {row[cIdx] || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-background border border-border text-ink leading-relaxed">
                      {paad.data[f.key] || 'Sin especificar.'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-3.5 border-t border-border bg-background/60 flex justify-between items-center text-xs">
          <div className="flex gap-2">
            <span className={`px-2 py-0.5 rounded font-semibold ${paad.pedApproved ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/10 text-muted'}`}>
              UAP: {paad.pedApproved ? '✓ Conformidad' : 'Pendiente'}
            </span>
            <span className={`px-2 py-0.5 rounded font-semibold ${paad.discApproved ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/10 text-muted'}`}>
              Dirección: {paad.discApproved ? '✓ Conformidad' : 'Pendiente'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition"
          >
            Cerrar Vista PAAD
          </button>
        </div>
      </div>
    </div>
  );
}