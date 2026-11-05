import {
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createHash } from 'node:crypto';
import { Prisma, type ArchivoExpedienteTipo } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { generarPdfExpediente } from '@/lib/expediente-pdf';

const TIPOS_ARCHIVABLES: ArchivoExpedienteTipo[] = [
  'PAAC',
  'PAAD',
  'INFORME_PEDAGOGICO',
  'INFORME_DISCIPLINAR',
  'INFORME_GENERAL',
];

let client: S3Client | undefined;
let bucketReady: Promise<void> | undefined;

export function tiposPdfExpediente(configuracion = process.env.EXPEDIENTE_PDF_TIPOS): ArchivoExpedienteTipo[] {
  if (!configuracion?.trim()) return [...TIPOS_ARCHIVABLES];

  const tipos = configuracion.split(',').map((tipo) => tipo.trim()).filter(Boolean);
  const desconocidos = tipos.filter((tipo) => !TIPOS_ARCHIVABLES.includes(tipo as ArchivoExpedienteTipo));
  if (desconocidos.length) {
    throw new Error(`EXPEDIENTE_PDF_TIPOS contiene tipos no admitidos: ${desconocidos.join(', ')}.`);
  }

  return [...new Set(tipos as ArchivoExpedienteTipo[])];
}

function configuracionS3() {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const faltantes = [
    ['S3_ENDPOINT', endpoint],
    ['S3_BUCKET', bucket],
    ['S3_ACCESS_KEY_ID', accessKeyId],
    ['S3_SECRET_ACCESS_KEY', secretAccessKey],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (faltantes.length) {
    throw new Error(`Falta configurar almacenamiento S3-compatible: ${faltantes.join(', ')}.`);
  }

  let parsedEndpoint: URL;
  try {
    parsedEndpoint = new URL(endpoint!);
  } catch {
    throw new Error('S3_ENDPOINT debe ser una URL HTTP(S) válida sin credenciales embebidas.');
  }
  if (!['http:', 'https:'].includes(parsedEndpoint.protocol) || parsedEndpoint.username || parsedEndpoint.password) {
    throw new Error('S3_ENDPOINT debe ser una URL HTTP(S) válida sin credenciales embebidas.');
  }

  return {
    endpoint: parsedEndpoint.toString().replace(/\/$/, ''),
    bucket: bucket!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
  };
}

export function getS3Client() {
  if (!client) {
    const config = configuracionS3();
    client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }
  return client;
}

export function getS3Bucket() {
  return configuracionS3().bucket;
}

async function asegurarBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const s3 = getS3Client();
      const bucket = getS3Bucket();
      try {
        await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch (error) {
        const statusCode = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
        const name = (error as { name?: string }).name;
        if (statusCode === 404 || name === 'NotFound' || name === 'NoSuchBucket') {
          throw new Error(`El bucket S3 "${bucket}" no existe. Crealo antes de finalizar una planificación.`);
        }
        throw error;
      }
    })();
  }

  try {
    await bucketReady;
  } catch (error) {
    bucketReady = undefined;
    throw error;
  }
}

const TITULOS: Record<ArchivoExpedienteTipo, string> = {
  PAAC: 'Plan Anual de Actividades de Cátedra (PAAC)',
  PAAD: 'Plan Anual de Actividades del Docente (PAAD)',
  INFORME_PEDAGOGICO: 'Informe Pedagógico — UAP',
  INFORME_DISCIPLINAR: 'Informe Disciplinar — Dirección de Carrera',
  INFORME_GENERAL: 'Informe General de PAAC',
};

type ArchivoParaGenerar = {
  tipo: ArchivoExpedienteTipo;
  docenteId?: string;
  nombreArchivo: string;
  datos: unknown;
};

function exigirDictamenesAprobados(planif: {
  informePedagogico: Prisma.JsonValue | null;
  informeDisciplinar: Prisma.JsonValue | null;
  informeGeneral: Prisma.JsonValue | null;
}, tipos: ArchivoExpedienteTipo[]) {
  const errores: string[] = [];
  if (tipos.includes('INFORME_PEDAGOGICO')) {
    const informe = planif.informePedagogico as unknown as { dictamen?: string } | null;
    if (informe?.dictamen !== 'FAVORABLE') errores.push('el Informe Pedagógico no tiene dictamen favorable');
  }
  if (tipos.includes('INFORME_DISCIPLINAR')) {
    const informe = planif.informeDisciplinar as unknown as { dictamen?: string } | null;
    if (informe?.dictamen !== 'CUMPLE') errores.push('el Informe Disciplinar no tiene dictamen de cumplimiento');
  }
  if (tipos.includes('INFORME_GENERAL')) {
    const informe = planif.informeGeneral as unknown as {
      recomendacion?: string;
      elaboradoPorUap?: boolean;
      elaboradoPorDireccion?: boolean;
    } | null;
    if (informe?.recomendacion !== 'FAVORABLE' || !informe.elaboradoPorUap || !informe.elaboradoPorDireccion) {
      errores.push('el Informe General no está completo y recomendado favorablemente');
    }
  }
  if (errores.length) throw new Error(`No se puede archivar el expediente: ${errores.join('; ')}.`);
}

function prepararArchivos(planif: {
  id: string;
  cicloLectivo: number;
  datosPaac: Prisma.JsonValue;
  informePedagogico: Prisma.JsonValue | null;
  informeDisciplinar: Prisma.JsonValue | null;
  informeGeneral: Prisma.JsonValue | null;
  asignatura: {
    nombre: string;
    planEstudio: { ordenanza: string; carrera: { nombre: string; sede: { nombre: string } } };
  };
  docenteResponsable: { nombre: string; apellido: string };
  integrantes: { docenteId: string; cargoEnCatedra: string; docente: { nombre: string; apellido: string } }[];
}, paads: { docenteId: string; datosPaad: Prisma.JsonValue; docente: { nombre: string; apellido: string } }[],
numeroExpediente: string, numeroResolucion: string, fechaAprobacion: Date): ArchivoParaGenerar[] {
const tipos = tiposPdfExpediente();
exigirDictamenesAprobados(planif, tipos);
const archivos: ArchivoParaGenerar[] = [];

  if (tipos.includes('PAAC')) {
    archivos.push({ tipo: 'PAAC', nombreArchivo: 'PAAC.pdf', datos: planif.datosPaac });
  }
  if (tipos.includes('PAAD')) {
    const docentes = new Map(planif.integrantes.map((integrante) => [
      integrante.docenteId,
      integrante.cargoEnCatedra,
    ]));
    for (const paad of paads) {
      const cargo = docentes.get(paad.docenteId);
      if (!cargo) continue;
      const safeName = paad.docente.nombre.normalize('NFKD').replace(/[^\w-]+/g, '-');
      archivos.push({
        tipo: 'PAAD',
        docenteId: paad.docenteId,
        nombreArchivo: `PAAD-${safeName}.pdf`,
        datos: {
          docente: `${paad.docente.nombre} ${paad.docente.apellido}`,
          cargo,
          cicloLectivo: planif.cicloLectivo,
          actividades: paad.datosPaad,
        },
      });
    }
  }
  if (tipos.includes('INFORME_PEDAGOGICO')) {
    archivos.push({ tipo: 'INFORME_PEDAGOGICO', nombreArchivo: 'informe-pedagogico.pdf', datos: planif.informePedagogico });
  }
  if (tipos.includes('INFORME_DISCIPLINAR')) {
    archivos.push({ tipo: 'INFORME_DISCIPLINAR', nombreArchivo: 'informe-disciplinar.pdf', datos: planif.informeDisciplinar });
  }
  if (tipos.includes('INFORME_GENERAL')) {
    archivos.push({ tipo: 'INFORME_GENERAL', nombreArchivo: 'informe-general.pdf', datos: planif.informeGeneral });
  }

  return archivos;
}

export async function archivarExpedienteFinal(
  tx: Prisma.TransactionClient,
  planificacionId: string,
  numeroExpediente: string,
  numeroResolucion: string,
  fechaAprobacion: Date,
) {
  const tipos = tiposPdfExpediente();
  if (!tipos.length) return [];

  const planif = await tx.planificacion.findUniqueOrThrow({
    where: { id: planificacionId },
    include: {
      asignatura: { include: { planEstudio: { include: { carrera: { include: { sede: true } } } } } },
      docenteResponsable: true,
      integrantes: { include: { docente: true } },
    },
  });
  const paads = tipos.includes('PAAD')
    ? await tx.paadAnual.findMany({
        where: {
          cicloLectivo: planif.cicloLectivo,
          estado: 'APROBADO',
          docenteId: { in: planif.integrantes.map((integrante) => integrante.docenteId) },
        },
        include: { docente: true },
      })
    : [];
  const archivos = prepararArchivos(planif, paads, numeroExpediente, numeroResolucion, fechaAprobacion);
  if (!archivos.length) return [];

  await asegurarBucket();
  const s3 = getS3Client();
  const bucket = getS3Bucket();
  const metadata: { tipo: ArchivoExpedienteTipo; docenteId?: string; nombreArchivo: string }[] = [];

  for (const archivo of archivos) {
    const objectKey = `planificaciones/${planificacionId}/${archivo.tipo.toLowerCase()}${archivo.docenteId ? `/${archivo.docenteId}` : ''}.pdf`;
    const pdf = await generarPdfExpediente({
      tipo: archivo.tipo,
      titulo: TITULOS[archivo.tipo],
      contexto: {
        asignatura: planif.asignatura.nombre,
        carrera: planif.asignatura.planEstudio.carrera.nombre,
        sede: planif.asignatura.planEstudio.carrera.sede.nombre,
        cicloLectivo: planif.cicloLectivo,
        planEstudio: planif.asignatura.planEstudio.ordenanza,
        numeroExpediente,
        numeroResolucion,
        fechaAprobacion: fechaAprobacion.toLocaleDateString('es-AR'),
      },
      datos: archivo.datos,
    });
    const checksumSha256 = createHash('sha256').update(pdf).digest('hex');
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: pdf,
      ContentLength: pdf.byteLength,
      ContentType: 'application/pdf',
      Metadata: { sha256: checksumSha256 },
    }));
    await tx.archivoExpediente.upsert({
      where: { objectKey },
      create: {
        planificacionId,
        tipo: archivo.tipo,
        docenteId: archivo.docenteId,
        nombreArchivo: archivo.nombreArchivo,
        objectKey,
        checksumSha256,
        sizeBytes: pdf.byteLength,
      },
      update: {
        tipo: archivo.tipo,
        docenteId: archivo.docenteId,
        nombreArchivo: archivo.nombreArchivo,
        checksumSha256,
        sizeBytes: pdf.byteLength,
      },
    });
    metadata.push({ tipo: archivo.tipo, docenteId: archivo.docenteId, nombreArchivo: archivo.nombreArchivo });
  }

  return metadata;
}

export async function obtenerArchivoExpediente(id: string) {
  return prisma.archivoExpediente.findUnique({ where: { id } });
}

export async function descargarObjetoExpediente(objectKey: string) {
  const result = await getS3Client().send(new GetObjectCommand({
    Bucket: getS3Bucket(),
    Key: objectKey,
  }));
  if (!result.Body) throw new Error('El archivo existe en el índice, pero el objeto no está disponible en el almacenamiento.');
  return result.Body.transformToByteArray();
}

export function etiquetaTipoArchivo(tipo: ArchivoExpedienteTipo) {
  return TITULOS[tipo];
}
