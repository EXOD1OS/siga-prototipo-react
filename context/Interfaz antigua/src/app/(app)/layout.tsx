import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (session.user.mustChangePassword) redirect('/cambiar-password');

  return (
    <div className="flex min-h-screen flex-col xl:flex-row">
      <Sidebar nombre={session.user.name ?? ''} rol={session.user.rol} />
      <main className="min-h-screen min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7 xl:px-8 xl:py-8">{children}</main>
    </div>
  );
}
