import { Children, type ReactNode } from 'react';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ease-out ${open ? 'rotate-90' : ''}`}
    >
      <path d="M7 4.5L13 10L7 15.5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface TreeItemProps {
  label: string;
  sublabel?: string;
  badge?: string;
  /** Clases de color para el badge (por defecto neutro). */
  badgeCls?: string;
  /** Fuerza el nodo como rama aunque no tenga hijos visibles (ej. plan vacío). */
  branch?: boolean;
  /** Solo para nodos con hijos. */
  open?: boolean;
  onToggle?: () => void;
  /** Acción del nodo hoja (abrir modal). */
  onSelect?: () => void;
  active?: boolean;
  /** Botones a la derecha de la fila (fuera del botón principal). */
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * Nodo del árbol de estructura. Replica el TreeItem de la interfaz anterior,
 * pero el estado abierto/cerrado lo controla el padre.
 */
export function TreeItem({
  label,
  sublabel,
  badge,
  badgeCls = 'border-border bg-surface text-muted',
  branch,
  open = false,
  onToggle,
  onSelect,
  active = false,
  actions,
  children,
}: TreeItemProps) {
  const childCount = Children.toArray(children).length;
  const hasChildren = branch ?? childCount > 0;

  const rowCls = active
    ? 'bg-soft border-primary text-ink font-semibold shadow-sm'
    : hasChildren
      ? 'bg-background border-border hover:bg-soft hover:border-primary text-ink font-medium'
      : 'bg-surface border-border hover:bg-soft hover:border-primary text-ink';

  return (
    <div>
      <div className={`group flex min-h-9 w-full items-center gap-2 rounded-xl border pr-2 transition-colors duration-150 ${rowCls}`}>
        <button
          type="button"
          onClick={hasChildren ? onToggle : onSelect}
          aria-expanded={hasChildren ? open : undefined}
          aria-current={active ? 'true' : undefined}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {hasChildren ? (
            <span className="shrink-0 text-primary">
              <ChevronIcon open={open} />
            </span>
          ) : (
            <span className="shrink-0 w-3.5 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="block truncate">{label}</span>
            {sublabel && <span className="block truncate text-[11px] font-normal text-muted mt-0.5">{sublabel}</span>}
          </span>

          {badge && (
            <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold sm:text-[10px] ${badgeCls}`}>
              {badge}
            </span>
          )}

          {hasChildren && (
            <span
              className={`shrink-0 text-[10px] rounded-full px-1.5 py-0.5 border transition-colors duration-150 ${
                active || open ? 'border-primary text-primary bg-surface' : 'border-border text-muted bg-surface'
              }`}
              aria-label={`${childCount} elementos`}
            >
              {childCount}
            </span>
          )}
        </button>

        {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
      </div>

      {hasChildren && (
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
          inert={!open}
        >
          <div className="overflow-hidden">
            <div
              className={`ml-[7px] border-l-2 border-border pl-3 mt-1 space-y-1 pb-1 transition-opacity duration-200 ${
                open ? 'opacity-100 delay-100' : 'opacity-0'
              }`}
            >
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
