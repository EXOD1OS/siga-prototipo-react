'use client';

import { useMemo, useState } from 'react';
import { TreeItem } from './TreeItem';
import { Modal } from '@/components/Modal';
import { EquipoCatedraPanel, type AsignacionRow, type AsignaturaSeleccionada } from './EquipoCatedraPanel';

interface Asignatura {
  id: string;
  nombre: string;
  anoCursada: number;
}

interface Plan {
  id: string;
  ordenanza: string;
  enfoque: string;
  asignaturas: Asignatura[];
}

interface Carrera {
  id: string;
  nombre: string;
  codigo: string;
  departamento: { id: string; nombre: string };
  planes: Plan[];
}

interface Sede {
  id: string;
  nombre: string;
  esCapital: boolean;
  carreras: Carrera[];
}

interface Asignacion {
  id: string;
  asignaturaId: string;
  cicloLectivo: number;
  docenteId: string;
  categoria: string;
  esResponsable: boolean;
  docenteNombre: string;
}

export function EstructuraExplorer({
  sedes,
  asignaciones,
  docentesDisponibles,
}: {
  sedes: Sede[];
  asignaciones: Asignacion[];
  docentesDisponibles: { id: string; nombre: string }[];
}) {
  const [seleccion, setSeleccion] = useState<AsignaturaSeleccionada | null>(null);
  const [cicloLectivo, setCicloLectivo] = useState(new Date().getFullYear());
  const [query, setQuery] = useState('');

  const sedesFiltradas: Sede[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sedes;
    const matches = (s: string) => s.toLowerCase().includes(q);

    return sedes
      .map((sede) => ({
        ...sede,
        carreras: sede.carreras
          .map((carrera) => ({
            ...carrera,
            planes: carrera.planes
              .map((plan) => ({
                ...plan,
                asignaturas: plan.asignaturas.filter(
                  (a) =>
                    matches(a.nombre) ||
                    matches(carrera.nombre) ||
                    matches(plan.ordenanza) ||
                    matches(carrera.departamento.nombre) ||
                    matches(sede.nombre)
                ),
              }))
              .filter((plan) => plan.asignaturas.length > 0),
          }))
          .filter((carrera) => carrera.planes.length > 0),
      }))
      .filter((sede) => sede.carreras.length > 0);
  }, [sedes, query]);

  const asignacionesFiltradas: AsignacionRow[] = useMemo(() => {
    if (!seleccion) return [];
    return asignaciones
      .filter((a) => a.asignaturaId === seleccion.id && a.cicloLectivo === cicloLectivo)
      .map((a) => ({ id: a.id, docenteId: a.docenteId, docenteNombre: a.docenteNombre, categoria: a.categoria, esResponsable: a.esResponsable }));
  }, [asignaciones, seleccion, cicloLectivo]);

  function renderAsignaturas(asignaturas: Asignatura[], carreraNombre: string) {
    return asignaturas
      .slice()
      .sort((a, b) => a.anoCursada - b.anoCursada)
      .map((a) => (
        <TreeItem
          key={a.id}
          label={a.nombre}
          badge={a.anoCursada > 0 ? `${a.anoCursada}° año` : 'Año no especificado'}
          active={seleccion?.id === a.id}
          onClick={() => setSeleccion({ id: a.id, nombre: a.nombre, carrera: carreraNombre })}
        />
      ));
  }

  const searchActive = query.trim() !== '';
  const totalAsignaturas = sedes.reduce(
    (total, sede) => total + sede.carreras.reduce(
      (carreraTotal, carrera) => carreraTotal + carrera.planes.reduce((planTotal, plan) => planTotal + plan.asignaturas.length, 0),
      0,
    ),
    0,
  );
  const asignaturasVisibles = sedesFiltradas.reduce(
    (total, sede) => total + sede.carreras.reduce(
      (carreraTotal, carrera) => carreraTotal + carrera.planes.reduce((planTotal, plan) => planTotal + plan.asignaturas.length, 0),
      0,
    ),
    0,
  );

  function renderPlanes(planes: Plan[], carreraNombre: string) {
    return planes.map((p) => (
      <TreeItem
        key={`${p.id}__${searchActive}`}
        label={p.ordenanza}
        badge={p.enfoque === 'COMPETENCIAS' ? 'Competencias' : 'Tradicional'}
        defaultOpen={searchActive}
      >
        {renderAsignaturas(p.asignaturas, carreraNombre)}
      </TreeItem>
    ));
  }

  function renderCarreras(carreras: Carrera[]) {
    return carreras.map((c) => (
      <TreeItem key={`${c.id}__${searchActive}`} label={`${c.nombre} (${c.codigo})`} defaultOpen={searchActive}>
        {renderPlanes(c.planes, c.nombre)}
      </TreeItem>
    ));
  }

  function renderSede(sede: Sede) {
    if (sede.esCapital) {
      const porDepartamento = new Map<string, { nombre: string; carreras: Carrera[] }>();
      for (const carrera of sede.carreras) {
        const key = carrera.departamento.id;
        if (!porDepartamento.has(key)) porDepartamento.set(key, { nombre: carrera.departamento.nombre, carreras: [] });
        porDepartamento.get(key)!.carreras.push(carrera);
      }
      return (
        <TreeItem key={`${sede.id}__${searchActive}`} label={sede.nombre} defaultOpen={searchActive}>
          {Array.from(porDepartamento.values()).map((d) => (
            <TreeItem key={`${d.nombre}__${searchActive}`} label={d.nombre} defaultOpen={searchActive}>
              {renderCarreras(d.carreras)}
            </TreeItem>
          ))}
        </TreeItem>
      );
    }

    return (
      <TreeItem key={`${sede.id}__${searchActive}`} label={sede.nombre} defaultOpen={searchActive}>
        {renderCarreras(sede.carreras)}
      </TreeItem>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-surface/75 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="relative w-full sm:max-w-xl">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500"><SearchIcon /></span>
          <label htmlFor="estructura-search" className="sr-only">Buscar sede, carrera, plan o asignatura</label>
          <input
            id="estructura-search"
            type="search"
            placeholder="Buscar por sede, carrera, plan o asignatura…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="!h-11 !w-full !rounded-xl !border-blue-100/10 !bg-[#09172b]/80 !pl-10 !pr-10 text-sm transition placeholder:!text-slate-500 focus:!border-blue-300/40 focus:!ring-4 focus:!ring-blue-400/10"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Limpiar búsqueda" className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-white">
              <ClearIcon />
            </button>
          )}
        </div>
        <p aria-live="polite" className="shrink-0 text-xs text-slate-400">
          {searchActive ? `${asignaturasVisibles} de ${totalAsignaturas} asignaturas` : `${totalAsignaturas} asignaturas disponibles`}
        </p>
      </div>

      <div className="max-h-[70vh] space-y-1 overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.08] bg-slate-950/35 p-3 sm:p-4">
        {sedesFiltradas.map(renderSede)}
        {sedesFiltradas.length === 0 && (
          <div className="px-3 py-10 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400"><SearchIcon /></span>
            <p className="mt-3 text-sm font-medium text-slate-200">No encontramos esa asignatura</p>
            <p className="mt-1 text-xs text-slate-500">Probá con otro nombre o quitá algún término de búsqueda.</p>
            <button type="button" onClick={() => setQuery('')} className="mt-4 rounded-lg px-3 py-2 text-xs font-medium text-blue-200 transition hover:bg-blue-300/10">Limpiar búsqueda</button>
          </div>
        )}
      </div>

      <Modal open={!!seleccion} onClose={() => setSeleccion(null)} widthClass="max-w-2xl">
        <EquipoCatedraPanel
          asignatura={seleccion}
          cicloLectivo={cicloLectivo}
          onCicloChange={setCicloLectivo}
          asignaciones={asignacionesFiltradas}
          docentesDisponibles={docentesDisponibles}
        />
      </Modal>
    </div>
  );
}

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7"><circle cx="8.8" cy="8.8" r="5.8" /><path d="m13 13 4.2 4.2" /></svg>;
}

function ClearIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8"><path d="m5 5 10 10M15 5 5 15" /></svg>;
}
