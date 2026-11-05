import { useMemo } from 'react';
import { ROLES } from '../../data/mockData';

interface Props {
  role: string;
  page: string;
  onNavigate: (page: string) => void;
  cycle: number;
}

export function Sidebar({ role, page, onNavigate, cycle }: Props) {
  const items = useMemo(() => {
    const list = [
      ['home', '◫', 'Panel de Inicio'],
      ['planificaciones', '▤', 'Planificaciones (PAAC)'],
    ];
    if (role.startsWith('DOCENTE')) {
      list.push(['mi-paad', '▧', 'Mi PAAD Anual']);
    } else {
      list.push(['paads', '▧', 'Bandeja de PAADs']);
    }
    if (['DIRECCION_CARRERA', 'UAP', 'CONSEJO_DEPARTAMENTAL', 'ADMINISTRADOR'].includes(role)) {
      list.push(['anexo-v', '✓', 'Anexo V y Elevación']);
    }
    if (role === 'ADMINISTRADOR') {
      list.push(['admin-estructura', '▦', 'Estructura y Equipos']);
      list.push(['admin-usuarios', '◉', 'Usuarios y Accesos']);
    }
    return list;
  }, [role]);

  return (
    <aside className="w-full md:w-64 bg-sidebar border-b md:border-b-0 md:border-r border-border flex flex-col shrink-0 select-none">
      <div className="h-16 px-5 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-soft border border-primary/30 flex items-center justify-center font-serif font-bold text-primary text-lg shadow-sm">
          S
        </div>
        <div>
          <span className="font-bold text-ink text-base block leading-tight tracking-tight">SIIGPA</span>
          <span className="text-[10px] text-muted uppercase tracking-wider">Gestión de Planes · UNLaR</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted">
          {ROLES[role]}
        </div>
        {items.map(([pageId, icon, label]) => {
          const active = page === pageId;
          return (
            <button
              key={pageId}
              onClick={() => onNavigate(pageId)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                active
                  ? 'bg-soft text-primary font-semibold shadow-[inset_3px_0_0_var(--primary)]'
                  : 'text-muted hover:text-ink hover:bg-background'
              }`}
            >
              <span className="text-sm">{icon}</span>
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1.5 text-[11px] text-muted">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Normativa Vigente</div>
        <div>• Ord. HCS N° 171/2019</div>
        <div>• Ord. HCS N° 219/2022</div>
        <div>• Ord. HCS N° 448/2011</div>
        <div className="pt-2 text-[10px] font-semibold text-primary">DACEFyN · Ciclo Lectivo {cycle}</div>
      </div>
    </aside>
  );
}