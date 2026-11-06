import { useEffect, useRef, useState } from 'react';
import { IconAlert, IconCheck, IconClose } from '../layout/icons';

export type ToastTone = 'success' | 'warning';

interface ToastProps {
  message: string;
  tone?: ToastTone;
  /** Duración visible antes de salir (ms). */
  duration?: number;
  onDone: () => void;
}

const SALIDA_MS = 250;

/**
 * Aviso flotante con entrada y salida suaves, barra de tiempo restante y cierre manual.
 * El tiempo se pausa mientras el cursor está encima.
 */
export function Toast({ message, tone = 'success', duration = 3800, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [pausado, setPausado] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // Entrada en el siguiente frame para que la transición se ejecute.
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Al ocultarse (después de haber entrado), espera la animación y avisa.
  const entro = useRef(false);
  useEffect(() => {
    if (visible) {
      entro.current = true;
      return;
    }
    if (!entro.current) return;
    const t = setTimeout(() => onDoneRef.current(), SALIDA_MS);
    return () => clearTimeout(t);
  }, [visible]);

  const Icon = tone === 'warning' ? IconAlert : IconCheck;
  const iconCls = tone === 'warning' ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-500';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        className={`pointer-events-auto relative flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl border border-border bg-surface py-3 pl-3 pr-2 shadow-2xl transition-all duration-300 ease-out motion-reduce:transition-none ${
          visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'
        }`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="flex-1 text-xs font-medium leading-snug text-ink">{message}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Cerrar aviso"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-ink"
        >
          <IconClose className="h-3.5 w-3.5" />
        </button>
        {/* Tiempo restante: al terminar la animación, el aviso se cierra solo */}
        {visible && (
          <span
            aria-hidden
            onAnimationEnd={() => setVisible(false)}
            className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-primary"
            style={{
              animation: `toast-progress ${duration}ms linear forwards`,
              animationPlayState: pausado ? 'paused' : 'running',
            }}
          />
        )}
      </div>
    </div>
  );
}
