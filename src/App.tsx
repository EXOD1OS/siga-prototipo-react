import { useState, useMemo } from 'react';
import { createInitialData, reemplazarCatedrasDeUsuario, usuariosConCatedras } from './data/mockData';
import { Header, type NotificationItem } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { PaadModal } from './components/shared/PaadModal';
import { PlanificacionesList } from './components/views/PlanificacionesList';
import { PaadsListView } from './components/views/PaadsListView';
import { DocumentFormView } from './components/views/DocumentFormView';
import { ReportEvaluationView } from './components/views/ReportEvaluationView';
import { AdminEstructuraView } from './components/views/AdminEstructuraView';
import { AdminUsuariosView } from './components/views/AdminUsuariosView';

export default function App() {
  const [S, setS] = useState(() => createInitialData());
  const [isDark, setIsDark] = useState(false);
  const [role, setRole] = useState('DOCENTE_RESPONSABLE');
  const [uid, setUid] = useState('u-lucia');
  const [careerId, setCareerId] = useState('car-isi');
  const [page, setPage] = useState('home');
  const [activeDocId, setActiveDocId] = useState('paac-1');
  const [modalPaadId, setModalPaadId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
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
    if (!d || !['BORRADOR', 'OBSERVADO'].includes(d.state)) return false;
    if (!role.startsWith('DOCENTE')) return false;
    if (d.type === 'PAAD') return d.owner === uid;
    if (d.type === 'PAAC') {
      return equipoDeAsig(d.asignaturaId).some((eq) => eq.docenteId === uid);
    }
    return false;
  };

  const canSubmitDoc = (d: any) => {
    if (!canEditDoc(d)) return false;
    if (d.type === 'PAAD') return d.owner === uid;
    if (d.type === 'PAAC') return responsableDeAsig(d.asignaturaId) === uid;
    return false;
  };

  const canObserveDoc = (d: any) => {
    if (!d || !['ENVIADO_A_REVISION', 'APROBADO_PEDAGOGICO', 'APROBADO_DISCIPLINAR'].includes(d.state)) return false;
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
              onApproveUap={(paadId) => {
                setS((prev) => ({
                  ...prev,
                  docs: prev.docs.map((x) =>
                    x.id === paadId ? { ...x, pedApproved: true, state: x.discApproved ? 'APROBADO' : x.state } : x
                  ),
                }));
                showToast('Conformidad UAP registrada en el PAAD.');
              }}
              onApproveDir={(paadId) => {
                setS((prev) => ({
                  ...prev,
                  docs: prev.docs.map((x) =>
                    x.id === paadId ? { ...x, discApproved: true, state: x.pedApproved ? 'APROBADO' : x.state } : x
                  ),
                }));
                showToast('Conformidad de Dirección registrada en el PAAD.');
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
              onUpdateField={(fKey: string, val: string) =>
                updateActiveDoc((doc) => {
                  doc.data[fKey] = val;
                  return doc;
                })
              }
              onUpdateTableCell={(fKey: string, r: number, c: number, val: string) =>
                updateActiveDoc((doc) => {
                  doc.data[fKey][r][c] = val;
                  return doc;
                })
              }
              onAddRow={(fKey: string, cols: number) =>
                updateActiveDoc((doc) => {
                  (doc.data[fKey] ??= []).push(Array(cols).fill(''));
                  return doc;
                })
              }
              onRemoveRow={(fKey: string, r: number) =>
                updateActiveDoc((doc) => {
                  doc.data[fKey].splice(r, 1);
                  return doc;
                })
              }
              onSaveDraft={() => showToast('Borrador guardado en JSONB.')}
              onSubmitDoc={() => {
                updateActiveDoc((doc) => {
                  doc.state = 'ENVIADO_A_REVISION';
                  return doc;
                });
                showToast('Documento enviado a revisión.');
              }}
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
              d={currentDoc}
              role={role}
              asigContext={asigContext}
              onBackToDoc={(id: string) => {
                setActiveDocId(id);
                setPage('doc');
              }}
              onUpdatePedItem={(idx: number, val: string) =>
                updateActiveDoc((doc) => {
                  doc.pedReport.items[idx] = val;
                  return doc;
                })
              }
              onUpdateDiscItem={(idx: number, val: string) =>
                updateActiveDoc((doc) => {
                  doc.discReport.items[idx] = val;
                  return doc;
                })
              }
              onEmitObserved={() =>
                updateActiveDoc((doc) => {
                  doc.state = 'OBSERVADO';
                  // Registra qué área observó, para la columna Dictámenes de la bandeja.
                  const informe = role === 'UAP' ? 'pedReport' : 'discReport';
                  doc[informe] = { ...doc[informe], dictamen: 'OBSERVADO', by: activeUserName, fecha: new Date().toLocaleDateString('es-AR') };
                  return doc;
                })
              }
              onEmitApprovedUap={() =>
                updateActiveDoc((doc) => {
                  doc.pedApproved = true;
                  doc.pedReport = { ...doc.pedReport, dictamen: 'APROBADO', by: activeUserName, fecha: new Date().toLocaleDateString('es-AR') };
                  doc.state = doc.discApproved ? 'APROBADO_PLENO' : 'APROBADO_PEDAGOGICO';
                  return doc;
                })
              }
              onEmitApprovedDir={() =>
                updateActiveDoc((doc) => {
                  doc.discApproved = true;
                  doc.discReport = { ...doc.discReport, dictamen: 'APROBADO', by: activeUserName, fecha: new Date().toLocaleDateString('es-AR') };
                  doc.state = doc.pedApproved ? 'APROBADO_PLENO' : 'APROBADO_DISCIPLINAR';
                  return doc;
                })
              }
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
          docenteName={fullName(modalPaad.owner)}
          carreraEvalName={`Dirección ${carreraBy(modalPaad.evalCareer)?.codigo || ''}`}
          misEquipos={S.equiposCatedra.filter((e) => e.docenteId === modalPaad.owner && e.cicloLectivo === S.cycle)}
          asigContext={asigContext}
          onClose={() => setModalPaadId(null)}
        />
      )}

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-surface px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}