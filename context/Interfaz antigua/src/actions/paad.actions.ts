'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { operarPaad, resolverObservacionPersonal } from '@/lib/paad';
import { elegirFuenteMigracion } from '@/lib/migrar-paad';
import type { PaadData } from '@/types/planificacion';

async function actor() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('No autenticado.');
  return session.user;
}
function refrescar() {
  revalidatePath('/mi-paad');
  revalidatePath('/paads', 'layout');
  revalidatePath('/planificaciones', 'layout');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
}
export async function guardarBorradorPaad(paadId: string, datos: PaadData) {
  await operarPaad(prisma, await actor(), paadId, 'guardar', { datos }); refrescar();
}
export async function presentarPaad(paadId: string) {
  await operarPaad(prisma, await actor(), paadId, 'presentar', {}); refrescar();
}
export async function observarPaad(input: { paadId: string; presentacionId: string; campoPath: string; mensaje: string }) {
  await operarPaad(prisma, await actor(), input.paadId, 'observar', input); refrescar();
}
export async function resolverObservacionPaad(id: string) {
  await resolverObservacionPersonal(prisma, await actor(), id); refrescar();
}
export async function dictaminarPaad(input: { paadId: string; presentacionId: string; resultado: 'FAVORABLE' | 'REQUIERE_CORRECCION'; mensaje: string }) {
  await operarPaad(prisma, await actor(), input.paadId, 'dictaminar', input); refrescar();
}
export async function asignarDireccionPaad(paadId: string, carreraId: string) {
  await operarPaad(prisma, await actor(), paadId, 'direccion', { carreraId }); refrescar();
}
export async function resolverConflictoPaad(paadId: string, fuenteId: string) {
  if ((await actor()).rol !== 'ADMINISTRADOR') throw new Error('No autorizado.');
  await elegirFuenteMigracion(prisma, paadId, fuenteId); refrescar();
}
