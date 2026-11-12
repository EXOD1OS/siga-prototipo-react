import { useState } from 'react';
import { StatusBadge } from '../shared/StatusBadge';

interface Props {
  paads: any[];
  role: string;
  carreras: any[];
  equiposCatedra: any[];
  cycle: number;
  fullName: (id: string) => string;
  asigContext: (id: string) => any;
  /** Abre el formulario completo del PAAD: allí UAP o Dirección lo observan o lo aprueban. */
  onOpenPaadDoc: (paadId: string) => void;
  onChangeEvalCareer: (paadId: string, newCareerId: string) => void;
}

const pendientesDe = (d: { comments?: { resolved: boolean }[] }) => d.comments?.filter((o) => !o.resolved).length ?? 0;

/**
 * Bandeja de PAAD (UAP y Dirección de Carrera). El PAAD no tiene doble conformidad:
 * con que una de las dos áreas lo apruebe queda Aprobado. Las decisiones se toman dentro del formulario.
 */
export function PaadsListView({ paads, role, carreras, equiposCatedra, cycle, fullName, asigContext, onOpenPaadDoc, onChangeEvalCareer }: Props) {
  const [search, setSearch] = useState('');
  const [filterCareer, setFilterCareer] = useState('ALL');
  const [filterState, setFilterState] = useState('ALL');

  const filtered = paads.filter((d) => {
    const misEq = equiposCatedra.filter((e) => e.docenteId === d.owner && e.cicloLectivo === cycle);
    const asigsNames = misEq.map((e) => asigContext(e.asignaturaId).asig?.nombre || '').join(' ');
    const teacherName = fullName(d.owner);

    // Filtro por búsqueda de texto (Docente o Asignatura)
    if (!`${teacherName} ${asigsNames}`.toLowerCase().includes(search.toLowerCase())) return false;
    // Filtro por Carrera Evaluadora
    if (filterCareer !== 'ALL' && d.evalCareer !== filterCareer) return false;
    // Filtro por Estado del PAAD
    if (filterState !== 'ALL' && d.state !== filterState) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Bandeja de PAAD Anuales (UAP y Dirección de Carrera)</h1>
        <p className="text-xs text-muted mt-0.5">
          Vista exclusiva para evaluación institucional. Filtra por docente, cátedra, carrera evaluadora o estado. El PAAD queda aprobado con la
          conformidad de la UAP o de la Dirección de Carrera.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Barra de filtros */}
        <div className="p-4 border-b border-border grid grid-cols-1 sm:grid-cols-3 gap-3 bg-background/50">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por docente o asignatura…"
            aria-label="Buscar por docente o asignatura"
            className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-xs text-ink outline-none focus:border-primary"
          />
          <select
            value={filterCareer}
            onChange={(e) => setFilterCareer(e.target.value)}
            aria-label="Dirección evaluadora"
            className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-xs text-ink"
          >
            <option value="ALL">Todas las Direcciones Evaluadoras</option>
            {carreras.map((c) => (
              <option key={c.id} value={c.id}>
                Dirección {c.sigla}
              </option>
            ))}
          </select>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            aria-label="Estado del PAAD"
            className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-xs text-ink"
          >
            <option value="ALL">Todos los estados de PAAD</option>
            <option value="BORRADOR">Borrador</option>
            <option value="ENVIADO_A_REVISION">En revisión</option>
            <option value="OBSERVADO">Observado</option>
            <option value="APROBADO">PAAD Aprobado</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-background text-muted border-b border-border text-[11px]">
                <th className="p-4">Docente</th>
                <th className="p-4">Cátedras en el Ciclo</th>
                <th className="p-4">Dirección Evaluadora</th>
                <th className="p-4">Estado PAAD</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length > 0 ? (
                filtered.map((d) => {
                  const misEq = equiposCatedra.filter((e) => e.docenteId === d.owner && e.cicloLectivo === cycle);
                  const evalCar = carreras.find((c) => c.id === d.evalCareer);
                  return (
                    <tr key={d.id} className="hover:bg-background/60 transition">
                      <td className="p-4 font-bold text-ink">{fullName(d.owner)}</td>
                      <td className="p-4 space-y-1">
                        {misEq.map((eq) => {
                          const c = asigContext(eq.asignaturaId);
                          return (
                            <div key={eq.id} className="text-[11px]">
                              <span className="font-semibold text-primary">{c.carrera?.sigla}</span> · {c.asig?.nombre} ({eq.cargo})
                            </div>
                          );
                        })}
                      </td>
                      <td className="p-4">
                        {role === 'ADMINISTRADOR' && d.state === 'BORRADOR' ? (
                          <select
                            value={d.evalCareer}
                            onChange={(e) => onChangeEvalCareer(d.id, e.target.value)}
                            aria-label={`Dirección evaluadora del PAAD de ${fullName(d.owner)}`}
                            className="rounded-lg bg-background border border-border px-2.5 py-1 text-xs text-ink"
                          >
                            {carreras.map((c) => (
                              <option key={c.id} value={c.id}>
                                Dirección {c.sigla}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2.5 py-1 rounded bg-soft text-primary font-semibold text-[11px]">Dirección {evalCar?.sigla}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge state={d.state} pendientes={pendientesDe(d)} />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenPaadDoc(d.id)}
                          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          Ver PAAD
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted">
                    No se encontraron PAADs con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
