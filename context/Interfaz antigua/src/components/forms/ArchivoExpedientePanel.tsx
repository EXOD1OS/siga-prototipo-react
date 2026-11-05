import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { etiquetaTipoArchivo } from '@/lib/archivo-expediente';
import { SectionCard } from './fields';

export async function ArchivoExpedientePanel({
  planificacionId,
  estado,
}: {
  planificacionId: string;
  estado: string;
}) {
  if (estado !== 'FINALIZADO') return null;

  const archivos = await prisma.archivoExpediente.findMany({
    where: { planificacionId },
    orderBy: [{ tipo: 'asc' }, { nombreArchivo: 'asc' }],
  });

  return (
    <section className="no-print">
      <SectionCard title="Documentos PDF archivados">
        {archivos.length ? (
          <ul className="space-y-2">
            {archivos.map((archivo) => (
              <li key={archivo.id} className="flex flex-col justify-between gap-1 rounded-lg border border-border px-3 py-2 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium text-gray-200">{etiquetaTipoArchivo(archivo.tipo)}</p>
                  <p className="text-xs text-gray-500">
                    {archivo.nombreArchivo} · {(archivo.sizeBytes / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Link
                  href={`/api/archivos/${archivo.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                  download={archivo.nombreArchivo}
                >
                  Descargar PDF
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">
            No hay archivos registrados para este expediente. Verificá la configuración del almacenamiento antes de cerrar la planificación.
          </p>
        )}
      </SectionCard>
    </section>
  );
}