import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { puedeVerPaad, PAAD_LABELS } from '@/lib/paad';
import { PaadStatus } from '@prisma/client';

export default async function PaadsPage({ searchParams }: { searchParams: { ciclo?: string; estado?: string; q?: string; pagina?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMINISTRADOR', 'UAP', 'DIRECCION_CARRERA'].includes(session.user.rol)) notFound();
  const ciclo = searchParams.ciclo ?? String(new Date().getFullYear());
  const estado = Object.values(PaadStatus).includes(searchParams.estado as PaadStatus) ? searchParams.estado as PaadStatus : undefined;
  const busqueda = searchParams.q?.trim() ?? '';
  const candidates = await prisma.paadAnual.findMany({ where: {
    ...(ciclo !== 'todos' ? { cicloLectivo: Number(ciclo) || new Date().getFullYear() } : {}),
  }, include: { docente: true, carreraEvaluadora: true }, orderBy: { updatedAt: 'desc' } });
  const permisos = await Promise.all(candidates.map(p => puedeVerPaad(prisma, session.user, p)));
  const visibles = candidates.filter((_, i) => permisos[i]);
  const conBusqueda = visibles.filter(p => !busqueda || `${p.docente.nombre} ${p.docente.apellido} ${p.carreraEvaluadora?.nombre ?? ''}`.toLocaleLowerCase('es').includes(busqueda.toLocaleLowerCase('es')));
  const filtrados = estado ? conBusqueda.filter(p => p.estado === estado) : conBusqueda;
  const conteosEstado: Record<string, number> = {};
  for (const paad of conBusqueda) conteosEstado[paad.estado] = (conteosEstado[paad.estado] ?? 0) + 1;
  const tamanoPagina = 9;
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / tamanoPagina));
  const paginaSolicitada = Math.max(1, Number.parseInt(searchParams.pagina ?? '1', 10) || 1);
  const paginaActual = Math.min(paginaSolicitada, totalPaginas);
  const paadsPagina = filtrados.slice((paginaActual - 1) * tamanoPagina, paginaActual * tamanoPagina);
  function hrefPagina(pagina: number) {
    const params = new URLSearchParams();
    params.set('ciclo', ciclo);
    if (estado) params.set('estado', estado);
    if (busqueda) params.set('q', busqueda);
    params.set('pagina', String(pagina));
    return `/paads?${params.toString()}`;
  }
  function hrefEstado(estadoSeleccionado?: PaadStatus) {
    const params = new URLSearchParams();
    params.set('ciclo', ciclo);
    if (estadoSeleccionado) params.set('estado', estadoSeleccionado);
    if (busqueda) params.set('q', busqueda);
    return `/paads?${params.toString()}`;
  }
  const ciclos = await prisma.paadAnual.findMany({ select: { cicloLectivo: true }, distinct: ['cicloLectivo'], orderBy: { cicloLectivo: 'desc' } });
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5">
      <header className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-blue-200/10 bg-gradient-to-r from-[#10213d] via-[#0d1b32] to-[#101a38] p-5 shadow-lg shadow-blue-950/20 sm:flex-row sm:items-center sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-28 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">Gestión académica</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">PAAD anuales</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">Consultá y revisá los planes anuales de actividad docente por ciclo y estado.</p>
        </div>
        <div className="relative flex w-fit items-center self-start rounded-xl border border-white/10 bg-[#071326]/35 px-5 py-4 shadow-lg backdrop-blur-sm sm:self-auto">
          <Image src="/unlar-logo.png" alt="Universidad Nacional de La Rioja" width={311} height={104} priority className="h-auto w-52 object-contain sm:w-60" />
        </div>
      </header>

      <form className="rounded-xl border border-blue-100/10 bg-gradient-to-br from-[#12233e] to-[#0b172b] p-4 shadow-lg shadow-blue-950/20 sm:p-5" method="get">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(250px,1.4fr)_minmax(160px,0.7fr)_minmax(180px,0.9fr)_auto_auto]">
          <label className="block text-xs font-medium text-slate-400">Buscar docente o carrera
            <input type="search" name="q" defaultValue={busqueda} placeholder="Nombre o carrera..." className="mt-1.5 block w-full rounded-lg border border-blue-100/10 bg-[#09172b] px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-400/10" />
          </label>
          <label className="block text-xs font-medium text-slate-400">Ciclo lectivo
            <select name="ciclo" defaultValue={ciclo} className="mt-1.5 block w-full rounded-lg border border-blue-100/10 bg-[#09172b] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-blue-300/40 focus:ring-2 focus:ring-blue-400/10">
              <option value="todos">Todos los ciclos</option>
              {[...new Set([new Date().getFullYear(), ...ciclos.map(c => c.cicloLectivo)])].sort((a,b) => b-a).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-400">Estado
            <select name="estado" defaultValue={estado ?? ''} className="mt-1.5 block w-full rounded-lg border border-blue-100/10 bg-[#09172b] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-blue-300/40 focus:ring-2 focus:ring-blue-400/10">
              <option value="">Todos los estados</option>
              {Object.entries(PAAD_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <button className="min-h-[42px] rounded-lg border border-blue-300/20 bg-blue-500/15 px-5 py-2.5 text-sm font-medium text-blue-100 transition hover:border-blue-300/40 hover:bg-blue-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Filtrar PAAD</button>
          <Link href="/paads" className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-blue-200/20 hover:bg-blue-400/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Limpiar filtros</Link>
        </div>
      </form>

      <nav aria-label="Accesos rápidos por estado" className="flex flex-wrap gap-2">
        <Link href={hrefEstado()} aria-current={!estado ? 'page' : undefined} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${!estado ? 'border-blue-300/30 bg-blue-500/15 text-blue-100' : 'border-white/10 bg-[#0d1b32]/90 text-slate-300 hover:border-blue-200/20 hover:bg-blue-400/[0.07] hover:text-white'}`}>
          <span>Todos</span><span className="rounded-md bg-black/20 px-1.5 py-0.5 tabular-nums">{conBusqueda.length}</span>
        </Link>
        {Object.entries(PAAD_LABELS).map(([key, label]) => {
          const seleccionado = estado === key;
          return <Link key={key} href={hrefEstado(key as PaadStatus)} aria-current={seleccionado ? 'page' : undefined} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${seleccionado ? 'border-blue-300/30 bg-blue-500/15 text-blue-100' : 'border-white/10 bg-[#0d1b32]/90 text-slate-300 hover:border-blue-200/20 hover:bg-blue-400/[0.07] hover:text-white'}`}>
            <span>{label}</span><span className="rounded-md bg-black/20 px-1.5 py-0.5 tabular-nums">{conteosEstado[key] ?? 0}</span>
          </Link>;
        })}
      </nav>

      <section aria-labelledby="paad-resultados-heading">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-medium text-blue-300">Documentos disponibles</p>
            <h2 id="paad-resultados-heading" className="mt-1 text-lg font-semibold text-white">Planes anuales</h2>
          </div>
          <span className="rounded-full border border-blue-200/10 bg-blue-400/[0.07] px-3 py-1 text-xs font-medium tabular-nums text-blue-200">{filtrados.length} PAAD</span>
        </div>
        {filtrados.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {paadsPagina.map(p => (
              <Link key={p.id} href={'/paads/' + p.id} className="group flex min-h-[150px] flex-col justify-between rounded-xl border border-white/10 bg-[#0d1b32]/90 p-4 shadow-md shadow-blue-950/10 transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/25 hover:bg-[#10213b] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:p-5">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200/10 bg-blue-400/[0.08] text-sm font-semibold text-blue-200" aria-hidden="true">{p.docente.nombre.trim().charAt(0)}{p.docente.apellido.trim().charAt(0)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100 transition-colors group-hover:text-white" title={`${p.docente.nombre} ${p.docente.apellido}`}>{p.docente.nombre} {p.docente.apellido}</p>
                    <p className="mt-1 text-xs text-slate-400">Ciclo lectivo {p.cicloLectivo}</p>
                  </div>
                  <PaadStatusBadge estado={p.estado} />
                </div>
                <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/[0.07] pt-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Dirección evaluadora</p>
                    <p className="mt-1 truncate text-xs text-slate-300">{p.carreraEvaluadora?.nombre ?? 'Dirección pendiente'}</p>
                    {p.conflictoMigracion && <p className="mt-1 text-[11px] font-medium text-amber-200">Conflicto de copias pendiente</p>}
                  </div>
                  <span aria-hidden="true" className="shrink-0 text-sm text-slate-500 transition-colors group-hover:text-blue-300">Abrir →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-[#0d1b32]/90 px-5 py-12 text-center shadow-lg shadow-blue-950/20">
            <p className="text-sm font-medium text-slate-300">No hay PAAD para estos filtros</p>
            <p className="mt-1 text-xs text-slate-500">Probá otra búsqueda o cambiá el ciclo lectivo y el estado.</p>
          </div>
        )}
        {filtrados.length > 0 && (
          <nav aria-label="Paginación de PAAD" className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0d1b32]/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">Mostrando {(paginaActual - 1) * tamanoPagina + 1}–{Math.min(paginaActual * tamanoPagina, filtrados.length)} de {filtrados.length}</p>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <Link aria-disabled={paginaActual === 1} tabIndex={paginaActual === 1 ? -1 : undefined} href={hrefPagina(Math.max(1, paginaActual - 1))} className={`rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-300/25 hover:bg-blue-400/[0.08] ${paginaActual === 1 ? 'pointer-events-none opacity-40' : ''}`}>Anterior</Link>
              <span className="min-w-[100px] text-center text-xs tabular-nums text-slate-400">Página {paginaActual} de {totalPaginas}</span>
              <Link aria-disabled={paginaActual === totalPaginas} tabIndex={paginaActual === totalPaginas ? -1 : undefined} href={hrefPagina(Math.min(totalPaginas, paginaActual + 1))} className={`rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-300/25 hover:bg-blue-400/[0.08] ${paginaActual === totalPaginas ? 'pointer-events-none opacity-40' : ''}`}>Siguiente</Link>
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}

function PaadStatusBadge({ estado }: { estado: PaadStatus }) {
  const estilos: Record<PaadStatus, string> = {
    BORRADOR: 'border-white/10 bg-white/[0.06] text-slate-300',
    ENVIADO_A_REVISION: 'border-blue-300/20 bg-blue-400/10 text-blue-200',
    OBSERVADO: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
    APROBADO_UAP: 'border-blue-300/20 bg-blue-400/10 text-blue-200',
    APROBADO_DIRECCION: 'border-indigo-300/20 bg-indigo-400/10 text-indigo-200',
    APROBADO: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
  };

  return <span className={`shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-medium ${estilos[estado]}`}>{PAAD_LABELS[estado]}</span>;
}
