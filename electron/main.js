const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    // icon: path.join(__dirname, '../public/icon.png'), // Uncomment and add icon.png to public/ folder
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5180';
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle database operations via IPC
const Database = require('better-sqlite3');
const dbPath = path.join(app.getPath('userData'), 'billing.db');
let db = null;

ipcMain.handle('db-init', () => {
  try {
    if (!db) {
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-query', (event, sql, params = []) => {
  try {
    if (!db) {
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
    }
    const stmt = db.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return { success: true, data: stmt.all(params) };
    } else {
      const result = stmt.run(params);
      return { success: true, data: result };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-transaction', (event, operations) => {
  try {
    if (!db) {
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
    }
    const transaction = db.transaction(() => {
      const results = [];
      for (const op of operations) {
        const stmt = db.prepare(op.sql);
        if (op.sql.trim().toUpperCase().startsWith('SELECT')) {
          results.push(stmt.all(op.params || []));
        } else {
          results.push(stmt.run(op.params || []));
        }
      }
      return results;
    });
    return { success: true, data: transaction() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

// Print functionality
ipcMain.handle('print-invoice', async () => {
  try {
    if (mainWindow) {
      mainWindow.webContents.print({ silent: false, printBackground: true }, (success, errorType) => {
        if (!success) {
          console.error('Print failed:', errorType);
        }
      });
      return { success: true };
    }
    return { success: false, error: 'Main window not available' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Save PDF with organized folder structure
ipcMain.handle('save-pdf', async (event, pdfData, invoiceNumber, invoiceDate) => {
  try {
    // Get project root directory (where the app is running from)
    const projectRoot = isDev ? process.cwd() : path.dirname(app.getPath('exe'));
    const dataDir = path.join(projectRoot, 'data', 'bills');
    
    // Create month-year folder format (e.g., "12-2025")
    const date = invoiceDate ? new Date(invoiceDate) : new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const monthYearFolder = `${month}-${year}`;
    
    const billsFolder = path.join(dataDir, monthYearFolder);
    
    // Create folders if they don't exist
    if (!fs.existsSync(billsFolder)) {
      fs.mkdirSync(billsFolder, { recursive: true });
    }
    
    // Generate safe filename
    const safeInvoiceNumber = invoiceNumber.replace(/[^a-z0-9]/gi, '_');
    const filename = `${safeInvoiceNumber}.pdf`;
    const filePath = path.join(billsFolder, filename);
    
    // Convert base64 to buffer and save
    const base64Data = pdfData.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving PDF:', error);
    return { success: false, error: error.message };
  }
});

// Get bills directory path
ipcMain.handle('get-bills-path', () => {
  try {
    const projectRoot = isDev ? process.cwd() : path.dirname(app.getPath('exe'));
    return path.join(projectRoot, 'data', 'bills');
  } catch (error) {
    return null;
  }
});

// ============================================
// Local File System Storage Implementation
// ============================================

const BASE_DIR = path.join(app.getPath('documents'), 'Bills');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];

// Initialize directory structure
async function initializeStorage() {
  try {
    await fsPromises.mkdir(BASE_DIR, { recursive: true });
    console.log('Bills directory created/verified:', BASE_DIR);
  } catch (error) {
    console.error('Error creating Bills directory:', error);
  }
}

// Get or create year/month folder
async function getInvoiceFolder(date) {
  const invoiceDate = new Date(date);
  const year = invoiceDate.getFullYear();
  const month = MONTHS[invoiceDate.getMonth()];
  
  const folderPath = path.join(BASE_DIR, year.toString(), month);
  await fsPromises.mkdir(folderPath, { recursive: true });
  
  return folderPath;
}

// Initialize storage on app ready
app.whenReady().then(() => {
  initializeStorage();
});

// Save invoice PDF
ipcMain.handle('save-invoice-pdf', async (event, { invoiceNumber, date, pdfBuffer }) => {
  try {
    const folder = await getInvoiceFolder(date);
    const filename = `${invoiceNumber}.pdf`;
    const filepath = path.join(folder, filename);
    
    // Convert array to Buffer if needed
    const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
    
    await fsPromises.writeFile(filepath, buffer);
    
    return { success: true, path: filepath };
  } catch (error) {
    console.error('Error saving invoice PDF:', error);
    return { success: false, error: error.message };
  }
});

// Save invoice metadata
ipcMain.handle('save-invoice-metadata', async (event, { invoiceNumber, date, invoiceData }) => {
  try {
    const folder = await getInvoiceFolder(date);
    const filename = `${invoiceNumber}.json`;
    const filepath = path.join(folder, filename);
    
    await fsPromises.writeFile(filepath, JSON.stringify(invoiceData, null, 2));
    
    return { success: true, path: filepath };
  } catch (error) {
    console.error('Error saving invoice metadata:', error);
    return { success: false, error: error.message };
  }
});

// Load all invoices
ipcMain.handle('load-all-invoices', async () => {
  try {
    const invoices = [];
    
    // Check if BASE_DIR exists
    if (!fs.existsSync(BASE_DIR)) {
      return { success: true, invoices: [] };
    }
    
    const years = await fsPromises.readdir(BASE_DIR);
    
    for (const year of years) {
      // Skip config files
      if (year.endsWith('.json')) continue;
      
      const yearPath = path.join(BASE_DIR, year);
      const stat = await fsPromises.stat(yearPath);
      
      // Only process directories
      if (!stat.isDirectory()) continue;
      
      const months = await fsPromises.readdir(yearPath);
      
      for (const month of months) {
        const monthPath = path.join(yearPath, month);
        const monthStat = await fsPromises.stat(monthPath);
        
        if (!monthStat.isDirectory()) continue;
        
        const files = await fsPromises.readdir(monthPath);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filepath = path.join(monthPath, file);
            const data = await fsPromises.readFile(filepath, 'utf-8');
            invoices.push(JSON.parse(data));
          }
        }
      }
    }
    
    // Sort by date descending
    invoices.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });
    
    return { success: true, invoices };
  } catch (error) {
    console.error('Error loading invoices:', error);
    return { success: false, error: error.message, invoices: [] };
  }
});

// Open invoice PDF
ipcMain.handle('open-invoice-pdf', async (event, { invoiceNumber, date }) => {
  try {
    const folder = await getInvoiceFolder(date);
    const filepath = path.join(folder, `${invoiceNumber}.pdf`);
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return { success: false, error: 'PDF file not found' };
    }
    
    await shell.openPath(filepath);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Save company settings
ipcMain.handle('save-company-settings', async (event, settings) => {
  try {
    const filepath = path.join(BASE_DIR, 'company-settings.json');
    await fsPromises.writeFile(filepath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving company settings:', error);
    return { success: false, error: error.message };
  }
});

// Load company settings
ipcMain.handle('load-company-settings', async () => {
  try {
    const filepath = path.join(BASE_DIR, 'company-settings.json');
    const data = await fsPromises.readFile(filepath, 'utf-8');
    return { success: true, settings: JSON.parse(data) };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: true, settings: null }; // No settings file yet
    }
    return { success: false, error: error.message };
  }
});

// Open Bills folder in file explorer
ipcMain.handle('open-bills-folder', async () => {
  try {
    await shell.openPath(BASE_DIR);
    return { success: true, path: BASE_DIR };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get Bills folder path (for display in UI)
ipcMain.handle('get-bills-folder-path', async () => {
  return { success: true, path: BASE_DIR };
});

