// Database schema and initialization queries

export const createTables = `
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    gstin TEXT,
    logo TEXT,
    userId TEXT,
    cloudId TEXT,
    syncStatus TEXT DEFAULT 'pending',
    lastModified DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastModifiedBy TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    gstin TEXT,
    userId TEXT,
    cloudId TEXT,
    syncStatus TEXT DEFAULT 'pending',
    lastModified DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastModifiedBy TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL DEFAULT 0,
    hsn_code TEXT,
    tax_rate REAL NOT NULL DEFAULT 0,
    stock REAL NOT NULL DEFAULT 0,
    userId TEXT,
    cloudId TEXT,
    syncStatus TEXT DEFAULT 'pending',
    lastModified DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastModifiedBy TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    subtotal REAL NOT NULL DEFAULT 0,
    discount_percentage REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    balance REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    userId TEXT,
    cloudId TEXT,
    syncStatus TEXT DEFAULT 'pending',
    lastModified DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastModifiedBy TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS sync_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_name TEXT UNIQUE NOT NULL,
    last_sync_time DATETIME,
    sync_status TEXT DEFAULT 'idle',
    pending_count INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
  CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
  CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(product_id);
  CREATE INDEX IF NOT EXISTS idx_companies_userId ON companies(userId);
  CREATE INDEX IF NOT EXISTS idx_customers_userId ON customers(userId);
  CREATE INDEX IF NOT EXISTS idx_products_userId ON products(userId);
  CREATE INDEX IF NOT EXISTS idx_invoices_userId ON invoices(userId);
  CREATE INDEX IF NOT EXISTS idx_companies_syncStatus ON companies(syncStatus);
  CREATE INDEX IF NOT EXISTS idx_customers_syncStatus ON customers(syncStatus);
  CREATE INDEX IF NOT EXISTS idx_products_syncStatus ON products(syncStatus);
  CREATE INDEX IF NOT EXISTS idx_invoices_syncStatus ON invoices(syncStatus);
`;

// Migration queries to add sync fields to existing tables
export const migrationQueries = `
  -- Add sync fields to companies if they don't exist
  ALTER TABLE companies ADD COLUMN userId TEXT;
  ALTER TABLE companies ADD COLUMN cloudId TEXT;
  ALTER TABLE companies ADD COLUMN syncStatus TEXT DEFAULT 'pending';
  ALTER TABLE companies ADD COLUMN lastModified DATETIME DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE companies ADD COLUMN lastModifiedBy TEXT;

  -- Add sync fields to customers if they don't exist
  ALTER TABLE customers ADD COLUMN userId TEXT;
  ALTER TABLE customers ADD COLUMN cloudId TEXT;
  ALTER TABLE customers ADD COLUMN syncStatus TEXT DEFAULT 'pending';
  ALTER TABLE customers ADD COLUMN lastModified DATETIME DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE customers ADD COLUMN lastModifiedBy TEXT;

  -- Add sync fields to products if they don't exist
  ALTER TABLE products ADD COLUMN userId TEXT;
  ALTER TABLE products ADD COLUMN cloudId TEXT;
  ALTER TABLE products ADD COLUMN syncStatus TEXT DEFAULT 'pending';
  ALTER TABLE products ADD COLUMN lastModified DATETIME DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE products ADD COLUMN lastModifiedBy TEXT;

  -- Add sync fields to invoices if they don't exist
  ALTER TABLE invoices ADD COLUMN userId TEXT;
  ALTER TABLE invoices ADD COLUMN cloudId TEXT;
  ALTER TABLE invoices ADD COLUMN syncStatus TEXT DEFAULT 'pending';
  ALTER TABLE invoices ADD COLUMN lastModified DATETIME DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE invoices ADD COLUMN lastModifiedBy TEXT;
`;

// Helper function to check if a column exists
const columnExists = async (tableName, columnName) => {
  try {
    const result = await window.electronAPI.dbQuery(
      `PRAGMA table_info(${tableName})`
    );
    return result.some(col => col.name === columnName);
  } catch (error) {
    return false;
  }
};

// Helper function to add column if it doesn't exist
const addColumnIfNotExists = async (tableName, columnName, columnDefinition) => {
  try {
    const exists = await columnExists(tableName, columnName);
    if (!exists) {
      await window.electronAPI.dbQuery(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`
      );
    }
  } catch (error) {
    // Column might already exist, ignore error
    console.log(`Column ${columnName} might already exist in ${tableName}:`, error.message);
  }
};

export const initializeDatabase = async () => {
  try {
    // Split the SQL into individual statements
    const statements = createTables
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await window.electronAPI.dbQuery(statement);
    }

    // Run migrations for existing tables
    try {
      await addColumnIfNotExists('companies', 'userId', 'TEXT');
      await addColumnIfNotExists('companies', 'cloudId', 'TEXT');
      await addColumnIfNotExists('companies', 'syncStatus', "TEXT DEFAULT 'pending'");
      await addColumnIfNotExists('companies', 'lastModified', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfNotExists('companies', 'lastModifiedBy', 'TEXT');

      await addColumnIfNotExists('customers', 'userId', 'TEXT');
      await addColumnIfNotExists('customers', 'cloudId', 'TEXT');
      await addColumnIfNotExists('customers', 'syncStatus', "TEXT DEFAULT 'pending'");
      await addColumnIfNotExists('customers', 'lastModified', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfNotExists('customers', 'lastModifiedBy', 'TEXT');

      await addColumnIfNotExists('products', 'userId', 'TEXT');
      await addColumnIfNotExists('products', 'cloudId', 'TEXT');
      await addColumnIfNotExists('products', 'syncStatus', "TEXT DEFAULT 'pending'");
      await addColumnIfNotExists('products', 'lastModified', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfNotExists('products', 'lastModifiedBy', 'TEXT');

      await addColumnIfNotExists('invoices', 'userId', 'TEXT');
      await addColumnIfNotExists('invoices', 'cloudId', 'TEXT');
      await addColumnIfNotExists('invoices', 'syncStatus', "TEXT DEFAULT 'pending'");
      await addColumnIfNotExists('invoices', 'lastModified', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfNotExists('invoices', 'lastModifiedBy', 'TEXT');
    } catch (migrationError) {
      console.warn('Migration warnings (may be expected):', migrationError);
    }

    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error: error.message };
  }
};

