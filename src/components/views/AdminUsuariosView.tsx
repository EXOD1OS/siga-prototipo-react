import { useMemo, useState } from 'react';
import { UsuarioFormModal, type AsignaturaOpcion, type MiembroEquipo } from '../admin/UsuarioFormModal';
import {
  ROL_BADGE,
  ROLES_ORDENADOS,
  esRolDocente,
  type Asignatura,
  type Carrera,
  type Departamento,
  type EquipoCatedra,
  type PlanEstudio,
  type Rol,
  type UsuarioConCatedras,
  type UsuarioDraft,
} from '../../types/estructura';

interface AdminUsuariosViewProps {
  /** Usuarios con su arreglo `catedras` del ciclo vigente (ver usuariosConCatedras en mockData). */
  usuarios: UsuarioConCatedras[];
  carreras: Carrera[];
  departamentos: Departamento[];
  planes: PlanEstudio[];
  asignaturas: Asignatura[];
  equiposCatedra: EquipoCatedra[];
  cycle: number;
  onCreateUser: (draft: UsuarioDraft) => void;
  onUpdateUser: (id: string, draft: UsuarioDraft) => void;
  onDeleteUser: (id: string) => void;
  onResetDni: (id: string) => void;
}

type FiltroEstado = 'ALL' | 'ACTIVO' | 'INACTIVO' | 'CLAVE_PENDIENTE';
/** Valor del filtro de ámbito: `car:<id>` o `dep:<id>`. */
type FiltroAmbito = 'ALL' | `car:${string}` | `dep:${string}`;
type ModalState = { mode: 'create' } | { mode: 'edit'; userId: string } | null;

const POR_PAGINA = 10;

const controlCls =
  'rounded-lg bg-surface border border-border px-3 py-2 text-xs text-ink outline-none transition focus:border-primary';

function PencilIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5">
      <path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d={dir === 'left' ? 'm12.5 4.5-5 5 5 5' : 'm7.5 4.5 5 5-5 5'} />
    </svg>
  );
}

export function AdminUsuariosView({
  usuarios,
  carreras,
  departamentos,
  planes,
  asignaturas,
  equiposCatedra,
  cycle,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onResetDni,
}: AdminUsuariosViewProps) {
  const [query, setQuery] = useState('');
  const [filtroRol, setFiltroRol] = useState<'ALL' | Rol>('ALL');
  const [filtroAmbito, setFiltroAmbito] = useState<FiltroAmbito>('ALL');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('ALL');
  const [pagina, setPagina] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);

  const carreraBy = useMemo(() => new Map(carreras.map((c) => [c.id, c])), [carreras]);
  const asigBy = useMemo(() => new Map(asignaturas.map((a) => [a.id, a])), [asignaturas]);

  /** Carreras y departamentos vinculados a un usuario (por dirección o por sus cátedras). */
  const ambitos = useMemo(() => {
    const map = new Map<string, { carreraIds: Set<string>; deptoIds: Set<string> }>();
    for (const u of usuarios) {
      const carreraIds = new Set<string>(u.carreraId ? [u.carreraId] : []);
      const deptoIds = new Set<string>();
      for (const c of u.catedras) {
        if (c.carreraId) carreraIds.add(c.carreraId);
        const rad = asigBy.get(c.asignaturaId)?.departamentoRadicacionId;
        if (rad) deptoIds.add(rad);
      }
      for (const id of carreraIds) {
        const dep = carreraBy.get(id)?.departamentoId;
        if (dep) deptoIds.add(dep);
      }
      map.set(u.id, { carreraIds, deptoIds });
    }
    return map;
  }, [usuarios, asigBy, carreraBy]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('es');
    return usuarios
      .filter((u) => {
        if (filtroRol !== 'ALL' && u.rol !== filtroRol) return false;
        if (filtroEstado === 'ACTIVO' && !u.activo) return false;
        if (filtroEstado === 'INACTIVO' && u.activo) return false;
        if (filtroEstado === 'CLAVE_PENDIENTE' && !u.mustChangePassword) return false;
        if (filtroAmbito !== 'ALL') {
          const a = ambitos.get(u.id);
          const [tipo, id] = filtroAmbito.split(':');
          if (tipo === 'car' && !a?.carreraIds.has(id)) return false;
          if (tipo === 'dep' && !a?.deptoIds.has(id)) return false;
        }
        if (!q) return true;
        return [u.nombre, u.apellido, `${u.nombre} ${u.apellido}`, `${u.apellido} ${u.nombre}`, u.email, u.dni].some((v) =>
          v.toLocaleLowerCase('es').includes(q)
        );
      })
      .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'));
  }, [usuarios, ambitos, query, filtroRol, filtroAmbito, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filas = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);
  const hayFiltros = query.trim() !== '' || filtroRol !== 'ALL' || filtroAmbito !== 'ALL' || filtroEstado !== 'ALL';

  const conReset =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPagina(1);
    };

  const limpiarFiltros = () => {
    setQuery('');
    setFiltroRol('ALL');
    setFiltroAmbito('ALL');
    setFiltroEstado('ALL');
    setPagina(1);
  };

  const carrerasDirigidas = (userId: string) => carreras.filter((c) => c.directorId === userId).map((c) => c.codigo);

  /** Reglas que impiden la baja para no dejar la estructura inconsistente. */
  const bloqueoEliminacion = (u: UsuarioConCatedras): string | null => {
    if (u.rol === 'Administrador' && usuarios.filter((x) => x.rol === 'Administrador').length === 1) {
      return 'es el único administrador del sistema.';
    }
    const dirige = carrerasDirigidas(u.id);
    if (dirige.length > 0) return `dirige ${dirige.join(', ')}. Asigná otra Dirección de Carrera antes.`;
    const responsableDe = u.catedras.filter((c) => c.esResponsable).map((c) => c.asignaturaNombre);
    if (responsableDe.length > 0) {
      return `es Docente Responsable de ${responsableDe.join(', ')}. Designá otro responsable desde Estructura Académica.`;
    }
    return null;
  };

  // Asignaturas con su carrera y su equipo de cátedra guardado (para el paso "equipo actual").
  const asignaturasOpciones = useMemo<AsignaturaOpcion[]>(() => {
    const userBy = new Map(usuarios.map((u) => [u.id, u]));
    const planBy = new Map(planes.map((p) => [p.id, p]));
    return asignaturas.map((a) => {
      const car = carreraBy.get(planBy.get(a.planEstudioId)?.carreraId ?? '');
      const equipo: MiembroEquipo[] = equiposCatedra
        .filter((e) => e.asignaturaId === a.id && e.cicloLectivo === cycle)
        .map((e) => {
          const u = userBy.get(e.docenteId);
          return {
            docenteId: e.docenteId,
            nombre: u ? `${u.nombre} ${u.apellido}` : e.docenteId,
            cargo: e.cargo,
            esResponsable: e.esResponsable,
          };
        })
        .sort((x, y) => Number(y.esResponsable) - Number(x.esResponsable));
      return {
        id: a.id,
        nombre: a.nombre,
        carreraId: car?.id ?? '',
        carreraCodigo: car?.codigo ?? '?',
        anoCursada: a.anoCursada,
        regimen: a.regimenDictado,
        esMatricial: !!a.departamentoRadicacionId && a.departamentoRadicacionId !== car?.departamentoId,
        equipo,
      };
    });
  }, [asignaturas, planes, carreraBy, equiposCatedra, usuarios, cycle]);

  const usuarioEditado = modal?.mode === 'edit' ? usuarios.find((u) => u.id === modal.userId) : undefined;

  const ambitoTexto = (u: UsuarioConCatedras) => {
    if (u.rol === 'Director') {
      return { principal: carreraBy.get(u.carreraId ?? '')?.codigo ?? 'Sin carrera', secundario: 'Dirección de carrera' };
    }
    if (esRolDocente(u.rol)) {
      if (u.catedras.length === 0) return { principal: 'Sin cátedras', secundario: null };
      const codigos = [...new Set(u.catedras.map((c) => c.carreraCodigo))];
      return {
        principal: u.catedras.map((c) => c.asignaturaNombre).join(', '),
        secundario: `${codigos.join(', ')} · ${u.catedras.length} cátedra(s)${u.catedras.some((c) => c.esResponsable) ? ' · Responsable' : ''}`,
      };
    }
    return { principal: 'Transversal', secundario: null };
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Usuarios y accesos</h1>
        <p className="text-xs text-muted mt-0.5">
          Alta de docentes y autoridades. El DNI es la contraseña provisoria y se pide cambiarla en el primer ingreso.
        </p>
      </div>

      <section
        aria-labelledby="usuarios-heading"
        className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm"
      >
        {/* Cabecera de la tarjeta */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-5">
          <h2 id="usuarios-heading" className="text-sm font-bold text-ink">
            Usuarios registrados
          </h2>
          <span aria-live="polite" className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium tabular-nums text-muted">
            {filtrados.length} de {usuarios.length} usuarios
          </span>
        </div>

        {/* Barra de herramientas: búsqueda + filtros + Nuevo usuario */}
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:px-5 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-0">
            <label htmlFor="usuarios-search" className="sr-only">
              Buscar por nombre, apellido, email o DNI
            </label>
            <input
              id="usuarios-search"
              type="search"
              value={query}
              onChange={(e) => conReset(setQuery)(e.target.value)}
              placeholder="Buscar por nombre, apellido, email o DNI…"
              className={`${controlCls} w-full`}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
            <label htmlFor="filtro-rol" className="sr-only">
              Filtrar por rol
            </label>
            <select
              id="filtro-rol"
              value={filtroRol}
              onChange={(e) => conReset(setFiltroRol)(e.target.value as 'ALL' | Rol)}
              className={controlCls}
            >
              <option value="ALL">Todos los roles</option>
              {ROLES_ORDENADOS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <label htmlFor="filtro-ambito" className="sr-only">
              Filtrar por carrera o departamento
            </label>
            <select
              id="filtro-ambito"
              value={filtroAmbito}
              onChange={(e) => conReset(setFiltroAmbito)(e.target.value as FiltroAmbito)}
              className={controlCls}
            >
              <option value="ALL">Todas las carreras / deptos.</option>
              <optgroup label="Carreras">
                {carreras.map((c) => (
                  <option key={c.id} value={`car:${c.id}`}>
                    {c.codigo} — {c.nombre}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Departamentos">
                {departamentos.map((d) => (
                  <option key={d.id} value={`dep:${d.id}`}>
                    {d.nombre}
                  </option>
                ))}
              </optgroup>
            </select>

            <label htmlFor="filtro-estado" className="sr-only">
              Filtrar por estado
            </label>
            <select
              id="filtro-estado"
              value={filtroEstado}
              onChange={(e) => conReset(setFiltroEstado)(e.target.value as FiltroEstado)}
              className={controlCls}
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
              <option value="CLAVE_PENDIENTE">Clave pendiente (DNI)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
            {hayFiltros && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="px-3 py-2 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-background transition"
              >
                Limpiar
              </button>
            )}
            <button
              type="button"
              onClick={() => setModal({ mode: 'create' })}
              className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span aria-hidden className="text-sm leading-none">
                +
              </span>
              Nuevo usuario
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-background text-muted border-b border-border text-[11px] uppercase tracking-wide">
                <th scope="col" className="px-4 py-3 font-semibold sm:px-5">Usuario</th>
                <th scope="col" className="px-3 py-3 font-semibold">DNI</th>
                <th scope="col" className="px-3 py-3 font-semibold">Rol</th>
                <th scope="col" className="px-3 py-3 font-semibold">Carrera / Cátedras</th>
                <th scope="col" className="px-3 py-3 font-semibold">Estado</th>
                <th scope="col" className="px-4 py-3 font-semibold text-right sm:px-5">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filas.map((u) => {
                const amb = ambitoTexto(u);
                return (
                  <tr key={u.id} className={`transition-colors hover:bg-background ${u.activo ? '' : 'opacity-60'}`}>
                    <td className="px-4 py-3 sm:px-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          aria-hidden
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-soft text-primary text-[11px] font-bold"
                        >
                          {u.nombre.charAt(0)}
                          {u.apellido.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-ink truncate">
                            {u.apellido}, {u.nombre}
                          </div>
                          <div className="text-[11px] text-muted truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-ink tabular-nums">{u.dni}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${ROL_BADGE[u.rol]}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-3 py-3 max-w-[260px]">
                      <div className="text-ink font-medium truncate" title={amb.principal}>
                        {amb.principal}
                      </div>
                      {amb.secundario && <div className="text-[11px] text-muted">{amb.secundario}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.activo
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : 'bg-slate-500/15 text-muted'
                          }`}
                        >
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        {u.mustChangePassword && (
                          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">Clave pendiente (DNI)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right sm:px-5">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: 'edit', userId: u.id })}
                        aria-label={`Editar a ${u.nombre} ${u.apellido}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface text-primary hover:bg-primary hover:text-white hover:border-primary text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <PencilIcon />
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-sm font-medium text-ink">No se encontraron usuarios</p>
                    <p className="mt-1 text-xs text-muted">Probá con otros términos o quitá algún filtro.</p>
                    {hayFiltros && (
                      <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="mt-3 rounded-lg px-3 py-2 text-xs font-medium text-primary hover:bg-soft transition"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {filtrados.length > 0 && (
          <nav
            aria-label="Paginación de usuarios"
            className="flex flex-col gap-2 border-t border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <p className="text-[11px] text-muted tabular-nums">
              Mostrando {(paginaActual - 1) * POR_PAGINA + 1}–{Math.min(paginaActual * POR_PAGINA, filtrados.length)} de{' '}
              {filtrados.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Página anterior"
                disabled={paginaActual <= 1}
                onClick={() => setPagina(paginaActual - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink hover:bg-soft transition disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronIcon dir="left" />
              </button>
              <span className="min-w-[96px] text-center text-[11px] text-muted tabular-nums">
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink hover:bg-soft transition disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronIcon dir="right" />
              </button>
            </div>
          </nav>
        )}
      </section>

      {modal?.mode === 'create' && (
        <UsuarioFormModal
          mode="create"
          usuarios={usuarios}
          carreras={carreras}
          asignaturas={asignaturasOpciones}
          cycle={cycle}
          onCreate={onCreateUser}
          onClose={() => setModal(null)}
        />
      )}

      {usuarioEditado && (
        <UsuarioFormModal
          key={usuarioEditado.id}
          mode="edit"
          usuario={usuarioEditado}
          carrerasDirigidas={carrerasDirigidas(usuarioEditado.id)}
          usuarios={usuarios}
          carreras={carreras}
          asignaturas={asignaturasOpciones}
          cycle={cycle}
          bloqueoEliminacion={bloqueoEliminacion(usuarioEditado)}
          onUpdate={onUpdateUser}
          onDelete={onDeleteUser}
          onResetDni={onResetDni}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
