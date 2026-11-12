import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { StatusBadge } from '../shared/StatusBadge';
import { IconDocs } from '../layout/icons';
import { AvisoEstado, avisoDeDocumento } from '../shared/AvisoEstado';
import { BadgeObservaciones, BarraPresentacion } from '../shared/EdicionDocumento';
import { PanelRevision, type InfoRevision } from '../shared/PanelRevision';
import { esReenvio } from '../../lib/revision';
import { ObservationFieldWrapper } from '../shared/ObservationFieldWrapper';
import { FichaAspectos, InfoTip, ListaItems, MatrizHorasPaad, SelectorCatedraPaad, TablaCatedrasPaad } from './CamposPaad';
import { BotonImprimir, PaadDocumentoOficial } from './PaadDocumentoOficial';
import { APARTADOS_PAAD, NUMERO_DISTRIBUCION, TITULO_DISTRIBUCION, totalHoras, validarPaad, type CatedraPaad } from '../../lib/paad';
import { paadVacio, type AspectosGeneralesPaad, type ListaPaad, type PaadContenido } from '../../types/paad';
import type { DocumentoEditable } from '../../types/planificacion';

interface PaadEditorProps {
  d: DocumentoEditable;
  docenteNombre: string;
  role: string;
  canEdit: boolean;
  canSubmit: boolean;
  canObserve: boolean;
  /** Cátedras del docente en el ciclo: el mismo PAAD se proyecta en cada una. */
  catedras: CatedraPaad[];
  /** Cátedra con la que se abre la proyección (contexto de origen o la de su Dirección). */
  catedraInicial: string | null;
  /** Aspectos Generales proyectados para una cátedra (ver getDynamicPaadHeader). */
  aspectosDe: (asignaturaId: string | null) => AspectosGeneralesPaad;
  /** El docente está viendo su propio PAAD ("Mi PAAD Anual"). */
  esPropio: boolean;
  /** Cierre de revisión para UAP / Dirección (null si la sesión no revisa). */
  revision: InfoRevision | null;
  onBack: () => void;
  onUpdatePaad: (c: PaadContenido) => void;
  onSaveDraft: () => void;
  onSubmitDoc: () => void;
  onAddObs: (fKey: string, path: string, txt: string, secIdx: number) => void;
  onResolveObs: (obsId: string) => void;
  /** UAP / Dirección / Admin eliminan una observación propia. */
  onDeleteObs: (obsId: string) => void;
}

type Vista = 'form' | 'preview';
/** Índice de observaciones: 0 = Aspectos generales, 1–7 = apartados, 8 = distribución horaria. */
const SEC_HORAS = NUMERO_DISTRIBUCION;

export function PaadEditor({
  d,
  docenteNombre,
  role,
  canEdit,
  canSubmit,
  canObserve,
  catedras,
  catedraInicial,
  aspectosDe,
  esPropio,
  revision,
  onBack,
  onUpdatePaad,
  onSaveDraft,
  onSubmitDoc,
  onAddObs,
  onResolveObs,
  onDeleteObs,
}: PaadEditorProps) {
  const [vista, setVista] = useState<Vista>('form');
  const [intento, setIntento] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const problemasRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  const contenido = d.paad ?? paadVacio();
  // Cátedra con la que se proyectan los Aspectos Generales; los apartados 1) a 8) no cambian.
  const [asigVista, setAsigVista] = useState<string | null>(catedraInicial);
  const aspectos = aspectosDe(asigVista);
  const selector = (sufijo: string, etiqueta: string) => (
    <SelectorCatedraPaad id={`${uid}-catedra-${sufijo}`} etiqueta={etiqueta} catedras={catedras} value={asigVista} onChange={setAsigVista} />
  );
  const problemas = validarPaad(contenido, d.comments);

  const setLista = (key: ListaPaad, items: string[]) => onUpdatePaad({ ...contenido, listas: { ...contenido.listas, [key]: items } });

  const ir = (id: string) => document.getElementById(`${uid}-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const presentar = () => {
    if (problemas.length > 0) {
      setIntento(true);
      setConfirmar(false);
      requestAnimationFrame(() => problemasRef.current?.focus());
      return;
    }
    if (!confirmar) {
      setConfirmar(true);
      return;
    }
    setConfirmar(false);
    setIntento(false);
    onSubmitDoc();
  };

  const aviso = avisoDeDocumento({
    d,
    tipo: 'PAAD',
    canEdit,
    canObserve,
    esDocente: role.startsWith('DOCENTE'),
    pendientes: d.comments.filter((o) => !o.resolved).length,
  });

  const obsDe = (key: string) => d.comments.filter((o) => o.field === key);
  const obsPendientesSec = (sec: number) => d.comments.filter((o) => !o.resolved && o.section === sec).length;
  const obsTotalesSec = (sec: number) => d.comments.filter((o) => o.section === sec).length;

  const indice = [
    { id: 'aspectos', label: 'Aspectos generales', n: null as number | null, sec: 0 },
    ...APARTADOS_PAAD.map((ap) => ({
      id: ap.id,
      label: `${ap.numero}) ${ap.titulo.charAt(0)}${ap.titulo.slice(1).toLowerCase()}`,
      n: ap.subapartados.reduce((s, sub) => s + sub.listas.reduce((t, l) => t + contenido.listas[l.key].length, 0), 0),
      sec: ap.numero,
    })),
    { id: 'horas', label: `${NUMERO_DISTRIBUCION}) Distribución horaria`, n: totalHoras(contenido), sec: SEC_HORAS },
  ];

  // Progreso: apartados 1) a 8) con al menos un ítem (o, en el 8, al menos una hora cargada).
  const apartados = indice.filter((it) => it.n !== null);
  const completados = apartados.filter((it) => (it.n ?? 0) > 0).length;
  const pct = Math.round((completados / apartados.length) * 100);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const next: Vista = vista === 'form' ? 'preview' : 'form';
      setVista(next);
      document.getElementById(`${uid}-tab-${next}`)?.focus();
    }
  };

  const estadoGuardado = d.sinGuardar ? 'Cambios sin guardar' : d.guardadoEn ? `Borrador guardado · ${d.guardadoEn}` : 'Sin cambios pendientes';

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="no-print flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2.5">
            <StatusBadge state={d.state} />
            <span className="text-xs text-muted">Anexo III – Ordenanza Nº 171/19 · Ciclo {d.cycle}</span>
          </div>
          <h1 className="text-2xl font-bold text-ink">Plan Anual de Actividades del Docente</h1>
          <p className="mt-0.5 text-xs text-muted">{docenteNombre}</p>
        </div>
        <button type="button" onClick={onBack} className="self-start rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-ink transition-colors hover:bg-background sm:self-auto">
          ← Volver
        </button>
      </div>

      {/* Pestañas */}
      <div role="tablist" aria-label="Modo de visualización del PAAD" className="no-print inline-flex rounded-xl border border-border bg-background p-1 text-xs">
        {(
          [
            ['form', canEdit ? 'Formulario' : 'Detalle'],
            ['preview', 'Vista previa documento / PDF'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            id={`${uid}-tab-${key}`}
            type="button"
            role="tab"
            aria-selected={vista === key}
            tabIndex={vista === key ? 0 : -1}
            onClick={() => setVista(key)}
            onKeyDown={onTabKey}
            className={`rounded-lg px-4 py-2 font-semibold transition-all duration-200 ${
              vista === key ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {vista === 'preview' ? (
        <div className="space-y-4">
          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">Así se verá el documento oficial con los datos cargados. Para PDF, elegí “Guardar como PDF” al imprimir.</p>
            <BotonImprimir />
          </div>
          <div className="no-print rounded-xl border border-border bg-surface px-4 py-3">{selector('preview', 'Previsualizar Aspectos Generales según Cátedra:')}</div>
          <div className="rounded-2xl bg-[#e6e8ec] p-3 sm:p-8 print:bg-transparent print:p-0">
            <PaadDocumentoOficial aspectos={aspectos} contenido={contenido} />
          </div>
        </div>
      ) : (
        <>
          {esPropio && (
            <div role="note" className="flex items-start gap-3 rounded-xl border border-border bg-soft px-4 py-3 text-xs text-ink">
              <IconDocs className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="leading-relaxed">
                Este PAAD (Puntos 1 al 8) es único para todo el Ciclo Lectivo y se vincula automáticamente a todas las asignaturas y carreras en las que
                participás. Los Aspectos Generales (Carrera, Asignatura, Plan y Función en la cátedra) se generan dinámicamente para cada materia a
                partir de tu designación en el Equipo de Cátedra y el PAAC correspondiente.
              </p>
            </div>
          )}

          {aviso && (
            <AvisoEstado tono={aviso.tono} titulo={aviso.titulo} etiqueta={aviso.etiqueta}>
              {aviso.texto}
            </AvisoEstado>
          )}

          {intento && problemas.length > 0 && (
            <div ref={problemasRef} tabIndex={-1} role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 outline-none">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">No se puede presentar todavía:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-ink">
                {problemas.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Índice */}
            <nav aria-label="Apartados del PAAD" className="space-y-1 rounded-xl border border-border bg-surface p-3 shadow-sm lg:sticky lg:top-20 lg:col-span-3">
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Apartados</div>
              {indice.map((it) => {
                const obs = obsPendientesSec(it.sec);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => ir(it.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-background hover:text-ink ${
                      obs > 0 ? 'font-medium text-amber-700 dark:text-amber-300' : 'text-muted'
                    }`}
                  >
                    <span className="truncate">{it.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <BadgeObservaciones pendientes={obs} total={obsTotalesSec(it.sec)} />
                      {it.n !== null && (
                        <span
                          className={`min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums ${
                            it.n > 0 ? 'bg-soft text-primary' : 'bg-background text-muted'
                          }`}
                        >
                          {it.id === 'horas' ? `${it.n} hs` : it.n}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}

              {/* Progreso de completitud */}
              <div className="mt-2 border-t border-border px-2.5 pt-3">
                <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="text-muted">Campos completados</span>
                  <span className="tabular-nums">
                    <strong className={pct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink'}>{pct}%</strong>
                    <span className="ml-1 text-[10px] text-muted">
                      {completados}/{apartados.length} apartados
                    </span>
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Progreso del PAAD"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  aria-valuetext={`${completados} de ${apartados.length} apartados con contenido`}
                  className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                >
                  <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out dark:bg-teal-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </nav>

            <div className="space-y-5 lg:col-span-9">
              {/* Aspectos generales: datos del docente + proyección por cátedra */}
              <section id={`${uid}-aspectos`} className="scroll-mt-24 space-y-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
                <div>
                  <h2 className="text-sm font-bold text-ink">Aspectos Generales</h2>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Se generan para cada asignatura a partir de la designación en el Equipo de Cátedra. Elegí una cátedra para ver cómo se presenta el PAAD en ella.
                  </p>
                </div>

                <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
                  {(
                    [
                      ['Docente', docenteNombre],
                      ['DNI', aspectos.dni],
                      ['Ciclo lectivo', String(d.cycle)],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="bg-surface px-4 py-2.5">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">{k}</dt>
                      <dd className="mt-0.5 text-xs font-medium text-ink">{v || '—'}</dd>
                    </div>
                  ))}
                </dl>

                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted">Asignaturas atendidas en el ciclo</h3>
                  <TablaCatedrasPaad catedras={catedras} activa={asigVista} onElegir={setAsigVista} />
                </div>

                <div className="space-y-2 rounded-xl border border-border bg-background p-3">
                  {selector('form', 'Previsualizar Aspectos Generales según Cátedra:')}
                  <FichaAspectos aspectos={aspectos} />
                </div>
              </section>
              {/* Apartados 1) a 7) */}
              {APARTADOS_PAAD.map((ap) => (
                <section key={ap.id} id={`${uid}-${ap.id}`} className="scroll-mt-24 rounded-xl border border-border bg-surface p-5 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-[11px] text-white">{ap.numero}</span>
                    {ap.titulo}
                    {!ap.subapartados[0].letra && <InfoTip titulo={ap.titulo} texto={ap.subapartados[0].info} />}
                  </h2>
                  {ap.subapartados.map((sub) => {
                    const fKey = sub.letra ? `${ap.id}.${sub.letra}` : ap.id;
                    return (
                      <ObservationFieldWrapper
                        key={fKey}
                        fKey={fKey}
                        label={
                          sub.letra ? (
                            <span className="flex items-start gap-2">
                              <span>
                                {sub.letra}) {sub.titulo}
                              </span>
                              <InfoTip titulo={sub.titulo} texto={sub.info} />
                            </span>
                          ) : null
                        }
                        campoPath={`paad.${fKey}`}
                        notes={obsDe(fKey)}
                        canEdit={canEdit}
                        canObserve={canObserve}
                        role={role}
                        onAddObs={(k, path, txt) => onAddObs(k, path, txt, ap.numero)}
                        onResolveObs={onResolveObs}
                        onDeleteObs={onDeleteObs}
                      >
                        <div className="space-y-4">
                          {sub.listas.map((l) => (
                            <ListaItems
                              key={l.key}
                              etiqueta={sub.listas.length > 1 ? l.etiqueta : undefined}
                              items={contenido.listas[l.key]}
                              placeholder={l.placeholder}
                              editable={canEdit}
                              onChange={(items) => setLista(l.key, items)}
                            />
                          ))}
                        </div>
                      </ObservationFieldWrapper>
                    );
                  })}
                </section>
              ))}

              {/* 8) Distribución horaria (mismo encabezado numerado que los apartados 1 a 7) */}
              <section id={`${uid}-horas`} className="scroll-mt-24 rounded-xl border border-border bg-surface p-5 shadow-sm">
                <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-ink">
                  <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-[11px] text-white">
                    {NUMERO_DISTRIBUCION}
                  </span>
                  <span className="sr-only">{NUMERO_DISTRIBUCION}) </span>
                  {TITULO_DISTRIBUCION}
                </h2>
                <p className="mb-4 text-[11px] text-muted">Cargá las horas semanales que dedicás a cada actividad por día. Los subtotales se calculan automáticamente.</p>
                <ObservationFieldWrapper
                  fKey="horas"
                  label={null}
                  campoPath="paad.distribucionHoraria"
                  notes={obsDe('horas')}
                  canEdit={canEdit}
                  canObserve={canObserve}
                  role={role}
                  onAddObs={(k, path, txt) => onAddObs(k, path, txt, SEC_HORAS)}
                  onResolveObs={onResolveObs}
                  onDeleteObs={onDeleteObs}
                >
                  <MatrizHorasPaad horas={contenido.horas} editable={canEdit} onChange={(horas) => onUpdatePaad({ ...contenido, horas })} />
                </ObservationFieldWrapper>
              </section>
            </div>
          </div>

          {/* Barra de acciones */}
          {canEdit && (
            <BarraPresentacion
              tipo="PAAD"
              sinGuardar={d.sinGuardar}
              estadoGuardado={estadoGuardado}
              problemas={problemas.length}
              reenvio={esReenvio(d)}
              canSubmit={canSubmit}
              confirmar={confirmar}
              onCancelar={() => setConfirmar(false)}
              onPresentar={presentar}
              onPreview={() => setVista('preview')}
              onSaveDraft={onSaveDraft}
            />
          )}

          {/* Decisión de UAP / Dirección */}
          {revision && (
            <div className="no-print sticky bottom-4 z-30">
              <PanelRevision revision={revision} tipo="PAAD" variante="barra" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
