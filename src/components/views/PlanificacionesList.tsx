import { useState } from 'react';
import { StatusBadge } from '../shared/StatusBadge';

export function PlanificacionesList({
  paacs, role, careerId, asigContext, fullName, equipoDeAsig, onOpenDoc, onOpenReport, onElevarPaac, onOpenFormalizarModal, onViewFinal,
}: any) {
  const [query, setQuery] = useState('');
  const [filterState, setFilterState] = useState('ALL');

  const filtered = paacs.filter((d: any) => {
    const ctx = asigContext(d.asignaturaId);
    if (role === 'DIRECCION_CARRERA' && ctx.carrera?.id !== careerId) return false;
    if (filterState !== 'ALL' && d.state !== filterState) return false;
    const txt = `${ctx.asig?.nombre} ${ctx.carrera?.codigo} ${fullName(d.owner)}`.toLowerCase();
    return txt.includes(query.toLowerCase());
  });

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-center justify-between bg-background/50">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por asignatura, carrera o docente responsable…"
          className="w-full sm:max-w-xs rounded-lg bg-surface border border-border px-3 py-2 text-xs text-ink outline-none focus:border-primary"
        />
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="w-full sm:w-auto rounded-lg bg-surface border border-border px-3 py-2 text-xs text-ink"
        >
          <option value="ALL">Todos los estados del circuito</option>
          <option value="BORRADOR">Borrador</option>
          <option value="ENVIADO_A_REVISION">Enviado a Revisión</option>
          <option value="OBSERVADO">Observado</option>
          <option value="APROBADO_PLENO">Aprobado Pleno</option>
          <option value="ELEVADO_AL_CONSEJO">Elevado al Consejo</option>
          <option value="FINALIZADO">Finalizado (S3 PDF)</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-background text-muted border-b border-border text-[11px]">
              <th className="p-4">Asignatura / Plan</th>
              <th className="p-4">Régimen</th>
              <th className="p-4">Docente Responsable</th>
              <th className="p-4">Estado Circuito</th>
              <th className="p-4">Dictámenes</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((d: any) => {
              const ctx = asigContext(d.asignaturaId);
              const unres = d.comments.filter((c: any) => !c.resolved).length;
              return (
                <tr key={d.id} className="hover:bg-background/60 transition">
                  <td className="p-4">
                    <div className="font-bold text-ink text-sm">{ctx.asig?.nombre}</div>
                    <div className="text-[11px] text-muted">{ctx.carrera?.codigo} · {ctx.plan?.ordenanza} ({ctx.plan?.enfoque})</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-ink">{ctx.asig?.anoCursada}.º Año · {ctx.asig?.regimenDictado}</div>
                    <div className="text-[11px] text-muted">{ctx.asig?.horasTotales} hs totales</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-ink">{fullName(d.owner)}</div>
                    <div className="text-[11px] text-muted">{equipoDeAsig(d.asignaturaId).length} integrantes</div>
                  </td>
                  <td className="p-4 space-y-1">
                    <div><StatusBadge state={d.state} /></div>
                    {unres > 0 && <div><span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-semibold">{unres} obs. activa(s)</span></div>}
                    {d.expediente && <div className="text-[10px] font-mono text-primary font-semibold">{d.expediente} · {d.resolucion}</div>}
                  </td>
                  <td className="p-4 space-y-1">
                    <div><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${d.pedApproved ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-background text-muted'}`}>UAP: {d.pedApproved ? 'Favorable' : 'Pendiente'}</span></div>
                    <div><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${d.discApproved ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-background text-muted'}`}>Dir: {d.discApproved ? 'Favorable' : 'Pendiente'}</span></div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button onClick={() => onOpenDoc(d.id)} className="px-3 py-1.5 rounded-lg bg-background hover:bg-soft border border-border text-ink font-medium">PAAC</button>
                      {['UAP', 'DIRECCION_CARRERA', 'ADMINISTRADOR', 'CONSEJO_DEPARTAMENTAL'].includes(role) && (
                        <button onClick={() => onOpenReport(d.id)} className="px-3 py-1.5 rounded-lg bg-background hover:bg-soft border border-border text-primary font-semibold">Informes</button>
                      )}
                      {role === 'DIRECCION_CARRERA' && d.state === 'APROBADO_PLENO' && (
                        <button onClick={() => onElevarPaac(d.id)} className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold">Elevar al CD</button>
                      )}
                      {role === 'CONSEJO_DEPARTAMENTAL' && ['APROBADO_PLENO', 'ELEVADO_AL_CONSEJO'].includes(d.state) && (
                        <button onClick={() => onOpenFormalizarModal(d.id)} className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold">Formalizar Exp.</button>
                      )}
                      {d.state === 'FINALIZADO' && (
                        <button onClick={() => onViewFinal(d.id)} className="px-3 py-1.5 rounded-lg bg-soft text-primary border border-primary/30 font-semibold">PDF / S3</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}