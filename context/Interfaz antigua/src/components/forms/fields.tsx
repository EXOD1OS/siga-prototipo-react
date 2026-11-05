'use client';

export function TextField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input className="w-full" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="number"
        className="w-full"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  disabled,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <textarea className="w-full" rows={rows} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function ListField({
  label,
  value,
  onChange,
  disabled,
  rows = 3,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label} (uno por línea)</label>
      <textarea
        className="w-full"
        rows={rows}
        disabled={disabled}
        value={value.join('\n')}
        onChange={(e) => onChange(e.target.value.split('\n'))}
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select className="w-full" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxGroupField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string[];
  options: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(opt: string) {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  }

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            disabled={disabled}
            onClick={() => toggle(opt)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              value.includes(opt)
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-transparent border-border text-gray-400 hover:border-gray-500'
            }`}
          >
            {opt.replaceAll('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RepeatableList<T>({
  label,
  items,
  onChange,
  disabled,
  renderItem,
  newItem,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  disabled?: boolean;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  newItem: () => T;
}) {
  function updateAt(idx: number, patch: Partial<T>) {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function removeAt(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
            {renderItem(item, (patch) => updateAt(idx, patch), idx)}
            {!disabled && (
              <button type="button" onClick={() => removeAt(idx)} className="text-xs text-danger hover:underline">
                Eliminar
              </button>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-gray-600">Sin elementos cargados.</p>}
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={() => onChange([...items, newItem()])}
          className="text-xs text-primary hover:underline mt-2"
        >
          + Agregar
        </button>
      )}
    </div>
  );
}

export function KeyValueRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm py-1">
      <dt className="text-gray-500">{label}</dt>
      <dd className="col-span-2 text-gray-300">{value || <span className="text-gray-600">—</span>}</dd>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-gray-500 bg-surface border border-dashed border-border rounded-xl p-5">{message}</p>;
}

export function SectionCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border p-4 space-y-4 sm:p-5 ${className || 'bg-surface border-border'}`}>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}
