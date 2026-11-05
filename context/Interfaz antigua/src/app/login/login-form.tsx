'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginForm({
  callbackUrl,
  passwordChanged,
}: {
  callbackUrl: string;
  passwordChanged: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        setError('No pudimos validar esos datos. Revisá el correo y la contraseña.');
        setLoading(false);
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError('No se pudo conectar con el sistema. Intentá nuevamente.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {passwordChanged && (
        <div role="status" className="flex gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-100">
          <span className="mt-0.5 text-emerald-300"><CheckIcon /></span>
          <span>Contraseña actualizada. Ingresá con tus nuevas credenciales.</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">Correo institucional</label>
        <div className="group relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 transition-colors group-focus-within:text-cyan-300"><MailIcon /></span>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="!h-12 !w-full !rounded-xl !border-white/10 !bg-slate-900/70 !pl-11 !pr-4 text-sm !text-white shadow-inner shadow-black/10 transition placeholder:!text-slate-600 hover:!border-white/20 focus:!border-cyan-400/60 focus:!ring-4 focus:!ring-cyan-400/10"
            placeholder="nombre@unlar.edu.ar"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-slate-200">Contraseña</label>
          <span className="text-xs text-slate-500">Acceso personal</span>
        </div>
        <div className="group relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 transition-colors group-focus-within:text-cyan-300"><LockIcon /></span>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="!h-12 !w-full !rounded-xl !border-white/10 !bg-slate-900/70 !pl-11 !pr-12 text-sm !text-white shadow-inner shadow-black/10 transition placeholder:!text-slate-600 hover:!border-white/20 focus:!border-cyan-400/60 focus:!ring-4 focus:!ring-cyan-400/10"
            placeholder="Ingresá tu contraseña"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3.5 text-slate-500 transition hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300"
          >
            <EyeIcon visible={showPassword} />
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" aria-live="polite" className="flex items-start gap-2.5 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100">
          <span className="mt-0.5 text-rose-300"><AlertIcon /></span>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email.trim() || !password}
        className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/50 transition duration-200 hover:-translate-y-0.5 hover:from-blue-400 hover:to-blue-500 hover:shadow-blue-900/50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        {loading ? <Spinner /> : <span className="relative">Ingresar al sistema <ArrowIcon /></span>}
        {loading && <span className="relative">Verificando acceso…</span>}
      </button>
      <p className="text-center text-xs text-slate-500">Tu sesión se valida de forma segura al ingresar.</p>
    </form>
  );
}

function MailIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7"><rect x="3.5" y="5" width="17" height="14" rx="2.5" /><path d="m5 7 7 5.5L19 7" /></svg>;
}

function LockIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7"><rect x="4.5" y="10" width="15" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>;
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible
    ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.6 5.2 9.5 7-.4.8-1.3 2.2-2.7 3.5M6.2 6.2C4.4 7.4 3.2 9.1 2.5 12c.5 1 3.9 7 9.5 7 1.2 0 2.3-.3 3.2-.8" /></svg>
    : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7"><path d="M2.5 12S5.9 5 12 5s9.5 7 9.5 7-3.4 7-9.5 7-9.5-7-9.5-7Z" /><circle cx="12" cy="12" r="2.6" /></svg>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="ml-1 inline h-4 w-4 transition-transform group-hover:translate-x-0.5" stroke="currentColor" strokeWidth="1.8"><path d="M3.5 10h12M10.5 5l5 5-5 5" /></svg>;
}

function CheckIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2"><path d="m4 10 4 4 8-8" /></svg>;
}

function AlertIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7"><circle cx="10" cy="10" r="7.5" /><path d="M10 6v4.5m0 3v.1" /></svg>;
}

function Spinner() {
  return <span aria-hidden="true" className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}
