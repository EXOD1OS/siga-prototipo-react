import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CLASES_RICH, htmlTieneTexto, sanitizarHtml } from '../../lib/richText';
import { LEMA_ANUAL, TITULOS_PAAC, totalesCronograma, type AspectosPaac } from '../../lib/paac';
import { DIAS_PAAD, DIA_LABEL } from '../../types/paad';
import {
  COMPETENCIAS_GENERALES,
  FILAS_HORARIO,
  FILA_HORARIO_LABEL,
  GRUPO_CG_LABEL,
  NIVELES_APORTE,
  type BloqueBibliografia,
  type GrupoCompetencia,
  type NivelAporte,
  type PaacContenido,
} from '../../types/paac';

interface Props {
  aspectos: AspectosPaac;
  contenido: PaacContenido;
  ciclo: number;
  porCompetencias: boolean;
}

/**
 * Documento institucional del PAAC en hojas A4 (tipografía serif y tablas grilladas en negro).
 * Igual que el PAAD, monta una copia en <body> que es lo único que se imprime (ver index.css).
 */
export function PaacDocumentoOficial(props: Props) {
  return (
    <>
      <Hojas {...props} />
      {createPortal(
        <div className="print-root" aria-hidden>
          <Hojas {...props} impresion />
        </div>,
        document.body
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Piezas tipográficas
// ---------------------------------------------------------------------------

const td = 'border border-black px-1.5 py-1 align-top';
const th = 'border border-black px-1.5 py-1 font-bold';

function Rico({ html }: { html: string }) {
  if (!htmlTieneTexto(html)) return <p className="italic text-neutral-500">Sin completar.</p>;
  return <div className={`text-justify ${CLASES_RICH}`} dangerouslySetInnerHTML={{ __html: sanitizarHtml(html) }} />;
}

function Titulo({ n, children }: { n: number; children?: ReactNode }) {
  const t = TITULOS_PAAC.find((x) => x.numero === n);
  return (
    <h2 className="mb-2 mt-5 break-after-avoid border-b border-black pb-0.5 text-[13px] font-bold">
      {n}. {children ?? t?.titulo}
    </h2>
  );
}

function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className="mb-1 mt-3 break-after-avoid font-bold underline">{children}</h3>;
}

function Tabla({ head, children, className = '' }: { head: ReactNode; children: ReactNode; className?: string }) {
  return (
    <table className={`mt-1 w-full border-collapse border border-black text-[11px] [&_tr]:break-inside-avoid ${className}`}>
      <thead className="bg-neutral-200">{head}</thead>
      <tbody>{children}</tbody>
    </table>
  );
}

const SinFilas = ({ cols }: { cols: number }) => (
  <tr>
    <td colSpan={cols} className={`${td} text-center italic text-neutral-500`}>
      Sin datos cargados.
    </td>
  </tr>
);

const Marca = ({ valor, n }: { valor: NivelAporte | null | undefined; n: NivelAporte }) => (
  <td className={`${td} w-14 text-center align-middle font-bold`}>{valor === n ? 'X' : ''}</td>
);

function Encabezado({ aspectos, ciclo }: { aspectos: AspectosPaac; ciclo: number }) {
  return (
    <table className="w-full border-collapse border border-black text-center">
      <tbody>
        <tr>
          <td className="w-[20%] border border-black p-2 align-middle">
            <img src="/unlar-escudo.png" alt="Escudo de la Universidad Nacional de La Rioja" className="mx-auto h-16 w-16 object-contain" />
          </td>
          <td className="border border-black p-2 align-middle">
            <p className="text-[14px] font-bold uppercase tracking-wide">Universidad Nacional de La Rioja</p>
            <p className="mt-0.5 text-[12px]">{aspectos.departamentoEncabezado || 'Departamento Académico'}</p>
          </td>
          <td className="w-[32%] border border-black p-2 align-middle text-[10.5px]">
            <p className="italic">{LEMA_ANUAL[ciclo] ?? ''}</p>
            <p className="mt-1 font-bold">
              Planificación Ciclo lectivo {ciclo} - {aspectos.asignatura}
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Hoja({ children, impresion, ultima = false }: { children: ReactNode; impresion: boolean; ultima?: boolean }) {
  return (
    <article
      className={`mx-auto w-full bg-white font-['Times_New_Roman',Times,serif] text-[12px] leading-[1.45] text-black ${
        impresion
          ? `max-w-none px-[16mm] py-[12mm] ${ultima ? '' : 'break-after-page'}`
          : 'max-w-[210mm] px-[12mm] py-[12mm] shadow-[0_8px_30px_rgba(0,0,0,0.18)] sm:min-h-[297mm] sm:px-[18mm] sm:py-[15mm]'
      }`}
    >
      {children}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Documento
// ---------------------------------------------------------------------------

function Hojas({ aspectos, contenido: c, ciclo, porCompetencias, impresion = false }: Props & { impresion?: boolean }) {
  const totales = totalesCronograma(c.cronograma);
  const filasAspectos: [string, ReactNode][] = [
    ['Sede / Delegación', aspectos.sede],
    ['Departamento Académico', aspectos.departamento],
    ['Carrera', aspectos.carrera],
    ['Plan de Estudio Ordenanza N°', aspectos.planOrdenanza],
    ['Asignatura', aspectos.asignatura],
    ['Curso / Año', aspectos.curso],
    ['Régimen', aspectos.regimen],
    ['Crédito Horario', aspectos.creditoHorario],
    [
      'Equipo de Cátedra',
      aspectos.equipo.length ? (
        <ul>
          {aspectos.equipo.map((e) => (
            <li key={e.docenteId}>
              {e.cargo}: {e.nombre}
            </li>
          ))}
        </ul>
      ) : (
        ''
      ),
    ],
    ['Contenidos Mínimos', <span className="block text-justify">{aspectos.contenidosMinimos}</span>],
    ['Nivel de Intensidad', aspectos.nivelIntensidad ? `Nivel ${aspectos.nivelIntensidad}` : ''],
    ['Relación Teórica Práctica', aspectos.relacionTP],
  ];

  return (
    <div className={impresion ? '' : 'space-y-6'}>
      {/* Hoja 1: Aspectos generales */}
      <Hoja impresion={impresion}>
        <Encabezado aspectos={aspectos} ciclo={ciclo} />
        <p className="mt-6 text-center text-[14px] font-bold uppercase">Programa de Actividades Académicas de la Cátedra (PAAC)</p>
        <p className="mb-4 text-center text-[12px]">Ciclo lectivo {ciclo}</p>
        <Tabla
          head={
            <tr>
              <th colSpan={2} className={`${th} text-center`}>
                ASPECTOS GENERALES
              </th>
            </tr>
          }
        >
          {filasAspectos.map(([k, v]) => (
            <tr key={k}>
              <th scope="row" className={`${th} w-[34%] bg-neutral-100 text-left`}>
                {k}
              </th>
              <td className={td}>{v || '..........................................'}</td>
            </tr>
          ))}
        </Tabla>
      </Hoja>

      {/* Hojas siguientes: desarrollo */}
      <Hoja impresion={impresion} ultima>
        <Encabezado aspectos={aspectos} ciclo={ciclo} />

        <Titulo n={1} />
        <Subtitulo>Importancia de la asignatura en el Plan de Estudios</Subtitulo>
        <Rico html={c.importancia} />

        {porCompetencias && (
          <>
            <Subtitulo>Relación de la asignatura con las Competencias de Egreso de la Carrera</Subtitulo>
            <p className="text-[11px] italic">
              Codificación: 0: Ninguna (No contribuye) | 1: Baja (Contribuye en alguna medida / sirve de fundamento) | 2: Media (Contribuye de manera
              significativa) | 3: Alta (Tributa directamente a la competencia).
            </p>
            <Tabla
              head={
                <tr>
                  <th className={`${th} text-left`}>COMPETENCIAS GENERALES</th>
                  {NIVELES_APORTE.map((n) => (
                    <th key={n} className={`${th} w-14 text-center`}>
                      NIVEL {n}
                    </th>
                  ))}
                </tr>
              }
            >
              {(['tecnologicas', 'sociales'] as GrupoCompetencia[]).flatMap((g) => [
                <tr key={g}>
                  <th colSpan={5} className={`${th} bg-neutral-100 text-left uppercase`}>
                    {GRUPO_CG_LABEL[g].replace('Competencias ', '')}
                  </th>
                </tr>,
                ...COMPETENCIAS_GENERALES.filter((x) => x.grupo === g).map((x) => (
                  <tr key={x.codigo}>
                    <td className={td}>
                      <strong>{x.codigo}:</strong> {x.texto}
                    </td>
                    {NIVELES_APORTE.map((n) => (
                      <Marca key={n} n={n} valor={c.competenciasGenerales[x.codigo]} />
                    ))}
                  </tr>
                )),
              ])}
            </Tabla>

            <Tabla
              className="mt-3"
              head={
                <tr>
                  <th className={`${th} w-16 text-center`}>N°</th>
                  <th className={`${th} text-left`}>COMPETENCIAS ESPECÍFICAS</th>
                  {NIVELES_APORTE.map((n) => (
                    <th key={n} className={`${th} w-14 text-center`}>
                      NIVEL {n}
                    </th>
                  ))}
                </tr>
              }
            >
              {c.competenciasEspecificas.length === 0 && <SinFilas cols={6} />}
              {c.competenciasEspecificas.map((e) => (
                <tr key={e.id}>
                  <td className={`${td} text-center font-bold`}>{e.codigo}</td>
                  <td className={td}>{e.detalle}</td>
                  {NIVELES_APORTE.map((n) => (
                    <Marca key={n} n={n} valor={e.nivel} />
                  ))}
                </tr>
              ))}
            </Tabla>
          </>
        )}

        <Titulo n={2} />
        {(
          [
            ['Articulación con las asignaturas correlativas', c.diagnostico.correlativas],
            ['Articulación con las materias del mismo año', c.diagnostico.mismoAnio],
            ['Análisis de los estudiantes', c.diagnostico.estudiantes],
            ['Infraestructura requerida', c.diagnostico.infraestructura],
          ] as const
        ).map(([t, h]) => (
          <div key={t}>
            <Subtitulo>{t}</Subtitulo>
            <Rico html={h} />
          </div>
        ))}

        <Titulo n={3} />
        <Subtitulo>Objetivos de la Carrera</Subtitulo>
        <Rico html={c.objetivosCarrera} />
        <Subtitulo>Propósito de la Asignatura</Subtitulo>
        <Rico html={c.proposito} />
        <Subtitulo>Resultados de Aprendizaje</Subtitulo>
        {c.resultados.length ? (
          <ul className="space-y-0.5">
            {c.resultados.map((r) => (
              <li key={r.id} className="text-justify">
                <strong>{r.codigo}:</strong> {r.descripcion}
              </li>
            ))}
          </ul>
        ) : (
          <p className="italic text-neutral-500">Sin completar.</p>
        )}

        <Titulo n={4} />
        <Subtitulo>Metodología de Enseñanza</Subtitulo>
        <Rico html={c.metodologia} />
        <Subtitulo>Propuesta para el desarrollo de las competencias</Subtitulo>
        <Tabla
          head={
            <tr>
              {['Competencia', 'Resultado de Aprendizaje', 'Unidades / Temas', 'Guía de T.P.', 'Actividad Formativa', 'Estrategia de Enseñanza'].map((h) => (
                <th key={h} className={`${th} text-center`}>
                  {h}
                </th>
              ))}
            </tr>
          }
        >
          {c.propuesta.length === 0 && <SinFilas cols={6} />}
          {c.propuesta.map((p) => (
            <tr key={p.id}>
              {[p.competencia, p.ra, p.unidades, p.guiaTp, p.actividad, p.estrategia].map((v, i) => (
                <td key={i} className={`${td} whitespace-pre-wrap`}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </Tabla>

        <Titulo n={5} />
        <Subtitulo>Contenidos Mínimos</Subtitulo>
        <p className="text-justify">{aspectos.contenidosMinimos}</p>
        {c.unidades.map((u) => (
          <div key={u.id} className="break-inside-avoid-page">
            <Subtitulo>
              Unidad N° {u.numero}: {u.titulo}
            </Subtitulo>
            <Rico html={u.contenidos} />
            {u.resultados && (
              <p className="mt-0.5">
                <strong>Resultados de aprendizaje:</strong> {u.resultados}
              </p>
            )}
          </div>
        ))}

        <Titulo n={6} />
        {htmlTieneTexto(c.tpIntro) && <Rico html={c.tpIntro} />}
        <Tabla
          className="mt-2"
          head={
            <tr>
              {['T.P. N°', 'Título', 'Propósito', 'Modalidad', 'Unidad / Temas'].map((h) => (
                <th key={h} className={`${th} text-center`}>
                  {h}
                </th>
              ))}
            </tr>
          }
        >
          {c.trabajosPracticos.length === 0 && <SinFilas cols={5} />}
          {c.trabajosPracticos.map((t) => (
            <tr key={t.id}>
              <td className={`${td} w-12 text-center font-bold`}>{t.numero}</td>
              <td className={td}>{t.titulo}</td>
              <td className={`${td} whitespace-pre-wrap`}>{t.proposito}</td>
              <td className={td}>{t.modalidad}</td>
              <td className={td}>{t.unidadTemas}</td>
            </tr>
          ))}
        </Tabla>

        <Titulo n={7} />
        {htmlTieneTexto(c.evalDescripcion) && <Rico html={c.evalDescripcion} />}
        <Tabla
          className="mt-2"
          head={
            <tr>
              {['Tipo de Evaluación', 'Criterios de Evaluación', 'RA N°', 'Técnica e Instrumento de Evaluación'].map((h) => (
                <th key={h} className={`${th} text-center`}>
                  {h}
                </th>
              ))}
            </tr>
          }
        >
          {c.evaluacion.length === 0 && <SinFilas cols={4} />}
          {c.evaluacion.map((e) => (
            <tr key={e.id}>
              <td className={`${td} w-24`}>{e.tipo}</td>
              <td className={`${td} whitespace-pre-wrap`}>{e.criterios}</td>
              <td className={`${td} w-16 text-center`}>{e.ra}</td>
              <td className={`${td} whitespace-pre-wrap`}>{e.tecnica}</td>
            </tr>
          ))}
        </Tabla>
        <Subtitulo>Régimen de Aprobación</Subtitulo>
        {(
          [
            ['a) Alumnos Promocionales', c.regimen.promocionales],
            ['b) Alumnos Regulares', c.regimen.regulares],
            ['c) Alumnos Libres', c.regimen.libres],
          ] as const
        ).map(([t, h]) => (
          <div key={t} className="mt-1.5">
            <p className="font-bold italic">{t}</p>
            <Rico html={h} />
          </div>
        ))}

        <Titulo n={8} />
        <TablasBibliografia titulo="Bibliografía Básica" bloque={c.bibliografia.basica} />
        <TablasBibliografia titulo="Bibliografía Complementaria" bloque={c.bibliografia.complementaria} />

        <Titulo n={9} />
        <Subtitulo>Horarios de Clases</Subtitulo>
        <Tabla
          head={
            <tr>
              <th className={th} />
              {DIAS_PAAD.map((d) => (
                <th key={d} className={`${th} text-center`}>
                  {DIA_LABEL[d].toUpperCase()}
                </th>
              ))}
            </tr>
          }
        >
          {FILAS_HORARIO.map((f) => (
            <tr key={f}>
              <th scope="row" className={`${th} bg-neutral-100 text-left uppercase`}>
                {FILA_HORARIO_LABEL[f]}
              </th>
              {DIAS_PAAD.map((d) => (
                <td key={d} className={`${td} h-8 whitespace-pre-wrap text-center`}>
                  {c.horarios[f][d]}
                </td>
              ))}
            </tr>
          ))}
        </Tabla>

        <Subtitulo>Cronograma</Subtitulo>
        <table className="mt-1 w-full border-collapse border border-black text-center text-[10.5px] [&_tr]:break-inside-avoid">
          <thead className="bg-neutral-200">
            <tr>
              <th rowSpan={2} className={th}>
                SEMANA N°
              </th>
              {['CLASES TEÓRICAS', 'CLASES PRÁCTICAS', 'CLASES DE LAB.', 'PRÁCTICAS DE CAMPO', 'EVALUACIONES PARCIALES'].map((h) => (
                <th key={h} colSpan={2} className={th}>
                  {h}
                </th>
              ))}
            </tr>
            <tr>
              {['Unidad N°', 'T.P. N°', 'T.P.L. N°', 'T.P.L. N°', 'Instancia'].map((h, i) => (
                <FilaSub key={i} etiqueta={h} />
              ))}
            </tr>
          </thead>
          <tbody>
            {c.cronograma.length === 0 && <SinFilas cols={11} />}
            {c.cronograma.map((s) => (
              <tr key={s.id}>
                {[s.semana, s.unidad, s.horasTeoria, s.tp, s.horasPractica, s.tpl, s.horasLab, s.tplCampo, s.horasCampo, s.evaluacion, s.horasEval].map((v, i) => (
                  <td key={i} className={`${td} ${i === 0 ? 'font-bold' : ''}`}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-neutral-100 font-bold">
              <td className={td}>TOTAL</td>
              <td className={td} />
              <td className={td}>{totales.horasTeoria || ''}</td>
              <td className={td} />
              <td className={td}>{totales.horasPractica || ''}</td>
              <td className={td} />
              <td className={td}>{totales.horasLab || ''}</td>
              <td className={td} />
              <td className={td}>{totales.horasCampo || ''}</td>
              <td className={td}>Total: {totales.total} hs</td>
              <td className={td}>{totales.horasEval || ''}</td>
            </tr>
          </tbody>
        </table>
        {c.notasCronograma && <p className="mt-1 whitespace-pre-wrap text-[10.5px] italic">Nota: {c.notasCronograma}</p>}

        <div className="mt-16 flex justify-end break-inside-avoid">
          <div className="w-60 border-t border-black pt-1 text-center text-[11px]">
            Firma y aclaración del Profesor Responsable
            <div className="mt-0.5 font-bold">{aspectos.equipo.find((e) => e.esResponsable)?.nombre}</div>
          </div>
        </div>
      </Hoja>
    </div>
  );
}

function FilaSub({ etiqueta }: { etiqueta: string }) {
  return (
    <>
      <th className={`${th} font-semibold`}>{etiqueta}</th>
      <th className={`${th} font-semibold`}>Horas</th>
    </>
  );
}

function TablasBibliografia({ titulo, bloque }: { titulo: string; bloque: BloqueBibliografia }) {
  return (
    <div className="mt-2">
      <Subtitulo>{titulo}</Subtitulo>
      <p className="mt-1 text-[11px] font-bold italic">Catálogo físico / Centros de Documentación UNLaR</p>
      <Tabla
        head={
          <tr>
            {['Título', 'Autores', 'Editorial', 'Ejemplares disponibles', 'Año de edición'].map((h) => (
              <th key={h} className={`${th} text-center`}>
                {h}
              </th>
            ))}
          </tr>
        }
      >
        {bloque.fisica.length === 0 && <SinFilas cols={5} />}
        {bloque.fisica.map((b) => (
          <tr key={b.id}>
            <td className={td}>{b.titulo}</td>
            <td className={td}>{b.autores}</td>
            <td className={td}>{b.editorial}</td>
            <td className={`${td} w-20 text-center`}>{b.ejemplares}</td>
            <td className={`${td} w-16 text-center`}>{b.anio}</td>
          </tr>
        ))}
      </Tabla>
      <p className="mt-2 text-[11px] font-bold italic">Plataforma digital / eLibro</p>
      <Tabla
        head={
          <tr>
            {['Título', 'Autores', 'Editorial', 'Enlace (URL)', 'Año de edición'].map((h) => (
              <th key={h} className={`${th} text-center`}>
                {h}
              </th>
            ))}
          </tr>
        }
      >
        {bloque.digital.length === 0 && <SinFilas cols={5} />}
        {bloque.digital.map((b) => (
          <tr key={b.id}>
            <td className={td}>{b.titulo}</td>
            <td className={td}>{b.autores}</td>
            <td className={td}>{b.editorial}</td>
            <td className={`${td} break-all text-[10px]`}>{b.url}</td>
            <td className={`${td} w-16 text-center`}>{b.anio}</td>
          </tr>
        ))}
      </Tabla>
    </div>
  );
}
