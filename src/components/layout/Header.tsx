import { useState, useRef, useEffect } from 'react';
import { ROLES } from '../../data/mockData';
import { StatusBadge } from '../shared/StatusBadge';

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
  docentes: any[];
  carreras: any[];
  activeUserName: string;
  isDark: boolean;
  toggleTheme: () => void;
  notifications: NotificationItem[];
  onSelectNotification: (docId: string) => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
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

  const initials = String(activeUserName)
    .split(' ')
    .slice(0, 2)
    .map((x) => x[0] || '')
    .join('')
    .toUpperCase();

  const alertCount = notifications.filter((n) => n.unresolvedCount > 0 || n.state === 'OBSERVADO').length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-surface/90 backdrop-blur border-b border-border px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="font-semibold text-ink">DACEFyN</span>
        <span>/</span>
        <span>Sede Capital</span>
        <span className="ml-2 px-2 py-0.5 rounded-md bg-soft text-primary border border-primary/25 font-bold text-[11px]">
          Ciclo {cycle}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted">Vista de Rol:</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg bg-background border border-border px-2.5 py-1.5 text-xs text-ink font-medium outline-none focus:border-primary"
          >
            {Object.entries(ROLES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {role.startsWith('DOCENTE') && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted">Docente:</span>
            <select
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              className="rounded-lg bg-background border border-border px-2.5 py-1.5 text-xs text-ink outline-none focus:border-primary"
            >
              {docentes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido}
                </option>
              ))}
            </select>
          </div>
        )}

        {role === 'DIRECCION_CARRERA' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted">Carrera:</span>
            <select
              value={careerId}
              onChange={(e) => setCareerId(e.target.value)}
              className="rounded-lg bg-background border border-border px-2.5 py-1.5 text-xs text-ink outline-none focus:border-primary"
            >
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Botón de Tema Claro / Oscuro */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background hover:bg-soft border border-border text-xs font-semibold text-ink transition shadow-sm"
        >
          <span>{isDark ? '☀️ Claro' : '🌙 Oscuro'}</span>
        </button>

        {/* CAMPANITA DE NOTIFICACIONES */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((prev) => !prev)}
            title="Notificaciones de estado y observaciones"
            className="relative p-2 rounded-xl bg-background hover:bg-soft border border-border text-ink transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {alertCount > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                {alertCount}
              </span>
            ) : (
              notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary" />
              )
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
              <div className="px-4 py-3 border-b border-border bg-background/60 flex items-center justify-between">
                <span className="font-bold text-ink">Estado de Mis Planificaciones</span>
                <span className="text-[10px] font-semibold text-muted">{notifications.length} instrumento(s)</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setNotifOpen(false);
                        onSelectNotification(n.docId);
                      }}
                      className="w-full p-3.5 hover:bg-soft/60 transition text-left flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-ink truncate">{n.title}</span>
                        <StatusBadge state={n.state} />
                      </div>
                      <div className="text-[11px] text-muted">{n.subtitle}</div>
                      {n.unresolvedCount > 0 ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          <span>⚠️ Tiene {n.unresolvedCount} observación(es) pendiente(s) de subsanar</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ Sin observaciones pendientes
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-muted">No hay notificaciones para mostrar.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar con Menú Desplegable (Cambiar Contraseña y Cerrar Sesión) */}
        <div className="relative pl-2 border-l border-border" ref={dropdownRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-background transition text-left"
          >
            <div className="w-8 h-8 rounded-full bg-soft border border-primary/30 text-primary flex items-center justify-center font-bold text-xs">
              {initials}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-ink leading-none">{activeUserName}</div>
              <div className="text-[10px] text-muted mt-0.5">{role}</div>
            </div>
            <span className="text-[10px] text-muted ml-0.5">▾</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-surface border border-border rounded-xl shadow-xl py-1.5 z-50 text-xs">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate('cambiar-password');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-ink hover:bg-soft hover:text-primary transition text-left font-medium"
              >
                <span>⚿</span> Cambiar Contraseña
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-danger hover:bg-rose-500/10 transition text-left font-semibold"
              >
                <span>⇥</span> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}