'use client';

import { useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { ROL_LABELS } from '@/types/planificacion';

export interface UsuarioMateria {
  nombre: string;
  categoria: string;
  cicloLectivo: number;
}

export interface UsuarioRow {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  rol: string;
  carrera: string | null;
  materias: UsuarioMateria[];
}

const POR_PAGINA = 10;

export function UsuariosPanel({ usuarios }: { usuarios: UsuarioRow[] }) {
  const [query, setQuery] = useState('');
  const [rol, setRol] = useState('');
  const [carrera, setCarrera] = useState('');
  const [pagina, setPagina] = useState(1);
  const [seleccionado, setSeleccionado] = useState<UsuarioRow | null>(null);

  const filtrados = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('es');
    return usuarios.filter((u) => {
      const coincideBusqueda = !q || [u.nombre, u.apellido, `${u.nombre} ${u.apellido}`, u.email, u.dni, ROL_LABELS[u.rol] ?? u.rol, u.carrera ?? '']
        .some((valor) => valor.toLocaleLowerCase('es').includes(q));
      return coincideBusqueda && (!rol || u.rol === rol) && (!carrera || u.carrera === carrera);
    });
  }, [usuarios, query, rol, carrera]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filasPagina = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);
  const roles = [...new Set(usuarios.map((u) => u.rol))].sort((a, b) => (ROL_LABELS[a] ?? a).localeCompare(ROL_LABELS[b] ?? b, 'es'));
  const carreras = [...new Set(usuarios.flatMap((u) => u.carrera ? [u.carrera] : []))].sort((a, b) => a.localeCompare(b, 'es'));

  function limpiarFiltros() {
    setQuery('');
    setRol('');
    setCarrera('');
    setPagina(1);
  }

  return (
    <section aria-labelledby="lista-usuarios-heading" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">Directorio</p>
          <h2 id="lista-usuarios-heading" className="mt-1 text-lg font-semibold text-white sm:text-xl">Usuarios registrados</h2>
          <p className="mt-1 text-sm text-slate-400">Buscá por nombre, DNI o email, y acotá la lista por rol o carrera.</p>
        </div>
        <span className="w-fit rounded-full border border-blue-200/10 bg-blue-400/[0.07] px-3 py-1.5 text-xs font-medium tabular-nums text-blue-200">{filtrados.length} de {usuarios.length} usuarios</span>
      </div>

      <div className="rounded-xl border border-blue-100/10 bg-gradient-to-br from-[#12233e] to-[#0b172b] p-3 shadow-lg shadow-blue-950/10 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_minmax(160px,0.8fr)_minmax(160px,0.8fr)_auto]">
          <label className="block text-xs font-medium text-slate-400">Buscar usuario
            <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPagina(1); }} placeholder="Nombre, DNI o email..." className="mt-1.5 block w-full rounded-lg border border-blue-100/10 bg-[#09172b] px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-400/10" />
          </label>
          <label className="block text-xs font-medium text-slate-400">Rol
            <select value={rol} onChange={(event) => { setRol(event.target.value); setPagina(1); }} className="mt-1.5 block w-full rounded-lg border border-blue-100/10 bg-[#09172b] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-blue-300/40 focus:ring-2 focus:ring-blue-400/10">
              <option value="">Todos los roles</option>
              {roles.map((value) => <option key={value} value={value}>{ROL_LABELS[value] ?? value}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-400">Carrera
            <select value={carrera} onChange={(event) => { setCarrera(event.target.value); setPagina(1); }} className="mt-1.5 block w-full rounded-lg border border-blue-100/10 bg-[#09172b] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-blue-300/40 focus:ring-2 focus:ring-blue-400/10">
              <option value="">Todas las carreras</option>
              {carreras.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <button type="button" onClick={limpiarFiltros} className="self-end rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-blue-200/20 hover:bg-blue-400/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Limpiar</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-blue-100/10 bg-[#0d1b32]/90 shadow-lg shadow-blue-950/10">
        <div className="hidden grid-cols-[minmax(180px,1.5fr)_minmax(200px,1.8fr)_minmax(110px,0.9fr)_minmax(150px,1.2fr)_minmax(90px,0.7fr)] gap-4 border-b border-white/[0.08] bg-[#17243a] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:grid">
          <span>Nombre</span><span>Email</span><span>DNI</span><span>Rol</span><span>Carrera</span>
        </div>
        <div className="divide-y divide-white/[0.07]">
          {filasPagina.map((u) => (
            <button key={u.id} type="button" onClick={() => setSeleccionado(u)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-400/[0.05] focus:outline-none focus-visible:bg-blue-400/[0.07] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 md:grid-cols-[minmax(180px,1.5fr)_minmax(200px,1.8fr)_minmax(110px,0.9fr)_minmax(150px,1.2fr)_minmax(90px,0.7fr)] md:gap-4 md:px-5">
              <span className="flex min-w-0 items-center gap-3 md:block">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200/10 bg-blue-400/[0.08] text-xs font-semibold text-blue-200 md:hidden" aria-hidden="true">{u.nombre.trim().charAt(0)}{u.apellido.trim().charAt(0)}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-100">{u.nombre} {u.apellido}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500 md:hidden">{u.email}</span>
                </span>
              </span>
              <span className="hidden truncate text-sm text-slate-400 md:block">{u.email}</span>
              <span className="hidden text-sm tabular-nums text-slate-400 md:block">{u.dni}</span>
              <span className="hidden md:block"><span className="inline-flex rounded-md border border-blue-200/10 bg-blue-400/[0.07] px-2 py-1 text-xs text-blue-100/90">{ROL_LABELS[u.rol] ?? u.rol}</span></span>
              <span className="hidden truncate text-sm text-slate-400 md:block">{u.carrera ?? '—'}</span>
              <span aria-hidden="true" className="text-lg text-slate-500 md:hidden">›</span>
            </button>
          ))}
          {filtrados.length === 0 && <div className="px-5 py-12 text-center"><p className="text-sm font-medium text-slate-300">No se encontraron usuarios</p><p className="mt-1 text-xs text-slate-500">Probá con otros términos o quitá algún filtro.</p></div>}
        </div>
      </div>

      {filtrados.length > 0 && (
        <nav aria-label="Paginación de usuarios" className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0d1b32]/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">Mostrando {(paginaActual - 1) * POR_PAGINA + 1}–{Math.min(paginaActual * POR_PAGINA, filtrados.length)} de {filtrados.length}</p>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button type="button" aria-label="Página anterior" disabled={paginaActual <= 1} onClick={() => setPagina((actual) => Math.max(1, actual - 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:border-blue-300/25 hover:bg-blue-400/[0.08] disabled:pointer-events-none disabled:opacity-35"><ChevronIcon direccion="izquierda" /></button>
            <span className="min-w-[112px] text-center text-xs tabular-nums text-slate-400">Página {paginaActual} de {totalPaginas}</span>
            <button type="button" aria-label="Página siguiente" disabled={paginaActual >= totalPaginas} onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:border-blue-300/25 hover:bg-blue-400/[0.08] disabled:pointer-events-none disabled:opacity-35"><ChevronIcon direccion="derecha" /></button>
          </div>
        </nav>
      )}

      <Modal open={!!seleccionado} onClose={() => setSeleccionado(null)} title={seleccionado ? `${seleccionado.nombre} ${seleccionado.apellido}` : ''} widthClass="max-w-lg">
        {seleccionado && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Email">{seleccionado.email}</Detail>
              <Detail label="DNI">{seleccionado.dni}</Detail>
              <Detail label="Rol asignado">{ROL_LABELS[seleccionado.rol] ?? seleccionado.rol}</Detail>
              <Detail label="Carrera">{seleccionado.carrera ?? '—'}</Detail>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-400">Materias que dicta</p>
              {seleccionado.materias.length === 0 ? <p className="text-xs text-slate-500">Sin materias asignadas en el equipo de cátedra.</p> : (
                <div className="max-h-64 space-y-1.5 overflow-y-auto">
                  {seleccionado.materias.map((materia, i) => <div key={`${materia.nombre}-${materia.cicloLectivo}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0d1b32] px-3 py-2"><span className="min-w-0 truncate text-slate-200">{materia.nombre}</span><span className="shrink-0 text-xs text-slate-500">{materia.categoria} · {materia.cicloLectivo}</span></div>)}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words text-slate-200">{children}</p></div>;
}

function ChevronIcon({ direccion }: { direccion: 'izquierda' | 'derecha' }) {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8"><path d={direccion === 'izquierda' ? 'm12.5 4.5-5 5 5 5' : 'm7.5 4.5 5 5-5 5'} /></svg>;
}
