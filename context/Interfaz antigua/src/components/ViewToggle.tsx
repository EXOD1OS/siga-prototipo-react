'use client';

import { useState } from 'react';

export function ViewToggle({ form, document }: { form: React.ReactNode; document: React.ReactNode }) {
  const [mode, setMode] = useState<'FORM' | 'DOC'>('FORM');

  return (
    <div>
      <div className="no-print flex gap-1 mb-4">
        <button
          type="button"
          onClick={() => setMode('FORM')}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            mode === 'FORM' ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border text-gray-400 hover:text-gray-200'
          }`}
        >
          Formulario
        </button>
        <button
          type="button"
          onClick={() => setMode('DOC')}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            mode === 'DOC' ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border text-gray-400 hover:text-gray-200'
          }`}
        >
          Documento
        </button>
      </div>
      {mode === 'FORM' ? form : document}
    </div>
  );
}
