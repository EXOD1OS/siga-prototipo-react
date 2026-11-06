import { Modal, ModalButton } from '../shared/Modal';
import type { Asignatura, Carrera, Departamento, EquipoCatedra, PlanEstudio, Sede } from '../../types/estructura';

interface CarreraDetalleModalProps {
  carrera: Carrera;
  sede?: Sede;
  departamento?: Departamento | null;
  directorNombre: string;
  planes: PlanEstudio[];
  asignaturas: Asignatura[];
  equipoDeAsig: (asigId: string) => EquipoCatedra[];
  departamentoNombre: (id: string | null) => string | undefined;
  cycle: number;
  onGestionarEquipo: (asigId: string) => void;
  onClose: () => void;
}

/** Detalle de una carrera: datos institucionales, planes y cobertura de equipos. */
export function CarreraDetalleModal({
  carrera,
  sede,
  departamento,
  directorNombre,
  planes,
  asignaturas,
  equipoDeAsig,
  departamentoNombre,
  cycle,
  onGestionarEquipo,
  onClose,
}: CarreraDetalleModalProps) {
  const conResponsable = asignaturas.filter((a) => equipoDeAsig(a.id).some((e) => e.esResponsable)).length;

  const datos: [string, string][] = [
    ['Código', carrera.codigo],
    ['Sede', sede?.nombre ?? '—'],
    ['Departamento', departamento?.nombre ?? 'Sin departamento (sede regional)'],
    ['Dirección de carrera', directorNombre],
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title={carrera.nombre}
      widthClass="max-w-2xl"
      headerExtra={
        <p className="text-xs text-muted">
          {planes.length} plan(es) · {asignaturas.length} asignatura(s) · {conResponsable}/{asignaturas.length} con responsable en{' '}
          {cycle}
        </p>
      }
      footer={<ModalButton onClick={onClose}>Cerrar</ModalButton>}
    >
      <div className="space-y-4">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {datos.map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border bg-background px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">{k}</dt>
              <dd className="mt-0.5 text-xs text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        {planes.map((plan) => {
          const asigs = asignaturas
            .filter((a) => a.planEstudioId === plan.id)
            .sort((a, b) => a.anoCursada - b.anoCursada);
          return (
            <section key={plan.id} className="space-y-2">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-ink">
                {plan.ordenanza}
                <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                  {plan.enfoque === 'COMPETENCIAS' ? 'Competencias' : 'Tradicional'}
                </span>
              </h3>
              <div className="space-y-2">
                {asigs.map((a) => {
                  const eq = equipoDeAsig(a.id);
                  const resp = eq.some((e) => e.esResponsable);
                  const esMatricial = !!a.departamentoRadicacionId && a.departamentoRadicacionId !== carrera.departamentoId;
                  return (
                    <div key={a.id} className="flex flex-wrap items-center gap-3 border border-border rounded-lg px-3 py-2">
                      <span className="flex-1 min-w-[10rem] text-sm text-ink truncate">
                        {a.anoCursada}.º · {a.nombre}
                        <span className="block text-[11px] text-muted truncate">
                          {a.regimenDictado} · {a.horasTotales} hs
                          {esMatricial && ` · Radicada en ${departamentoNombre(a.departamentoRadicacionId) ?? 'otro departamento'}`}
                        </span>
                      </span>
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${
                          resp
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {resp ? `${eq.length} docente(s)` : 'Sin responsable'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onGestionarEquipo(a.id)}
                        className="text-xs font-medium text-primary hover:text-primary-hover border border-border hover:border-primary rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Gestionar equipo
                      </button>
                    </div>
                  );
                })}
                {asigs.length === 0 && <p className="text-xs text-muted">Sin asignaturas cargadas en este plan.</p>}
              </div>
            </section>
          );
        })}
        {planes.length === 0 && <p className="text-xs text-muted">La carrera no tiene planes de estudio cargados.</p>}
      </div>
    </Modal>
  );
}
