const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  dbInit: () => ipcRenderer.invoke('db-init'),
  dbQuery: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
  dbTransaction: (operations) => ipcRenderer.invoke('db-transaction', operations),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  printInvoice: () => ipcRenderer.invoke('print-invoice'),
  savePDF: (pdfData, invoiceNumber, invoiceDate) => ipcRenderer.invoke('save-pdf', pdfData, invoiceNumber, invoiceDate),
  getBillsPath: () => ipcRenderer.invoke('get-bills-path'),
  
  // Local file system storage methods
  saveInvoicePDF: (data) => ipcRenderer.invoke('save-invoice-pdf', data),
  saveInvoiceMetadata: (data) => ipcRenderer.invoke('save-invoice-metadata', data),
  loadAllInvoices: () => ipcRenderer.invoke('load-all-invoices'),
  openInvoicePDF: (data) => ipcRenderer.invoke('open-invoice-pdf', data),
  saveCompanySettings: (settings) => ipcRenderer.invoke('save-company-settings', settings),
  loadCompanySettings: () => ipcRenderer.invoke('load-company-settings'),
  openBillsFolder: () => ipcRenderer.invoke('open-bills-folder'),
  getBillsFolderPath: () => ipcRenderer.invoke('get-bills-folder-path'),
});

