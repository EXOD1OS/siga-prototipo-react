import { useId, useState, type FormEvent } from 'react';
import { IconEye, IconEyeOff, IconMoon, IconSun } from '../layout/icons';
import type { Usuario } from '../../types/estructura';

interface Props {
  usuarios: Usuario[];
  /** Cuentas que se ofrecen en el selector de demostración (ids de `usuarios`). */
  cuentasDemo: string[];
  isDark: boolean;
  toggleTheme: () => void;
  /** Credenciales válidas: la app arma la sesión a partir del usuario. */
  onLogin: (u: Usuario) => void;
}

// `primary`, `surface` y `border` son variables CSS sin canal alfa: los modificadores `/NN` de Tailwind
// no se generan para ellas, así que se suma un color-mix equivalente junto a cada uno.
const inputCls =
  'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:ring-[color-mix(in_srgb,var(--primary)_30%,transparent)] focus:border-primary transition-all duration-200 aria-[invalid=true]:border-danger';
const labelCls = 'mb-1.5 block text-xs font-semibold text-ink';

const ROL_CUENTA_LABEL: Record<Usuario['rol'], string> = {
  Docente: 'Docente',
  Director: 'Dirección de Carrera',
  UAP: 'UAP',
  Consejo: 'Consejo Departamental',
  Administrador: 'Administrador',
};

/** Ingreso institucional al SIIGPA (prototipo: valida contra los usuarios cargados). */
export function LoginView({ usuarios, cuentasDemo, isDark, toggleTheme, onLogin }: Props) {
  const uid = useId();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [demo, setDemo] = useState('');
  const [error, setError] = useState<{ campo: 'usuario' | 'password' | null; msg: string } | null>(null);
  const [fondoListo, setFondoListo] = useState(false);

  const demos = cuentasDemo.map((id) => usuarios.find((u) => u.id === id)).filter((u): u is Usuario => !!u);

  const elegirDemo = (id: string) => {
    setDemo(id);
    const u = usuarios.find((x) => x.id === id);
    if (!u) return;
    // El acceso inicial usa el DNI como contraseña provisoria.
    setUsuario(u.email);
    setPassword(u.dni);
    setError(null);
  };

  const ingresar = (e: FormEvent) => {
    e.preventDefault();
    const clave = usuario.trim().toLowerCase();
    if (!clave) return setError({ campo: 'usuario', msg: 'Ingresá tu email institucional o tu DNI.' });
    if (!password) return setError({ campo: 'password', msg: 'Ingresá tu contraseña.' });
    const u = usuarios.find((x) => x.email.toLowerCase() === clave || x.dni === clave);
    if (!u) return setError({ campo: 'usuario', msg: 'No encontramos una cuenta con ese email o DNI.' });
    if (!u.activo) return setError({ campo: 'usuario', msg: 'La cuenta está inactiva. Consultá con la administración del DACEFyN.' });
    setError(null);
    onLogin(u);
  };

  const errorId = `${uid}-error`;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4">
      <img
        src="/unlar-campus-login.png"
        alt=""
        aria-hidden
        onLoad={() => setFondoListo(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${fondoListo ? 'scale-105 opacity-100' : 'scale-110 opacity-0'}`}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-[#152b42]/75 to-[#157b79]/60 backdrop-blur-[3px]" />

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors duration-200 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {isDark ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
      </button>

      <main className="animate-riseIn relative z-10 w-full max-w-md space-y-6 rounded-2xl border border-border/80 border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-surface/95 bg-[color-mix(in_srgb,var(--surface)_95%,transparent)] p-8 shadow-2xl backdrop-blur-md transition-all duration-300">
        <header className="space-y-3 text-center">
          <div className="mx-auto inline-flex rounded-xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/5">
            <img src="/unlar-logo.png" alt="Universidad Nacional de La Rioja" className="mx-auto h-14 w-auto object-contain drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-center text-2xl font-extrabold tracking-tight text-ink">SIIGPA</h1>
            <p className="mt-1 text-center text-xs text-muted">Sistema Integral de Gestión de Planificaciones Académicas</p>
            <p className="text-center text-xs text-muted">DACEFyN · Universidad Nacional de La Rioja</p>
          </div>
        </header>

        <form onSubmit={ingresar} noValidate className="space-y-4">
          {demos.length > 0 && (
            <div>
              <label htmlFor={`${uid}-demo`} className={labelCls}>
                Cuenta de demostración <span className="font-normal text-muted">(opcional)</span>
              </label>
              <select id={`${uid}-demo`} value={demo} onChange={(e) => elegirDemo(e.target.value)} className={inputCls}>
                <option value="">Ingresar con mis credenciales…</option>
                {demos.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} {u.apellido} · {ROL_CUENTA_LABEL[u.rol]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor={`${uid}-usuario`} className={labelCls}>
              Usuario (Email institucional o DNI)
            </label>
            <input
              id={`${uid}-usuario`}
              type="text"
              autoComplete="username"
              inputMode="email"
              placeholder="nombre@unlar.edu.ar"
              value={usuario}
              onChange={(e) => {
                setUsuario(e.target.value);
                if (error?.campo === 'usuario') setError(null);
              }}
              aria-invalid={error?.campo === 'usuario'}
              aria-describedby={error?.campo === 'usuario' ? errorId : undefined}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor={`${uid}-password`} className={labelCls}>
              Contraseña
            </label>
            <div className="relative">
              <input
                id={`${uid}-password`}
                type={verPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error?.campo === 'password') setError(null);
                }}
                aria-invalid={error?.campo === 'password'}
                aria-describedby={error?.campo === 'password' ? errorId : undefined}
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={verPassword}
                className="absolute inset-y-0 right-1 my-1 flex w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-soft hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                {verPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p id={errorId} role="alert" className="animate-fadeIn rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300">
              {error.msg}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-3 text-xs font-semibold text-white shadow-lg shadow-primary/25 shadow-[0_10px_25px_-6px_color-mix(in_srgb,var(--primary)_25%,transparent)] transition-all duration-200 hover:bg-primary-hover active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Iniciar Sesión
          </button>
        </form>

        <p className="border-t border-border pt-4 text-center text-[11px] text-muted">El acceso inicial utiliza el DNI como credencial provisoria</p>
      </main>
    </div>
  );
}
