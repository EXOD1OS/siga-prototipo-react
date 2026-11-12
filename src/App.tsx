import { useState, useMemo } from 'react';
import { createInitialData, reemplazarCatedrasDeUsuario, usuariosConCatedras } from './data/mockData';
import { Header, type NotificationItem } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { PaadModal } from './components/shared/PaadModal';
import { Toast, type ToastTone } from './components/shared/Toast';
import { armarAspectosGenerales } from './lib/paad';
import { paadVacio } from './types/paad';
import { PlanificacionesList } from './components/views/PlanificacionesList';
import { PaadsListView } from './components/views/PaadsListView';
import { DocumentFormView } from './components/views/DocumentFormView';
import { ReportEvaluationView } from './components/views/ReportEvaluationView';
import { AdminEstructuraView } from './components/views/AdminEstructuraView';
import { AdminUsuariosView } from './components/views/AdminUsuariosView';
import type { InfoRevision } from './components/shared/PanelRevision';
import type { InformeEvaluacion } from './types/planificacion';
import {
  areaDeRol,
  esEditablePorDocente,
  esReenvio,
  ESTADOS_EN_REVISION,
  finalizarRevision,
  observacionesPendientesDe,
  presentarDocumento,
  type ResultadoRevision,
} from './lib/revision';

export default function App() {
  const [S, setS] = useState(() => createInitialData());
  const [isDark, setIsDark] = useState(false);
  const [role, setRole] = useState('DOCENTE_RESPONSABLE');
  const [uid, setUid] = useState('u-lucia');
  const [careerId, setCareerId] = useState('car-isi');
  const [page, setPage] = useState('home');
  const [activeDocId, setActiveDocId] = useState('paac-1');
  const [modalPaadId, setModalPaadId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; msg: string; tone: ToastTone } | null>(null);

  const toggleTheme = () => {
    const next = !isDark;
    const root = document.documentElement;
    // Transición de colores solo durante el cambio de tema.
    root.classList.add('theme-transition');
    setIsDark(next);
    root.classList.toggle('dark', next);
    window.setTimeout(() => root.classList.remove('theme-transition'), 400);
  };

  const showToast = (msg: string, tone: ToastTone = 'success') => {
    // Un id nuevo reinicia el aviso aunque el mensaje se repita.
    setToast({ id: Date.now(), msg, tone });
  };

  const userBy = (id: string) => S.usuarios.find((u) => u.id === id);
  const fullName = (id: string) => {
    const u = userBy(id);
    return u ? `${u.nombre} ${u.apellido}` : id;
  };
  const asigBy = (id: string) => S.asignaturas.find((a) => a.id === id);
  const planBy = (id?: string) => S.planes.find((p) => p.id === id);
  const carreraBy = (id?: string | null) => S.carreras.find((c) => c.id === id);
  const deptoBy = (id?: string | null) => S.departamentos.find((d) => d.id === id);
  const sedeBy = (id?: string) => S.sedes.find((s) => s.id === id);
  const docBy = (id: string) => S.docs.find((d) => d.id === id);
  const equipoDeAsig = (asigId: string) =>
    S.equiposCatedra.filter((e) => e.asignaturaId === asigId && e.cicloLectivo === S.cycle);
  const responsableDeAsig = (asigId: string) =>
    equipoDeAsig(asigId).find((e) => e.esResponsable)?.docenteId || null;

  const asigContext = (asigId: string) => {
    const a = asigBy(asigId);
    const p = planBy(a?.planEstudioId);
    const c = carreraBy(p?.carreraId);
    const s = sedeBy(c?.sedeId);
    const d = c?.departamentoId ? deptoBy(c.departamentoId) : null;
    const rad = a?.departamentoRadicacionId ? deptoBy(a.departamentoRadicacionId) : null;
    return { asig: a, plan: p, carrera: c, sede: s, depto: d, radicacion: rad };
  };

  const activeUserName = useMemo(() => {
    if (role === 'ADMINISTRADOR') return 'Administrador General';
    if (role === 'CONSEJO_DEPARTAMENTAL') return 'Secretaría Consejo DACEFyN';
    if (role === 'UAP') return 'Lic. Ana Suárez (UAP)';
    if (role === 'DIRECCION_CARRERA') {
      const c = carreraBy(careerId);
      return `${fullName(c?.directorId || '')} (${c?.codigo})`;
    }
    return fullName(uid);
  }, [role, uid, careerId, S]);

  // Notificaciones para la campanita del Header (Estado de las planificaciones del docente y observaciones)
  const notifications = useMemo<NotificationItem[]>(() => {
    if (role.startsWith('DOCENTE')) {
      const misAsigsIds = S.equiposCatedra
        .filter((e) => e.docenteId === uid && e.cicloLectivo === S.cycle)
        .map((e) => e.asignaturaId);
      const misDocs = S.docs.filter(
        (d) => (d.type === 'PAAC' && misAsigsIds.includes(d.asignaturaId)) || (d.type === 'PAAD' && d.owner === uid)
      );
      return misDocs.map((d) => {
        const ctx = d.type === 'PAAC' ? asigContext(d.asignaturaId) : null;
        return {
          id: 'notif-' + d.id,
          docId: d.id,
          title: d.type === 'PAAC' ? `PAAC · ${ctx?.asig?.nombre}` : `Mi PAAD Anual (${d.cycle})`,
          subtitle: d.type === 'PAAC' ? `${ctx?.carrera?.codigo} · ${ctx?.asig?.regimenDictado}` : 'Anexo III · Documento personal',
          state: d.state,
          unresolvedCount: d.comments.filter((c: any) => !c.resolved).length,
        };
      });
    }
    // Para UAP y Dirección muestra los documentos enviados a revisión o con observaciones
    return S.docs
      .filter((d) => ['ENVIADO_A_REVISION', 'OBSERVADO'].includes(d.state))
      .map((d) => {
        const ctx = d.type === 'PAAC' ? asigContext(d.asignaturaId) : null;
        return {
          id: 'notif-' + d.id,
          docId: d.id,
          title: d.type === 'PAAC' ? `PAAC · ${ctx?.asig?.nombre}` : `PAAD · ${fullName(d.owner)}`,
          subtitle: d.type === 'PAAC' ? `Responsable: ${fullName(d.owner)}` : 'Evaluación anual docente',
          state: d.state,
          unresolvedCount: d.comments.filter((c: any) => !c.resolved).length,
        };
      });
  }, [S, role, uid]);

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    setPage(newRole === 'ADMINISTRADOR' ? 'admin-estructura' : 'home');
  };

  const handleNavigate = (targetPage: string) => {
    if (targetPage === 'mi-paad') {
      const mp = S.docs.find((d) => d.type === 'PAAD' && d.owner === uid);
      if (mp) {
        setActiveDocId(mp.id);
        setPage('doc');
        return;
      }
    }
    setPage(targetPage);
  };

  const canEditDoc = (d: any) => {
    // Borrador, Observado o con algún dictamen "Con observaciones": el docente puede corregir.
    if (!d || !esEditablePorDocente(d)) return false;
    if (!role.startsWith('DOCENTE')) return false;
    if (d.type === 'PAAD') return d.owner === uid;
    // El PAAC lo confecciona y edita el Docente Responsable; el resto del equipo lo ve en lectura.
    if (d.type === 'PAAC') return responsableDeAsig(d.asignaturaId) === uid;
    return false;
  };

  const canSubmitDoc = (d: any) => {
    if (!canEditDoc(d)) return false;
    if (d.type === 'PAAD') return d.owner === uid;
    if (d.type === 'PAAC') return responsableDeAsig(d.asignaturaId) === uid;
    return false;
  };

  const canObserveDoc = (d: any) => {
    if (!d || !ESTADOS_EN_REVISION.includes(d.state)) return false;
    if (role === 'UAP') return !d.pedApproved;
    if (role === 'DIRECCION_CARRERA') {
      const cid = d.type === 'PAAC' ? asigContext(d.asignaturaId).carrera?.id : d.evalCareer;
      return cid === careerId && !d.discApproved;
    }
    return false;
  };

  const updateActiveDoc = (updater: (doc: any) => any) => {
    setS((prev) => ({
      ...prev,
      docs: prev.docs.map((doc) => (doc.id === activeDocId ? updater(JSON.parse(JSON.stringify(doc))) : doc)),
    }));
  };

  /** UAP / Dirección cierran su revisión: devuelven al docente o emiten dictamen favorable. */
  const finalizarRevisionDoc = (docId: string, resultado: ResultadoRevision, datosInforme?: Partial<InformeEvaluacion>) => {
    const area = areaDeRol(role);
    const doc = docBy(docId);
    if (!area || !doc) return;
    const { doc: next, error } = finalizarRevision(doc, area, resultado, {
      autor: activeUserName,
      fecha: new Date().toLocaleDateString('es-AR'),
    }, datosInforme);
    if (error) {
      showToast(error, 'warning');
      return;
    }
    setS((prev) => ({ ...prev, docs: prev.docs.map((x) => (x.id === docId ? next : x)) }));
    const quien = area === 'uap' ? 'pedagógico (UAP)' : 'disciplinar (Dirección)';
    showToast(
      resultado === 'OBSERVADO'
        ? `${doc.type} devuelto al docente con observaciones: ya puede corregirlo.`
        : ['APROBADO_PLENO', 'APROBADO'].includes(next.state)
          ? `Dictamen ${quien} favorable. Ambos dictámenes son favorables: ${doc.type} evaluado favorablemente.`
          : `Dictamen ${quien} favorable registrado.`,
      resultado === 'OBSERVADO' ? 'warning' : 'success'
    );
  };

  /** Datos del panel de decisión si la sesión puede revisar el documento. */
  const revisionPara = (d: any): InfoRevision | null => {
    const area = areaDeRol(role);
    if (!d || !area || !canObserveDoc(d)) return null;
    return {
      area,
      pendientes: observacionesPendientesDe(d, area),
      onFinalizar: (r, datos) => finalizarRevisionDoc(d.id, r, datos),
      // PAAC: el dictamen favorable pasa por el informe oficial (Anexo III / IV) autocompletado.
      onAbrirInforme:
        d.type === 'PAAC'
          ? () => {
              setModalPaadId(null);
              setActiveDocId(d.id);
              setPage('report');
            }
          : undefined,
    };
  };

  const paacs = S.docs.filter((d) => d.type === 'PAAC');
  const paads = S.docs.filter((d) => d.type === 'PAAD');
  const currentDoc = docBy(activeDocId);
  const modalPaad = modalPaadId ? docBy(modalPaadId) : null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {page !== 'login' && <Sidebar role={role} page={page} onNavigate={handleNavigate} cycle={S.cycle} />}

      <div className="flex-1 flex flex-col min-w-0">
        {page !== 'login' && (
          <Header
            cycle={S.cycle}
            role={role}
            setRole={handleRoleChange}
            uid={uid}
            setUid={setUid}
            careerId={careerId}
            setCareerId={setCareerId}
            docentes={S.usuarios.filter((u) => u.rol === 'Docente')}
            carreras={S.carreras}
            activeUserName={activeUserName}
            isDark={isDark}
            toggleTheme={toggleTheme}
            notifications={notifications}
            onSelectNotification={(docId) => {
              setActiveDocId(docId);
              setPage('doc');
            }}
            onNavigate={handleNavigate}
            onLogout={() => {
              setPage('login');
              showToast('Sesión finalizada.');
            }}
          />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {page === 'login' && (
            <div className="max-w-md mx-auto mt-16 bg-surface border border-border rounded-2xl p-8 shadow-lg space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-soft border border-primary/30 flex items-center justify-center font-serif font-bold text-primary text-xl">
                  S
                </div>
                <div>
                  <h1 className="text-lg font-bold text-ink leading-none">SIIGPA · DACEFyN</h1>
                  <span className="text-xs text-muted">Ingreso Institucional UNLaR</span>
                </div>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-ink mb-1">Email o DNI</label>
                  <input defaultValue={userBy(uid)?.email || 'titular.prog@unlar.edu.ar'} className="w-full rounded-lg bg-background border border-border px-3 py-2.5 text-ink" />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Contraseña</label>
                  <input type="password" defaultValue="12345678" className="w-full rounded-lg bg-background border border-border px-3 py-2.5 text-ink" />
                </div>
                <button
                  onClick={() => {
                    setPage('home');
                    showToast(`Bienvenido/a, ${activeUserName}`);
                  }}
                  className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition"
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>
          )}

          {(page === 'home' || page === 'planificaciones') && (
            <PlanificacionesList
              paacs={paacs}
              role={role}
              uid={uid}
              careerId={careerId}
              cycle={S.cycle}
              carreras={S.carreras}
              equiposCatedra={S.equiposCatedra}
              asigContext={asigContext}
              fullName={fullName}
              puedeEditar={canEditDoc}
              onOpenDoc={(id: string) => {
                setActiveDocId(id);
                setPage('doc');
              }}
              onOpenReport={(id: string) => {
                setActiveDocId(id);
                setPage('report');
              }}
              onElevarPaac={(id: string) =>
                setS((prev) => ({
                  ...prev,
                  docs: prev.docs.map((x) => (x.id === id ? { ...x, state: 'ELEVADO_AL_CONSEJO' } : x)),
                }))
              }
              onOpenFormalizarModal={(id: string) =>
                setS((prev) => ({
                  ...prev,
                  docs: prev.docs.map((x) =>
                    x.id === id ? { ...x, expediente: 'EXP-2026-104', resolucion: 'RES-CD-088/26', state: 'FINALIZADO' } : x
                  ),
                }))
              }
              onViewFinal={(id: string) => {
                setActiveDocId(id);
                setPage('doc');
              }}
              onFinalizarRevision={finalizarRevisionDoc}
              docs={S.docs}
            />
          )}

          {/* BANDEJA DE PAADS: EXCLUSIVA PARA DIRECCIÓN, UAP, CONSEJO Y ADMIN (Oculta a profesores) */}
          {page === 'paads' && !role.startsWith('DOCENTE') && (
            <PaadsListView
              paads={paads}
              role={role}
              careerId={careerId}
              carreras={S.carreras}
              equiposCatedra={S.equiposCatedra}
              cycle={S.cycle}
              fullName={fullName}
              asigContext={asigContext}
              onOpenPaadModal={(paadId) => setModalPaadId(paadId)}
              onOpenPaadDoc={(paadId) => {
                setActiveDocId(paadId);
                setPage('doc');
              }}
              onApproveUap={(paadId) => finalizarRevisionDoc(paadId, 'FAVORABLE')}
              onApproveDir={(paadId) => finalizarRevisionDoc(paadId, 'FAVORABLE')}
              onChangeEvalCareer={(paadId, newCarId) => {
                setS((prev) => ({
                  ...prev,
                  docs: prev.docs.map((x) => (x.id === paadId ? { ...x, evalCareer: newCarId } : x)),
                }));
                showToast('Dirección evaluadora del PAAD actualizada.');
              }}
            />
          )}

          {page === 'doc' && currentDoc && (
            <DocumentFormView
              d={currentDoc}
              role={role}
              uid={uid}
              canEdit={canEditDoc(currentDoc)}
              canSubmit={canSubmitDoc(currentDoc)}
              canObserve={canObserveDoc(currentDoc)}
              asigContext={asigContext}
              equipoDeAsig={equipoDeAsig}
              fullName={fullName}
              S={S}
              onBack={() => setPage(currentDoc.type === 'PAAD' && !role.startsWith('DOCENTE') ? 'paads' : 'planificaciones')}
              onUpdatePaac={(contenido) =>
                updateActiveDoc((doc) => {
                  // Los cambios se reflejan en el estado al instante; el borrador marca que no se guardó.
                  doc.paac = contenido;
                  doc.sinGuardar = true;
                  return doc;
                })
              }
              onUpdatePaad={(contenido) =>
                updateActiveDoc((doc) => {
                  doc.paad = contenido;
                  doc.sinGuardar = true;
                  return doc;
                })
              }
              onSaveDraft={() => {
                updateActiveDoc((doc) => {
                  doc.sinGuardar = false;
                  doc.guardadoEn = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                  return doc;
                });
                showToast('Borrador guardado. El estado del documento no cambió.');
              }}
              onSubmitDoc={() => {
                const reenvio = esReenvio(currentDoc);
                updateActiveDoc((doc) => ({
                  // Guarda las correcciones y vuelve a revisión; los dictámenes observados vuelven a "En revisión".
                  ...presentarDocumento(doc),
                  sinGuardar: false,
                  guardadoEn: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                }));
                showToast(
                  reenvio
                    ? `${currentDoc.type} subsanado y presentado nuevamente: queda en revisión.`
                    : `${currentDoc.type} presentado: queda en revisión de UAP y Dirección.`
                );
              }}
              revision={revisionPara(currentDoc)}
              onAddObs={(fKey: string, path: string, txt: string, secIdx: number) =>
                updateActiveDoc((doc) => {
                  doc.comments.push({
                    id: 'obs-' + Date.now(),
                    field: fKey,
                    campoPath: path,
                    section: secIdx,
                    area: role === 'UAP' ? 'uap' : 'direccion',
                    author: activeUserName,
                    text: txt,
                    date: 'Hoy',
                    resolved: false,
                  });
                  return doc;
                })
              }
              onDeleteObs={(obsId: string) => {
                updateActiveDoc((doc) => {
                  doc.comments = doc.comments.filter((x: any) => x.id !== obsId);
                  return doc;
                });
                showToast('Observación eliminada.');
              }}
              onResolveObs={(obsId: string) =>
                updateActiveDoc((doc) => {
                  const o = doc.comments.find((x: any) => x.id === obsId);
                  if (o) o.resolved = true;
                  return doc;
                })
              }
              onOpenReport={(id: string) => {
                setActiveDocId(id);
                setPage('report');
              }}
              onOpenPaadModal={(paadId: string) => setModalPaadId(paadId)}
            />
          )}

          {page === 'report' && currentDoc && (
            <ReportEvaluationView
              key={`${currentDoc.id}-${role}-${careerId}`}
              d={currentDoc}
              asigContext={asigContext}
              equipo={equipoDeAsig(currentDoc.asignaturaId)}
              docs={S.docs}
              fullName={fullName}
              revision={revisionPara(currentDoc)}
              onBackToDoc={(id: string) => {
                setActiveDocId(id);
                setPage('doc');
              }}
            />
          )}

          {page === 'cambiar-password' && (
            <div className="max-w-md mx-auto mt-10 bg-surface border border-border rounded-2xl p-6 shadow-md space-y-4">
              <h1 className="text-base font-bold text-ink">Cambiar Contraseña</h1>
              <p className="text-xs text-muted">
                Usuario activo: <strong>{activeUserName}</strong>
              </p>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-ink mb-1">Contraseña Actual / DNI Inicial</label>
                  <input type="password" placeholder="Contraseña actual" className="w-full rounded-lg bg-background border border-border px-3 py-2 text-ink" />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Nueva Contraseña</label>
                  <input type="password" placeholder="Mínimo 8 caracteres" className="w-full rounded-lg bg-background border border-border px-3 py-2 text-ink" />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Repetir Nueva Contraseña</label>
                  <input type="password" placeholder="Confirmar nueva contraseña" className="w-full rounded-lg bg-background border border-border px-3 py-2 text-ink" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setPage('home')} className="px-3.5 py-2 rounded-lg bg-background border border-border text-ink">
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      setPage('home');
                      showToast('Contraseña actualizada correctamente.');
                    }}
                    className="px-4 py-2 rounded-lg bg-primary text-white font-semibold"
                  >
                    Guardar Contraseña
                  </button>
                </div>
              </div>
            </div>
          )}

          {page === 'admin-estructura' && role === 'ADMINISTRADOR' && (
            <AdminEstructuraView
              S={S}
              asigContext={asigContext}
              equipoDeAsig={equipoDeAsig}
              fullName={fullName}
              onSaveEquipo={(asigId, integrantes) => {
                // Reemplaza el equipo de la asignatura en el ciclo vigente; otros ciclos no se tocan.
                setS((prev) => ({
                  ...prev,
                  equiposCatedra: [
                    ...prev.equiposCatedra.filter(
                      (x) => !(x.asignaturaId === asigId && x.cicloLectivo === prev.cycle)
                    ),
                    ...integrantes.map((i) => ({ ...i, asignaturaId: asigId, cicloLectivo: prev.cycle })),
                  ],
                }));
                showToast('Equipo de cátedra actualizado.');
              }}
              onLotePeriodo={(perTipo) => {
                const asigs = S.asignaturas.filter((a) =>
                  perTipo === '1C' ? ['1C', 'ANUAL'].includes(a.regimenDictado) : a.regimenDictado === '2C'
                );
                let creadas = 0;
                const newDocs = [...S.docs];
                asigs.forEach((a) => {
                  if (!newDocs.some((x) => x.type === 'PAAC' && x.asignaturaId === a.id && x.cycle === S.cycle)) {
                    newDocs.push({
                      id: 'paac-' + Date.now() + Math.random(),
                      type: 'PAAC',
                      asignaturaId: a.id,
                      owner: responsableDeAsig(a.id) || 'u-lucia',
                      cycle: S.cycle,
                      periodo: perTipo,
                      state: 'BORRADOR',
                      pedApproved: false,
                      discApproved: false,
                      expediente: '',
                      resolucion: '',
                      data: {},
                      pedReport: { items: {} },
                      discReport: { items: {} },
                      comments: [],
                    });
                    creadas++;
                  }
                });
                setS((prev) => ({ ...prev, docs: newDocs }));
                showToast(
                  creadas > 0
                    ? `Se generaron ${creadas} nueva(s) planificación(es) en BORRADOR para ${perTipo}.`
                    : `Todas las asignaturas de ${perTipo} ya tienen su PAAC instanciado.`
                );
              }}
            />
          )}

          {page === 'admin-usuarios' && role === 'ADMINISTRADOR' && (
            <AdminUsuariosView
              usuarios={usuariosConCatedras(S)}
              carreras={S.carreras}
              departamentos={S.departamentos}
              planes={S.planes}
              asignaturas={S.asignaturas}
              equiposCatedra={S.equiposCatedra}
              cycle={S.cycle}
              onCreateUser={({ catedras, ...datos }) => {
                const id = 'u-' + Date.now();
                setS((prev) => ({
                  ...prev,
                  usuarios: [...prev.usuarios, { id, ...datos, mustChangePassword: true }],
                  // El Director queda registrado como director de esa carrera.
                  carreras:
                    datos.rol === 'Director' && datos.carreraId
                      ? prev.carreras.map((c) => (c.id === datos.carreraId ? { ...c, directorId: id } : c))
                      : prev.carreras,
                  // Las cátedras se persisten como registros de EQUIPOS_CATEDRA del ciclo vigente.
                  equiposCatedra: reemplazarCatedrasDeUsuario(prev.equiposCatedra, id, prev.cycle, catedras),
                }));
                showToast(
                  `Usuario creado${catedras.length ? ` con ${catedras.length} cátedra(s)` : ''}. Contraseña provisoria: DNI ${datos.dni}.`
                );
              }}
              onUpdateUser={(uId, { catedras, ...datos }) => {
                setS((prev) => ({
                  ...prev,
                  usuarios: prev.usuarios.map((u) => (u.id === uId ? { ...u, ...datos } : u)),
                  // El Director queda registrado como director de esa carrera.
                  carreras:
                    datos.rol === 'Director' && datos.carreraId
                      ? prev.carreras.map((c) => (c.id === datos.carreraId ? { ...c, directorId: uId } : c))
                      : prev.carreras,
                  // Si deja de ser Docente, `catedras` llega vacío y se lo desvincula de sus equipos.
                  equiposCatedra: reemplazarCatedrasDeUsuario(prev.equiposCatedra, uId, prev.cycle, catedras),
                }));
                showToast('Datos y cátedras del usuario actualizados.');
              }}
              onDeleteUser={(uId) => {
                setS((prev) => ({
                  ...prev,
                  usuarios: prev.usuarios.filter((u) => u.id !== uId),
                  equiposCatedra: prev.equiposCatedra.filter((e) => e.docenteId !== uId),
                }));
                showToast('Usuario eliminado.');
              }}
              onResetDni={(uId) => {
                setS((prev) => ({
                  ...prev,
                  usuarios: prev.usuarios.map((u) => (u.id === uId ? { ...u, mustChangePassword: true } : u)),
                }));
                showToast('Clave blanqueada: el usuario deberá ingresar con su DNI.');
              }}
            />
          )}
        </main>
      </div>

      {/* MODAL PARA VER EL PAAD PRESENTADO DE UN DOCENTE */}
      {modalPaad && (
        <PaadModal
          paad={modalPaad}
          aspectos={armarAspectosGenerales({
            contenido: modalPaad.paad ?? paadVacio(),
            ownerId: modalPaad.owner,
            ciclo: modalPaad.cycle,
            usuarios: S.usuarios,
            equipos: S.equiposCatedra,
            asigContext,
          })}
          docenteName={fullName(modalPaad.owner)}
          carreraEvalName={`Dirección ${carreraBy(modalPaad.evalCareer)?.sigla || ''}`}
          revision={revisionPara(modalPaad)}
          onAbrirDetalle={
            canObserveDoc(modalPaad)
              ? () => {
                  setActiveDocId(modalPaad.id);
                  setModalPaadId(null);
                  setPage('doc');
                }
              : undefined
          }
          onClose={() => setModalPaadId(null)}
        />
      )}

      {toast && <Toast key={toast.id} message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}