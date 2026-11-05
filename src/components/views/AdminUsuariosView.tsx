import { useState } from 'react';
import { ROLES } from '../../data/mockData';

export function AdminUsuariosView({ usuarios, carreras, onCreateUser, onResetDni }: any) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('DOCENTE_RESPONSABLE');
  const [carreraId, setCarreraId] = useState('');

  const handleSubmit = () => {
    if (!nombre.trim() || !apellido.trim() || !dni.trim() || !email.trim()) return;
    onCreateUser({ nombre: nombre.trim(), apellido: apellido.trim(), dni: dni.trim(), email: email.trim(), rol, carreraId: carreraId || null });
    setNombre(''); setApellido(''); setDni(''); setEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold text-ink">Gestión de Usuarios y Control de Acceso (RBAC)</h1>
        <p className="text-xs text-muted mt-0.5">Alta con DNI como clave provisoria (<code>must_change_password = true</code>).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-surface border border-border rounded-xl p-5 space-y-3 shadow-sm">
          <h2 className="text-sm font-bold text-ink border-b border-border pb-2">+ Dar de Alta Nuevo Usuario</h2>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-ink" />
          <input value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Apellido" className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-ink" />
          <input value={dni} onChange={(e) => setDni(e.target.value)} placeholder="DNI (Clave provisoria)" className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-ink" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email institucional" className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-ink" />
          <select value={rol} onChange={(e) => setRol(e.target.value)} className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-ink">
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={carreraId} onChange={(e) => setCarreraId(e.target.value)} className="w-full rounded-lg bg-background border border-border px-3 py-2 text-xs text-ink">
            <option value="">Carrera (Solo Dirección)</option>
            {carreras.map((c: any) => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
          </select>
          <button onClick={handleSubmit} className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold text-xs">Crear Usuario</button>
        </div>

        <div className="lg:col-span-8 bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead><tr className="bg-background text-muted border-b border-border"><th className="p-3.5">Usuario</th><th className="p-3.5">DNI</th><th className="p-3.5">Rol</th><th className="p-3.5">Clave</th><th className="p-3.5 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-border">
              {usuarios.map((u: any) => (
                <tr key={u.id}>
                  <td className="p-3.5"><div className="font-semibold text-ink">{u.apellido}, {u.nombre}</div><div className="text-[11px] text-muted">{u.email}</div></td>
                  <td className="p-3.5 font-mono text-ink">{u.dni}</td>
                  <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-soft text-primary text-[10px] font-bold">{u.rol}</span></td>
                  <td className="p-3.5">{u.mustChangePassword ? 'Pendiente (DNI)' : 'Actualizada'}</td>
                  <td className="p-3.5 text-right"><button onClick={() => onResetDni(u.id)} className="px-2.5 py-1 rounded bg-background border border-border text-[11px]">Blanquear a DNI</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}