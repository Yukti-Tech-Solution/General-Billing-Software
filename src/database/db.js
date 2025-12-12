// Database operations wrapper
import { syncCompany, syncProducts, syncCustomers, syncInvoices } from './syncManager';
import { generateLicenseKey } from '../utils/licenseGenerator';

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

// Quick customer helper
export const insertQuickCustomer = async (customer) => {
  return await saveCustomer(customer);
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

// Quick product helper
export const insertQuickProduct = async (product) => {
  return await saveProduct(product);
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
      `SELECT i.*, 
              COALESCE(i.customer_name, c.name) as customer_name, 
              COALESCE(i.customer_phone, c.phone) as customer_phone 
       FROM invoices i 
       LEFT JOIN customers c ON i.customer_id = c.id 
       WHERE i.date >= ? AND i.date <= ? 
       ORDER BY i.date DESC, i.id DESC`,
      [fromDate, toDate]
    );
  }
  return await dbQuery(
    `SELECT i.*, 
            COALESCE(i.customer_name, c.name) as customer_name, 
            COALESCE(i.customer_phone, c.phone) as customer_phone 
     FROM invoices i 
     LEFT JOIN customers c ON i.customer_id = c.id 
     ORDER BY i.date DESC, i.id DESC`
  );
};

export const getInvoice = async (id) => {
  const result = await dbQuery(
    `SELECT i.*, 
            COALESCE(i.customer_name, c.name) as customer_name, 
            COALESCE(i.customer_phone, c.phone) as customer_phone, 
            COALESCE(i.customer_address, c.address) as customer_address, 
            COALESCE(i.customer_gstin, c.gstin) as customer_gstin
     FROM invoices i 
     LEFT JOIN customers c ON i.customer_id = c.id 
     WHERE i.id = ?`,
    [id]
  );
  return result.length > 0 ? result[0] : null;
};

export const getInvoiceItems = async (invoiceId) => {
  return await dbQuery(
    `SELECT ii.*, 
            COALESCE(ii.product_name, p.name) as product_name, 
            COALESCE(ii.hsn_code, p.hsn_code) as hsn_code, 
            COALESCE(ii.tax_rate, p.tax_rate) as tax_rate,
            COALESCE(ii.description, p.description) as description
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
        customer_id = ?, customer_name = ?, customer_phone = ?, customer_address = ?, customer_gstin = ?, 
        date = ?, subtotal = ?, discount_percentage = ?, 
        discount_amount = ?, tax_amount = ?, total = ?, paid_amount = ?, 
        balance = ?, status = ?, notes = ?,
        userId = ?, syncStatus = 'pending', lastModified = ?, lastModifiedBy = ?
        WHERE id = ?`,
      [
        invoice.customer_id || null,
        invoice.customer_name || null,
        invoice.customer_phone || null,
        invoice.customer_address || null,
        invoice.customer_gstin || null,
        invoice.date, invoice.subtotal,
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
        invoice_number, customer_id, customer_name, customer_phone, customer_address, customer_gstin,
        date, subtotal, discount_percentage,
        discount_amount, tax_amount, total, paid_amount, balance, status, notes,
        userId, syncStatus, lastModified, lastModifiedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        invoice.invoice_number, invoice.customer_id || null,
        invoice.customer_name || null, invoice.customer_phone || null,
        invoice.customer_address || null, invoice.customer_gstin || null,
        invoice.date,
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
      `INSERT INTO invoice_items (
        invoice_id, product_id, product_name, description, hsn_code, tax_rate, quantity, price, amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        item.product_id || null,
        item.product_name || null,
        item.description || null,
        item.hsn_code || null,
        item.tax_rate || 0,
        item.quantity,
        item.price,
        item.amount
      ]
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

// License operations
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const insertLicense = async ({ email, name, durationDays = 365, notes = '' }) => {
  const activationDate = new Date();
  const expiryDate = addDays(activationDate, durationDays);
  const licenseKey = generateLicenseKey();
  const result = await dbQuery(
    `INSERT INTO licenses (customer_email, customer_name, activation_date, expiry_date, is_active, license_key, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      email.trim().toLowerCase(),
      name,
      activationDate.toISOString(),
      expiryDate.toISOString(),
      1,
      licenseKey,
      notes
    ]
  );
  return { id: result.lastInsertRowid, license_key: licenseKey, expiry_date: expiryDate.toISOString() };
};

export const getLicenses = async (search = '') => {
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    return await dbQuery(
      `SELECT * FROM licenses 
       WHERE LOWER(customer_email) LIKE ? OR LOWER(customer_name) LIKE ?
       ORDER BY created_at DESC`,
      [term, term]
    );
  }
  return await dbQuery('SELECT * FROM licenses ORDER BY created_at DESC');
};

export const getLicenseByEmailAndKey = async (email, licenseKey) => {
  const result = await dbQuery(
    `SELECT * FROM licenses WHERE LOWER(customer_email) = ? AND license_key = ? LIMIT 1`,
    [email.trim().toLowerCase(), licenseKey.trim()]
  );
  return result.length ? result[0] : null;
};

export const getLicenseStatus = async () => {
  const result = await dbQuery(
    `SELECT * FROM licenses 
     WHERE is_active = 1 
     ORDER BY expiry_date DESC 
     LIMIT 1`
  );
  if (!result.length) return { status: 'not_found' };

  const license = result[0];
  const now = new Date();
  const expiry = new Date(license.expiry_date);
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (expiry < now) return { status: 'expired', license, daysRemaining: 0 };
  return { status: 'valid', license, daysRemaining };
};

export const validateLicenseKey = async (email, licenseKey) => {
  const license = await getLicenseByEmailAndKey(email, licenseKey);
  if (!license) return { valid: false, status: 'not_found' };
  if (!license.is_active) return { valid: false, status: 'inactive', license };

  const now = new Date();
  const expiry = new Date(license.expiry_date);
  if (expiry < now) return { valid: false, status: 'expired', license };

  return { valid: true, status: 'valid', license };
};

export const activateLicense = async (email, licenseKey) => {
  const validation = await validateLicenseKey(email, licenseKey);
  if (!validation.valid) {
    return { success: false, status: validation.status };
  }

  const nowIso = new Date().toISOString();
  await dbQuery(
    `UPDATE licenses SET is_active = 1, activation_date = ? WHERE id = ?`,
    [nowIso, validation.license.id]
  );
  return { success: true, license: { ...validation.license, activation_date: nowIso } };
};

export const extendLicense = async (id, additionalDays) => {
  const current = await dbQuery(`SELECT * FROM licenses WHERE id = ?`, [id]);
  if (!current.length) throw new Error('License not found');
  const license = current[0];
  const newExpiry = addDays(new Date(license.expiry_date), additionalDays);
  await dbQuery(`UPDATE licenses SET expiry_date = ?, is_active = 1 WHERE id = ?`, [
    newExpiry.toISOString(),
    id,
  ]);
  return { expiry_date: newExpiry.toISOString() };
};

export const disableLicense = async (id) => {
  await dbQuery(`UPDATE licenses SET is_active = 0 WHERE id = ?`, [id]);
  return { success: true };
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

