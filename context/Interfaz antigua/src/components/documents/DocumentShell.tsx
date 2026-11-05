'use client';

import Image from 'next/image';

export function DocumentShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="no-print mx-auto mb-3 flex max-w-5xl justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-300/20 bg-blue-500/10 px-3.5 py-2 text-xs font-medium text-blue-100 transition hover:border-blue-300/40 hover:bg-blue-500/20"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7"><path d="M7 8V3.75h10V8M7 17H5.5A2.5 2.5 0 0 1 3 14.5v-4A2.5 2.5 0 0 1 5.5 8h13a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-2.5 2.5H17"/><path d="M7 14h10v6.25H7zM17.5 11.5h.01"/></svg>
          Imprimir o guardar como PDF
        </button>
      </div>
      <article className="print-area mx-auto max-w-5xl space-y-6 rounded-xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-800 shadow-xl shadow-black/20 sm:p-8 lg:p-10">
        <header className="flex items-center justify-between gap-4 border-b-2 border-[#c65c22] pb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#17345a]">Universidad Nacional de La Rioja · DACEFyN</p>
            <h2 className="mt-2 text-xl font-bold leading-snug text-[#10213d] sm:text-2xl">{title}</h2>
            {subtitle && <p className="mt-1.5 text-xs leading-5 text-slate-600">{subtitle}</p>}
          </div>
          <Image src="/unlar-escudo.png" alt="Escudo de la Universidad Nacional de La Rioja" width={600} height={600} className="h-14 w-14 shrink-0 object-contain sm:h-[4.5rem] sm:w-[4.5rem] print:h-16 print:w-16" priority />
        </header>
        {children}
      </article>
    </div>
  );
}

export function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="doc-section space-y-3">
      <h3 className="border-l-[3px] border-[#c65c22] bg-blue-50/80 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#17345a]">{title}</h3>
      <div className="space-y-3 px-1">{children}</div>
    </section>
  );
}

export function DocField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-[minmax(150px,0.7fr)_minmax(0,2fr)] sm:gap-3">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 whitespace-pre-wrap text-slate-800">{value || <span className="text-slate-300">Sin información</span>}</dd>
    </div>
  );
}

export function DocTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[#eaf0f8] text-[#17345a]">
            {headers.map((h) => (
              <th key={h} className="border-b border-r border-slate-200 px-3 py-2 text-left font-semibold last:border-r-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 ? 'bg-slate-50/80' : 'bg-white'}>
              {row.map((cell, j) => (
                <td key={j} className="border-b border-r border-slate-200 px-3 py-2 align-top text-slate-700 last:border-r-0">
                  {cell ?? '—'}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-3 text-center text-slate-400">
                No se registraron actividades en este apartado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
