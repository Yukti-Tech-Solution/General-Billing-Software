// Database operations wrapper
import { syncCompany, syncProducts, syncCustomers, syncInvoices } from './syncManager';

// Helper function to get device ID
const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

// Helper function to get user ID
const getUserId = () => {
  return localStorage.getItem('userId') || null;
};

// Helper function to trigger sync (with retry logic)
const triggerSync = async (syncFunction, maxRetries = 3) => {
  const userId = getUserId();
  if (!userId) return; // No user logged in, skip sync

  let retries = 0;
  while (retries < maxRetries) {
    try {
      if (navigator.onLine) {
        await syncFunction();
      }
      break; // Success, exit retry loop
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        console.error('Sync failed after retries:', error);
      } else {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }
  }
};

export const dbQuery = async (sql, params = []) => {
  try {
    const result = await window.electronAPI.dbQuery(sql, params);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const dbTransaction = async (operations) => {
  try {
    const result = await window.electronAPI.dbTransaction(operations);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  } catch (error) {
    console.error('Database transaction error:', error);
    throw error;
  }
};

// Company operations
export const getCompany = async () => {
  const result = await dbQuery('SELECT * FROM companies LIMIT 1');
  return result.length > 0 ? result[0] : null;
};

export const saveCompany = async (company) => {
  const userId = getUserId();
  const deviceId = getDeviceId();
  const now = new Date().toISOString();
  
  const existing = await getCompany();
  if (existing) {
    await dbQuery(
      `UPDATE companies SET 
       name = ?, phone = ?, address = ?, gstin = ?, logo = ?,
       userId = ?, syncStatus = 'pending', lastModified = ?, lastModifiedBy = ?
       WHERE id = ?`,
      [company.name, company.phone, company.address, company.gstin, company.logo, 
       userId, now, deviceId, existing.id]
    );
    
    // Trigger sync in background
    triggerSync(syncCompany);
    return existing.id;
  } else {
    const result = await dbQuery(
      `INSERT INTO companies (name, phone, address, gstin, logo, userId, syncStatus, lastModified, lastModifiedBy) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [company.name, company.phone, company.address, company.gstin, company.logo, userId, now, deviceId]
    );
    
    // Trigger sync in background
    triggerSync(syncCompany);
    return result.lastInsertRowid;
  }
};

// Customer operations
export const getCustomers = async (search = '') => {
  if (search) {
    return await dbQuery(
      'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name',
      [`%${search}%`, `%${search}%`]
    );
  }
  return await dbQuery('SELECT * FROM customers ORDER BY name');
};

export const getCustomer = async (id) => {
  const result = await dbQuery('SELECT * FROM customers WHERE id = ?', [id]);
  return result.length > 0 ? result[0] : null;
};

export const saveCustomer = async (customer) => {
  const userId = getUserId();
  const deviceId = getDeviceId();
  const now = new Date().toISOString();
  
  if (customer.id) {
    await dbQuery(
      `UPDATE customers SET 
       name = ?, phone = ?, address = ?, gstin = ?,
       userId = ?, syncStatus = 'pending', lastModified = ?, lastModifiedBy = ?
       WHERE id = ?`,
      [customer.name, customer.phone, customer.address, customer.gstin, 
       userId, now, deviceId, customer.id]
    );
    
    // Trigger sync in background
    triggerSync(syncCustomers);
    return customer.id;
  } else {
    const result = await dbQuery(
      `INSERT INTO customers (name, phone, address, gstin, userId, syncStatus, lastModified, lastModifiedBy) 
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [customer.name, customer.phone, customer.address, customer.gstin, userId, now, deviceId]
    );
    
    // Trigger sync in background
    triggerSync(syncCustomers);
    return result.lastInsertRowid;
  }
};

export const deleteCustomer = async (id) => {
  // Mark for deletion in cloud (soft delete approach)
  // For hard delete, you might want to sync deletion to Firebase
  await dbQuery('DELETE FROM customers WHERE id = ?', [id]);
  
  // Note: In production, you might want to mark as deleted and sync deletion
  // For now, we'll just delete locally
};

// Product operations
export const getProducts = async (search = '') => {
  if (search) {
    return await dbQuery(
      'SELECT * FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY name',
      [`%${search}%`, `%${search}%`]
    );
  }
  return await dbQuery('SELECT * FROM products ORDER BY name');
};

export const getProduct = async (id) => {
  const result = await dbQuery('SELECT * FROM products WHERE id = ?', [id]);
  return result.length > 0 ? result[0] : null;
};

export const saveProduct = async (product) => {
  const userId = getUserId();
  const deviceId = getDeviceId();
  const now = new Date().toISOString();
  
  if (product.id) {
    await dbQuery(
      `UPDATE products SET 
       name = ?, description = ?, price = ?, hsn_code = ?, tax_rate = ?, stock = ?,
       userId = ?, syncStatus = 'pending', lastModified = ?, lastModifiedBy = ?
       WHERE id = ?`,
      [product.name, product.description, product.price, product.hsn_code, product.tax_rate, product.stock,
       userId, now, deviceId, product.id]
    );
    
    // Trigger sync in background
    triggerSync(syncProducts);
    return product.id;
  } else {
    const result = await dbQuery(
      `INSERT INTO products (name, description, price, hsn_code, tax_rate, stock, userId, syncStatus, lastModified, lastModifiedBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [product.name, product.description, product.price, product.hsn_code, product.tax_rate, product.stock, userId, now, deviceId]
    );
    
    // Trigger sync in background
    triggerSync(syncProducts);
    return result.lastInsertRowid;
  }
};

export const deleteProduct = async (id) => {
  // Mark for deletion in cloud (soft delete approach)
  await dbQuery('DELETE FROM products WHERE id = ?', [id]);
  
  // Note: In production, you might want to mark as deleted and sync deletion
};

// Invoice operations
export const getNextInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const result = await dbQuery(
    "SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1",
    [`INV-${year}-%`]
  );
  
  if (result.length === 0) {
    return `INV-${year}-001`;
  }
  
  const lastNumber = result[0].invoice_number;
  const parts = lastNumber.split('-');
  const lastSeq = parseInt(parts[2]) || 0;
  const nextSeq = (lastSeq + 1).toString().padStart(3, '0');
  return `INV-${year}-${nextSeq}`;
};

export const getInvoices = async (fromDate = null, toDate = null) => {
  if (fromDate && toDate) {
    return await dbQuery(
      `SELECT i.*, c.name as customer_name, c.phone as customer_phone 
       FROM invoices i 
       LEFT JOIN customers c ON i.customer_id = c.id 
       WHERE i.date >= ? AND i.date <= ? 
       ORDER BY i.date DESC, i.id DESC`,
      [fromDate, toDate]
    );
  }
  return await dbQuery(
    `SELECT i.*, c.name as customer_name, c.phone as customer_phone 
     FROM invoices i 
     LEFT JOIN customers c ON i.customer_id = c.id 
     ORDER BY i.date DESC, i.id DESC`
  );
};

export const getInvoice = async (id) => {
  const result = await dbQuery(
    `SELECT i.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address, c.gstin as customer_gstin
     FROM invoices i 
     LEFT JOIN customers c ON i.customer_id = c.id 
     WHERE i.id = ?`,
    [id]
  );
  return result.length > 0 ? result[0] : null;
};

export const getInvoiceItems = async (invoiceId) => {
  return await dbQuery(
    `SELECT ii.*, p.name as product_name, p.hsn_code, p.tax_rate 
     FROM invoice_items ii 
     LEFT JOIN products p ON ii.product_id = p.id 
     WHERE ii.invoice_id = ?`,
    [invoiceId]
  );
};

export const saveInvoice = async (invoice, items) => {
  const userId = getUserId();
  const deviceId = getDeviceId();
  const now = new Date().toISOString();
  let invoiceId;
  
  if (invoice.id) {
    // Update invoice
    await dbQuery(
      `UPDATE invoices SET 
        customer_id = ?, date = ?, subtotal = ?, discount_percentage = ?, 
        discount_amount = ?, tax_amount = ?, total = ?, paid_amount = ?, 
        balance = ?, status = ?, notes = ?,
        userId = ?, syncStatus = 'pending', lastModified = ?, lastModifiedBy = ?
        WHERE id = ?`,
      [
        invoice.customer_id, invoice.date, invoice.subtotal,
        invoice.discount_percentage, invoice.discount_amount,
        invoice.tax_amount, invoice.total, invoice.paid_amount,
        invoice.balance, invoice.status, invoice.notes,
        userId, now, deviceId, invoice.id
      ]
    );
    
    // Delete old items
    await dbQuery('DELETE FROM invoice_items WHERE invoice_id = ?', [invoice.id]);
    invoiceId = invoice.id;
  } else {
    // Insert new invoice
    const result = await dbQuery(
      `INSERT INTO invoices (
        invoice_number, customer_id, date, subtotal, discount_percentage,
        discount_amount, tax_amount, total, paid_amount, balance, status, notes,
        userId, syncStatus, lastModified, lastModifiedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        invoice.invoice_number, invoice.customer_id, invoice.date,
        invoice.subtotal, invoice.discount_percentage, invoice.discount_amount,
        invoice.tax_amount, invoice.total, invoice.paid_amount,
        invoice.balance, invoice.status, invoice.notes,
        userId, now, deviceId
      ]
    );
    invoiceId = result.lastInsertRowid;
  }
  
  // Insert items
  for (const item of items) {
    await dbQuery(
      'INSERT INTO invoice_items (invoice_id, product_id, quantity, price, amount) VALUES (?, ?, ?, ?, ?)',
      [invoiceId, item.product_id, item.quantity, item.price, item.amount]
    );
  }
  
  // Trigger sync in background
  triggerSync(syncInvoices);
  return invoiceId;
};

export const deleteInvoice = async (id) => {
  // Mark for deletion in cloud (soft delete approach)
  await dbQuery('DELETE FROM invoices WHERE id = ?', [id]);
  
  // Note: In production, you might want to mark as deleted and sync deletion
};

// Dashboard statistics
export const getDashboardStats = async () => {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  
  const todaySales = await dbQuery(
    'SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE date = ?',
    [today]
  );
  
  const monthSales = await dbQuery(
    'SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE date >= ?',
    [monthStart]
  );
  
  const yearSales = await dbQuery(
    'SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE date >= ?',
    [yearStart]
  );
  
  const totalInvoices = await dbQuery('SELECT COUNT(*) as count FROM invoices');
  
  const pendingPayments = await dbQuery(
    'SELECT COALESCE(SUM(balance), 0) as total FROM invoices WHERE balance > 0'
  );
  
  const recentInvoices = await dbQuery(
    `SELECT i.*, c.name as customer_name 
     FROM invoices i 
     LEFT JOIN customers c ON i.customer_id = c.id 
     ORDER BY i.created_at DESC 
     LIMIT 10`
  );
  
  return {
    todaySales: todaySales[0].total || 0,
    monthSales: monthSales[0].total || 0,
    yearSales: yearSales[0].total || 0,
    totalInvoices: totalInvoices[0].count || 0,
    pendingPayments: pendingPayments[0].total || 0,
    recentInvoices: recentInvoices || []
  };
};

