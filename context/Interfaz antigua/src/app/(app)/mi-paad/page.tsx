import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PaadDetail } from '@/components/PaadDetail';

export default async function MiPaadPage({ searchParams }: { searchParams: { ciclo?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.rol !== 'DOCENTE') notFound();
  const paads = await prisma.paadAnual.findMany({ where: { docenteId: session.user.id }, orderBy: { cicloLectivo: 'desc' } });
  const ciclos = [...new Set([new Date().getFullYear(), ...paads.map(p => p.cicloLectivo)])].sort((a,b) => b-a);
  const solicitado = Number(searchParams.ciclo);
  const ciclo = ciclos.includes(solicitado) ? solicitado : ciclos[0];
  const actual = paads.find(p => p.cicloLectivo === ciclo);

  return <div className="relative isolate -mx-4 -my-5 min-h-screen overflow-hidden bg-[#071326] px-4 py-6 text-slate-200 sm:-mx-6 sm:-my-7 sm:px-6 sm:py-8 xl:-mx-8 xl:-my-8 xl:px-10 xl:py-9">
    <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-40 h-[520px] w-[620px] rounded-full bg-blue-600/15 blur-[130px]" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 left-[28%] h-[360px] w-[520px] rounded-full bg-indigo-700/10 blur-[120px]" />
    <div className="relative mx-auto w-full max-w-[1440px] space-y-5 sm:space-y-6">
      <header className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-blue-200/10 bg-gradient-to-r from-[#10213d] via-[#0d1b32] to-[#101a38] p-5 shadow-lg shadow-blue-950/20 sm:flex-row sm:items-center sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-28 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">UNLaR · Espacio docente</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Mi PAAD</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">Completá y consultá tu Plan Anual de Actividades Docentes.</p>
        </div>
        <div className="relative flex w-fit items-center self-start rounded-xl border border-white/10 bg-[#071326]/35 px-5 py-4 shadow-lg backdrop-blur-sm sm:self-auto">
          <Image src="/unlar-logo.png" alt="Universidad Nacional de La Rioja" width={311} height={104} priority className="h-auto w-52 object-contain sm:w-60" />
        </div>
      </header>

      <section className="flex flex-col gap-4 rounded-xl border border-blue-100/10 bg-gradient-to-br from-[#12233e] to-[#0b172b] p-4 shadow-lg shadow-blue-950/20 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-sm font-semibold text-slate-100">Ciclo lectivo {ciclo}</p>
          <p className="mt-1 text-xs text-slate-400">El PAAD es anual y reúne tus actividades de todas las materias del ciclo.</p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <label htmlFor="mi-paad-ciclo" className="text-xs font-medium text-slate-400">Consultar otro ciclo</label>
          <select id="mi-paad-ciclo" name="ciclo" defaultValue={ciclo} className="min-h-10 min-w-24 rounded-lg border border-blue-100/10 bg-[#09172b] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-300/40 focus:ring-2 focus:ring-blue-400/10">
            {ciclos.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="min-h-10 rounded-lg border border-blue-300/20 bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-100 transition hover:border-blue-300/40 hover:bg-blue-500/25">Ver</button>
        </form>
      </section>

      {actual ? <PaadDetail id={actual.id} actor={session.user} showInstitutionalLogo={false} /> : <section className="rounded-2xl border border-white/10 bg-[#0d1b32]/90 px-5 py-12 text-center shadow-lg shadow-blue-950/20">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-blue-200/10 bg-blue-400/[0.08] text-blue-200" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.6"><path d="M7 3.75h7l4.25 4.5v12A1.75 1.75 0 0 1 16.5 22h-9A1.75 1.75 0 0 1 5.75 20.25V5.5A1.75 1.75 0 0 1 7.5 3.75Z"/><path d="M14 4v5h4M9 13h6M9 17h6"/></svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-white">Todavía no está habilitado tu PAAD</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">Administración debe generar el documento para este ciclo. Cuando esté disponible, aparecerá en esta pantalla.</p>
      </section>}
    </div>
  </div>;
}
