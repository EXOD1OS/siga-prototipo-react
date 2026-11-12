// Filtros con los que un dashboard abre los listados (deep-linking entre Inicio y las bandejas).

export interface FiltrosPaac {
  careerId?: string;
  state?: string;
  regimen?: string;
  search?: string;
  /** Ciclo lectivo (los dashboards cuentan sobre el ciclo vigente). */
  ciclo?: number;
  /** Pestaña del listado; si no se indica, se deduce del estado (históricos → "historicas"). */
  vista?: 'activas' | 'historicas';
}

export interface FiltrosPaad {
  /** Dirección evaluadora del PAAD. */
  careerId?: string;
  state?: string;
  search?: string;
}

/** Chip "Filtro aplicado desde Inicio": describe los filtros recibidos. */
export function describirFiltros(f: { careerId?: string; state?: string; regimen?: string; search?: string; ciclo?: number }, opts: {
  carreraSigla: (id: string) => string;
  estadoLabel: (s: string) => string;
}): string[] {
  const partes: string[] = [];
  if (f.careerId) partes.push(opts.carreraSigla(f.careerId));
  if (f.state) partes.push(opts.estadoLabel(f.state));
  if (f.regimen) partes.push(`Régimen ${f.regimen}`);
  if (f.ciclo) partes.push(`Ciclo ${f.ciclo}`);
  if (f.search) partes.push(`«${f.search}»`);
  return partes;
}
