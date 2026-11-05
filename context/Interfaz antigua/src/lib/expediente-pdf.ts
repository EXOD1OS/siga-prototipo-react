import PDFDocument from 'pdfkit';
import { join } from 'node:path';

export type ExpedientePdfContext = {
  asignatura: string;
  carrera: string;
  sede: string;
  cicloLectivo: number;
  planEstudio: string;
  numeroExpediente: string;
  numeroResolucion: string;
  fechaAprobacion: string;
};

type PdfInput = {
  tipo?: 'PAAC' | 'PAAD' | 'INFORME_PEDAGOGICO' | 'INFORME_DISCIPLINAR' | 'INFORME_GENERAL';
  titulo: string;
  contexto: ExpedientePdfContext;
  datos: unknown;
};

function etiqueta(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (first) => first.toLocaleUpperCase('es-AR'));
}

function valorEscalar(value: string | number | boolean) {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'string' && /^[A-Z0-9_]+$/.test(value)) {
    return value.replaceAll('_', ' ').toLocaleLowerCase('es-AR').replace(/^./, (first) => first.toLocaleUpperCase('es-AR'));
  }
  return String(value);
}

function renderizarDato(doc: PDFKit.PDFDocument, nombre: string, valor: unknown, nivel = 0) {
  if (valor === null || valor === undefined || nivel > 12) return;
  const sangria = 48 + nivel * 10;
  if (Array.isArray(valor)) {
    doc.moveDown(0.35).font('Helvetica-Bold').fontSize(10).fillColor('#17345a').text(etiqueta(nombre), sangria);
    if (!valor.length) {
      doc.font('Helvetica').fontSize(9).fillColor('#222222').text('Sin registros.', sangria + 8);
      return;
    }
    valor.forEach((elemento, indice) => {
      if (elemento && typeof elemento === 'object') {
        doc.moveDown(0.2).font('Helvetica-Bold').fontSize(9).fillColor('#333333').text(`${etiqueta(nombre)} ${indice + 1}`, sangria + 8);
        if (Array.isArray(elemento)) renderizarDato(doc, 'Detalle', elemento, nivel + 1);
        else Object.entries(elemento as Record<string, unknown>).forEach(([clave, item]) => renderizarDato(doc, clave, item, nivel + 1));
      } else {
        doc.font('Helvetica').fontSize(9).fillColor('#222222').text(`• ${valorEscalar(elemento as string | number | boolean)}`, sangria + 8);
      }
    });
    return;
  }

  if (typeof valor === 'object') {
    doc.moveDown(0.35).font('Helvetica-Bold').fontSize(nivel === 0 ? 11 : 10).fillColor('#17345a').text(etiqueta(nombre), sangria);
    Object.entries(valor as Record<string, unknown>).forEach(([clave, item]) => renderizarDato(doc, clave, item, nivel + 1));
    return;
  }

  const texto = valorEscalar(valor as string | number | boolean);
  const anchoValor = 320 - nivel * 10;
  doc.font('Helvetica').fontSize(9);
  const altoValor = doc.heightOfString(texto, { width: anchoValor });
  doc.font('Helvetica-Bold').fontSize(9);
  const altoEtiqueta = doc.heightOfString(etiqueta(nombre), { width: 150 });
  const alto = Math.max(altoValor, altoEtiqueta, 13) + 6;
  if (doc.y + alto > doc.page.height - 100) doc.addPage();
  const y = doc.y;
  doc.font('Helvetica').fontSize(9).fillColor('#64748b')
    .text(etiqueta(nombre), sangria + 2, y, { width: 150 });
  doc.fillColor('#1e293b')
    .text(texto, sangria + 164, y, { width: anchoValor });
  doc.y = y + alto;
}

function renderizarSeccion(doc: PDFKit.PDFDocument, nombre: string, valor: unknown) {
  const camposSimples = valor && typeof valor === 'object' && !Array.isArray(valor)
    ? Object.values(valor as Record<string, unknown>).every((item) => item === null || typeof item !== 'object')
      ? Object.values(valor as Record<string, unknown>).length
      : 0
    : 0;
  const altoMinimo = 10 + 30 + Math.max(22, Math.min(camposSimples, 5) * 19);
  if (doc.y + altoMinimo > doc.page.height - 100) doc.addPage();
  doc.y += 10;
  const y = doc.y;
  doc.rect(48, y, 499, 23).fill('#eff5fb');
  doc.rect(48, y, 3, 23).fill('#c65c22');
  const titulo = nombre === 'encabezado' ? 'Aspectos generales' : etiqueta(nombre);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#17345a')
    .text(titulo.toLocaleUpperCase('es-AR'), 59, y + 6, { width: 480 });
  doc.y = y + 30;
  if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
    Object.entries(valor as Record<string, unknown>).forEach(([clave, item]) => renderizarDato(doc, clave, item));
  } else {
    renderizarDato(doc, 'Detalle', valor);
  }
}

export async function generarPdfExpediente({ tipo, titulo, contexto, datos }: PdfInput): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 52, right: 48, bottom: 90, left: 48 },
    bufferPages: true,
    info: { Title: titulo, Author: 'SIGA-Planificaciones — UNLaR', Subject: 'Expediente académico finalizado' },
  });
  const chunks: Buffer[] = [];
  const resultado = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.font('Helvetica-Bold').fontSize(8).fillColor('#17345a')
    .text('UNIVERSIDAD NACIONAL DE LA RIOJA · DACEFyN', 48, 55, { width: 415, characterSpacing: 0.8 });
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#10213d')
    .text(titulo, 48, 77, { width: 415 });
  doc.image(join(process.cwd(), 'public', 'unlar-escudo.png'), 477, 54, { fit: [64, 64] });
  const finTitulo = Math.max(doc.y, 122);
  doc.moveTo(48, finTitulo + 10).lineTo(547, finTitulo + 10).lineWidth(1.5).strokeColor('#c65c22').stroke();
  doc.y = finTitulo + 22;

  renderizarSeccion(doc, 'Datos del expediente', {
    sede: contexto.sede,
    carrera: contexto.carrera,
    planEstudio: contexto.planEstudio,
    asignatura: contexto.asignatura,
    cicloLectivo: contexto.cicloLectivo,
    numeroExpediente: contexto.numeroExpediente,
    numeroResolucion: contexto.numeroResolucion,
    fechaAprobacion: contexto.fechaAprobacion,
  });

  if (datos && typeof datos === 'object' && !Array.isArray(datos)) {
    const entradas = Object.entries(datos as Record<string, unknown>);
    if (tipo?.startsWith('INFORME_')) {
      const secciones = entradas.filter(([, valor]) => valor !== null && typeof valor === 'object');
      const campos = entradas.filter(([, valor]) => valor === null || typeof valor !== 'object');
      secciones.forEach(([clave, valor]) => renderizarSeccion(doc, clave, valor));
      if (campos.length) {
        renderizarSeccion(doc, tipo === 'INFORME_GENERAL' ? 'Conclusión del informe' : 'Dictamen y observaciones', Object.fromEntries(campos));
      }
    } else {
      entradas.forEach(([clave, valor]) => renderizarSeccion(doc, clave, valor));
    }
  } else {
    renderizarSeccion(doc, 'Contenido', datos);
  }

  const paginas = doc.bufferedPageRange();
  for (let pagina = 0; pagina < paginas.count; pagina += 1) {
    doc.switchToPage(paginas.start + pagina);
    const margenInferior = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = doc.page.height - 75;
    doc.strokeColor('#e2e8f0').moveTo(48, y - 8).lineTo(547, y - 8).stroke();
    doc.font('Helvetica').fontSize(8).fillColor('#64748b')
      .text(`Documento archivado · ${contexto.numeroExpediente}`, 48, y, { width: 360, lineBreak: false });
    doc.text(`Página ${pagina + 1} de ${paginas.count}`, 420, y, { width: 127, align: 'right', lineBreak: false });
    doc.page.margins.bottom = margenInferior;
  }

  doc.end();
  return resultado;
}
