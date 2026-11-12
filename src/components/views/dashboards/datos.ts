// Datos y navegación comunes a los dashboards de Inicio.
import { armarAspectosPaac, paacDesdeDatosAnteriores, progresoPaac } from '../../../lib/paac';
import type { AreaRevision } from '../../../lib/revision';
import type { AsigContext, Carrera, EquipoCatedra, Usuario } from '../../../types/estructura';
import type { InformeEvaluacion, ObservacionDoc, PaacDoc } from '../../../types/planificacion';
import type { FiltrosPaac, FiltrosPaad } from '../../../types/navegacion';
import { COLOR, pct, type CatedraTarjeta, type ModoMatriz } from './DashboardKit';

/** PAAD tal como lo necesitan los dashboards. */
export interface PaadFila {
  id: string;
  owner: string;
  state: string;
  cycle: number;
  /** Dirección de Carrera que evalúa el PAAD (es el filtro de carrera de la bandeja de PAAD). */
  evalCareer?: string;
  comments: ObservacionDoc[];
}

export interface NavDashboard {
  goToPlanificaciones: (f?: FiltrosPaac) => void;
  goToPaads: (f?: FiltrosPaad) => void;
  onOpenDoc: (id: string) => void;
  onOpenReport: (id: string) => void;
}

export interface DatosDashboard {
  nombre: string;
  ciclo: number;
  paacs: PaacDoc[];
  paads: PaadFila[];
  carreras: Carrera[];
  usuarios: Usuario[];
  equipos: EquipoCatedra[];
  asigContext: (id: string) => AsigContext;
  fullName: (id: string) => string;
}

export const ESTADOS_REVISION_PAAC = ['ENVIADO_A_REVISION', 'APROBADO_PEDAGOGICO', 'APROBADO_DISCIPLINAR'];
export const ESTADOS_FAVORABLES = ['APROBADO_PLENO', 'ELEVADO_AL_CONSEJO', 'FINALIZADO'];

export const contar = <T,>(lista: T[], pred: (x: T) => boolean) => lista.filter(pred).length;

/** PAAC de una carrera. */
export const paacsDe = (paacs: PaacDoc[], carreraId: string, asigContext: (id: string) => AsigContext) =>
  paacs.filter((d) => asigContext(d.asignaturaId).carrera?.id === carreraId);

/** Conteo de PAAD por estado. */
export function estadosPaad(paads: PaadFila[]) {
  return {
    borrador: contar(paads, (d) => d.state === 'BORRADOR'),
    revision: contar(paads, (d) => d.state === 'ENVIADO_A_REVISION'),
    observado: contar(paads, (d) => d.state === 'OBSERVADO'),
    aprobado: contar(paads, (d) => d.state === 'APROBADO'),
  };
}

/** Plan de estudios vigente de la carrera (para el encabezado de cada fila). */
export const ordenanzaDe = (paacs: PaacDoc[], carreraId: string, asigContext: (id: string) => AsigContext) =>
  paacs.map((d) => asigContext(d.asignaturaId)).find((c) => c.carrera?.id === carreraId)?.plan?.ordenanza;

function estadoArea(aprobado: boolean, informe: InformeEvaluacion | undefined, comments: ObservacionDoc[], area: AreaRevision) {
  if (aprobado) return 'aprobado' as const;
  if (informe?.dictamen === 'OBSERVADO' || comments.some((o) => !o.resolved && o.area === area)) return 'observado' as const;
  return 'pendiente' as const;
}

const REGIMEN: Record<string, string> = { '1C': '1C', '2C': '2C', ANUAL: 'Anual' };

export const COLOR_ESTADO_PAAC = (state: string) =>
  ESTADOS_FAVORABLES.includes(state) ? COLOR.aprobado : ESTADOS_REVISION_PAAC.includes(state) ? COLOR.revision : state === 'OBSERVADO' ? COLOR.observado : COLOR.pendiente;

/** Datos de una tarjeta de cátedra (SelectableCatedraCard). */
export function tarjetaDe(d: PaacDoc, datos: DatosDashboard): CatedraTarjeta {
  const ctx = datos.asigContext(d.asignaturaId);
  const contenido = d.paac ?? paacDesdeDatosAnteriores(d.data);
  const aspectos = armarAspectosPaac({ asignaturaId: d.asignaturaId, contenido, ciclo: d.cycle, usuarios: datos.usuarios, equipos: datos.equipos, asigContext: datos.asigContext });
  return {
    id: d.id,
    state: d.state,
    asignatura: ctx.asig?.nombre ?? d.asignaturaId,
    carrera: ctx.carrera?.sigla,
    ordenanza: ctx.plan?.ordenanza,
    regimen: ctx.asig ? REGIMEN[ctx.asig.regimenDictado] : undefined,
    responsable: datos.fullName(d.owner),
    avance: progresoPaac(contenido, aspectos, ctx.plan?.enfoque === 'COMPETENCIAS'),
    pendientes: d.comments.filter((o) => !o.resolved).length,
    uap: estadoArea(d.pedApproved, d.pedReport, d.comments, 'uap'),
    direccion: estadoArea(d.discApproved, d.discReport, d.comments, 'direccion'),
    conInformes: d.pedApproved || d.discApproved,
    acento: COLOR_ESTADO_PAAC(d.state),
  };
}

/**
 * Comparativa por carrera con dos modos (PAAC / PAAD), una métrica a la vez.
 * Celdas: No presentados · En revisión · Observados · Aprobados, cada una abre el listado filtrado.
 */
export function modosPorCarrera(opts: {
  datos: DatosDashboard;
  paacs: PaacDoc[];
  paads: PaadFila[];
  nav: NavDashboard;
  ciclo: number;
  /** % de avance de la fila PAAC (ej. con dictamen UAP o disciplinar). */
  avancePaac: (lista: PaacDoc[]) => number;
  /** Filas sin navegación (ej. carreras ajenas a la Dirección). */
  soloConsulta?: (carreraId: string) => string | undefined;
}): ModoMatriz[] {
  const { datos, paacs, paads, nav, ciclo, avancePaac, soloConsulta } = opts;
  const filasPaac = datos.carreras.map((c) => {
    const l = paacsDe(paacs, c.id, datos.asigContext);
    const fc = { ciclo, careerId: c.id };
    return {
      carrera: c,
      ordenanza: ordenanzaDe(paacs, c.id, datos.asigContext),
      avance: avancePaac(l),
      soloConsulta: soloConsulta?.(c.id),
      celdas: [
        { key: 'borrador', label: 'No presentados', valor: contar(l, (d) => d.state === 'BORRADOR'), color: COLOR.pendiente, onClick: () => nav.goToPlanificaciones({ ...fc, state: 'BORRADOR' }) },
        { key: 'revision', label: 'En revisión', valor: contar(l, (d) => ESTADOS_REVISION_PAAC.includes(d.state)), color: COLOR.revision, onClick: () => nav.goToPlanificaciones({ ...fc, state: 'ENVIADO_A_REVISION' }) },
        { key: 'observado', label: 'Observados', valor: contar(l, (d) => d.state === 'OBSERVADO'), color: COLOR.observado, onClick: () => nav.goToPlanificaciones({ ...fc, state: 'OBSERVADO' }) },
        { key: 'aprobado', label: 'Aprobados', valor: contar(l, (d) => ESTADOS_FAVORABLES.includes(d.state)), color: COLOR.aprobado, onClick: () => nav.goToPlanificaciones({ ...fc, vista: 'historicas' }) },
      ],
    };
  });
  const filasPaad = datos.carreras.map((c) => {
    const l = paads.filter((d) => d.evalCareer === c.id);
    const e = estadosPaad(l);
    return {
      carrera: c,
      ordenanza: ordenanzaDe(paacs, c.id, datos.asigContext),
      avance: pct(e.aprobado, l.length),
      soloConsulta: soloConsulta?.(c.id),
      celdas: [
        { key: 'borrador', label: 'No presentados', valor: e.borrador, color: COLOR.pendiente, onClick: () => nav.goToPaads({ careerId: c.id, state: 'BORRADOR' }) },
        { key: 'revision', label: 'En revisión', valor: e.revision, color: COLOR.revision, onClick: () => nav.goToPaads({ careerId: c.id, state: 'ENVIADO_A_REVISION' }) },
        { key: 'observado', label: 'Observados', valor: e.observado, color: COLOR.observado, onClick: () => nav.goToPaads({ careerId: c.id, state: 'OBSERVADO' }) },
        { key: 'aprobado', label: 'Aprobados', valor: e.aprobado, color: COLOR.aprobado, onClick: () => nav.goToPaads({ careerId: c.id, state: 'APROBADO' }) },
      ],
    };
  });
  return [
    { key: 'paac', label: 'Planificaciones PAAC', unidad: 'PAAC', total: paacs.length, filas: filasPaac },
    { key: 'paad', label: 'Planes Anuales PAAD', unidad: 'PAAD', total: paads.length, filas: filasPaad },
  ];
}
