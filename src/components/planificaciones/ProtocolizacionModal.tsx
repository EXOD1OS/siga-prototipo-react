import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Modal } from '../shared/Modal';
import { IconAlert, IconCheck, IconLock, IconSeal } from '../layout/icons';
import { IconCarpeta } from './BotonProtocolo';
import type { AsigContext } from '../../types/estructura';
import type { PaacDoc } from '../../types/planificacion';

interface Props {
  doc: PaacDoc;
  ctx: AsigContext;
  /** Docente Responsable de la cátedra. */
  responsable: string;
  onClose: () => void;
  /** 1.ª instancia: caratula el expediente y eleva al Consejo (APROBADO_PLENO → ELEVADO_AL_CONSEJO). */
  onRegistrarExpediente: (expediente: string, fecha: string) => void;
  /** 2.ª instancia: registra la Resolución del Consejo Superior (ELEVADO_AL_CONSEJO → FINALIZADO). */
  onRegistrarResolucion: (resolucion: string, fecha: string) => void;
}

const hoy = () => new Date().toISOString().slice(0, 10);
/** "2026-05-12" → "12/05/2026". */
export const fechaLegible = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('/') : iso);

// `primary` es una variable CSS sin canal alfa: `ring-primary/20` no se genera; va su equivalente con color-mix.
const inputCls =
  'h-10 w-full rounded-xl border border-border bg-background px-3.5 text-xs text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-[color:color-mix(in_srgb,var(--primary)_20%,transparent)] aria-[invalid=true]:border-danger';
const labelCls = 'mb-1.5 block text-xs font-semibold text-ink';

type EstadoPaso = 'completo' | 'activo' | 'pendiente';

function Paso({ n, titulo, detalle, estado }: { n: number; titulo: string; detalle: string; estado: EstadoPaso }) {
  const circulo =
    estado === 'completo'
      ? 'border-emerald-600 bg-emerald-600 text-white'
      : estado === 'activo'
        ? 'border-primary bg-primary text-white'
        : 'border-border bg-background text-muted';
  return (
    <li className="flex min-w-0 flex-1 items-center gap-2.5" aria-current={estado === 'activo' ? 'step' : undefined}>
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${circulo}`}>
        {estado === 'completo' ? <IconCheck className="h-3.5 w-3.5" /> : n}
      </span>
      <span className="min-w-0">
        <span className={`block truncate text-xs font-semibold ${estado === 'pendiente' ? 'text-muted' : 'text-ink'}`}>{titulo}</span>
        <span className="block truncate text-[10px] text-muted">
          {detalle}
          <span className="sr-only"> · {estado === 'completo' ? 'completado' : estado === 'activo' ? 'paso actual' : 'pendiente'}</span>
        </span>
      </span>
    </li>
  );
}

function CampoConIcono({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
        {icono}
      </span>
      {children}
    </div>
  );
}

/**
 * Protocolización del PAAC por el Consejo Departamental, en dos momentos:
 * 1) Caratulación del expediente y elevación; 2) carga de la Resolución del Consejo Superior y cierre definitivo.
 * La etapa la determina el estado del documento.
 */
export function ProtocolizacionModal({ doc, ctx, responsable, onClose, onRegistrarExpediente, onRegistrarResolucion }: Props) {
  const uid = useId();
  const etapa = doc.state === 'APROBADO_PLENO' ? 1 : doc.state === 'ELEVADO_AL_CONSEJO' ? 2 : null;
  const [numero, setNumero] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [intento, setIntento] = useState(false);

  if (!etapa) return null;
  const error = intento && !numero.trim() ? (etapa === 1 ? 'Ingresá el número de expediente.' : 'Ingresá el número de resolución.') : null;

  const confirmar = (e: FormEvent) => {
    e.preventDefault();
    setIntento(true);
    if (!numero.trim() || !fecha) return;
    if (etapa === 1) onRegistrarExpediente(numero.trim(), fechaLegible(fecha));
    else onRegistrarResolucion(numero.trim(), fechaLegible(fecha));
  };

  const errorId = `${uid}-error`;

  return (
    <Modal open onClose={onClose} title={etapa === 1 ? 'Registrar Expediente y Elevar al Consejo' : 'Registrar Resolución y Finalizar Planificación'} widthClass="max-w-xl">
      <form onSubmit={confirmar} noValidate className="space-y-5">
        {/* Indicador de progreso */}
        <ol aria-label="Etapas de protocolización" className="flex items-center gap-3">
          <Paso n={1} titulo="Caratulación de Expediente" detalle="Consejo Departamental" estado={etapa === 1 ? 'activo' : 'completo'} />
          <span aria-hidden className={`h-px w-8 shrink-0 sm:w-12 ${etapa === 2 ? 'bg-emerald-600' : 'bg-border'}`} />
          <Paso n={2} titulo="Resolución Definitiva" detalle="Consejo Superior" estado={etapa === 2 ? 'activo' : 'pendiente'} />
        </ol>

        {/* Resumen de la cátedra */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink" title={ctx.asig?.nombre}>
              {ctx.asig?.nombre ?? doc.asignaturaId}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted">
              {[ctx.carrera?.sigla, ctx.plan?.ordenanza, `Ciclo ${doc.cycle}`, responsable].filter(Boolean).join(' · ')}
            </p>
          </div>
          {etapa === 2 ? (
            <span className="shrink-0 text-right">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Expediente</span>
              <span className="mt-0.5 inline-block rounded-md border border-primary/20 border-[color:color-mix(in_srgb,var(--primary)_20%,transparent)] bg-soft px-2.5 py-1 font-mono text-xs font-bold text-primary">
                {doc.expediente || '—'}
              </span>
            </span>
          ) : (
            <span className="flex shrink-0 flex-col items-end gap-1 text-[11px]">
              {(
                [
                  ['UAP', doc.pedApproved],
                  ['Dirección', doc.discApproved],
                ] as const
              ).map(([area, ok]) => (
                <span key={area} className={`inline-flex items-center gap-1 font-medium ${ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-danger'}`}>
                  {ok ? <IconCheck className="h-3 w-3" /> : <IconAlert className="h-3 w-3" />}
                  {area}: {ok ? 'favorable' : 'pendiente'}
                </span>
              ))}
            </span>
          )}
        </div>

        {etapa === 2 && (
          <p className="text-xs leading-relaxed text-muted">
            Una vez recibida la Resolución emitida por el Consejo Superior, regístrela a continuación para finalizar y archivar definitivamente la planificación.
            {doc.fechaElevacion && ` Elevada el ${doc.fechaElevacion}.`}
          </p>
        )}

        {/* Campos */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor={`${uid}-numero`} className={labelCls}>
              {etapa === 1 ? 'Número de Expediente' : 'Número de Resolución (CS / CD)'} <span className="text-danger">*</span>
            </label>
            <CampoConIcono icono={etapa === 1 ? <IconCarpeta className="h-4 w-4" /> : <IconSeal className="h-4 w-4" />}>
              <input
                id={`${uid}-numero`}
                autoFocus
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder={etapa === 1 ? 'EXP-UNLaR-2026-00412' : 'RES-CS-2026-089'}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className={`${inputCls} pl-10 font-mono`}
              />
            </CampoConIcono>
          </div>
          <div className="sm:col-span-1">
            <label htmlFor={`${uid}-fecha`} className={labelCls}>
              {etapa === 1 ? 'Fecha de elevación' : 'Fecha de Resolución'}
            </label>
            <input id={`${uid}-fecha`} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
          </div>
        </div>
        {error && (
          <p id={errorId} role="alert" className="-mt-2 text-xs font-medium text-danger">
            {error}
          </p>
        )}

        {etapa === 2 && (
          <p role="note" className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
            <IconLock className="mt-0.5 h-4 w-4 shrink-0" />
            Atención: Al registrar la resolución, la planificación quedará finalizada de forma permanente e inmutable.
          </p>
        )}

        {/* Pie */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-border bg-background px-4 text-xs font-semibold text-muted transition hover:bg-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-semibold text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              etapa === 1 ? 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500 focus-visible:outline-emerald-500'
            }`}
          >
            {etapa === 1 ? <IconCarpeta className="h-4 w-4 shrink-0" /> : <IconSeal className="h-4 w-4 shrink-0" />}
            {etapa === 1 ? 'Caratular Expediente y Elevar' : 'Registrar Resolución y Finalizar Definitivamente'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
