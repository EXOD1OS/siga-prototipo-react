'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin', label: 'Gestión Académica' },
  { href: '/admin/usuarios', label: 'Usuarios' },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones de administración" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-slate-950/40 p-1">
      {TABS.map((tab) => {
        const active = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-4 sm:text-sm ${
              active ? 'bg-primary/15 text-blue-100 shadow-inner shadow-blue-950/20' : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-100'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
