// Réplica de las hojas institucionales de los informes del PAAC (Ord. HCS N° 219/2022 – UNLaR):
// Anexo IV (Informe Disciplinar, Dirección de Carrera) y Anexo III (Informe Pedagógico, UAP).
// Los estilos viven en CSS_INFORME (no en Tailwind) para que la vista previa, la impresión
// y la impresión sean idénticas en cualquier tema de la app.
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { LEMA_ANUAL } from '../../lib/paac';
import {
  encabezadoInforme,
  integrantesEquipo,
  sugerirInformeDisciplinar,
  sugerirInformePedagogico,
  type DocPaadResumen,
} from '../../lib/informes';
import type { AsigContext, EquipoCatedra } from '../../types/estructura';
import type { PaacDoc } from '../../types/planificacion';
import type { InformeDisciplinarDatos, InformePedagogicoDatos, ItemValorado } from '../../types/informes';

export type TipoInforme = 'disciplinar' | 'pedagogico';

export const TITULO_INFORME: Record<TipoInforme, string> = {
  disciplinar: 'Informe Disciplinar',
  pedagogico: 'Informe Pedagógico',
};

type Encabezado = ReturnType<typeof encabezadoInforme>;
type Integrante = { docenteId: string; nombre: string; cargo: string };

export interface DatosHojaComun {
  encabezado: Encabezado;
  ciclo: number;
  /** Firmante y fecha del informe emitido. */
  firmante?: string;
  fecha?: string;
}

/** Escudo institucional (public/). */
export const ESCUDO_SRC = '/unlar-escudo.png';

export const CSS_INFORME = `
.inf-doc{background:#fff;color:#0f172a;font-family:'Times New Roman',Times,serif;font-size:12px;line-height:1.4}
.inf-doc *{box-sizing:border-box}
.inf-doc table{border-collapse:collapse;width:100%}
.inf-doc .inf-membrete td{border:1px solid #000;padding:6px 8px;vertical-align:middle;text-align:center}
.inf-doc .inf-escudo{display:flex;align-items:center;gap:8px;text-align:left}
.inf-doc .inf-escudo img{width:56px;height:56px;object-fit:contain;flex:none}
.inf-doc .inf-escudo p{margin:0;font-size:10.5px;line-height:1.3}
.inf-doc .inf-escudo .inf-univ{font-weight:700;font-size:12px;letter-spacing:.02em}
.inf-doc .inf-lema{font-style:italic;font-size:10.5px}
.inf-doc .inf-centro p{margin:0}
.inf-doc .inf-titulo{margin:18px 0 12px;text-align:center;font-size:15px;font-weight:700;text-decoration:underline;text-underline-offset:3px}
.inf-doc .inf-meta{margin:0 0 12px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:12px}
.inf-doc .inf-meta dt{font-weight:700}
.inf-doc .inf-meta dd{margin:0}
.inf-doc .inf-equipo{margin:0;padding-left:16px}
.inf-doc .inf-grilla{font-family:Arial,Helvetica,sans-serif;font-size:10.5px;border:1px solid #000}
.inf-doc .inf-grilla th,.inf-doc .inf-grilla td{border:1px solid #000;padding:4px 5px;vertical-align:top}
.inf-doc .inf-grilla th{background:#e5e7eb;font-weight:700;text-align:center;vertical-align:middle}
.inf-doc .inf-grilla td.inf-c{text-align:center;vertical-align:middle}
.inf-doc .inf-grilla td.inf-item{font-weight:700;background:#f8fafc;width:13%}
.inf-doc .inf-grilla ul{margin:0;padding-left:12px}
.inf-doc .inf-grilla tr{break-inside:avoid}
.inf-doc .inf-notas{margin:10px 0 0;padding:0;list-style:none;font-size:9.5px;line-height:1.35}
.inf-doc .inf-notas li{margin-top:2px}
.inf-doc .inf-firma{margin-top:40px;display:flex;justify-content:flex-end}
.inf-doc .inf-firma div{min-width:260px;border-top:1px solid #000;padding-top:4px;text-align:center;font-size:11px}
.inf-doc .inf-firma p{margin:0}
.inf-doc .inf-vacio{color:#64748b;font-style:italic}
@media print{
  @page inf-apaisada{size:A4 landscape;margin:10mm}
  .inf-doc{page:inf-apaisada;width:auto;max-width:none;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important}
}
`;

const v = (x: string | undefined) => (x && x.trim() ? x : <span className="inf-vacio">—</span>);
const valorado = (i: ItemValorado) => (i.texto ? `${i.valor}. ${i.texto}` : i.valor);

/** Cargo abreviado como en los modelos impresos ("Prof. Titular", "Prof. JTP"…). */
const ABREVIATURAS: [RegExp, string][] = [
  [/^Profesor(a)? /i, 'Prof. '],
  [/^Jefe de Trabajos Prácticos/i, 'Prof. JTP'],
  [/^Ayudante de Primera/i, 'Ayte. de 1ra'],
  [/^Ayudante de Segunda/i, 'Ayte. de 2da'],
];
const cargoCorto = (c: string) => ABREVIATURAS.reduce((acc, [re, r]) => acc.replace(re, r), c);

function Membrete({ variante, ciclo }: { variante: TipoInforme; ciclo: number }) {
  return (
    <table className="inf-membrete border border-black">
      <tbody>
        <tr>
          <td style={{ width: '38%' }}>
            <div className="inf-escudo">
              <img src={ESCUDO_SRC} alt="Escudo de la Universidad Nacional de La Rioja" />
              <div>
                {variante === 'disciplinar' ? (
                  <>
                    <p>Ministerio de Educación</p>
                    <p className="inf-univ">UNIVERSIDAD NACIONAL DE LA RIOJA</p>
                    <p>CONSEJO SUPERIOR</p>
                  </>
                ) : (
                  <>
                    <p className="inf-univ">Departamento Académico de Ciencias Exactas, Físicas y Naturales</p>
                    <p>Universidad Nacional de La Rioja</p>
                  </>
                )}
              </div>
            </div>
          </td>
          <td className="inf-centro">
            <p>
              <strong>Ord. HCS N° 219/2022</strong>
            </p>
            <p>{variante === 'disciplinar' ? 'Anexo IV' : 'Anexo III'}</p>
          </td>
          <td style={{ width: '32%' }}>
            <p className="inf-lema">{LEMA_ANUAL[ciclo] ?? ''}</p>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Firma({ linea, firmante, fecha }: { linea: string; firmante?: string; fecha?: string }) {
  return (
    <div className="inf-firma">
      <div>
        {firmante && <p>{firmante}</p>}
        <p>
          <strong>{linea}</strong>
        </p>
        {fecha && <p>La Rioja, {fecha}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Anexo IV — Informe Disciplinar
// ---------------------------------------------------------------------------

export const NOTAS_DISCIPLINAR = [
  '¹ PAAD plan de actividad anual docente, que deben ser presentados por todos los integrantes del equipo de cátedra - para cada integrante: Presentó - No Presentó',
  '² Para comentario sobre las presentaciones que tengan observaciones para ser corregidas por los responsables',
  '³ En esta columna se determinará si el PAAC cumple con los contenidos mínimos de la Ord. C.S. del plan de estudio. Cumple - No Cumple',
  '⁴ Trabajos prácticos, se debe establecer una equidad en relación a los contenidos teóricos y laboratorio y estar relacionados a las actividades disciplinares. Los trabajos de campo o viajes de estudios deben ser presentados con objetivos, tiempo aproximado y lugar. Acordes - No Acorde',
  '⁵ Presenta bibliografía básica, es la bibliografía obligatoria para el estudiante, debe poseer actualizada y clásica y la complementaria - Presenta - No Presenta',
];

export function HojaInformeDisciplinar({ comun, datos, obs }: { comun: DatosHojaComun; datos: InformeDisciplinarDatos; obs: string }) {
  const { encabezado: e } = comun;
  return (
    <div className="inf-doc">
      <Membrete variante="disciplinar" ciclo={comun.ciclo} />
      <h1 className="inf-titulo">Informe Disciplinar presentado por la Dirección de Carrera</h1>
      <dl className="inf-meta">
        <dt>Sede:</dt>
        <dd>{e.sede}</dd>
        <dt>Carrera:</dt>
        <dd>{e.carrera}</dd>
        <dt>Plan de Estudios:</dt>
        <dd>{e.plan}</dd>
        <dt>Año Académico:</dt>
        <dd>{e.anio}</dd>
      </dl>

      <table className="inf-grilla border-collapse border border-black text-xs font-sans">
        <thead>
          <tr>
            <th rowSpan={3} style={{ width: '14%' }}>
              Asignatura
            </th>
            <th colSpan={6}>ANÁLISIS PAAC</th>
            <th rowSpan={3} style={{ width: '20%' }}>
              PAAD¹
            </th>
            <th rowSpan={3} style={{ width: '22%' }}>
              Observación²
            </th>
          </tr>
          <tr>
            <th rowSpan={2}>Contenidos³</th>
            <th colSpan={3}>Trabajos Prácticos⁴</th>
            <th colSpan={2}>Bibliografía⁵</th>
          </tr>
          <tr>
            <th>Lab.</th>
            <th>TP</th>
            <th>Campo</th>
            <th>Compl.</th>
            <th>Básica</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>{e.asignatura}</strong>
            </td>
            <td className="inf-c">{v(datos.contenidos)}</td>
            <td className="inf-c">{v(datos.tpLab)}</td>
            <td className="inf-c">{v(datos.tp)}</td>
            <td className="inf-c">{v(datos.tpCampo)}</td>
            <td className="inf-c">{v(datos.bibComplementaria)}</td>
            <td className="inf-c">{v(datos.bibBasica)}</td>
            <td>
              {datos.paads.length ? (
                <ul>
                  {datos.paads.map((p) => (
                    <li key={p.docenteId}>
                      {p.nombre}: <strong>{p.valor}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="inf-vacio">Sin equipo de cátedra cargado.</span>
              )}
            </td>
            <td>{v(obs)}</td>
          </tr>
        </tbody>
      </table>

      <ul className="inf-notas">
        {NOTAS_DISCIPLINAR.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>

      <Firma linea={`Dirección de Carrera · ${e.carrera}`} firmante={comun.firmante} fecha={comun.fecha} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Anexo III — Informe Pedagógico
// ---------------------------------------------------------------------------

export function HojaInformePedagogico({
  comun,
  datos,
  obs,
  equipo,
}: {
  comun: DatosHojaComun;
  datos: InformePedagogicoDatos;
  obs: string;
  equipo: Integrante[];
}) {
  const { encabezado: e } = comun;
  const generales: [string, string][] = [
    ['Introducción', valorado(datos.introduccion)],
    ['Diagnóstico', valorado(datos.diagnostico)],
    ['Objetivos / Propósito / RA', datos.objetivos],
    ['Clase', datos.clase],
    ['Recursos Didácticos', datos.recursos],
  ];
  const curriculares: [string, string, string, string][] = [
    ['Contenidos', datos.contenidos, 'Evaluación inicial, Formativa y Sumativa', datos.evaluacion],
    ['Trabajos Prácticos', datos.tp, 'Régimen Aprobación', datos.regimen],
    ['Trabajos Prácticos de Laboratorio', datos.tpLab, 'Horarios', datos.horarios],
    ['Trabajos Campo', datos.tpCampo, 'Distribución Horaria', datos.distribucion],
    ['', '', '', ''],
  ];

  return (
    <div className="inf-doc">
      <Membrete variante="pedagogico" ciclo={comun.ciclo} />
      <h1 className="inf-titulo">Informe Pedagógico presentado por la Unidad de Asesoramiento Pedagógico</h1>
      <dl className="inf-meta">
        <dt>Sede:</dt>
        <dd>{e.sede}</dd>
        <dt>Carrera:</dt>
        <dd>{e.carrera}</dd>
        <dt>Plan de Estudios Ord. C.S. N°:</dt>
        <dd>{e.plan}</dd>
        <dt>Año Académico:</dt>
        <dd>{e.anio}</dd>
        <dt>Equipo de cátedra:</dt>
        <dd>
          {equipo.length ? (
            <ul className="inf-equipo">
              {equipo.map((i) => (
                <li key={i.docenteId}>
                  {cargoCorto(i.cargo)}: {i.nombre}
                </li>
              ))}
            </ul>
          ) : (
            <span className="inf-vacio">Sin equipo de cátedra cargado.</span>
          )}
        </dd>
      </dl>

      <table className="inf-grilla border-collapse border border-black text-xs">
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: '13%' }}>
              ASIGNATURA
            </th>
            <th colSpan={2}>ASPECTOS GENERALES</th>
            <th colSpan={4}>ASPECTOS CURRICULARES</th>
          </tr>
          <tr>
            <th>Ítem</th>
            <th>Análisis</th>
            <th>Ítem</th>
            <th>Análisis</th>
            <th>Ítem</th>
            <th>Análisis</th>
          </tr>
        </thead>
        <tbody>
          {generales.map(([item, analisis], i) => {
            const [c1, a1, c2, a2] = curriculares[i];
            return (
              <tr key={item}>
                {i === 0 && (
                  <td rowSpan={generales.length}>
                    <strong>{e.asignatura}</strong>
                    <br />
                    {e.anioCursada}
                    <br />
                    {e.regimen}
                    <br />
                    {e.cargaHoraria}
                  </td>
                )}
                <td className="inf-item">{item}</td>
                <td>{v(analisis)}</td>
                <td className="inf-item">{c1}</td>
                <td>{c1 ? v(a1) : ''}</td>
                <td className="inf-item">{c2}</td>
                <td>{c2 ? v(a2) : ''}</td>
              </tr>
            );
          })}
          <tr>
            <td colSpan={7}>
              <strong>Observación:</strong> {v(obs)}
            </td>
          </tr>
        </tbody>
      </table>

      <Firma linea="Unidad de Asesoramiento Pedagógico del DACEFyN" firmante={comun.firmante} fecha={comun.fecha} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Armado de la hoja a partir del PAAC
// ---------------------------------------------------------------------------

export interface FuenteHojaInforme {
  d: PaacDoc;
  ctx: AsigContext;
  equipo: EquipoCatedra[];
  /** Documentos del sistema (estado de los PAAD del equipo, si el informe no lo guardó). */
  docs: DocPaadResumen[];
  fullName: (id: string) => string;
}

/** Un informe se considera presentado cuando su dictamen favorable quedó firme. */
export const informePresentado = (d: Pick<PaacDoc, 'discApproved' | 'pedApproved'>, tipo: TipoInforme) =>
  tipo === 'disciplinar' ? d.discApproved : d.pedApproved;

/** Hoja oficial con los datos guardados; si el informe es anterior al modelo oficial, usa el autocompletado. */
export function hojaInforme(tipo: TipoInforme, f: FuenteHojaInforme): ReactElement {
  const { d, ctx, equipo, docs, fullName } = f;
  const informe = tipo === 'disciplinar' ? d.discReport : d.pedReport;
  const comun: DatosHojaComun = { encabezado: encabezadoInforme(ctx, d.cycle), ciclo: d.cycle, firmante: informe?.by, fecha: informe?.fecha };
  if (tipo === 'disciplinar') {
    const datos = informe?.disciplinar ?? sugerirInformeDisciplinar({ d, equipo, docs, fullName });
    return <HojaInformeDisciplinar comun={comun} datos={datos} obs={informe?.obsDisciplinares ?? ''} />;
  }
  const datos = informe?.pedagogico ?? sugerirInformePedagogico(d);
  return <HojaInformePedagogico comun={comun} datos={datos} obs={informe?.obsGenerales ?? ''} equipo={integrantesEquipo(equipo, fullName)} />;
}

// Botones de la vista de informes (clases pedidas + foco visible).
// `border-primary/30` no se genera porque `primary` es una variable CSS sin canal alfa: se suma un color-mix equivalente.
const foco = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
export const BTN_VER_PDF = `px-3 py-1.5 rounded-lg bg-soft hover:bg-primary text-primary hover:text-white border border-primary/30 border-[color-mix(in_srgb,var(--primary)_30%,transparent)] text-xs font-semibold transition ${foco}`;
export const BTN_DESCARGAR_PDF = `px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition shadow-sm ${foco}`;
export const BTN_VOLVER_DIGITAL = `px-3 py-1.5 rounded-lg bg-surface hover:bg-background border border-border text-ink text-xs font-semibold transition ${foco}`;

/** Abre el diálogo de impresión con la hoja montada por <HojaOficial> («Guardar como PDF»). */
export const imprimirInforme = () => window.print();

/**
 * Hoja oficial A4 del informe. Siempre monta la copia de impresión en <body> (ver index.css),
 * así «Descargar PDF» funciona aunque la hoja no esté a la vista; `visible` muestra la vista previa.
 */
export function HojaOficial({ tipo, fuente, visible }: { tipo: TipoInforme; fuente: FuenteHojaInforme; visible: boolean }) {
  const hoja = hojaInforme(tipo, fuente);
  return (
    <>
      <style>{CSS_INFORME}</style>
      {visible && (
        <div className="overflow-x-auto rounded-xl bg-slate-200 p-3 dark:bg-slate-800 sm:p-6">
          <div className="mx-auto min-w-[56rem] max-w-5xl border border-slate-300 bg-white p-8 font-serif text-slate-900 shadow-2xl">{hoja}</div>
        </div>
      )}
      {createPortal(
        <div className="print-root" aria-hidden>
          {hoja}
        </div>,
        document.body
      )}
    </>
  );
}