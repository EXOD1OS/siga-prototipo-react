// Utilidades del texto enriquecido de los campos narrativos (PAAC).
// El HTML se guarda ya saneado: solo párrafos, saltos, negrita, cursiva, subrayado y listas, sin atributos.

const ETIQUETAS: Record<string, string> = {
  P: 'p',
  BR: 'br',
  STRONG: 'strong',
  B: 'strong',
  EM: 'em',
  I: 'em',
  U: 'u',
  UL: 'ul',
  OL: 'ol',
  LI: 'li',
};
/** Bloques que se convierten en párrafo. */
const BLOQUES = new Set(['DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TR', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'PRE']);
/** Contenido que se descarta por completo. */
const DESCARTAR = new Set(['SCRIPT', 'STYLE', 'META', 'TITLE', 'HEAD', 'LINK', 'NOSCRIPT', 'TEMPLATE', 'IFRAME', 'OBJECT', 'SVG', 'IMG', 'XML']);
const INLINE = new Set(['strong', 'em', 'u', 'br']);

function limpiarNodo(nodo: Node, doc: Document, destino: Node) {
  if (nodo.nodeType === Node.TEXT_NODE) {
    destino.appendChild(doc.createTextNode((nodo.textContent ?? '').replace(/ /g, ' ')));
    return;
  }
  if (nodo.nodeType !== Node.ELEMENT_NODE) return;
  const el = nodo as Element;
  const tag = el.tagName.toUpperCase();
  if (DESCARTAR.has(tag) || tag.includes(':')) return; // incluye etiquetas de Word como <o:p>
  const mapeada = ETIQUETAS[tag] ?? (BLOQUES.has(tag) ? 'p' : null);
  if (!mapeada) {
    // Etiqueta no permitida (span, font, a…): se conserva solo su contenido.
    el.childNodes.forEach((h) => limpiarNodo(h, doc, destino));
    return;
  }
  const nuevo = doc.createElement(mapeada);
  if (mapeada !== 'br') el.childNodes.forEach((h) => limpiarNodo(h, doc, nuevo));
  destino.appendChild(nuevo);
}

/** Agrupa el texto suelto del primer nivel en párrafos y quita párrafos vacíos. */
function normalizar(raiz: HTMLElement, doc: Document) {
  const hijos = Array.from(raiz.childNodes);
  raiz.innerHTML = '';
  let parrafo: HTMLElement | null = null;
  for (const h of hijos) {
    const tag = h.nodeType === Node.ELEMENT_NODE ? (h as Element).tagName.toLowerCase() : '#text';
    if (tag === '#text' || INLINE.has(tag)) {
      if (tag === '#text' && !(h.textContent ?? '').trim() && !parrafo) continue;
      parrafo ??= doc.createElement('p');
      parrafo.appendChild(h);
    } else {
      if (parrafo) raiz.appendChild(parrafo);
      parrafo = null;
      raiz.appendChild(h);
    }
  }
  if (parrafo) raiz.appendChild(parrafo);
  raiz.querySelectorAll('p, li, strong, em, u').forEach((e) => {
    if (!(e.textContent ?? '').trim() && !e.querySelector('br')) e.remove();
  });
  raiz.querySelectorAll('ul, ol').forEach((l) => {
    if (!l.querySelector('li')) l.remove();
  });
}

/** Devuelve un HTML seguro con las etiquetas permitidas. */
export function sanitizarHtml(html: string): string {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') return escaparHtml(html.replace(/<[^>]*>/g, ''));
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const raiz = doc.createElement('div');
  doc.body.childNodes.forEach((n) => limpiarNodo(n, doc, raiz));
  normalizar(raiz, doc);
  return raiz.innerHTML;
}

export function escaparHtml(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Texto plano pegado → HTML: líneas en blanco separan párrafos,
 * líneas con "-", "•" o "*" forman viñetas y "1." o "1)" listas numeradas.
 */
export function textoPlanoAHtml(texto: string): string {
  const lineas = texto.replace(/\r\n?/g, '\n').split('\n');
  const partes: string[] = [];
  let parrafo: string[] = [];
  let lista: { tipo: 'ul' | 'ol'; items: string[] } | null = null;
  const cerrarParrafo = () => {
    if (parrafo.length) partes.push(`<p>${parrafo.join('<br>')}</p>`);
    parrafo = [];
  };
  const cerrarLista = () => {
    if (lista) partes.push(`<${lista.tipo}>${lista.items.map((i) => `<li>${i}</li>`).join('')}</${lista.tipo}>`);
    lista = null;
  };
  for (const linea of lineas) {
    const vin = linea.match(/^\s*[-•*·▪]\s+(.*)$/);
    const num = linea.match(/^\s*\d+[.)]\s+(.*)$/);
    if (vin || num) {
      cerrarParrafo();
      const tipo = vin ? 'ul' : 'ol';
      if (lista && lista.tipo !== tipo) cerrarLista();
      lista ??= { tipo, items: [] };
      lista.items.push(escaparHtml((vin ?? num)![1].trim()));
    } else if (!linea.trim()) {
      cerrarParrafo();
      cerrarLista();
    } else {
      cerrarLista();
      parrafo.push(escaparHtml(linea.trim()));
    }
  }
  cerrarParrafo();
  cerrarLista();
  return partes.join('');
}

/** true si el HTML tiene algún texto visible. */
export function htmlTieneTexto(html: string | undefined): boolean {
  return !!html && html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() !== '';
}

/** Texto plano corto → párrafo HTML (para migrar datos anteriores). */
export const parrafo = (t: string | undefined) => (t && t.trim() ? `<p>${escaparHtml(t.trim())}</p>` : '');

/** Clases de lectura para HTML enriquecido (Tailwind quita los estilos de listas por defecto). */
export const CLASES_RICH =
  '[&_p]:mb-1.5 [&>*:last-child]:mb-0 [&_ul]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-0.5 [&_strong]:font-bold [&_em]:italic [&_u]:underline';
