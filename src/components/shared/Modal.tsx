import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Contenido extra en la cabecera, debajo del título (chips de contexto, etc.). */
  headerExtra?: ReactNode;
  /** Botones de acción del pie (Guardar / Cerrar). */
  footer?: ReactNode;
  children: ReactNode;
  widthClass?: string;
}

/**
 * Modal institucional. Replica el estilo del Modal de la interfaz anterior:
 * backdrop semitransparente, panel surface con borde, cabecera separada y botón ×.
 */
export function Modal({
  open,
  onClose,
  title,
  headerExtra,
  footer,
  children,
  widthClass = 'max-w-2xl',
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Ref para no re-ejecutar el efecto (y robar el foco) cuando el padre pasa un onClose nuevo.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Respeta el autoFocus de un campo interno; si no hay, enfoca el panel.
    if (!panelRef.current?.contains(document.activeElement)) panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`w-full ${widthClass} bg-surface border border-border rounded-xl shadow-xl outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
            <div className="min-w-0">
              <h2 id={titleId} className="text-sm font-semibold text-ink">
                {title}
              </h2>
              {headerExtra && <div className="mt-1.5">{headerExtra}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="text-muted hover:text-ink text-lg leading-none rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">{footer}</div>
        )}
      </div>
    </div>
  );
}

/** Botones estándar del pie de modal. */
export function ModalButton({
  variant = 'secondary',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'danger-outline' }) {
  const cls = {
    primary: 'bg-primary hover:bg-primary-hover text-white',
    secondary: 'border border-border text-ink hover:bg-background',
    danger: 'bg-danger hover:bg-red-600 text-white',
    'danger-outline': 'border border-red-500/40 text-danger hover:bg-red-500/10',
  }[variant];
  return (
    <button
      type="button"
      {...props}
      className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${cls}`}
    >
      {children}
    </button>
  );
}
