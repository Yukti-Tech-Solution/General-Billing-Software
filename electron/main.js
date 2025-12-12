const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
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

