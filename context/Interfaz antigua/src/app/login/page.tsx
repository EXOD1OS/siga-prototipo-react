import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LoginForm from './login-form';

type LoginPageProps = {
  searchParams?: { callbackUrl?: string | string[]; passwordChanged?: string };
};

function safeDestination(value?: string | string[]) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate?.startsWith('/') && !candidate.startsWith('//') && !candidate.includes('\\')
    ? candidate
    : '/dashboard';
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const destination = safeDestination(searchParams?.callbackUrl);
  const session = await getServerSession(authOptions);

  if (session?.user) redirect(destination);

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#071426] px-4 py-10 text-slate-100 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-75"
          style={{ backgroundImage: "url('/unlar-campus-login.png')", backgroundPosition: 'center 42%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#071426]/60 via-[#071426]/42 to-[#071426]/65" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_5%,rgba(3,10,22,0.32)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/55 shadow-[0_32px_100px_-35px_rgba(0,0,0,0.85)] backdrop-blur-2xl lg:min-h-[620px] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-gradient-to-br from-blue-950/45 via-slate-950/25 to-cyan-950/30 p-12 lg:flex">
          <div aria-hidden="true" className="absolute -right-24 top-24 h-72 w-72 rounded-full border border-blue-300/10" />
          <div aria-hidden="true" className="absolute -right-12 top-36 h-48 w-48 rounded-full border border-blue-300/10" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-400/10 text-sm font-bold tracking-wide text-blue-100 shadow-lg shadow-blue-950/40">U</div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white">UNLaR</p>
              <p className="text-xs text-slate-400">Universidad Nacional de La Rioja</p>
            </div>
          </div>

          <div className="relative max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-300/[0.07] px-3 py-1.5 text-xs font-medium text-blue-100/90">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
              DACEFyN · Gestión académica
            </div>
            <h1 className="text-6xl font-semibold leading-none tracking-tight text-white">UAP</h1>
            <p className="mt-3 text-lg font-medium tracking-wide text-blue-100">Unidad Pedagógica</p>
            <div className="mt-10 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-200"><ShieldIcon /></span>
              Acceso seguro para equipos académicos
            </div>
          </div>

          <p className="relative text-xs text-slate-500">Sistema de Gestión de Planificaciones · PAAC / PAAD</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-9 lg:hidden">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-400/10 text-sm font-bold text-blue-100">U</div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/80">UAP · Unidad Pedagógica</p>
            </div>
            <div className="mb-8">
              <p className="text-sm font-medium text-cyan-200">Bienvenido/a</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Ingresá a tu cuenta</h2>
              <p className="mt-2 text-sm text-slate-400">Usá tus credenciales institucionales para continuar.</p>
            </div>
            <LoginForm
              callbackUrl={destination}
              passwordChanged={searchParams?.passwordChanged === '1'}
            />
            <p className="mt-8 text-center text-xs leading-5 text-slate-500">Si todavía no tenés acceso, solicitá tu cuenta a la administración del sistema.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3 19 6v5c0 4.4-2.8 8.2-7 10-4.2-1.8-7-5.6-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
