import { useState, useMemo } from 'react';
import { createInitialData, reemplazarCatedrasDeUsuario, ROLES, usuariosConCatedras } from './data/mockData';
import { Header, type NotificationItem } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { PaadModal } from './components/shared/PaadModal';
import { Toast, type ToastTone } from './components/shared/Toast';
import { catedraInicial, catedrasDocente, getDynamicPaadHeader, type FuentePaad } from './lib/paad';
import { PlanificacionesList } from './components/views/PlanificacionesList';
import { PaadsListView } from './components/views/PaadsListView';
import { DocumentFormView } from './components/views/DocumentFormView';
import { ReportEvaluationView } from './components/views/ReportEvaluationView';
import { LoginView } from './components/views/LoginView';
import { DocenteDashboardView } from './components/views/DocenteDashboardView';
import { CambiarPasswordModal } from './components/shared/CambiarPasswordModal';
import type { Usuario } from './types/estructura';
import { AdminEstructuraView } from './components/views/AdminEstructuraView';
import { AdminUsuariosView } from './components/views/AdminUsuariosView';
import type { InfoRevision } from './components/shared/PanelRevision';
import type { InformeEvaluacion } from './types/planificacion';
import {
  areaDeRol,
  esEditablePorDocente,
  esReenvio,
  ESTADOS_EN_REVISION,
  ESTADOS_REVISION_PAAD,
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
  // Vista rápida de un PAAD: guarda desde qué asignatura (PAAC) se abrió para proyectar sus Aspectos Generales.
  const [modalPaadState, setModalPaadState] = useState<{ paadId: string; asigId?: string } | null>(null);
  // Contexto con el que se abre el formulario de un PAAD (cátedra de origen o carrera filtrada en la bandeja).
  const [paadContexto, setPaadContexto] = useState<{ asignaturaId?: string | null; carreraId?: string | null } | null>(null);
  const [toast, setToast] = useState<{ id: number; msg: string; tone: ToastTone } | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

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

  /** Cuenta de usuario detrás de la sesión simulada (para el cambio de contraseña). */
  const usuarioSesionId = (): string | null => {
    if (role.startsWith('DOCENTE')) return uid;
    if (role === 'DIRECCION_CARRERA') return carreraBy(careerId)?.directorId ?? null;
    const rolCuenta: Record<string, Usuario['rol']> = { UAP: 'UAP', CONSEJO_DEPARTAMENTAL: 'Consejo', ADMINISTRADOR: 'Administrador' };
    return S.usuarios.find((u) => u.rol === rolCuenta[role])?.id ?? null;
  };
  const debeCambiarPassword = !!S.usuarios.find((u) => u.id === usuarioSesionId())?.mustChangePassword;

  /** Arma la sesión a partir de la cuenta que ingresó en el Login. */
  const iniciarSesion = (u: Usuario) => {
    let nuevoRol: string;
    if (u.rol === 'Docente') {
      const responsable = S.equiposCatedra.some((e) => e.docenteId === u.id && e.cicloLectivo === S.cycle && e.esResponsable);
      nuevoRol = responsable ? 'DOCENTE_RESPONSABLE' : 'DOCENTE_AUXILIAR';
      setUid(u.id);
    } else if (u.rol === 'Director') {
      nuevoRol = 'DIRECCION_CARRERA';
      if (u.carreraId) setCareerId(u.carreraId);
    } else {
      nuevoRol = { UAP: 'UAP', Consejo: 'CONSEJO_DEPARTAMENTAL', Administrador: 'ADMINISTRADOR' }[u.rol];
    }
    handleRoleChange(nuevoRol);
    showToast(`Bienvenido/a, ${u.nombre} ${u.apellido}`);
    // Con la contraseña provisoria (DNI) se pide definir una personal al entrar.
    if (u.mustChangePassword) setPasswordModalOpen(true);
  };

  const actualizarPassword = () => {
    const id = usuarioSesionId();
    setS((prev) => ({ ...prev, usuarios: prev.usuarios.map((u) => (u.id === id ? { ...u, mustChangePassword: false } : u)) }));
    setPasswordModalOpen(false);
    showToast('Contraseña actualizada correctamente.');
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    setPage(newRole === 'ADMINISTRADOR' ? 'admin-estructura' : 'home');
  };

  const handleNavigate = (targetPage: string) => {
    setPaadContexto(null);
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
    if (!d) return false;
    // PAAD: sin doble conformidad. UAP o la Dirección evaluadora lo revisan en revisión u observado;
    // una vez Aprobado ya no hay controles de revisión.
    if (d.type === 'PAAD') {
      if (!ESTADOS_REVISION_PAAD.includes(d.state)) return false;
      return role === 'UAP' || (role === 'DIRECCION_CARRERA' && d.evalCareer === careerId);
    }
    if (!ESTADOS_EN_REVISION.includes(d.state)) return false;
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
  /** Devuelve true si el dictamen quedó registrado. */
  const finalizarRevisionDoc = (docId: string, resultado: ResultadoRevision, datosInforme?: Partial<InformeEvaluacion>): boolean => {
    const area = areaDeRol(role);
    const doc = docBy(docId);
    if (!area || !doc) return false;
    const { doc: next, error } = finalizarRevision(doc, area, resultado, {
      autor: activeUserName,
      fecha: new Date().toLocaleDateString('es-AR'),
    }, datosInforme);
    if (error) {
      showToast(error, 'warning');
      return false;
    }
    setS((prev) => ({ ...prev, docs: prev.docs.map((x) => (x.id === docId ? next : x)) }));
    const quien = area === 'uap' ? 'pedagógico (UAP)' : 'disciplinar (Dirección)';
    showToast(
      resultado === 'OBSERVADO'
        ? `${doc.type} devuelto al docente con observaciones: ya puede corregirlo.`
        : doc.type === 'PAAD'
          ? `PAAD aprobado por ${area === 'uap' ? 'la UAP' : 'la Dirección de Carrera'}.`
          : next.state === 'APROBADO_PLENO'
            ? `Dictamen ${quien} favorable. Ambos dictámenes son favorables: ${doc.type} evaluado favorablemente.`
            : `Dictamen ${quien} favorable registrado.`,
      resultado === 'OBSERVADO' ? 'warning' : 'success'
    );
    return true;
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
              setModalPaadState(null);
              setActiveDocId(d.id);
              setPage('report');
            }
          : undefined,
    };
  };

  const paacs = S.docs.filter((d) => d.type === 'PAAC');
  const paads = S.docs.filter((d) => d.type === 'PAAD');
  const currentDoc = docBy(activeDocId);
  const modalPaad = modalPaadState ? docBy(modalPaadState.paadId) : null;

  const toastEl = toast && <Toast key={toast.id} message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />;

  if (page === 'login') {
    return (
      <>
        <LoginView
          usuarios={S.usuarios}
          cuentasDemo={['u-lucia', 'u-martin', 'u-uap', 'u-dir-isi', 'u-consejo', 'u-admin']}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onLogin={iniciarSesion}
        />
        {toastEl}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar role={role} page={page} onNavigate={handleNavigate} cycle={S.cycle} />

      <div className="flex-1 flex flex-col min-w-0">
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
          onOpenPasswordModal={() => setPasswordModalOpen(true)}
          onLogout={() => {
            setPage('login');
            showToast('Sesión finalizada.');
          }}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {page === 'home' && role.startsWith('DOCENTE') && (
            <DocenteDashboardView
              role={role}
              uid={uid}
              activeUserName={activeUserName}
              ciclo={S.cycle}
              paacs={paacs}
              paad={S.docs.find((d) => d.type === 'PAAD' && d.owner === uid && d.cycle === S.cycle)}
              usuarios={S.usuarios}
              equiposCatedra={S.equiposCatedra}
              asigContext={asigContext}
              onOpenDoc={(id: string) => {
                setPaadContexto(null);
                setActiveDocId(id);
                setPage('doc');
              }}
              onOpenReport={(id: string) => {
                setActiveDocId(id);
                setPage('report');
              }}
              onVerPlanificaciones={() => handleNavigate('planificaciones')}
            />
          )}

          {(page === 'planificaciones' || (page === 'home' && !role.startsWith('DOCENTE'))) && (
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
              docs={S.docs}
            />
          )}

          {/* BANDEJA DE PAADS: EXCLUSIVA PARA DIRECCIÓN, UAP, CONSEJO Y ADMIN (Oculta a profesores) */}
          {page === 'paads' && !role.startsWith('DOCENTE') && (
            <PaadsListView
              paads={paads}
              role={role}
              carreras={S.carreras}
              equiposCatedra={S.equiposCatedra}
              cycle={S.cycle}
              fullName={fullName}
              asigContext={asigContext}
              onOpenPaadDoc={(paadId, carreraId) => {
                setPaadContexto(carreraId ? { carreraId } : null);
                setActiveDocId(paadId);
                setPage('doc');
              }}
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
                    : currentDoc.type === 'PAAD'
                      ? 'PAAD presentado: queda en revisión de la UAP o la Dirección de Carrera.'
                      : 'PAAC presentado: queda en revisión de UAP y Dirección.'
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
              onOpenPaadModal={(paadId: string, asigId?: string) => setModalPaadState({ paadId, asigId })}
              paadContexto={{
                // La Dirección ve por defecto el encabezado de su propia carrera.
                ...(role === 'DIRECCION_CARRERA' ? { carreraId: careerId } : {}),
                ...paadContexto,
              }}
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
              areaSesion={areaDeRol(role)}
              onBackToDoc={(id: string) => {
                setActiveDocId(id);
                setPage('doc');
              }}
            />
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
      {modalPaad && modalPaadState && (() => {
        // Un PAAD por ciclo: se proyecta sobre la asignatura desde la que se abrió (o la inicial del docente).
        const fuente: FuentePaad = { ciclo: modalPaad.cycle, usuarios: S.usuarios, equipos: S.equiposCatedra, asigContext };
        const catedras = catedrasDocente(modalPaad.owner, fuente);
        return (
          <PaadModal
            key={`${modalPaad.id}-${modalPaadState.asigId ?? ''}`}
            paad={modalPaad}
            catedras={catedras}
            catedraInicial={catedraInicial(catedras, {
              asignaturaId: modalPaadState.asigId,
              carreraId: role === 'DIRECCION_CARRERA' ? careerId : null,
            })}
            aspectosDe={(asigId) => getDynamicPaadHeader(modalPaad.owner, asigId, fuente)}
            docenteName={fullName(modalPaad.owner)}
            carreraEvalName={`Dirección ${carreraBy(modalPaad.evalCareer)?.sigla || ''}`}
            onAbrirDetalle={() => {
              setPaadContexto(modalPaadState.asigId ? { asignaturaId: modalPaadState.asigId } : null);
              setActiveDocId(modalPaad.id);
              setModalPaadState(null);
              setPage('doc');
            }}
            onClose={() => setModalPaadState(null)}
          />
        );
      })()}
      <CambiarPasswordModal
        open={passwordModalOpen}
        activeUserName={activeUserName}
        rolLabel={ROLES[role] ?? role}
        obligatorio={debeCambiarPassword}
        onClose={() => setPasswordModalOpen(false)}
        onConfirm={actualizarPassword}
      />

      {toastEl}
    </div>
  );
}