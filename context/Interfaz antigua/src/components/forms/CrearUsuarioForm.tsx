'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { crearUsuario } from '@/actions/admin.actions';
import { ROL_LABELS } from '@/types/planificacion';
import { TextField, SelectField, NumberField, SectionCard } from './fields';

const ROLES = Object.values(UserRole);
const CATEGORIAS_DOCENTES = ['TITULAR', 'ASOCIADO', 'ADJUNTO', 'JTP', 'AYUDANTE'];

export function CrearUsuarioForm({
  carreras,
  asignaturas,
}: {
  carreras: { id: string; nombre: string; codigo: string }[];
  asignaturas: { id: string; nombre: string; carrera: string; planEstudio: string }[];
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [rol, setRol] = useState<UserRole>(UserRole.DOCENTE);
  const [carreraId, setCarreraId] = useState(carreras[0]?.id ?? '');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [cicloLectivo, setCicloLectivo] = useState(new Date().getFullYear());
  const [categoria, setCategoria] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (rol === UserRole.DOCENTE && asignaturaId && !categoria) {
      setError('Seleccioná la categoría docente para la materia.');
      return;
    }
    setLoading(true);
    try {
      await crearUsuario({
        nombre,
        apellido,
        email,
        dni,
        rol,
        carreraId: rol === UserRole.DIRECCION_CARRERA ? carreraId : null,
        asignacionInicial:
          rol === UserRole.DOCENTE && asignaturaId
            ? { asignaturaId, cicloLectivo, categoria }
            : undefined,
      });
      setSuccess(`Usuario creado${rol === UserRole.DOCENTE && asignaturaId ? ' y asignado a la materia' : ''}. Contraseña temporal: el DNI (${dni}).`);
      setNombre('');
      setApellido('');
      setEmail('');
      setDni('');
      setAsignaturaId('');
      setCategoria('');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'No se pudo crear el usuario.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard title="Nuevo usuario">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <TextField label="Nombre" value={nombre} onChange={setNombre} />
          <TextField label="Apellido" value={apellido} onChange={setApellido} />
          <TextField label="Email institucional" value={email} onChange={setEmail} />
          <TextField label="DNI" value={dni} onChange={setDni} />
          <SelectField
            label="Rol"
            value={rol}
            options={ROLES.map((r) => ({ value: r, label: ROL_LABELS[r] ?? r }))}
            onChange={(v) => setRol(v as UserRole)}
          />
          {rol === UserRole.DIRECCION_CARRERA && (
            <SelectField
              label="Carrera"
              value={carreraId}
              options={carreras.map((c) => ({ value: c.id, label: `${c.nombre} (${c.codigo})` }))}
              onChange={setCarreraId}
            />
          )}
        </div>

        {rol === UserRole.DOCENTE && (
          <div className="space-y-3 rounded-xl border border-blue-100/10 bg-[#09172b]/60 p-3 sm:p-4">
            <SelectField
              label="Materia inicial (opcional)"
              value={asignaturaId}
              options={[
                { value: '', label: 'Sin materia por ahora' },
                ...asignaturas.map((a) => ({
                  value: a.id,
                  label: `${a.nombre} — ${a.carrera} · ${a.planEstudio}`,
                })),
              ]}
              onChange={setAsignaturaId}
            />
            {asignaturaId && (
              <div className="grid grid-cols-2 gap-4">
                <NumberField label="Ciclo lectivo" value={cicloLectivo} onChange={setCicloLectivo} />
                <SelectField
                  label="Categoría docente"
                  value={categoria}
                  options={[
                    { value: '', label: 'Seleccionar categoría' },
                    ...CATEGORIAS_DOCENTES.map((c) => ({ value: c, label: c })),
                  ]}
                  onChange={setCategoria}
                />
              </div>
            )}
            <p className="text-xs leading-5 text-slate-500">Podés asignar más materias y designar a la persona responsable desde Gestión Académica.</p>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-300/20 bg-blue-500/15 px-5 py-2 text-sm font-semibold text-blue-100 transition hover:border-blue-300/40 hover:bg-blue-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-wait disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear usuario'}
        </button>
      </form>
    </SectionCard>
  );
}
