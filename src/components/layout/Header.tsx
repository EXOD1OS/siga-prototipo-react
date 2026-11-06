import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ROLES } from '../../data/mockData';
import { StatusBadge } from '../shared/StatusBadge';
import type { Carrera, Usuario } from '../../types/estructura';
import {
  IconAlert,
  IconBell,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconKey,
  IconLogout,
  IconMoon,
  IconSun,
} from './icons';

export interface NotificationItem {
  id: string;
  docId: string;
  title: string;
  subtitle: string;
  state: string;
  unresolvedCount: number;
}

interface Props {
  cycle: number;
  role: string;
  setRole: (r: string) => void;
  uid: string;
  setUid: (u: string) => void;
  careerId: string;
  setCareerId: (c: string) => void;
  docentes: Usuario[];
  carreras: Carrera[];
  activeUserName: string;
  isDark: boolean;
  toggleTheme: () => void;
  notifications: NotificationItem[];
  onSelectNotification: (docId: string) => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

type Tono = 'atencion' | 'revision' | 'ok';

const tonoDe = (n: NotificationItem): Tono => {
  if (n.unresolvedCount > 0 || n.state === 'OBSERVADO') return 'atencion';
  if (['ENVIADO_A_REVISION', 'APROBADO_PEDAGOGICO', 'APROBADO_DISCIPLINAR', 'ELEVADO_AL_CONSEJO'].includes(n.state)) return 'revision';
  return 'ok';
};

const TONO: Record<Tono, { Icon: typeof IconAlert; cls: string }> = {
  atencion: { Icon: IconAlert, cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  revision: { Icon: IconClock, cls: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
  ok: { Icon: IconCheck, cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
};

/** Clases de un panel desplegable con entrada/salida suave. */
const panelCls = (open: boolean) =>
  `absolute right-0 top-full z-50 mt-2 origin-top-right rounded-2xl border border-border bg-surface shadow-2xl transition-all duration-200 ease-out ${
    open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-1 scale-95 opacity-0 pointer-events-none'
  }`;

const iconBtnCls =
  'relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-ink transition-colors duration-200 hover:border-primary hover:bg-soft hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const selectCls =
  'rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink outline-none transition-colors focus:border-primary';

function GrupoNotif({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <div className="sticky top-0 z-10 bg-surface px-4 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted backdrop-blur">{titulo}</div>
      <ul className="px-2 pb-2">{children}</ul>
    </div>
  );
}

export function Header({
  cycle,
  role,
  setRole,
  uid,
  setUid,
  careerId,
  setCareerId,
  docentes,
  carreras,
  activeUserName,
  isDark,
  toggleTheme,
  notifications,
  onSelectNotification,
  onNavigate,
  onLogout,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const initials = activeUserName
    .split(' ')
    .slice(0, 2)
    .map((x) => x[0] || '')
    .join('')
    .toUpperCase();

  const atencion = notifications.filter((n) => tonoDe(n) === 'atencion');
  const resto = notifications.filter((n) => tonoDe(n) !== 'atencion');

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const renderNotif = (n: NotificationItem) => {
    const { Icon, cls } = TONO[tonoDe(n)];
    return (
      <li key={n.id}>
        <button
          type="button"
          onClick={() => {
            setNotifOpen(false);
            onSelectNotification(n.docId);
          }}
          className="group flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors duration-150 hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cls}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-2">
              <span className="truncate text-xs font-semibold text-ink">{n.title}</span>
              <StatusBadge state={n.state} />
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-muted">{n.subtitle}</span>
            {n.unresolvedCount > 0 && (
              <span className="mt-1 block text-[11px] font-medium text-amber-700 dark:text-amber-400">
                {n.unresolvedCount} observación(es) por subsanar
              </span>
            )}
          </span>
          <IconChevronRight className="mt-2 h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100" />
        </button>
      </li>
    );
  };

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] px-6 py-3 backdrop-blur-md">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="font-semibold text-ink">DACEFyN</span>
        <span aria-hidden>/</span>
        <span>Sede Capital</span>
        <span className="ml-2 rounded-md bg-soft px-2 py-0.5 text-[11px] font-bold text-primary">Ciclo {cycle}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Simulación de sesión del prototipo */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background px-2 py-1">
          <label htmlFor="hdr-rol" className="pl-1 text-[11px] text-muted">
            Vista de rol
          </label>
          <select id="hdr-rol" value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
            {Object.entries(ROLES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {role.startsWith('DOCENTE') && (
            <select aria-label="Docente" value={uid} onChange={(e) => setUid(e.target.value)} className={selectCls}>
              {docentes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido}
                </option>
              ))}
            </select>
          )}
          {role === 'DIRECCION_CARRERA' && (
            <select aria-label="Carrera" value={careerId} onChange={(e) => setCareerId(e.target.value)} className={selectCls}>
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.sigla}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Tema claro / oscuro: el ícono gira y se intercambia */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Activar tema claro' : 'Activar tema oscuro'}
          title={isDark ? 'Tema claro' : 'Tema oscuro'}
          className={`${iconBtnCls} overflow-hidden`}
        >
          <IconSun
            data-theme-anim
            className={`absolute h-[18px] w-[18px] text-amber-500 transition-all duration-500 ease-out ${
              isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0'
            }`}
          />
          <IconMoon
            data-theme-anim
            className={`absolute h-[18px] w-[18px] text-indigo-500 transition-all duration-500 ease-out ${
              isDark ? '-rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
            }`}
          />
        </button>

        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((o) => !o);
              setMenuOpen(false);
            }}
            aria-label={`Notificaciones${atencion.length ? `: ${atencion.length} requieren atención` : ''}`}
            aria-expanded={notifOpen}
            aria-haspopup="dialog"
            className={`${iconBtnCls} ${notifOpen ? 'border-primary bg-soft text-primary' : ''}`}
          >
            <IconBell className={`h-[18px] w-[18px] transition-transform duration-300 ${notifOpen ? 'rotate-12' : ''}`} />
            {atencion.length > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-40 motion-reduce:animate-none" />
                <span className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                  {atencion.length}
                </span>
              </span>
            ) : (
              notifications.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-surface" />
            )}
          </button>

          <div role="dialog" aria-label="Notificaciones" aria-hidden={!notifOpen} inert={!notifOpen} className={`${panelCls(notifOpen)} w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <div className="text-sm font-bold text-ink">Notificaciones</div>
                <div className="text-[11px] text-muted">
                  {atencion.length ? `${atencion.length} requieren tu atención` : 'Todo al día'}
                </div>
              </div>
              <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted">{notifications.length}</span>
            </div>

            <div className="max-h-[22rem] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-soft text-primary">
                    <IconBell className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-ink">Sin notificaciones</p>
                  <p className="mt-1 text-xs text-muted">Te avisaremos cuando haya novedades en tus planificaciones.</p>
                </div>
              ) : (
                <>
                  {atencion.length > 0 && <GrupoNotif titulo="Requieren atención">{atencion.map(renderNotif)}</GrupoNotif>}
                  {resto.length > 0 && <GrupoNotif titulo="Seguimiento">{resto.map(renderNotif)}</GrupoNotif>}
                </>
              )}
            </div>

            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(false);
                  onNavigate('planificaciones');
                }}
                className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-primary transition-colors hover:bg-soft"
              >
                Ver todas las planificaciones <IconChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Usuario */}
        <div className="relative border-l border-border pl-2.5" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((o) => !o);
              setNotifOpen(false);
            }}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 rounded-xl p-1 pr-2 text-left transition-colors duration-200 hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm">{initials}</span>
            <span className="hidden sm:block">
              <span className="block text-xs font-semibold leading-none text-ink">{activeUserName}</span>
              <span className="mt-1 block text-[10px] text-muted">{ROLES[role]}</span>
            </span>
            <IconChevronDown className={`h-3.5 w-3.5 text-muted transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          <div role="menu" aria-hidden={!menuOpen} inert={!menuOpen} className={`${panelCls(menuOpen)} w-56 p-1.5 text-xs`}>
            <div className="px-3 py-2">
              <div className="truncate font-semibold text-ink">{activeUserName}</div>
              <div className="text-[11px] text-muted">{ROLES[role]}</div>
            </div>
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onNavigate('cambiar-password');
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-medium text-ink transition-colors hover:bg-soft hover:text-primary"
            >
              <IconKey className="h-4 w-4" /> Cambiar contraseña
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-semibold text-danger transition-colors hover:bg-red-500/10"
            >
              <IconLogout className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
