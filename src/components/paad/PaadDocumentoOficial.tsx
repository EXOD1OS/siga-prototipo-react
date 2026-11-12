import { createPortal } from 'react-dom';
import { APARTADOS_PAAD, CAMPOS_ASPECTOS, NUMERO_DISTRIBUCION, TITULO_DISTRIBUCION } from '../../lib/paad';
import {
  ACTIVIDADES_PAAD,
  ACTIVIDAD_LABEL,
  DIAS_PAAD,
  DIA_LABEL,
  formatoHoras,
  type AspectosGeneralesPaad,
  type PaadContenido,
} from '../../types/paad';

interface Props {
  aspectos: AspectosGeneralesPaad;
  contenido: PaadContenido;
}

function Vinetas({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="ml-6 italic text-neutral-500">Sin actividades declaradas.</p>;
  return (
    <ul className="ml-10 list-disc space-y-0.5">
      {items.map((it, i) => (
        <li key={i} className="pl-1">
          {it}
        </li>
      ))}
    </ul>
  );
}

/**
 * Hoja A4 del ANEXO III – ORDENANZA Nº 171/19 (Plan Anual de Actividades del Docente).
 * Tipografía serif y tabla grillada en negro, como el documento oficial de la UNLaR.
 * Además monta una copia en <body> que es lo único que se imprime (ver index.css),
 * así la hoja sale completa aunque esté dentro de un modal con scroll.
 */
export function PaadDocumentoOficial(props: Props) {
  return (
    <>
      <Hoja {...props} />
      {createPortal(
        <div className="print-root" aria-hidden>
          <Hoja {...props} impresion />
        </div>,
        document.body
      )}
    </>
  );
}

function Hoja({ aspectos, contenido, impresion = false }: Props & { impresion?: boolean }) {
  return (
    <article
      aria-label={impresion ? undefined : 'Vista previa del PAAD – Anexo III, Ordenanza Nº 171/19'}
      className={`mx-auto w-full bg-white font-['Times_New_Roman',Times,serif] text-[12.5px] leading-[1.45] text-black ${
        impresion
          ? 'max-w-none px-[18mm] py-[14mm]'
          : 'max-w-[210mm] px-[14mm] py-[12mm] shadow-[0_8px_30px_rgba(0,0,0,0.18)] sm:min-h-[297mm] sm:px-[20mm] sm:py-[16mm]'
      }`}
    >
      {/* Encabezado oficial */}
      <header className="text-center">
        <img src="/unlar-escudo.png" alt="Escudo de la Universidad Nacional de La Rioja" className="mx-auto h-20 w-20 object-contain" />
        <p className="mt-2 text-[14px] font-bold tracking-wide">UNIVERSIDAD NACIONAL DE LA RIOJA</p>
        <p className="text-[13px] italic">Consejo Superior</p>
      </header>
      <div className="mt-3 text-right text-[11.5px]">
        <p className="italic">"2019-Año del 70º Aniversario de la Gratuidad de la Enseñanza Universitaria"</p>
        <p className="mt-1">LA RIOJA, 31 de julio de 2019.</p>
      </div>

      <div className="mx-auto mt-5 w-fit border-2 border-black px-8 py-2 text-center">
        <p className="text-[13px] font-bold">ANEXO III – ORDENANZA Nº 171/19</p>
        <p className="text-[13px] font-bold">PLAN ANUAL DE ACTIVIDADES DEL DOCENTE</p>
      </div>

      {/* Aspectos generales */}
      <section className="mt-6">
        <p className="font-bold underline">ASPECTOS GENERALES</p>
        <dl className="mt-2 space-y-0.5">
          {CAMPOS_ASPECTOS.map(({ key, label }) => (
            <div key={key} className="flex gap-1.5">
              <dt className="shrink-0 font-bold">{label}:</dt>
              <dd>{aspectos[key] || '..........................................'}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-5 text-justify italic">
        Estimado profesor: Detalle las actividades que planifica llevar a cabo durante el presente año lectivo, de acuerdo con los
        siguientes aspectos y en función de su categoría y dedicación.
      </p>

      {/* Apartados 1) a 7) */}
      <div className="mt-4 space-y-4">
        {APARTADOS_PAAD.map((ap) => (
          <section key={ap.id} className="break-inside-avoid-page">
            <p className="font-bold">
              {ap.numero}) {ap.titulo}
            </p>
            <div className="mt-1.5 space-y-2">
              {ap.subapartados.map((sub) => (
                <div key={sub.titulo}>
                  {sub.letra && (
                    <p className="ml-4 font-bold">
                      {sub.letra}) {sub.titulo}
                    </p>
                  )}
                  {sub.listas.map((l) => (
                    <div key={l.key} className="mt-1">
                      {sub.listas.length > 1 && <p className="ml-6 italic">{l.etiqueta}:</p>}
                      <Vinetas items={contenido.listas[l.key]} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Distribución horaria */}
      <section className="mt-6 break-inside-avoid-page">
        <p className="font-bold">
          {NUMERO_DISTRIBUCION}) {TITULO_DISTRIBUCION}
        </p>
        <table className="mt-2 w-full border-collapse border border-black text-center text-[12px]">
          <thead>
            <tr>
              <th scope="col" className="border border-black px-2 py-1 text-left font-bold">
                Actividad
              </th>
              {DIAS_PAAD.map((d) => (
                <th key={d} scope="col" className="border border-black px-2 py-1 font-bold">
                  {DIA_LABEL[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIVIDADES_PAAD.map((a) => (
              <tr key={a}>
                <th scope="row" className="border border-black px-2 py-1 text-left font-normal">
                  {ACTIVIDAD_LABEL[a]}
                </th>
                {DIAS_PAAD.map((d) => (
                  <td key={d} className="h-7 border border-black px-2 py-1">
                    {formatoHoras(contenido.horas[a][d])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Firma */}
      <div className="mt-16 flex justify-end print:mt-20">
        <div className="w-56 border-t border-black pt-1 text-center text-[11.5px]">
          Firma y aclaración del docente
          <div className="mt-0.5 font-bold">{aspectos.presentadoPor}</div>
        </div>
      </div>
    </article>
  );
}

/** Botón de impresión (imprime solo la hoja del documento). */
export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
        <path d="M7 8V3.75h10V8M7 17H5.5A2.5 2.5 0 0 1 3 14.5v-4A2.5 2.5 0 0 1 5.5 8h13a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-2.5 2.5H17" />
        <path d="M7 14h10v6.25H7z" />
      </svg>
      Imprimir / Guardar PDF
    </button>
  );
}
