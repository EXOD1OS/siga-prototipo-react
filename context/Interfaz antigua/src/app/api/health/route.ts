import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ estado: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ estado: 'sin-conexion-base' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
