import { useId, useState, type FormEvent } from 'react';
import { IconArrowRight, IconEye, IconEyeOff, IconLock, IconMoon, IconSun, IconUser } from '../layout/icons';
import { UnlarLogo } from '../shared/UnlarLogo';
import type { Usuario } from '../../types/estructura';

interface Props {
  usuarios: Usuario[];
  /** Cuentas que se ofrecen en el acceso de demostración (ids de `usuarios`). */
  cuentasDemo: string[];
  isDark: boolean;
  toggleTheme: () => void;
  /** Credenciales válidas: la app arma la sesión a partir del usuario. */
  onLogin: (u: Usuario) => void;
}

// `primary`, `surface`, `background`, `soft` y `border` son variables CSS sin canal alfa: los modificadores
// `/NN` de Tailwind no se generan para ellas. Junto a cada uno va su equivalente literal con color-mix
// (literal: Tailwind solo genera las clases que encuentra escritas tal cual en el código).

const inputCls = [
  'w-full rounded-xl bg-background/80 hover:bg-background focus:bg-surface border border-border focus:border-primary',
  'focus:ring-4 focus:ring-primary/15',
  'bg-[color:color-mix(in_srgb,var(--bg)_80%,transparent)] focus:ring-[color:color-mix(in_srgb,var(--primary)_15%,transparent)]',
  'pl-10 pr-3.5 py-2.5 text-xs text-ink placeholder:text-muted outline-none transition-all duration-200',
  'aria-[invalid=true]:border-danger',
].join(' ');
const iconoCampoCls = 'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary';
const labelCls = 'mb-1.5 block text-xs font-semibold text-ink';

const ROL_CUENTA_LABEL: Record<Usuario['rol'], string> = {
  Docente: 'Docente',
  Director: 'Dirección',
  UAP: 'UAP',
  Consejo: 'Consejo',
  Administrador: 'Admin.',
};

/** Ingreso institucional al SIIGPA (prototipo: valida contra los usuarios cargados). */
export function LoginView({ usuarios, cuentasDemo, isDark, toggleTheme, onLogin }: Props) {
  const uid = useId();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [demo, setDemo] = useState('');
  const [error, setError] = useState<{ campo: 'usuario' | 'password'; msg: string } | null>(null);
  const [fondoListo, setFondoListo] = useState(false);

  const demos = cuentasDemo.map((id) => usuarios.find((u) => u.id === id)).filter((u): u is Usuario => !!u);

  const elegirDemo = (u: Usuario) => {
    setDemo(u.id);
    // El acceso inicial usa el DNI como contraseña provisoria.
    setUsuario(u.email);
    setPassword(u.dni);
    setError(null);
  };

  const ingresar = (e: FormEvent) => {
    e.preventDefault();
    const clave = usuario.trim().toLowerCase();
    if (!clave) return setError({ campo: 'usuario', msg: 'Ingresá tu correo institucional o tu DNI.' });
    if (!password) return setError({ campo: 'password', msg: 'Ingresá tu contraseña.' });
    const u = usuarios.find((x) => x.email.toLowerCase() === clave || x.dni === clave);
    if (!u) return setError({ campo: 'usuario', msg: 'No encontramos una cuenta con ese correo o DNI.' });
    if (!u.activo) return setError({ campo: 'usuario', msg: 'La cuenta está inactiva. Consultá con la administración del DACEFyN.' });
    setError(null);
    onLogin(u);
  };

  const errorId = `${uid}-error`;
  const descr = (campo: 'usuario' | 'password') => (error?.campo === campo ? errorId : undefined);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <img
        src="/unlar-campus-login.png"
        alt=""
        aria-hidden
        onLoad={() => setFondoListo(true)}
        className={`absolute inset-0 h-full w-full scale-105 object-cover transition-[transform,opacity] duration-1000 ${fondoListo ? 'opacity-100' : 'scale-110 opacity-0'}`}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-tr from-slate-950/85 via-slate-900/75 to-[#157b79]/50 backdrop-blur-[4px]" />

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors duration-200 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {isDark ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
      </button>

      <main
        className={`animate-riseIn relative z-10 w-full max-w-[420px] overflow-hidden rounded-3xl border border-border/80 bg-surface/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 bg-[color:color-mix(in_srgb,var(--surface)_95%,transparent)] border-[color:color-mix(in_srgb,var(--border)_80%,transparent)]`}
      >
        <div aria-hidden className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-500 to-primary" />

        <header className="space-y-3 px-8 pb-4 pt-8 text-center">
          <UnlarLogo className="mx-auto h-16 transition-transform duration-300 hover:scale-105" />
          <span
            className={`inline-flex items-center rounded-full border border-primary/20 bg-soft px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary border-[color:color-mix(in_srgb,var(--primary)_20%,transparent)]`}
          >
            DACEFyN · UNLaR
          </span>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">SIIGPA</h1>
            <p className="text-xs leading-relaxed text-muted">Sistema Integral de Gestión de Planificaciones Académicas</p>
          </div>
        </header>

        <form onSubmit={ingresar} noValidate className="space-y-5 px-8 pb-8 pt-2">
          <div>
            <label htmlFor={`${uid}-usuario`} className={labelCls}>
              Correo Institucional o DNI
            </label>
            <div className="group relative">
              <IconUser className={iconoCampoCls} />
              <input
                id={`${uid}-usuario`}
                type="text"
                autoComplete="username"
                inputMode="email"
                placeholder="nombre@unlar.edu.ar"
                value={usuario}
                onChange={(e) => {
                  setUsuario(e.target.value);
                  setDemo('');
                  if (error?.campo === 'usuario') setError(null);
                }}
                aria-invalid={error?.campo === 'usuario'}
                aria-describedby={descr('usuario')}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${uid}-password`} className={labelCls}>
              Contraseña
            </label>
            <div className="group relative">
              <IconLock className={iconoCampoCls} />
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
                aria-describedby={descr('password')}
                className={`${inputCls} pr-24`}
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                aria-pressed={verPassword}
                aria-controls={`${uid}-password`}
                className="absolute inset-y-0 right-1.5 my-1.5 flex items-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold text-muted transition-colors hover:bg-soft hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                {verPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                {verPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {demos.length > 0 && (
            <fieldset
              className={`space-y-2 rounded-xl border border-primary/20 bg-soft/50 p-3 border-[color:color-mix(in_srgb,var(--primary)_20%,transparent)] bg-[color:color-mix(in_srgb,var(--soft)_50%,transparent)]`}
            >
              <legend className="sr-only">Acceso de demostración</legend>
              <p aria-hidden className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Acceso de demostración
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {demos.map((u) => {
                  const activo = demo === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => elegirDemo(u)}
                      aria-pressed={activo}
                      title={`${u.nombre} ${u.apellido} · ${u.email}`}
                      className={`min-w-0 rounded-lg border px-2 py-1.5 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                        activo ? 'border-primary bg-primary text-white shadow-sm' : 'border-border bg-surface text-ink hover:border-primary hover:text-primary'
                      }`}
                    >
                      <span className="block truncate text-[11px] font-semibold">{ROL_CUENTA_LABEL[u.rol]}</span>
                      <span className={`block truncate text-[10px] ${activo ? 'text-white/80' : 'text-muted'}`}>
                        {u.nombre} {u.apellido}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {error && (
            <p id={errorId} role="alert" className="animate-fadeIn rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300">
              {error.msg}
            </p>
          )}

          <button
            type="submit"
            className={`flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-semibold tracking-wide text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/30 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary shadow-[color:color-mix(in_srgb,var(--primary)_25%,transparent)] hover:shadow-[color:color-mix(in_srgb,var(--primary)_30%,transparent)]`}
          >
            Iniciar Sesión
            <IconArrowRight className="h-4 w-4" />
          </button>
        </form>

        <footer className={`border-t border-border bg-background/60 px-8 py-4 text-center bg-[color:color-mix(in_srgb,var(--bg)_60%,transparent)]`}>
          <p className="text-[11px] text-muted">Acceso inicial con número de DNI · Ordenanzas HCS N° 171/19 y 219/22</p>
        </footer>
      </main>
    </div>
  );
}
