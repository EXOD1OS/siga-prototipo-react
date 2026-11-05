const STATE_STYLES: Record<string, { label: string; cls: string }> = {
  BORRADOR: { label: 'Borrador', cls: 'bg-slate-500/15 text-slate-600' },
  ENVIADO_A_REVISION: { label: 'En Revisión', cls: 'bg-amber-500/15 text-amber-700' },
  OBSERVADO: { label: 'Observado', cls: 'bg-red-500/15 text-red-700' },
  APROBADO_PEDAGOGICO: { label: 'Aprob. Pedagógico', cls: 'bg-sky-500/15 text-sky-700' },
  APROBADO_DISCIPLINAR: { label: 'Aprob. Disciplinar', cls: 'bg-sky-500/15 text-sky-700' },
  APROBADO_PLENO: { label: 'Aprobado Pleno', cls: 'bg-emerald-500/15 text-emerald-700' },
  APROBADO: { label: 'Aprobado', cls: 'bg-emerald-500/15 text-emerald-700' },
  ELEVADO_AL_CONSEJO: { label: 'Elevado al Consejo', cls: 'bg-indigo-500/15 text-indigo-700' },
  FINALIZADO: { label: 'Finalizado', cls: 'bg-purple-500/15 text-purple-700' },
};

export function StatusBadge({ state }: { state: string }) {
  const s = STATE_STYLES[state] || { label: state, cls: 'bg-soft text-muted' };
  return <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${s.cls}`}>{s.label}</span>;
}
