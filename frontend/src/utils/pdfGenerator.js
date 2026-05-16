import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * Generate and download a PDF with debtors for a specific category.
 * @param {string} categoria - Category name (e.g. "C7", "PRIMERA")
 * @param {Array} jugadores - Array of debtor objects with jugador, cuotas, totalAdeudado
 */
export const downloadMorososPDF = (categoria, jugadores) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Font configuration
  const PAGE_WIDTH = 210;
  const MARGIN = 15;

  // ── Title ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Club Deportivo', PAGE_WIDTH / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text(`Deudores - ${categoria}`, PAGE_WIDTH / 2, 29, { align: 'center' });

  // ── Date ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(130);
  const now = new Date();
  const dateStr = `Generado el ${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}`;
  doc.text(dateStr, PAGE_WIDTH / 2, 36, { align: 'center' });

  // ── Separator ──
  doc.setDrawColor(220);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, 40, PAGE_WIDTH - MARGIN, 40);

  // ── Table data ──
  const body = jugadores.map((m, i) => {
    const cuotasStr = m.cuotas
      .map((c) => `${MONTHS_SHORT[c.mes - 1]} ${c.anio}`)
      .join(', ');
    return [
      i + 1,
      m.jugador.nombre,
      cuotasStr,
      `$${m.totalAdeudado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
    ];
  });

  const totalGeneral = jugadores.reduce((s, m) => s + m.totalAdeudado, 0);

  // Footer row
  body.push([
    '',
    { content: 'TOTAL', styles: { fontStyle: 'bold', fontSize: 10 } },
    '',
    {
      content: `$${totalGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      styles: { fontStyle: 'bold', fontSize: 10 },
    },
  ]);

  // Use standalone autoTable(doc, options) instead of doc.autoTable()
  autoTable(doc, {
    startY: 45,
    head: [['#', 'Jugador', 'Cuotas Adeudadas', 'Total']],
    body,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: PAGE_WIDTH - 2 * MARGIN,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 80 },
      3: { cellWidth: 35, halign: 'right' },
    },
    footStyles: {
      fillColor: [241, 245, 249],
      fontStyle: 'bold',
    },
    didParseCell: (data) => {
      // Highlight the total row
      if (data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
    },
  });

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Página ${i} de ${pageCount}`,
      PAGE_WIDTH / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // ── Download ──
  const safeName = categoria.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`deudores_${safeName}.pdf`);
};
