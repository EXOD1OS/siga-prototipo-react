import { useMemo, useState } from 'react';
import { Modal, ModalButton } from '../shared/Modal';
import { StatusBadge } from '../shared/StatusBadge';
import {
  CARGOS_CATEDRA,
  type AsigContext,
  type DocumentoResumen,
  type EquipoCatedra,
  type IntegranteBorrador,
  type Usuario,
} from '../../types/estructura';

interface EquipoCatedraModalProps {
  ctx: AsigContext;
  cycle: number;
  equipo: EquipoCatedra[];
  docentes: Usuario[];
  docs: DocumentoResumen[];
  onClose: () => void;
  onSave: (asigId: string, integrantes: IntegranteBorrador[]) => void;
}

const fieldCls =
  'w-full rounded-lg bg-surface border border-border px-3 py-2 text-xs text-ink outline-none focus:border-primary disabled:opacity-50';

function toBorrador(equipo: EquipoCatedra[]): IntegranteBorrador[] {
  return equipo.map(({ id, docenteId, cargo, esResponsable }) => ({ id, docenteId, cargo, esResponsable }));
}

/**
 * Gestión del equipo de cátedra de una asignatura para el ciclo lectivo vigente.
 * Disposición basada en GestionEquipoModal de la interfaz anterior.
 */
export function EquipoCatedraModal({ ctx, cycle, equipo, docentes, docs, onClose, onSave }: EquipoCatedraModalProps) {
  const [inicial] = useState(() => toBorrador(equipo));
  const [integrantes, setIntegrantes] = useState<IntegranteBorrador[]>(inicial);
  const [nuevoDocenteId, setNuevoDocenteId] = useState('');
  const [nuevoCargo, setNuevoCargo] = useState<string>(CARGOS_CATEDRA[4]);
  const [error, setError] = useState<string | null>(null);

  const asig = ctx.asig;
  const docenteBy = useMemo(() => new Map(docentes.map((d) => [d.id, d])), [docentes]);
  const disponibles = docentes.filter((d) => !integrantes.some((i) => i.docenteId === d.id));
  const docenteSeleccionado = disponibles.some((d) => d.id === nuevoDocenteId) ? nuevoDocenteId : (disponibles[0]?.id ?? '');
  const dirty = JSON.stringify(integrantes) !== JSON.stringify(inicial);
  const esMatricial = !!ctx.radicacion && !!ctx.depto && ctx.radicacion.id !== ctx.depto.id;

  if (!asig) return null;

  const designarResponsable = (id: string) =>
    setIntegrantes((prev) => prev.map((i) => ({ ...i, esResponsable: i.id === id })));

  const cambiarCargo = (id: string, cargo: string) =>
    setIntegrantes((prev) => prev.map((i) => (i.id === id ? { ...i, cargo } : i)));

  const quitar = (id: string) => setIntegrantes((prev) => prev.filter((i) => i.id !== id));

  const agregar = () => {
    if (!docenteSeleccionado) return;
    setError(null);
    setIntegrantes((prev) => [
      ...prev,
      {
        id: `eq-${Date.now()}`,
        docenteId: docenteSeleccionado,
        cargo: nuevoCargo,
        // El primer integrante queda como responsable por defecto.
        esResponsable: prev.length === 0,
      },
    ]);
    setNuevoDocenteId('');
  };

  const guardar = () => {
    if (integrantes.length > 0 && !integrantes.some((i) => i.esResponsable)) {
      setError('Designá un Docente Responsable antes de guardar.');
      return;
    }
    onSave(asig.id, integrantes);
    onClose();
  };

  const nombreDocente = (id: string) => {
    const u = docenteBy.get(id);
    return u ? `${u.nombre} ${u.apellido}` : id;
  };

  const estadoPaad = (docenteId: string) => docs.find((d) => d.type === 'PAAD' && d.owner === docenteId)?.state;

  return (
    <Modal
      open
      onClose={onClose}
      title="Gestión de equipo de cátedra"
      widthClass="max-w-2xl"
      headerExtra={
        <div className="space-y-1.5">
          <p className="text-xs text-ink font-medium">
            {asig.nombre}{' '}
            <span className="text-muted font-normal">
              · {asig.anoCursada}.º año · {asig.regimenDictado} · {asig.horasSemanales} hs/sem ({asig.horasTotales} hs)
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ctx.sede && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-soft text-primary border border-primary">
                {ctx.sede.nombre}
              </span>
            )}
            {ctx.carrera && ctx.plan && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-background text-ink border border-border">
                {ctx.carrera.codigo} · {ctx.plan.ordenanza} ({ctx.plan.enfoque})
              </span>
            )}
            {esMatricial && ctx.radicacion && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                Radicación matricial: {ctx.radicacion.nombre}
              </span>
            )}
          </div>
        </div>
      }
      footer={
        <>
          {dirty && <span className="mr-auto text-[11px] text-warning font-medium">Hay cambios sin guardar</span>}
          <ModalButton onClick={onClose}>Cerrar</ModalButton>
          <ModalButton variant="primary" onClick={guardar} disabled={!dirty}>
            Guardar cambios
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-muted">
          Ciclo lectivo {cycle}. Los cambios se aplican al presionar <strong className="text-ink">Guardar cambios</strong>.
          {esMatricial && ' La planificación de esta asignatura se deriva al departamento de radicación.'}
        </p>

        <div className="rounded-lg border border-border bg-background px-3 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Contenidos mínimos</div>
          <p className="mt-1 text-xs text-ink leading-relaxed">{asig.contenidosMinimos}</p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div className="space-y-2">
          {integrantes.map((m) => {
            const estado = estadoPaad(m.docenteId);
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-3 border border-border rounded-lg px-3 py-2">
                <label className="flex items-center gap-1.5 text-xs text-muted shrink-0 cursor-pointer">
                  <input
                    type="radio"
                    name={`responsable-${asig.id}`}
                    checked={m.esResponsable}
                    onChange={() => {
                      setError(null);
                      designarResponsable(m.id);
                    }}
                    className="accent-primary"
                  />
                  Responsable
                </label>
                <span className="flex-1 min-w-[8rem] text-sm text-ink truncate">
                  {nombreDocente(m.docenteId)}
                  <span className="block text-[11px] text-muted truncate">{docenteBy.get(m.docenteId)?.email}</span>
                </span>
                {estado && <StatusBadge state={estado} />}
                <label className="sr-only" htmlFor={`cargo-${m.id}`}>
                  Cargo de {nombreDocente(m.docenteId)}
                </label>
                <select
                  id={`cargo-${m.id}`}
                  value={m.cargo}
                  onChange={(e) => cambiarCargo(m.id, e.target.value)}
                  className="rounded-lg bg-surface border border-border px-2 py-1 text-xs text-ink outline-none focus:border-primary"
                >
                  {CARGOS_CATEDRA.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={m.esResponsable}
                  onClick={() => quitar(m.id)}
                  className="text-xs text-danger hover:underline disabled:opacity-40 disabled:hover:no-underline disabled:cursor-not-allowed whitespace-nowrap"
                  title={m.esResponsable ? 'Cambiá el responsable antes de quitarlo' : undefined}
                >
                  Quitar
                </button>
              </div>
            );
          })}
          {integrantes.length === 0 && (
            <p className="text-xs text-muted">Sin integrantes cargados para el ciclo {cycle}.</p>
          )}
        </div>

        {disponibles.length > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-end gap-2 border border-dashed border-border rounded-lg p-3">
            <div className="flex-1">
              <label htmlFor="nuevo-docente" className="block text-[11px] text-muted mb-1">
                Docente
              </label>
              <select
                id="nuevo-docente"
                value={docenteSeleccionado}
                onChange={(e) => setNuevoDocenteId(e.target.value)}
                className={fieldCls}
              >
                {disponibles.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.apellido}, {d.nombre} (DNI {d.dni})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:w-52">
              <label htmlFor="nuevo-cargo" className="block text-[11px] text-muted mb-1">
                Cargo
              </label>
              <select id="nuevo-cargo" value={nuevoCargo} onChange={(e) => setNuevoCargo(e.target.value)} className={fieldCls}>
                {CARGOS_CATEDRA.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={agregar}
              className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-lg disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              + Agregar
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted border border-dashed border-border rounded-lg p-3">
            Todos los docentes activos ya integran esta cátedra.
          </p>
        )}
      </div>
    </Modal>
  );
}
