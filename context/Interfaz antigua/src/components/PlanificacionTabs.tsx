'use client';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setDocumentType, type PlanifTab } from '@/redux/slices/planificationSlice';

export interface TabDef {
  key: PlanifTab;
  label: string;
  pendientes?: number;
  content: React.ReactNode;
}

export function PlanificacionTabs({ tabs }: { tabs: TabDef[] }) {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((s) => s.planification.currentDocumentType);
  const active = tabs.some((t) => t.key === activeTab) ? activeTab : tabs[0]?.key;

  return (
    <div>
      <div className="no-print flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => dispatch(setDocumentType(tab.key))}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              active === tab.key ? 'text-primary border-primary' : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            {tab.label}
            {!!tab.pendientes && tab.pendientes > 0 && (
              <span className="ml-2 inline-flex items-center justify-center text-[10px] bg-danger/20 text-red-300 border border-danger/40 rounded-full px-1.5 py-0.5">
                {tab.pendientes}
              </span>
            )}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div key={tab.key} className={active === tab.key ? 'block' : 'hidden'}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
