import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { numberToWords } from './numberToWords';

const BLACK = [0, 0, 0];
const LIGHT_GRAY = [245, 245, 245];
const VERY_LIGHT_GRAY = [250, 250, 250];

const formatCurrency = (amount = 0) => {
  const num = Number(amount) || 0;
  const sign = num < 0 ? '-' : '';
  const absolute = Math.abs(num).toFixed(2);
  const [integer, decimal] = absolute.split('.');
  const lastThree = integer.slice(-3);
  const otherNumbers = integer.slice(0, -3);
  const formattedInteger = otherNumbers
    ? `${otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}`
    : lastThree;

  return `${sign}₹ ${formattedInteger}.${decimal}`;
};

const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatQuantity = (quantity = 0) => Number(quantity || 0).toFixed(2);

const convertImageToBase64 = async (imageSource) => {
  if (!imageSource) return null;
  if (imageSource.startsWith('data:image')) {
    return imageSource;
  }

  try {
    const response = await fetch(imageSource);
    if (!response.ok) {
      throw new Error('Unable to fetch logo');
    }
    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Logo conversion failed:', error);
    return null;
  }
};

const addHeader = async (doc, company, invoice, layout) => {
  const { margins, contentWidth, pageWidth } = layout;
  let leftY = margins.top;
  let logoOffset = 0;

  if (company?.logo) {
    try {
      const logoBase64 = await convertImageToBase64(company.logo);
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margins.left, leftY, 40, 40);
        logoOffset = 45;
      }
    } catch (error) {
      console.warn('Logo could not be loaded:', error);
    }
  }

  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(company?.name || 'Company Name', margins.left + logoOffset, leftY + 5);
  leftY += 11;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const leftColumnWidth = contentWidth / 2 - 5;
  const leftDetails = [
    company?.address,
    company?.phone ? `Phone: ${company.phone}` : null,
    company?.gstin ? `GSTIN: ${company.gstin}` : null,
  ].filter(Boolean);

  leftDetails.forEach((detail) => {
    const lines = doc.splitTextToSize(detail, leftColumnWidth);
    lines.forEach((line) => {
      doc.text(line, margins.left + logoOffset, leftY);
      leftY += 5;
    });
  });

  let rightY = margins.top;
  const rightX = pageWidth - margins.right;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('INVOICE', rightX, rightY + 10, { align: 'right' });
  rightY += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Invoice No:', rightX - 60, rightY, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.text(invoice?.invoice_number || '-', rightX, rightY, { align: 'right' });
  rightY += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Date of Issue:', rightX - 60, rightY, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice?.date), rightX, rightY, { align: 'right' });

  const headerBottom = Math.max(leftY, rightY) + 6;
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.5);
  doc.line(margins.left, headerBottom, pageWidth - margins.right, headerBottom);

  return headerBottom + 4;
};

const addBillToSection = (doc, customer, startY, layout) => {
  const { margins, contentWidth } = layout;
  let currentY = startY + 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Bill To:', margins.left, currentY);
  currentY += 6;

  doc.setFontSize(11);
  doc.text(customer?.name || 'Customer Name', margins.left, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  if (customer?.phone) {
    doc.text(`Phone: ${customer.phone}`, margins.left, currentY);
    currentY += 5;
  }

  if (customer?.gstin) {
    doc.text(`GSTIN: ${customer.gstin}`, margins.left, currentY);
    currentY += 5;
  }

  if (customer?.address) {
    const lines = doc.splitTextToSize(customer.address, contentWidth);
    lines.forEach((line) => {
      doc.text(line, margins.left, currentY);
      currentY += 5;
    });
  }

  doc.line(margins.left, currentY + 2, margins.left + contentWidth, currentY + 2);
  return currentY + 8;
};

const addItemsTable = (doc, items, startY, layout) => {
  const { pageWidth, pageHeight, margins } = layout;
  const body = items.map((item, index) => [
    (index + 1).toString(),
    item.product_name || 'Item',
    item.hsn_code || '-',
    formatQuantity(item.quantity),
    formatCurrency(item.price),
    formatCurrency(item.amount),
  ]);

  doc.autoTable({
    startY,
    head: [['SR', 'Description / Item Name', 'HSN/SAC', 'Qty', 'Rate', 'Amount']],
    body,
    theme: 'grid',
    styles: {
      fontSize: 9,
      textColor: BLACK,
      lineColor: BLACK,
      lineWidth: 0.5,
      cellPadding: { top: 4, bottom: 4, right: 3, left: 3 },
    },
    headStyles: {
      fillColor: LIGHT_GRAY,
      textColor: BLACK,
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: VERY_LIGHT_GRAY,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { halign: 'right' },
      1: { halign: 'left' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { left: margins.left, right: margins.right },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setFontSize(9);
        doc.setTextColor(...BLACK);
        doc.text('Continued from previous page...', margins.left, margins.top);
      }
      doc.setFontSize(8);
      doc.text(
        `Page ${data.pageNumber}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' },
      );
    },
  });

  return doc.lastAutoTable?.finalY || startY;
};

const addTotalsSection = (doc, invoice, invoiceItems, startY, layout) => {
  const subtotal = Number(invoice?.subtotal) || 0;
  const discountAmount = Number(invoice?.discount_amount) || 0;
  const discountPercent = Number(invoice?.discount_percentage) || 0;
  const totalTaxAmount = Number(invoice?.tax_amount) || 0;
  const total = Number(invoice?.total) || subtotal;

  const avgTaxRate = invoice?.tax_rate
    ? Number(invoice.tax_rate)
    : (invoiceItems.reduce((sum, item) => sum + Number(item.tax_rate || 0), 0) / invoiceItems.length) || 0;

  const cgstRate = avgTaxRate / 2;
  const sgstRate = avgTaxRate / 2;
  const cgstAmount = totalTaxAmount / 2;
  const sgstAmount = totalTaxAmount / 2;

  const totalsData = [
    ['Subtotal', formatCurrency(subtotal)],
    ...(discountAmount > 0
      ? [[`Discount (${discountPercent.toFixed(2)}%)`, `- ${formatCurrency(discountAmount)}`]]
      : []),
    [`CGST (${cgstRate.toFixed(2)}%)`, formatCurrency(cgstAmount)],
    [`SGST (${sgstRate.toFixed(2)}%)`, formatCurrency(sgstAmount)],
    ['Total', formatCurrency(total)],
  ];

  const tableMarginLeft = layout.pageWidth - layout.margins.right - 180;
  doc.autoTable({
    startY,
    body: totalsData,
    theme: 'grid',
    styles: {
      fontSize: 10,
      textColor: BLACK,
      lineColor: BLACK,
      lineWidth: 0.5,
      fontStyle: 'bold',
      cellPadding: { top: 4, bottom: 4, right: 4, left: 4 },
      halign: 'right',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 110 },
      1: { halign: 'right', cellWidth: 70 },
    },
    margin: { left: tableMarginLeft, right: layout.margins.right },
    didDrawCell: (data) => {
      if (data.row.index === totalsData.length - 1) {
        data.cell.styles.fontSize = 11;
      }
    },
  });

  return doc.lastAutoTable?.finalY || startY;
};

const addPaymentSection = (doc, invoice, startY, layout) => {
  const paid = Number(invoice?.paid_amount) || 0;
  const total = Number(invoice?.total) || 0;
  const balance = Math.max(total - paid, 0);

  const data = [
    ['Received', formatCurrency(paid)],
    balance > 0 ? ['Balance', formatCurrency(balance)] : ['You Saved', formatCurrency(Math.abs(balance))],
  ];

  const tableMarginLeft = layout.pageWidth - layout.margins.right - 180;
  doc.autoTable({
    startY,
    body: data,
    theme: 'grid',
    styles: {
      fontSize: 10,
      textColor: BLACK,
      lineColor: BLACK,
      lineWidth: 0.5,
      fontStyle: 'bold',
      cellPadding: { top: 4, bottom: 4, right: 4, left: 4 },
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 110 },
      1: { halign: 'right', cellWidth: 70 },
    },
    margin: { left: tableMarginLeft, right: layout.margins.right },
  });

  return doc.lastAutoTable?.finalY || startY;
};

const addAmountInWordsSection = (doc, total, startY, layout) => {
  const { margins, contentWidth } = layout;
  const amountNumber = Number(total) || 0;
  const amountTextRaw = numberToWords(Number(amountNumber.toFixed(2)));
  const amountText = `${amountTextRaw.replace(/ Only$/, '')} Only`;
  const lines = doc.splitTextToSize(amountText, contentWidth - 10);
  const boxHeight = 12 + lines.length * 5;

  doc.setDrawColor(...BLACK);
  doc.rect(margins.left, startY, contentWidth, boxHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Amount in Words:', margins.left + 4, startY + 7);

  doc.setFontSize(10);
  doc.text(lines, margins.left + 4, startY + 13);

  return startY + boxHeight + 6;
};

const addNotesSection = (doc, notes, startY, layout) => {
  if (!notes) {
    return startY;
  }

  const { margins, contentWidth } = layout;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Terms & Conditions / Notes:', margins.left, startY);
  const bodyY = startY + 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(notes, contentWidth);
  doc.text(lines, margins.left, bodyY);

  return bodyY + lines.length * 5 + 4;
};

const addFooter = (doc, layout) => {
  const { pageWidth } = layout;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text(
    'Thank you for doing business with us!',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 20,
    { align: 'center' },
  );
};

export const generateInvoicePDF = async (invoice, company, customer, invoiceItems) => {
  try {
    if (!invoice || !company || !customer || !invoiceItems) {
      throw new Error('Missing required invoice data');
    }

    if (!Array.isArray(invoiceItems) || invoiceItems.length === 0) {
      throw new Error('Invoice must have at least one item');
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const margins = { top: 15, bottom: 20, left: 15, right: 15 };
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const layout = {
      margins,
      pageWidth,
      pageHeight,
      contentWidth: pageWidth - margins.left - margins.right,
    };

    let currentY = margins.top;

    try {
      currentY = await addHeader(doc, company, invoice, layout);
    } catch (error) {
      console.error('Header generation error:', error);
    }

    try {
      currentY = addBillToSection(doc, customer, currentY, layout);
    } catch (error) {
      console.error('Bill To section error:', error);
    }

    let tableEndY = currentY;
    try {
      tableEndY = addItemsTable(doc, invoiceItems, currentY + 6, layout);
    } catch (error) {
      console.error('Items table error:', error);
    }

    let sectionY = Math.max(tableEndY + 8, currentY + 8);
    try {
      sectionY = addTotalsSection(doc, invoice, invoiceItems, sectionY, layout) + 6;
    } catch (error) {
      console.error('Totals section error:', error);
    }

    try {
      sectionY = addPaymentSection(doc, invoice, sectionY + 4, layout) + 6;
    } catch (error) {
      console.error('Payment section error:', error);
    }

    try {
      sectionY = addAmountInWordsSection(doc, invoice.total, sectionY + 6, layout);
    } catch (error) {
      console.error('Amount in words section error:', error);
    }

    try {
      sectionY = addNotesSection(doc, invoice.notes, sectionY + 6, layout);
    } catch (error) {
      console.error('Notes section error:', error);
    }

    addFooter(doc, layout);

    const safeCustomerName = customer?.name
      ? customer.name.replace(/[^a-z0-9]/gi, '_')
      : 'Customer';
    const filename = `${invoice.invoice_number || 'Invoice'}_${safeCustomerName}.pdf`;

    doc.save(filename);
    return { success: true, filename };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
};


