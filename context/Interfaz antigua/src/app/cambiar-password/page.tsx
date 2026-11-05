import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CambiarPasswordForm } from '@/components/forms/CambiarPasswordForm';

export default async function CambiarPasswordPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-white">Cambiar contraseña</h1>
          <p className="text-sm text-gray-400 mt-1">
            {session.user.mustChangePassword
              ? 'Por seguridad, debés establecer una contraseña nueva antes de continuar.'
              : 'Elegí una nueva contraseña para tu cuenta.'}
          </p>
        </div>
        <CambiarPasswordForm />
      </div>
    </div>
  );
}
