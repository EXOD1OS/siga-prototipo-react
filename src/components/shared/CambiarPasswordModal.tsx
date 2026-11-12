import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { IconAlert, IconEye, IconEyeOff, IconKey } from '../layout/icons';

interface Props {
  open: boolean;
  /** Nombre y perfil de la sesión activa (ej. "Lucía Torres"). */
  activeUserName: string;
  rolLabel: string;
  /** La cuenta todavía usa el DNI como contraseña provisoria. */
  obligatorio?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const MIN = 8;

const inputCls =
  'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-11 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:ring-[color-mix(in_srgb,var(--primary)_30%,transparent)] focus:border-primary transition-all duration-200 aria-[invalid=true]:border-danger';

function CampoPassword({
  id,
  label,
  value,
  onChange,
  autoComplete,
  ayuda,
  error,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  ayuda?: string;
  error?: string;
  autoFocus?: boolean;
}) {
  const [ver, setVer] = useState(false);
  const describedBy = [ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={ver ? 'text' : 'password'}
          value={value}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          aria-label={ver ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={ver}
          className="absolute inset-y-0 right-1 my-1 flex w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-soft hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {ver ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
        </button>
      </div>
      {ayuda && !error && (
        <p id={`${id}-ayuda`} className="mt-1 text-[11px] text-muted">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="animate-fadeIn mt-1 text-[11px] font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

/** Cambio de contraseña sin salir de la vista en la que se trabaja. */
export function CambiarPasswordModal({ open, activeUserName, rolLabel, obligatorio = false, onClose, onConfirm }: Props) {
  const uid = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [intento, setIntento] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Al abrir: formulario limpio, Escape cierra y el fondo no se desplaza.
  useEffect(() => {
    if (!open) return;
    setActual('');
    setNueva('');
    setConfirmacion('');
    setIntento(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  // Los errores se muestran al primer intento de guardar y después se actualizan mientras se escribe.
  const errores = {
    actual: !actual ? 'Ingresá tu contraseña actual o el DNI inicial.' : undefined,
    nueva: nueva.length < MIN ? `La nueva contraseña debe tener al menos ${MIN} caracteres.` : nueva === actual ? 'La nueva contraseña debe ser distinta de la actual.' : undefined,
    confirmacion: confirmacion !== nueva ? 'Las contraseñas no coinciden.' : !confirmacion ? 'Repetí la nueva contraseña.' : undefined,
  };
  const valido = !errores.actual && !errores.nueva && !errores.confirmacion;
  const ver = (e?: string) => (intento ? e : undefined);

  const guardar = (e: FormEvent) => {
    e.preventDefault();
    setIntento(true);
    if (valido) onConfirm();
  };

  return (
    <div className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-titulo`}
        aria-describedby={`${uid}-sub`}
        className="animate-riseIn w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-soft text-primary">
            <IconKey className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={`${uid}-titulo`} className="text-sm font-semibold text-ink">
              Cambiar Contraseña
            </h2>
            <p id={`${uid}-sub`} className="truncate text-[11px] text-muted">
              {activeUserName} · {rolLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            ✕
          </button>
        </div>

        <form onSubmit={guardar} noValidate className="space-y-4 px-5 py-5">
          {obligatorio && (
            <p role="status" className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
              <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Tu cuenta usa el DNI como contraseña provisoria. Definí una contraseña personal para continuar de forma segura.
            </p>
          )}
          <CampoPassword
            id={`${uid}-actual`}
            label="Contraseña actual / DNI inicial"
            value={actual}
            onChange={setActual}
            autoComplete="current-password"
            error={ver(errores.actual)}
            autoFocus
          />
          <CampoPassword
            id={`${uid}-nueva`}
            label="Nueva contraseña"
            value={nueva}
            onChange={setNueva}
            autoComplete="new-password"
            ayuda={`Mínimo ${MIN} caracteres.`}
            error={ver(errores.nueva)}
          />
          <CampoPassword
            id={`${uid}-confirmar`}
            label="Confirmar nueva contraseña"
            value={confirmacion}
            onChange={setConfirmacion}
            autoComplete="new-password"
            error={ver(errores.confirmacion)}
          />

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-medium text-ink transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={intento && !valido}
              className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-hover active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Guardar contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
