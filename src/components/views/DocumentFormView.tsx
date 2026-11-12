import { PaadEditor } from '../paad/PaadEditor';
import { PaacEditor, type IntegrantePaad } from '../paac/PaacEditor';
import { catedraInicial, catedrasDocente, getDynamicPaadHeader, nombreOficial, type FuentePaad } from '../../lib/paad';
import { armarAspectosPaac, paacDesdeDatosAnteriores } from '../../lib/paac';
import { paadVacio, type PaadContenido } from '../../types/paad';
import type { PaacContenido } from '../../types/paac';
import type { AsigContext, DocumentoResumen, EquipoCatedra, Usuario } from '../../types/estructura';
import type { DocumentoEditable } from '../../types/planificacion';
import type { InfoRevision } from '../shared/PanelRevision';

interface DocumentFormViewProps {
  d: DocumentoEditable;
  role: string;
  uid: string;
  canEdit: boolean;
  canSubmit: boolean;
  canObserve: boolean;
  asigContext: (id: string) => AsigContext;
  equipoDeAsig: (id: string) => EquipoCatedra[];
  fullName: (id: string) => string;
  S: { cycle: number; docs: DocumentoResumen[]; equiposCatedra: EquipoCatedra[]; usuarios: Usuario[] };
  onBack: () => void;
  /** Reemplaza el contenido estructurado de un PAAD. */
  onUpdatePaad: (c: PaadContenido) => void;
  /** Reemplaza el contenido estructurado de un PAAC. */
  onUpdatePaac: (c: PaacContenido) => void;
  onSaveDraft: () => void;
  onSubmitDoc: () => void;
  onAddObs: (fKey: string, path: string, txt: string, secIdx: number) => void;
  onResolveObs: (obsId: string) => void;
  /** UAP / Dirección / Admin eliminan una observación propia. */
  onDeleteObs: (obsId: string) => void;
  onOpenReport: (id: string) => void;
  /** Abre la vista rápida de un PAAD proyectado sobre la asignatura indicada. */
  onOpenPaadModal: (paadId: string, asignaturaId?: string) => void;
  /** PAAD: cátedra o carrera con la que abrir la proyección de los Aspectos Generales. */
  paadContexto?: { asignaturaId?: string | null; carreraId?: string | null };
  /** Cierre de revisión para UAP / Dirección (null si la sesión no revisa este documento). */
  revision: InfoRevision | null;
}

/** Abre el editor del documento según su tipo: PAAD (Anexo III) o PAAC. */
export function DocumentFormView({
  d,
  role,
  uid,
  canEdit,
  canSubmit,
  canObserve,
  asigContext,
  equipoDeAsig,
  fullName,
  S,
  onBack,
  onUpdatePaad,
  onUpdatePaac,
  onSaveDraft,
  onSubmitDoc,
  onAddObs,
  onResolveObs,
  onDeleteObs,
  onOpenReport,
  onOpenPaadModal,
  paadContexto,
  revision,
}: DocumentFormViewProps) {
  if (d.type === 'PAAD') {
    // Un solo PAAD por ciclo; los Aspectos Generales se proyectan sobre cada cátedra del docente.
    const fuente: FuentePaad = { ciclo: d.cycle, usuarios: S.usuarios, equipos: S.equiposCatedra, asigContext };
    const catedras = catedrasDocente(d.owner, fuente);
    const contenido = d.paad ?? paadVacio();
    return (
      <PaadEditor
        key={`${d.id}-${paadContexto?.asignaturaId ?? ''}-${paadContexto?.carreraId ?? ''}`}
        d={{ ...d, paad: contenido }}
        docenteNombre={fullName(d.owner)}
        role={role}
        canEdit={canEdit}
        canSubmit={canSubmit}
        canObserve={canObserve}
        catedras={catedras}
        catedraInicial={catedraInicial(catedras, paadContexto)}
        aspectosDe={(asigId) => getDynamicPaadHeader(d.owner, asigId, fuente)}
        esPropio={role.startsWith('DOCENTE') && d.owner === uid}
        revision={revision}
        onBack={onBack}
        onUpdatePaad={onUpdatePaad}
        onSaveDraft={onSaveDraft}
        onSubmitDoc={onSubmitDoc}
        onAddObs={onAddObs}
        onResolveObs={onResolveObs}
        onDeleteObs={onDeleteObs}
      />
    );
  }

  // PAAC: los documentos cargados con el esquema anterior se convierten al abrirlos.
  const contenido = d.paac ?? paacDesdeDatosAnteriores(d.data);
  const ctx = d.asignaturaId ? asigContext(d.asignaturaId) : null;
  const aspectos = armarAspectosPaac({ asignaturaId: d.asignaturaId, contenido, ciclo: d.cycle, usuarios: S.usuarios, equipos: S.equiposCatedra, asigContext });
  const equipo = d.asignaturaId ? equipoDeAsig(d.asignaturaId) : [];
  const responsable = equipo.find((e) => e.esResponsable);
  const integrantes: IntegrantePaad[] = equipo.map((e) => {
    const p = S.docs.find((x) => x.type === 'PAAD' && x.owner === e.docenteId);
    return {
      docenteId: e.docenteId,
      nombre: fullName(e.docenteId),
      cargo: e.cargo,
      esResponsable: e.esResponsable,
      paadId: p?.id,
      paadEstado: p?.state,
      puedeVer: role !== 'DOCENTE_AUXILIAR' || e.docenteId === uid,
    };
  });

  return (
    <PaacEditor
      d={d}
      contenido={contenido}
      aspectos={aspectos}
      porCompetencias={ctx?.plan?.enfoque === 'COMPETENCIAS'}
      horasPlan={ctx?.asig?.horasTotales}
      subtitulo={[ctx?.carrera?.sigla, ctx?.asig?.codigo].filter(Boolean).join(' · ')}
      responsable={responsable ? nombreOficial(S.usuarios.find((u) => u.id === responsable.docenteId)) : ''}
      integrantes={integrantes}
      role={role}
      canEdit={canEdit}
      canSubmit={canSubmit}
      canObserve={canObserve}
      puedeIrAlInforme={['UAP', 'DIRECCION_CARRERA'].includes(role)}
      revision={revision}
      onBack={onBack}
      onOpenReport={() => onOpenReport(d.id)}
      onOpenPaadModal={(paadId) => onOpenPaadModal(paadId, d.asignaturaId)}
      onUpdatePaac={onUpdatePaac}
      onSaveDraft={onSaveDraft}
      onSubmitDoc={onSubmitDoc}
      onAddObs={onAddObs}
      onResolveObs={onResolveObs}
      onDeleteObs={onDeleteObs}
    />
  );
}
