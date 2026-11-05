import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { descargarObjetoExpediente, obtenerArchivoExpediente } from '@/lib/archivo-expediente';
import { planificacionVisiblePara } from '@/lib/visibilidad';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response('No autenticado.', { status: 401 });

  const result = await obtenerArchivoExpediente(params.id);
  if (!result) return new Response('Archivo no encontrado.', { status: 404 });

  const planificacion = await planificacionVisiblePara(session.user, result.planificacionId);
  if (!planificacion || planificacion.estado !== 'FINALIZADO') {
    return new Response('No autorizado.', { status: 404 });
  }
  const bytes = await descargarObjetoExpediente(result.objectKey);

  const filename = result.nombreArchivo.replace(/["\\\r\n]/g, '_');
  return new Response(Buffer.from(bytes), {
    headers: {
      'Content-Type': result.contentType,
      'Content-Length': String(bytes.byteLength),
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(result.nombreArchivo)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
