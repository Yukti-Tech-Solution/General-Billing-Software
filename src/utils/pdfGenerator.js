import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToWords } from './numberToWords';

const PRIMARY = [43, 122, 139]; // #2B7A8B
const TEXT_PRIMARY = [51, 51, 51];
const TEXT_SECONDARY = [102, 102, 102];
const BORDER = [221, 221, 221];
const ROW_ALT = [247, 252, 254];
const WHITE = [255, 255, 255];

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
  // Use "Rs." instead of the rupee symbol because the
  // default jsPDF font does not render "₹" correctly
  // and can corrupt digits in some PDF viewers.
  return `${sign}Rs. ${formattedInteger}.${decimal}`;
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatQuantity = (quantity = 0) => Number(quantity || 0).toFixed(2);

const convertImageToBase64 = async (imageSource) => {
  if (!imageSource) return null;
  if (imageSource.startsWith('data:image')) return imageSource;

  try {
    const response = await fetch(imageSource);
    if (!response.ok) throw new Error('Unable to fetch logo');
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
  const { margins, pageWidth } = layout;
  const headerHeight = 50;

  // White background for the entire page
  doc.setFillColor(...WHITE);
  doc.rect(0, 0, pageWidth, layout.pageHeight, 'F');

  // Teal background for header section
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Company name - white text on teal background
  const companyName = company?.name || 'INVOICE';
  doc.setTextColor(...WHITE); // White text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  
  // Logo (left side, before company name)
  let nameX = margins.left;
  if (company?.logo) {
    try {
      const logoBase64 = await convertImageToBase64(company.logo);
      if (logoBase64) {
        const size = 30;
        doc.addImage(
          logoBase64,
          'PNG',
          margins.left,
          margins.top + 10,
          size,
          size,
          undefined,
          'FAST',
        );
        nameX = margins.left + size + 10;
      }
    } catch (error) {
      console.warn('Logo could not be loaded:', error);
    }
  }
  
  doc.text(companyName, nameX, margins.top + 20);

  // Company details below company name (white text)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  
  let detailY = margins.top + 28;
  if (company?.address) {
    doc.text(company.address, nameX, detailY);
    detailY += 5;
  }
  if (company?.phone) {
    doc.text(`Phone: ${company.phone}`, nameX, detailY);
    detailY += 5;
  }
  if (company?.gstin) {
    doc.text(`GSTIN: ${company.gstin}`, nameX, detailY);
    detailY += 5;
  }

  // Invoice number and date (right side, white text)
  const rightX = pageWidth - margins.right;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Invoice No: ${invoice?.invoice_number || ''}`, rightX, margins.top + 12, { align: 'right' });
  doc.text(`Date: ${invoice?.date ? new Date(invoice.date).toLocaleDateString() : ''}`, rightX, margins.top + 19, { align: 'right' });

  return headerHeight + margins.top + 6;
};

const addInvoiceInfoSection = (doc, invoice, customer, startY, layout) => {
  const { margins, contentWidth } = layout;
  const columnWidth = contentWidth / 2 - 4;
  const boxHeight = 32;

  doc.setDrawColor(...BORDER);
  doc.setFillColor(...WHITE);
  doc.rect(margins.left, startY, columnWidth, boxHeight);
  doc.rect(margins.left + columnWidth + 8, startY, columnWidth, boxHeight);

  // Left column - invoice info
  doc.setTextColor(...TEXT_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Invoice Info', margins.left + 4, startY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const leftLines = [
    [`Invoice No:`, invoice?.invoice_number || '-'],
    [`Date of Issue:`, formatDate(invoice?.date)],
    [`Due Date:`, formatDate(invoice?.due_date || invoice?.date)],
  ];
  leftLines.forEach((row, idx) => {
    const y = startY + 13 + idx * 6;
    doc.text(row[0], margins.left + 4, y);
    doc.text(row[1], margins.left + columnWidth - 4, y, { align: 'right' });
  });

  // Right column - Bill To
  const rightX = margins.left + columnWidth + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Bill To', rightX + 4, startY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const customerLines = [
    customer?.name || 'Customer Name',
    customer?.address,
    customer?.phone ? `Phone: ${customer.phone}` : null,
    customer?.email ? `Email: ${customer.email}` : null,
  ].filter(Boolean);

  customerLines.forEach((line, idx) => {
    const y = startY + 13 + idx * 6;
    doc.text(line, rightX + 4, y);
  });

  return startY + boxHeight + 10;
};

const addItemsTable = (doc, items, startY, layout) => {
  const { pageWidth, pageHeight, margins } = layout;

  const body = items.map((item) => [
    item.product_name || 'Item',
    item.description || '',
    formatQuantity(item.quantity),
    formatCurrency(item.price),
    formatCurrency(item.amount),
  ]);

  autoTable(doc, {
    startY,
    head: [['Item', 'Description', 'Hours', 'Rate', 'Amount']],
    body,
    theme: 'grid',
    styles: {
      fontSize: 9,
      textColor: TEXT_PRIMARY,
      lineColor: BORDER,
      lineWidth: 0.3,
      cellPadding: { top: 4, bottom: 4, right: 3, left: 3 },
    },
    headStyles: {
      fillColor: PRIMARY,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: { fillColor: ROW_ALT },
    bodyStyles: { fillColor: WHITE },
    columnStyles: {
      0: { cellWidth: 35, halign: 'left' },
      1: { cellWidth: 65, halign: 'left' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: margins.left, right: margins.right },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_SECONDARY);
      doc.text(`Page ${data.pageNumber}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
      if (data.pageNumber > 1) {
        doc.text('Continued from previous page...', margins.left, margins.top - 2);
      }
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
  const taxRate =
    invoice?.tax_rate != null
      ? Number(invoice.tax_rate)
      : (invoiceItems.reduce((sum, item) => sum + Number(item.tax_rate || 0), 0) /
          (invoiceItems.length || 1)) || 0;

  const totalsData = [
    ['Subtotal', formatCurrency(subtotal)],
    ...(discountAmount > 0
      ? [[`Discount (${discountPercent.toFixed(2)}%)`, `- ${formatCurrency(discountAmount)}`]]
      : []),
    [`Tax Rate`, `${taxRate.toFixed(2)}%`],
    [`Tax Amount`, formatCurrency(totalTaxAmount)],
    ['Total', formatCurrency(total)],
  ];

  const tableWidth = 90;
  const tableX = layout.pageWidth - layout.margins.right - tableWidth;

  autoTable(doc, {
    startY,
    body: totalsData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      textColor: TEXT_PRIMARY,
      cellPadding: { top: 3, bottom: 3, right: 4, left: 4 },
      halign: 'right',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: tableWidth - 40 },
      1: { halign: 'right', cellWidth: 40 },
    },
    margin: { left: tableX, right: layout.margins.right },
    didParseCell: (data) => {
      if (data.row.index === totalsData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 11;
        data.cell.styles.textColor = PRIMARY;
      }
    },
    didDrawCell: (data) => {
      if (data.row.index === totalsData.length - 1) {
        doc.setDrawColor(...PRIMARY);
        doc.setLineWidth(0.4);
        doc.line(
          tableX,
          data.cell.y - 1,
          tableX + tableWidth,
          data.cell.y - 1,
        );
      }
    },
  });

  return doc.lastAutoTable?.finalY || startY;
};

const addAmountInWordsSection = (doc, total, startY, layout) => {
  const { margins, contentWidth } = layout;
  const amountNumber = Number(total) || 0;
  const amountTextRaw = numberToWords(Number(amountNumber.toFixed(2)));
  const amountText = `${amountTextRaw.replace(/ Only$/, '')} Only`;
  const lines = doc.splitTextToSize(amountText, contentWidth - 10);
  const boxHeight = 10 + lines.length * 5;

  doc.setDrawColor(...BORDER);
  doc.rect(margins.left, startY, contentWidth, boxHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text('Amount in Words', margins.left + 4, startY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(lines, margins.left + 4, startY + 12);

  return startY + boxHeight + 8;
};

const addNotesSection = (doc, notes, startY, layout) => {
  if (!notes) return startY;
  const { margins, contentWidth } = layout;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text('Terms / Notes', margins.left, startY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_SECONDARY);
  const lines = doc.splitTextToSize(notes, contentWidth);
  doc.text(lines, margins.left, startY + 6);

  return startY + 6 + lines.length * 5;
};

const addFooter = (doc, layout) => {
  const { pageWidth, pageHeight } = layout;
  
  // Add branding footer with link
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_SECONDARY);
  const footerY = pageHeight - 10;
  
  // "Created by Yukti Tech Solution" text
  doc.text('Created by Yukti Tech Solution', 10, footerY);
  
  // Add clickable link (jsPDF supports textWithLink)
  try {
    doc.setTextColor(41, 128, 185); // Blue color for link
    doc.textWithLink('https://yuktitechsolution.co.in/', 10, footerY + 5, {
      url: 'https://yuktitechsolution.co.in/'
    });
  } catch (error) {
    // Fallback if textWithLink is not available
    doc.text('https://yuktitechsolution.co.in/', 10, footerY + 5);
  }
  
  // Reset text color
  doc.setTextColor(...TEXT_PRIMARY);
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

    currentY = await addHeader(doc, company, invoice, layout);
    currentY = addInvoiceInfoSection(doc, invoice, customer, currentY + 6, layout);

    const tableEndY = addItemsTable(doc, invoiceItems, currentY, layout);
    let sectionY = Math.max(tableEndY + 8, currentY + 8);

    sectionY = addTotalsSection(doc, invoice, invoiceItems, sectionY, layout) + 6;
    sectionY = addAmountInWordsSection(doc, invoice.total, sectionY, layout);
    sectionY = addNotesSection(doc, invoice.notes, sectionY + 2, layout);

    addFooter(doc, layout);

    // Check if we're in Electron environment
    if (window.electronAPI && window.electronAPI.saveInvoicePDF) {
      // Get PDF as ArrayBuffer
      const pdfArrayBuffer = doc.output('arraybuffer');
      const invoiceNumber = invoice.invoice_number || 'Invoice';
      const invoiceDate = invoice.date || new Date().toISOString();
      
      // Convert ArrayBuffer to Uint8Array for IPC transfer
      const uint8Array = new Uint8Array(pdfArrayBuffer);
      
      // Save PDF using new file system structure
      const pdfResult = await window.electronAPI.saveInvoicePDF({
        invoiceNumber,
        date: invoiceDate,
        pdfBuffer: Array.from(uint8Array) // Send as array for IPC
      });
      
      // Save metadata
      const invoiceData = {
        ...invoice,
        // Ensure customer_name is at top level for compatibility
        customer_name: invoice.customer_name || customer?.name || null,
        customer_phone: invoice.customer_phone || customer?.phone || null,
        customer_address: invoice.customer_address || customer?.address || null,
        customer_gstin: invoice.customer_gstin || customer?.gstin || null,
        // Also include nested customer object for detailed access
        customer: customer ? {
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          gstin: customer.gstin
        } : null,
        items: invoiceItems.map(item => ({
          product_name: item.product_name,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          amount: item.amount,
          tax_rate: item.tax_rate,
          hsn_code: item.hsn_code
        }))
      };
      
      const metadataResult = await window.electronAPI.saveInvoiceMetadata({
        invoiceNumber,
        date: invoiceDate,
        invoiceData
      });
      
      if (pdfResult.success && metadataResult.success) {
        return { success: true, filename: pdfResult.path, message: 'PDF saved successfully' };
      } else {
        throw new Error(pdfResult.error || metadataResult.error || 'Failed to save PDF');
      }
    } else if (window.electronAPI && window.electronAPI.savePDF) {
      // Fallback to old method
      const pdfOutput = doc.output('datauristring');
      const invoiceNumber = invoice.invoice_number || 'Invoice';
      const invoiceDate = invoice.date || new Date().toISOString();
      
      const result = await window.electronAPI.savePDF(pdfOutput, invoiceNumber, invoiceDate);
      
      if (result.success) {
        return { success: true, filename: result.filePath, message: 'PDF saved successfully' };
      } else {
        throw new Error(result.error || 'Failed to save PDF');
      }
    } else {
      // Fallback for browser environment
      const safeCustomerName = customer?.name
        ? customer.name.replace(/[^a-z0-9]/gi, '_')
        : 'Customer';
      const filename = `${invoice.invoice_number || 'Invoice'}_${safeCustomerName}.pdf`;
      doc.save(filename);
      return { success: true, filename };
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
};


