'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { UserRole } from '@prisma/client';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setSelectedCycle } from '@/redux/slices/planificationSlice';
import { StatusBadge } from '@/components/StatusBadge';
import { ResolucionModal } from '@/components/ResolucionModal';
import { ESTADO_LABELS } from '@/types/planificacion';

interface PlanifRow {
  id: string;
  estado: string;
  cicloLectivo: number;
  regimen: string;
  numeroExpediente: string | null;
  numeroResolucion: string | null;
  fechaAprobacionCd: string | null;
  asignatura: { nombre: string; planEstudio: { carrera: { nombre: string; codigo: string; sede: { nombre: string } } } };
  docenteResponsable: { nombre: string; apellido: string };
}

const TODOS = '__todos__';
const TAMANO_PAGINA = 10;

function periodoDe(regimen: string): '1C' | '2C' {
  return regimen === '2C' ? '2C' : '1C';
}

export function PlanificacionesList({ planificaciones, rol, initialEstado }: { planificaciones: PlanifRow[]; rol: UserRole; initialEstado?: string }) {
  const dispatch = useAppDispatch();
  const selectedCycle = useAppSelector((s) => s.planification.selectedCycle);
  const [sede, setSede] = useState(TODOS);
  const [periodo, setPeriodo] = useState(TODOS);
  const [carrera, setCarrera] = useState(TODOS);
  const [estado, setEstado] = useState(initialEstado || TODOS);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);

  const ciclos = Array.from(new Set([new Date().getFullYear(), ...planificaciones.map((p) => p.cicloLectivo)])).sort(
    (a, b) => b - a
  );
  const sedes = Array.from(new Set(planificaciones.map((p) => p.asignatura.planEstudio.carrera.sede.nombre))).sort();
  const carreras = useMemo(
    () =>
      Array.from(
        new Set(
          planificaciones
            .filter((p) => sede === TODOS || p.asignatura.planEstudio.carrera.sede.nombre === sede)
            .map((p) => p.asignatura.planEstudio.carrera.nombre)
        )
      ).sort(),
    [planificaciones, sede]
  );
  const estados = Array.from(new Set([...planificaciones.map((p) => p.estado), ...(initialEstado ? [initialEstado] : [])]));

  useEffect(() => {
    setPagina(1);
  }, [selectedCycle, sede, periodo, carrera, estado, busqueda]);

  function onSedeChange(v: string) {
    setSede(v);
    setCarrera(TODOS);
  }

  const visibles = useMemo(() => {
    const mostrarTodosCiclos = selectedCycle === 0;
    return planificaciones.filter(
      (p) =>
        (mostrarTodosCiclos || p.cicloLectivo === selectedCycle) &&
        (sede === TODOS || p.asignatura.planEstudio.carrera.sede.nombre === sede) &&
        (periodo === TODOS || periodoDe(p.regimen) === periodo) &&
        (carrera === TODOS || p.asignatura.planEstudio.carrera.nombre === carrera) &&
        (estado === TODOS || p.estado === estado) &&
        (!busqueda.trim() || `${p.asignatura.nombre} ${p.docenteResponsable.nombre} ${p.docenteResponsable.apellido}`.toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es')))
    );
  }, [planificaciones, selectedCycle, sede, periodo, carrera, estado, busqueda]);

  const esDocente = rol === UserRole.DOCENTE;
  const totalPaginas = Math.max(1, Math.ceil(visibles.length / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filasPagina = visibles.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA);

  function limpiarFiltros() {
    dispatch(setSelectedCycle(new Date().getFullYear()));
    setSede(TODOS);
    setPeriodo(TODOS);
    setCarrera(TODOS);
    setEstado(TODOS);
    setBusqueda('');
    setPagina(1);
  }

  const filtro = 'min-w-0 sm:min-w-[150px] sm:flex-1';
  const control =
    'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-primary/60 focus:ring-2 focus:ring-primary/20';
  const etiqueta = 'mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-500';
  const th = 'px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500';
  const resolucion = (p: PlanifRow) => (
    <ResolucionModal
      asignatura={p.asignatura.nombre}
      cicloLectivo={p.cicloLectivo}
      numeroExpediente={p.numeroExpediente}
      numeroResolucion={p.numeroResolucion}
      fechaAprobacionCd={p.fechaAprobacionCd}
    />
  );

  return (
    <section aria-label="Bandeja de planificaciones" className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-100">Bandeja de planificaciones</h2>
          <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium tabular-nums text-blue-300">
            {visibles.length} {visibles.length === 1 ? 'planificación' : 'planificaciones'}
          </span>
        </div>
        <button type="button" onClick={limpiarFiltros} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-primary/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span aria-hidden="true">↺</span> Limpiar filtros
        </button>
      </div>

      <div role="search" aria-label="Filtros de planificaciones" className="flex flex-col gap-3 border-b border-border bg-background/40 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:px-5">
        <div className="min-w-0 sm:min-w-[240px] sm:flex-[2]">
          <label htmlFor="buscar-planificaciones" className={etiqueta}>Buscar asignatura o responsable</label>
          <div className="relative">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>
            <input id="buscar-planificaciones" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej.: Álgebra o Claudia Santander" className={`${control} pl-10`} />
          </div>
        </div>
        <div className={filtro}>
          <label htmlFor="filtro-ciclo" className={etiqueta}>Ciclo lectivo</label>
          <select id="filtro-ciclo" className={control} value={selectedCycle} onChange={(e) => dispatch(setSelectedCycle(Number(e.target.value)))}>
            <option value={0}>Todos (histórico)</option>
            {ciclos.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className={filtro}>
          <label htmlFor="filtro-sede" className={etiqueta}>Sede</label>
          <select id="filtro-sede" className={control} value={sede} onChange={(e) => onSedeChange(e.target.value)}>
            <option value={TODOS}>Todas</option>
            {sedes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className={filtro}>
          <label htmlFor="filtro-periodo" className={etiqueta}>Período</label>
          <select id="filtro-periodo" className={control} value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value={TODOS}>Todos</option>
            <option value="1C">1er Cuatrimestre (Anual + 1C)</option>
            <option value="2C">2do Cuatrimestre</option>
          </select>
        </div>
        <div className={filtro}>
          <label htmlFor="filtro-carrera" className={etiqueta}>Carrera</label>
          <select id="filtro-carrera" className={control} value={carrera} onChange={(e) => setCarrera(e.target.value)}>
            <option value={TODOS}>Todas</option>
            {carreras.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className={filtro}>
          <label htmlFor="filtro-estado" className={etiqueta}>Estado</label>
          <select id="filtro-estado" className={control} value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value={TODOS}>Todos</option>
            {estados.map((e) => (
              <option key={e} value={e}>
                {ESTADO_LABELS[e] ?? e}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm font-medium text-slate-300">No hay planificaciones para mostrar</p>
          <p className="mt-1 text-xs text-slate-500">Probá cambiar o quitar alguno de los filtros.</p>
        </div>
      ) : (
        <>
          <table className="hidden w-full table-fixed border-collapse text-sm md:table">
            <thead className="border-b border-border bg-background/60">
              <tr>
                <th scope="col" className={`${th} w-[34%]`}>Asignatura</th>
                <th scope="col" className={th}>Carrera</th>
                <th scope="col" className={`${th} w-20`}>Ciclo</th>
                <th scope="col" className={th}>Responsable</th>
                <th scope="col" className={th}>Estado</th>
                {esDocente && <th scope="col" className={th}>Expediente</th>}
              </tr>
            </thead>
            <tbody>
              {filasPagina.map((p) => (
                <tr key={p.id} className="relative border-b border-border transition-colors last:border-b-0 hover:bg-primary/[0.05]">
                  <td className="px-5 py-3.5">
                    <Link href={`/planificaciones/${p.id}`} className="block min-w-0 font-medium text-slate-100 transition-colors after:absolute after:inset-0 hover:text-blue-300">
                      <span title={p.asignatura.nombre} className="block truncate">{p.asignatura.nombre}</span>
                      <span className="mt-0.5 block truncate text-[11px] font-normal text-slate-500">{p.asignatura.planEstudio.carrera.nombre}</span>
                    </Link>
                  </td>
                  <td className="truncate px-5 py-3.5 text-slate-400">{p.asignatura.planEstudio.carrera.codigo}</td>
                  <td className="px-5 py-3.5 tabular-nums text-slate-400">{p.cicloLectivo}</td>
                  <td className="truncate px-5 py-3.5 text-slate-400">
                    {p.docenteResponsable.nombre} {p.docenteResponsable.apellido}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge estado={p.estado} />
                  </td>
                  {esDocente && <td className="relative z-10 px-5 py-3.5">{resolucion(p)}</td>}
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="flex flex-col gap-3 p-3 md:hidden">
            {filasPagina.map((p) => (
              <li key={p.id} className="rounded-lg border border-border bg-background/50 p-4">
                <Link href={`/planificaciones/${p.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-100">{p.asignatura.nombre}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{p.asignatura.planEstudio.carrera.nombre}</p>
                    </div>
                    <StatusBadge estado={p.estado} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                    <div>
                      <dt className="text-slate-500">Carrera</dt>
                      <dd className="mt-0.5 text-slate-300">{p.asignatura.planEstudio.carrera.codigo}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Ciclo</dt>
                      <dd className="mt-0.5 tabular-nums text-slate-300">{p.cicloLectivo}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-500">Responsable</dt>
                      <dd className="mt-0.5 text-slate-300">
                        {p.docenteResponsable.nombre} {p.docenteResponsable.apellido}
                      </dd>
                    </div>
                  </dl>
                </Link>
                {esDocente && <div className="mt-3 border-t border-border pt-3">{resolucion(p)}</div>}
              </li>
            ))}
          </ul>

          <nav aria-label="Paginación de planificaciones" className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs tabular-nums text-slate-500">Mostrando {(paginaActual - 1) * TAMANO_PAGINA + 1}–{Math.min(paginaActual * TAMANO_PAGINA, visibles.length)} de {visibles.length}</p>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button type="button" onClick={() => setPagina((actual) => Math.max(1, actual - 1))} disabled={paginaActual === 1} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-primary/40 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
              <span aria-live="polite" className="min-w-[100px] text-center text-xs tabular-nums text-slate-400">Página {paginaActual} de {totalPaginas}</span>
              <button type="button" onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))} disabled={paginaActual === totalPaginas} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-primary/40 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40">Siguiente</button>
            </div>
          </nav>
        </>
      )}
    </section>
  );
}
