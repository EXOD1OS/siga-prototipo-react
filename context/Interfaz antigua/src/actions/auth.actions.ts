'use server';

import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function cambiarPassword(nuevaPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('No autenticado.');
  if (nuevaPassword.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');

  const passwordHash = await bcrypt.hash(nuevaPassword, 10);
  await prisma.usuario.update({
    where: { id: session.user.id },
    data: { passwordHash, mustChangePassword: false },
  });
}
