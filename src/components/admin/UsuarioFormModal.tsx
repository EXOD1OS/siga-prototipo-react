import { useId, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Modal, ModalButton } from '../shared/Modal';
import {
  CARGOS_CATEDRA,
  ROL_DESCRIPCION,
  ROLES_ORDENADOS,
  esRolDocente,
  type CatedraAsignada,
  type Carrera,
  type Rol,
  type Usuario,
  type UsuarioConCatedras,
  type UsuarioDraft,
} from '../../types/estructura';

/** Integrante actual (guardado) de un equipo de cátedra. */
export interface MiembroEquipo {
  docenteId: string;
  nombre: string;
  cargo: string;
  esResponsable: boolean;
}

/** Asignatura ofrecida para asignar, con su contexto y equipo actual ya resueltos. */
export interface AsignaturaOpcion {
  id: string;
  nombre: string;
  carreraId: string;
  carreraCodigo: string;
  anoCursada: number;
  regimen: string;
  esMatricial: boolean;
  /** Equipo de cátedra guardado en el ciclo vigente. */
  equipo: MiembroEquipo[];
}

interface BaseProps {
  /** Todos los usuarios, para validar email y DNI únicos. */
  usuarios: Usuario[];
  carreras: Carrera[];
  asignaturas: AsignaturaOpcion[];
  cycle: number;
  onClose: () => void;
}

interface CreateProps extends BaseProps {
  mode: 'create';
  onCreate: (draft: UsuarioDraft) => void;
}

interface EditProps extends BaseProps {
  mode: 'edit';
  usuario: UsuarioConCatedras;
  /** Códigos de las carreras que dirige actualmente. */
  carrerasDirigidas: string[];
  /** Motivo por el que no se puede eliminar (null si se puede). */
  bloqueoEliminacion: string | null;
  onUpdate: (id: string, draft: UsuarioDraft) => void;
  onDelete: (id: string) => void;
  onResetDni: (id: string) => void;
}

export type UsuarioFormModalProps = CreateProps | EditProps;

type CampoError = 'nombre' | 'apellido' | 'email' | 'dni' | 'rol' | 'carreraId' | 'nuevaCatedra';
type Errores = Partial<Record<CampoError, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DNI_RE = /^\d{7,8}$/;
/** Simula la latencia del backend para mostrar el estado de carga. */
const simularRed = () => new Promise<void>((r) => setTimeout(r, 400));

const inputCls = (err?: string) =>
  `w-full rounded-lg bg-surface border px-3 py-2 text-xs text-ink outline-none transition focus:border-primary disabled:opacity-60 ${
    err ? 'border-danger' : 'border-border'
  }`;

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-medium text-muted mb-1">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[11px] text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>
      )}
    </div>
  );
}

function draftInicial(props: UsuarioFormModalProps): UsuarioDraft {
  if (props.mode === 'edit') {
    const { nombre, apellido, email, dni, rol, carreraId, activo, catedras } = props.usuario;
    return { nombre, apellido, email, dni, rol, carreraId, activo, catedras };
  }
  return { nombre: '', apellido: '', email: '', dni: '', rol: 'Docente', carreraId: null, activo: true, catedras: [] };
}

/**
 * Alta y edición de usuarios. Datos personales basados en CrearUsuarioForm; la
 * asignación de cátedras sigue la lógica de GestionEquipoModal / EquipoCatedraPanel.
 */
export function UsuarioFormModal(props: UsuarioFormModalProps) {
  const { usuarios, carreras, asignaturas, cycle, onClose } = props;
  const isEdit = props.mode === 'edit';
  const editId = isEdit ? props.usuario.id : null;
  const uid = useId();
  const formId = `${uid}-form`;
  const fid = (name: string) => `${uid}-${name}`;

  const [draft, setDraft] = useState<UsuarioDraft>(() => draftInicial(props));
  const [errores, setErrores] = useState<Errores>({});
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [avisoClave, setAvisoClave] = useState<string | null>(null);

  // Paso a paso para incorporar una cátedra.
  const [selCarrera, setSelCarrera] = useState('');
  const [selAno, setSelAno] = useState<number | 'ALL'>('ALL');
  const [selAsig, setSelAsig] = useState('');
  const [selCargo, setSelCargo] = useState('');
  const [selResp, setSelResp] = useState(false);

  // Responsabilidades ya guardadas: no se quitan desde acá (igual que en GestionEquipoModal).
  const [responsableGuardado] = useState(
    () =>
      new Set(
        props.mode === 'edit' ? props.usuario.catedras.filter((c) => c.esResponsable).map((c) => c.asignaturaId) : []
      )
  );

  const asigBy = useMemo(() => new Map(asignaturas.map((a) => [a.id, a])), [asignaturas]);
  const esDocente = esRolDocente(draft.rol);
  const asignadas = new Set(draft.catedras.map((c) => c.asignaturaId));

  const asigsCarrera = asignaturas.filter((a) => a.carreraId === selCarrera);
  const anosCarrera = [...new Set(asigsCarrera.map((a) => a.anoCursada))].sort((a, b) => a - b);
  const asigsDisponibles = asigsCarrera
    .filter((a) => selAno === 'ALL' || a.anoCursada === selAno)
    .filter((a) => !asignadas.has(a.id))
    .sort((a, b) => a.anoCursada - b.anoCursada || a.nombre.localeCompare(b.nombre, 'es'));
  const asigElegida = asigsDisponibles.find((a) => a.id === selAsig);
  const respActual = asigElegida?.equipo.find((m) => m.esResponsable);

  const set = <K extends keyof UsuarioDraft>(key: K, value: UsuarioDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrores((e) => ({ ...e, [key as CampoError]: undefined }));
  };

  const cambiarRol = (rol: Rol) => {
    setDraft((d) => ({
      ...d,
      rol,
      carreraId: rol === 'Director' ? (d.carreraId ?? carreras[0]?.id ?? null) : null,
    }));
    setErrores((e) => ({ ...e, rol: undefined, carreraId: undefined }));
  };

  const setCatedras = (fn: (prev: CatedraAsignada[]) => CatedraAsignada[]) =>
    setDraft((d) => ({ ...d, catedras: fn(d.catedras) }));

  const elegirAsignatura = (id: string) => {
    setSelAsig(id);
    setSelCargo('');
    // Si la cátedra no tiene responsable, se propone al docente como tal.
    setSelResp(!!id && !asigBy.get(id)?.equipo.some((m) => m.esResponsable));
    setErrores((e) => ({ ...e, nuevaCatedra: undefined }));
  };

  const incorporar = () => {
    if (!asigElegida) {
      setErrores((e) => ({ ...e, nuevaCatedra: 'Seleccioná una asignatura.' }));
      return;
    }
    if (!selCargo) {
      setErrores((e) => ({ ...e, nuevaCatedra: 'Seleccioná el cargo en el equipo.' }));
      return;
    }
    setCatedras((prev) => [
      ...prev,
      {
        asignaturaId: asigElegida.id,
        asignaturaNombre: asigElegida.nombre,
        carreraId: asigElegida.carreraId,
        carreraCodigo: asigElegida.carreraCodigo,
        cargo: selCargo,
        esResponsable: selResp,
      },
    ]);
    // Deja la carrera elegida para agilizar cargas sucesivas.
    setSelAsig('');
    setSelCargo('');
    setSelResp(false);
    setErrores((e) => ({ ...e, nuevaCatedra: undefined }));
  };

  const validar = (): Errores => {
    const e: Errores = {};
    const email = draft.email.trim().toLowerCase();
    const otros = usuarios.filter((u) => u.id !== editId);
    if (!draft.nombre.trim()) e.nombre = 'Ingresá el nombre.';
    if (!draft.apellido.trim()) e.apellido = 'Ingresá el apellido.';
    if (!email) e.email = 'Ingresá el email institucional.';
    else if (!EMAIL_RE.test(email)) e.email = 'El email no tiene un formato válido.';
    else if (otros.some((u) => u.email.toLowerCase() === email)) e.email = 'Ya existe un usuario con ese email.';
    if (!DNI_RE.test(draft.dni.trim())) e.dni = 'El DNI debe tener 7 u 8 dígitos, sin puntos.';
    else if (otros.some((u) => u.dni === draft.dni.trim())) e.dni = 'Ya existe un usuario con ese DNI.';
    if (draft.rol === 'Director' && !draft.carreraId) e.carreraId = 'Seleccioná la carrera que dirige.';
    if (props.mode === 'edit') {
      if (draft.rol !== 'Docente' && responsableGuardado.size > 0) {
        e.rol = 'Es Docente Responsable de una cátedra. Designá otro responsable antes de cambiar su rol.';
      } else if (draft.rol !== 'Director' && props.carrerasDirigidas.length > 0) {
        e.rol = `Dirige ${props.carrerasDirigidas.join(', ')}. Asigná otra Dirección antes de cambiar su rol.`;
      }
    }
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (loading) return;
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    const limpio: UsuarioDraft = {
      ...draft,
      nombre: draft.nombre.trim(),
      apellido: draft.apellido.trim(),
      email: draft.email.trim().toLowerCase(),
      dni: draft.dni.trim(),
      // Solo los docentes integran equipos de cátedra.
      catedras: esDocente ? draft.catedras : [],
    };
    setLoading(true);
    await simularRed();
    if (props.mode === 'edit') props.onUpdate(props.usuario.id, limpio);
    else props.onCreate(limpio);
    onClose();
  };

  const handleDelete = async () => {
    if (props.mode !== 'edit' || props.bloqueoEliminacion) return;
    setLoading(true);
    await simularRed();
    props.onDelete(props.usuario.id);
    onClose();
  };

  const nombreCompleto = isEdit ? `${props.usuario.nombre} ${props.usuario.apellido}` : '';
  const catedrasQueSePierden = isEdit && !esDocente ? props.usuario.catedras.length : 0;

  const footer = confirmDelete ? (
    <>
      <p className="mr-auto text-[11px] text-danger font-medium">
        ¿Eliminar a {nombreCompleto}? Se lo desvinculará de todas sus cátedras. Esta acción no se puede deshacer.
      </p>
      <ModalButton onClick={() => setConfirmDelete(false)} disabled={loading}>
        No, volver
      </ModalButton>
      <ModalButton variant="danger" onClick={handleDelete} disabled={loading} autoFocus>
        {loading ? 'Eliminando…' : 'Sí, eliminar'}
      </ModalButton>
    </>
  ) : (
    <>
      {isEdit && (
        <span className="mr-auto">
          <ModalButton
            variant="danger-outline"
            onClick={() => setConfirmDelete(true)}
            disabled={loading || !!props.bloqueoEliminacion}
            title={props.bloqueoEliminacion ?? undefined}
          >
            Eliminar usuario
          </ModalButton>
        </span>
      )}
      <ModalButton onClick={onClose} disabled={loading}>
        Cancelar
      </ModalButton>
      <ModalButton variant="primary" type="submit" form={formId} disabled={loading}>
        {loading ? (isEdit ? 'Guardando…' : 'Creando…') : isEdit ? 'Guardar cambios' : 'Crear usuario'}
      </ModalButton>
    </>
  );

  return (
    <Modal
      open
      onClose={loading ? () => undefined : onClose}
      title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
      widthClass="max-w-2xl"
      headerExtra={
        <p className="text-xs text-muted">
          {isEdit
            ? `${nombreCompleto} · ${props.usuario.email}`
            : 'La contraseña provisoria será el DNI; se pedirá cambiarla en el primer inicio de sesión.'}
        </p>
      }
      footer={footer}
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
        <fieldset disabled={loading || confirmDelete} className="space-y-5">
          {/* Datos personales y rol */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field id={fid('nombre')} label="Nombre" error={errores.nombre}>
              <input
                id={fid('nombre')}
                value={draft.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                aria-invalid={!!errores.nombre}
                aria-describedby={errores.nombre ? `${fid('nombre')}-error` : undefined}
                autoFocus
                className={inputCls(errores.nombre)}
              />
            </Field>
            <Field id={fid('apellido')} label="Apellido" error={errores.apellido}>
              <input
                id={fid('apellido')}
                value={draft.apellido}
                onChange={(e) => set('apellido', e.target.value)}
                aria-invalid={!!errores.apellido}
                aria-describedby={errores.apellido ? `${fid('apellido')}-error` : undefined}
                className={inputCls(errores.apellido)}
              />
            </Field>
            <Field id={fid('email')} label="Email institucional" error={errores.email}>
              <input
                id={fid('email')}
                type="email"
                value={draft.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="nombre@unlar.edu.ar"
                aria-invalid={!!errores.email}
                aria-describedby={errores.email ? `${fid('email')}-error` : undefined}
                className={inputCls(errores.email)}
              />
            </Field>
            <Field id={fid('dni')} label="DNI" error={errores.dni} hint={isEdit ? undefined : 'Será la contraseña provisoria.'}>
              <input
                id={fid('dni')}
                inputMode="numeric"
                value={draft.dni}
                onChange={(e) => set('dni', e.target.value.replace(/\D/g, ''))}
                maxLength={8}
                aria-invalid={!!errores.dni}
                aria-describedby={errores.dni ? `${fid('dni')}-error` : undefined}
                className={`${inputCls(errores.dni)} font-mono`}
              />
            </Field>
            <Field id={fid('rol')} label="Rol" error={errores.rol} hint={ROL_DESCRIPCION[draft.rol]}>
              <select
                id={fid('rol')}
                value={draft.rol}
                onChange={(e) => cambiarRol(e.target.value as Rol)}
                aria-invalid={!!errores.rol}
                aria-describedby={errores.rol ? `${fid('rol')}-error` : undefined}
                className={inputCls(errores.rol)}
              >
                {ROLES_ORDENADOS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            {draft.rol === 'Director' && (
              <Field id={fid('carrera')} label="Carrera que dirige" error={errores.carreraId}>
                <select
                  id={fid('carrera')}
                  value={draft.carreraId ?? ''}
                  onChange={(e) => set('carreraId', e.target.value || null)}
                  aria-invalid={!!errores.carreraId}
                  className={inputCls(errores.carreraId)}
                >
                  <option value="">Seleccionar carrera</option>
                  {carreras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {c.nombre}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {catedrasQueSePierden > 0 && !errores.rol && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
              Al guardar con el rol “{draft.rol}” se lo desvinculará de {catedrasQueSePierden} cátedra(s).
            </p>
          )}

          {/* Asignación de cátedras: solo para Docentes */}
          {esDocente && (
            <section aria-labelledby={fid('catedras-h')} className="space-y-3 rounded-xl border border-border bg-background p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 id={fid('catedras-h')} className="text-xs font-bold text-ink">
                  Asignación de Cátedras / Asignaturas
                </h3>
                <span className="text-[11px] text-muted">Ciclo {cycle}</span>
              </div>

              {/* 1. Carrera y año → 2. Asignatura */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.6fr)_minmax(0,1.6fr)]">
                <Field id={fid('sel-carrera')} label="1. Carrera">
                  <select
                    id={fid('sel-carrera')}
                    value={selCarrera}
                    onChange={(e) => {
                      setSelCarrera(e.target.value);
                      setSelAno('ALL');
                      elegirAsignatura('');
                    }}
                    className={inputCls()}
                  >
                    <option value="">Seleccionar carrera</option>
                    {carreras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigo} — {c.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id={fid('sel-ano')} label="Año">
                  <select
                    id={fid('sel-ano')}
                    value={selAno}
                    onChange={(e) => {
                      setSelAno(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                      elegirAsignatura('');
                    }}
                    disabled={!selCarrera}
                    className={inputCls()}
                  >
                    <option value="ALL">Todos</option>
                    {anosCarrera.map((n) => (
                      <option key={n} value={n}>
                        {n}.º año
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id={fid('sel-asig')} label="2. Asignatura / Cátedra">
                  <select
                    id={fid('sel-asig')}
                    value={asigElegida ? selAsig : ''}
                    onChange={(e) => elegirAsignatura(e.target.value)}
                    disabled={!selCarrera || asigsDisponibles.length === 0}
                    className={inputCls()}
                  >
                    <option value="">
                      {!selCarrera
                        ? 'Primero elegí una carrera'
                        : asigsDisponibles.length
                          ? 'Seleccionar asignatura'
                          : 'Sin asignaturas disponibles'}
                    </option>
                    {asigsDisponibles.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.anoCursada}.º · {a.nombre} ({a.regimen})
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* 3. Equipo actual + incorporación */}
              {asigElegida && (
                <div className="space-y-3 rounded-lg border border-border bg-surface p-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        Equipo de cátedra actual · {asigElegida.nombre}
                      </span>
                      {asigElegida.esMatricial && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300">
                          Matricial
                        </span>
                      )}
                    </div>
                    {asigElegida.equipo.length > 0 ? (
                      <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                        {asigElegida.equipo.map((m) => (
                          <li key={m.docenteId} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                            <span className="flex-1 truncate text-ink">
                              {m.nombre}
                              {m.docenteId === editId && <span className="text-muted"> (este usuario)</span>}
                            </span>
                            <span className="text-muted">{m.cargo}</span>
                            {m.esResponsable && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                Responsable
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1.5 text-xs text-muted">La cátedra todavía no tiene integrantes.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                    <Field id={fid('sel-cargo')} label="3. Cargo en el equipo">
                      <select
                        id={fid('sel-cargo')}
                        value={selCargo}
                        onChange={(e) => {
                          setSelCargo(e.target.value);
                          setErrores((er) => ({ ...er, nuevaCatedra: undefined }));
                        }}
                        className={inputCls()}
                      >
                        <option value="">Seleccionar cargo</option>
                        {CARGOS_CATEDRA.map((cg) => (
                          <option key={cg} value={cg}>
                            {cg}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <label className="flex items-center gap-2 pb-2 text-xs text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selResp}
                        onChange={(e) => setSelResp(e.target.checked)}
                        className="w-4 h-4 rounded accent-primary"
                      />
                      Responsable
                    </label>
                    <button
                      type="button"
                      onClick={incorporar}
                      className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-lg whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      + Incorporar a la cátedra
                    </button>
                  </div>
                  {selResp && respActual && respActual.docenteId !== editId && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      Al guardar reemplazará a {respActual.nombre} como Docente Responsable.
                    </p>
                  )}
                  {errores.nuevaCatedra && (
                    <p role="alert" className="text-[11px] text-danger">
                      {errores.nuevaCatedra}
                    </p>
                  )}
                </div>
              )}

              {/* Resumen de cátedras asignadas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Cátedras asignadas</span>
                  <span className="text-[11px] font-semibold text-muted">{draft.catedras.length}</span>
                </div>
                {draft.catedras.map((c) => {
                  const bloqueada = responsableGuardado.has(c.asignaturaId);
                  return (
                    <div key={c.asignaturaId} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
                      <label
                        className={`flex items-center gap-1.5 text-xs shrink-0 ${bloqueada ? 'text-ink' : 'text-muted cursor-pointer'}`}
                        title={bloqueada ? 'Para cambiar el responsable, usá Estructura Académica' : undefined}
                      >
                        <input
                          type="checkbox"
                          checked={c.esResponsable}
                          disabled={bloqueada}
                          onChange={(e) =>
                            setCatedras((prev) =>
                              prev.map((x) => (x.asignaturaId === c.asignaturaId ? { ...x, esResponsable: e.target.checked } : x))
                            )
                          }
                          className="accent-primary"
                        />
                        Responsable
                      </label>
                      <span className="flex-1 min-w-[9rem] text-sm text-ink truncate">
                        {c.asignaturaNombre}
                        <span className="block text-[11px] text-muted">{c.carreraCodigo}</span>
                      </span>
                      <label className="sr-only" htmlFor={fid(`cargo-${c.asignaturaId}`)}>
                        Cargo en {c.asignaturaNombre}
                      </label>
                      <select
                        id={fid(`cargo-${c.asignaturaId}`)}
                        value={c.cargo}
                        onChange={(e) =>
                          setCatedras((prev) =>
                            prev.map((x) => (x.asignaturaId === c.asignaturaId ? { ...x, cargo: e.target.value } : x))
                          )
                        }
                        className="rounded-lg bg-surface border border-border px-2 py-1 text-xs text-ink outline-none focus:border-primary"
                      >
                        {CARGOS_CATEDRA.map((cg) => (
                          <option key={cg} value={cg}>
                            {cg}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={bloqueada}
                        onClick={() => setCatedras((prev) => prev.filter((x) => x.asignaturaId !== c.asignaturaId))}
                        className="text-xs text-danger hover:underline disabled:opacity-40 disabled:hover:no-underline disabled:cursor-not-allowed whitespace-nowrap"
                        title={bloqueada ? 'Designá otro responsable en Estructura Académica antes de quitarlo' : undefined}
                      >
                        Quitar
                      </button>
                    </div>
                  );
                })}
                {draft.catedras.length === 0 && (
                  <p className="text-xs text-muted">Sin cátedras asignadas. Podés guardar así y asignarlas más tarde.</p>
                )}
              </div>
            </section>
          )}

          {isEdit && (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.activo}
                  onChange={(e) => set('activo', e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                Cuenta activa
              </label>
              <div className="flex items-center gap-2">
                {avisoClave && (
                  <span role="status" className="text-[11px] text-success font-medium">
                    {avisoClave}
                  </span>
                )}
                <ModalButton
                  onClick={() => {
                    props.onResetDni(props.usuario.id);
                    setAvisoClave('Clave blanqueada al DNI.');
                  }}
                >
                  Blanquear clave a DNI
                </ModalButton>
              </div>
            </div>
          )}

          {isEdit && props.bloqueoEliminacion && (
            <p className="text-[11px] text-muted">
              <strong className="text-ink">No se puede eliminar:</strong> {props.bloqueoEliminacion}
            </p>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
