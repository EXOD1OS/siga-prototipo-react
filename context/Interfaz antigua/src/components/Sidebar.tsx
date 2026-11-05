'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ROL_LABELS } from '@/types/planificacion';

const NAV = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/planificaciones', label: 'Planificaciones' },
];

const NAV_ADMIN = [{ href: '/admin', label: 'Administración' }];

export function Sidebar({ nombre, rol }: { nombre: string; rol: string }) {
  const pathname = usePathname();

  function renderLink(item: { href: string; label: string }) {
    const active = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`block shrink-0 whitespace-nowrap px-3 py-2 rounded-lg text-sm transition-colors ${
          active ? 'bg-primary/15 text-primary font-medium' : 'text-gray-400 hover:bg-surface hover:text-gray-200'
        }`}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <aside className="no-print flex w-full shrink-0 flex-col border-b border-border bg-sidebar xl:sticky xl:top-0 xl:h-screen xl:w-64 xl:border-b-0 xl:border-r">
      <div className="border-b border-border px-4 py-3 sm:px-5 sm:py-4 xl:px-5 xl:py-6">
        <p className="text-white font-semibold leading-tight">SIGA Planificaciones</p>
        <p className="text-xs text-gray-500 mt-0.5">DACEFyN &middot; UNLaR</p>
      </div>

      <nav aria-label="Navegación principal" className="flex gap-1 overflow-x-auto px-2 py-2 xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-y-auto xl:overflow-x-hidden xl:px-3 xl:py-4">
        {NAV.map(renderLink)}
        {rol === 'DOCENTE' && renderLink({ href: '/mi-paad', label: 'Mi PAAD' })}
        {['UAP', 'DIRECCION_CARRERA', 'ADMINISTRADOR'].includes(rol) && renderLink({ href: '/paads', label: 'PAAD' })}
        {rol === 'ADMINISTRADOR' && NAV_ADMIN.map(renderLink)}
      </nav>

      <div className="shrink-0 border-t border-border px-3 py-3 sm:px-4 xl:px-4 xl:py-4">
        <p className="truncate text-sm font-medium text-gray-200">{nombre}</p>
        <p className="truncate text-xs text-gray-500">{ROL_LABELS[rol] ?? rol}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/cambiar-password"
            className="rounded-lg border border-border px-2 py-2 text-center text-xs text-gray-300 transition-colors hover:bg-surface hover:text-white"
          >
            Cambiar contraseña
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg border border-border px-2 py-2 text-xs text-gray-300 transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
