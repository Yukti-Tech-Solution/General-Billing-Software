const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
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

