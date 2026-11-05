import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PaadDetail } from '@/components/PaadDetail';

export default async function PaadPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return <PaadDetail id={params.id} actor={session.user} />;
}
