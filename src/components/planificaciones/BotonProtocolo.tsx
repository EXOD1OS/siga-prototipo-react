import type { MouseEvent } from 'react';
import { IconSeal } from '../layout/icons';

export type EtapaProtocolo = 'expediente' | 'resolucion';

/** Carpeta de expediente. */
export const IconCarpeta = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4.2l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5v8.3A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18z" />
    <path d="M12 11.5v5M9.5 14h5" />
  </svg>
);

const BASE =
  'inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold leading-none shadow-sm transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

const ESTILO: Record<EtapaProtocolo, string> = {
  expediente:
    'bg-indigo-600/15 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white border-indigo-500/30 hover:border-indigo-600 focus-visible:outline-indigo-500',
  resolucion:
    'bg-emerald-600/15 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white border-emerald-500/30 hover:border-emerald-600 focus-visible:outline-emerald-500',
};

export const LABEL_PROTOCOLO: Record<EtapaProtocolo, string> = {
  expediente: 'Cargar Expediente',
  resolucion: 'Cargar Resolución',
};

/** Etapa de protocolización que corresponde al estado del PAAC (null = ninguna). */
export const etapaProtocolo = (state: string): EtapaProtocolo | null =>
  state === 'APROBADO_PLENO' ? 'expediente' : state === 'ELEVADO_AL_CONSEJO' ? 'resolucion' : null;

/** Botón secundario de fila con la misma altura que los de protocolización. */
export const BTN_FILA =
  'inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg border border-border bg-surface px-3 text-xs font-semibold leading-none text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-surface disabled:hover:text-primary';

/** «Cargar Expediente» (1.ª instancia) o «Cargar Resolución» (2.ª instancia) del Consejo Departamental. */
export function BotonProtocolo({
  etapa,
  onClick,
  detenerPropagacion = false,
  className = '',
}: {
  etapa: EtapaProtocolo;
  onClick: () => void;
  /** Dentro de una tarjeta clickeable: no abre la tarjeta. */
  detenerPropagacion?: boolean;
  className?: string;
}) {
  const manejar = (e: MouseEvent<HTMLButtonElement>) => {
    if (detenerPropagacion) e.stopPropagation();
    onClick();
  };
  return (
    <button type="button" onClick={manejar} className={`${BASE} ${ESTILO[etapa]} ${className}`}>
      {etapa === 'expediente' ? <IconCarpeta className="h-3.5 w-3.5 shrink-0" /> : <IconSeal className="h-3.5 w-3.5 shrink-0" />}
      {LABEL_PROTOCOLO[etapa]}
    </button>
  );
}
