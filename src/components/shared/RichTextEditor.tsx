import { useEffect, useRef, useState, type ClipboardEvent, type ReactNode } from 'react';
import { CLASES_RICH, htmlTieneTexto, sanitizarHtml, textoPlanoAHtml } from '../../lib/richText';

type Comando = 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList';

const HERRAMIENTAS: { cmd: Comando; label: string; atajo?: string; icono: ReactNode }[] = [
  { cmd: 'bold', label: 'Negrita', atajo: 'Ctrl+B', icono: <span className="font-bold">B</span> },
  { cmd: 'italic', label: 'Cursiva', atajo: 'Ctrl+I', icono: <span className="font-serif italic">I</span> },
  { cmd: 'underline', label: 'Subrayado', atajo: 'Ctrl+U', icono: <span className="underline underline-offset-2">U</span> },
  {
    cmd: 'insertUnorderedList',
    label: 'Lista con viñetas',
    icono: (
      <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
        <path d="M8 5h9M8 10h9M8 15h9" strokeLinecap="round" />
        <circle cx="4" cy="5" r="1" fill="currentColor" />
        <circle cx="4" cy="10" r="1" fill="currentColor" />
        <circle cx="4" cy="15" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    cmd: 'insertOrderedList',
    label: 'Lista numerada',
    icono: <span className="text-[11px] font-bold tabular-nums">1.</span>,
  },
];

const SIN_ACTIVOS: Record<Comando, boolean> = {
  bold: false,
  italic: false,
  underline: false,
  insertUnorderedList: false,
  insertOrderedList: false,
};

interface Props {
  value: string;
  onChange: (html: string) => void;
  editable: boolean;
  /** Nombre accesible del área de edición. */
  ariaLabel: string;
  placeholder?: string;
  invalido?: boolean;
  /** Alto mínimo del área (clase Tailwind). */
  minH?: string;
}

/** Editor de texto enriquecido para los campos narrativos. En modo lectura muestra el texto con formato. */
export function RichTextEditor({ editable, ...props }: Props) {
  if (!editable) return <RichTextView html={props.value} vacio="Sin completar." />;
  return <EditorEditable {...props} />;
}

/** Muestra HTML enriquecido saneado. */
export function RichTextView({ html, vacio, className = '' }: { html: string; vacio?: string; className?: string }) {
  if (!htmlTieneTexto(html)) return vacio ? <p className="text-xs italic text-muted">{vacio}</p> : null;
  return (
    <div
      className={`text-xs leading-relaxed text-ink ${CLASES_RICH} ${className}`}
      // El contenido pasa por sanitizarHtml: solo etiquetas de formato, sin atributos.
      dangerouslySetInnerHTML={{ __html: sanitizarHtml(html) }}
    />
  );
}

function EditorEditable({ value, onChange, ariaLabel, placeholder = 'Escribí aquí…', invalido = false, minH = 'min-h-[110px]' }: Omit<Props, 'editable'>) {
  const ref = useRef<HTMLDivElement>(null);
  /** Último HTML emitido: evita reescribir el DOM (y mover el cursor) mientras se escribe. */
  const ultimo = useRef<string | null>(null);
  const [activos, setActivos] = useState(SIN_ACTIVOS);
  const [vacio, setVacio] = useState(!htmlTieneTexto(value));
  const [foco, setFoco] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || value === ultimo.current) return;
    el.innerHTML = sanitizarHtml(value);
    ultimo.current = value;
    setVacio(!htmlTieneTexto(value));
  }, [value]);

  useEffect(() => {
    if (!foco) return;
    const actualizar = () => {
      const sel = document.getSelection();
      if (!sel || !ref.current?.contains(sel.anchorNode)) return;
      setActivos(
        Object.fromEntries(HERRAMIENTAS.map((h) => [h.cmd, document.queryCommandState(h.cmd)])) as Record<Comando, boolean>
      );
    };
    document.addEventListener('selectionchange', actualizar);
    return () => document.removeEventListener('selectionchange', actualizar);
  }, [foco]);

  const emitir = () => {
    const el = ref.current;
    if (!el) return;
    const tieneTexto = htmlTieneTexto(el.innerHTML) || !!el.querySelector('li');
    if (!tieneTexto && el.innerHTML !== '') el.innerHTML = '';
    const html = tieneTexto ? sanitizarHtml(el.innerHTML) : '';
    ultimo.current = html;
    setVacio(!tieneTexto);
    onChange(html);
  };

  const aplicar = (cmd: Comando) => {
    ref.current?.focus();
    document.execCommand(cmd);
    emitir();
    setActivos((a) => ({ ...a, [cmd]: document.queryCommandState(cmd) }));
  };

  const pegar = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const texto = e.clipboardData.getData('text/plain');
    const limpio = html ? sanitizarHtml(html) : textoPlanoAHtml(texto);
    if (limpio) document.execCommand('insertHTML', false, limpio);
    emitir();
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-surface transition-colors ${
        invalido ? 'border-red-500' : foco ? 'border-primary' : 'border-border'
      }`}
    >
      <div role="toolbar" aria-label={`Formato de ${ariaLabel}`} className="flex flex-wrap items-center gap-0.5 border-b border-border bg-background px-1.5 py-1">
        {HERRAMIENTAS.map((h, i) => (
          <span key={h.cmd} className="flex items-center">
            {i === 3 && <span aria-hidden className="mx-1 h-4 w-px bg-border" />}
            <button
              type="button"
              aria-label={h.label}
              aria-pressed={activos[h.cmd]}
              title={h.atajo ? `${h.label} (${h.atajo})` : h.label}
              // mousedown evita que el botón robe la selección del texto.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => aplicar(h.cmd)}
              className={`flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                activos[h.cmd] ? 'bg-soft text-primary' : 'text-muted hover:bg-surface hover:text-ink'
              }`}
            >
              {h.icono}
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        {vacio && (
          <span aria-hidden className="pointer-events-none absolute left-3 top-2.5 text-xs text-muted">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel}
          aria-invalid={invalido || undefined}
          contentEditable
          suppressContentEditableWarning
          onInput={emitir}
          onPaste={pegar}
          onFocus={() => {
            setFoco(true);
            document.execCommand('defaultParagraphSeparator', false, 'p');
          }}
          onBlur={() => {
            setFoco(false);
            setActivos(SIN_ACTIVOS);
          }}
          className={`${minH} max-h-[420px] overflow-y-auto px-3 py-2.5 text-xs leading-relaxed text-ink outline-none ${CLASES_RICH}`}
        />
      </div>
    </div>
  );
}
