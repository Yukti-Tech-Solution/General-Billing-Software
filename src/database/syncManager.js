// Firebase Firestore Sync Manager
// Handles bidirectional sync between local SQLite and Firebase Firestore

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { dbQuery } from './db';

// Device identifier (unique per installation)
const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

// Get current user ID
const getUserId = () => {
  return auth.currentUser?.uid || localStorage.getItem('userId') || null;
};

// Sync state
let autoSyncEnabled = false;
let syncInProgress = false;
let syncListeners = {};
let onlineStatus = navigator.onLine;

// Listen to online/offline status
window.addEventListener('online', () => {
  onlineStatus = true;
  if (autoSyncEnabled) {
    syncAll();
  }
});

window.addEventListener('offline', () => {
  onlineStatus = false;
});

// ============================================================================
// A. SYNC CONFIGURATION
// ============================================================================

/**
 * Upload local data to Firebase
 */
export const syncToFirebase = async (collectionName, data) => {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  if (!onlineStatus) {
    throw new Error('Device is offline');
  }

  try {
    const collectionRef = collection(db, 'users', userId, collectionName);
    const batch = writeBatch(db);
    const deviceId = getDeviceId();

    for (const record of data) {
      const docId = record.cloudId || `local_${record.id}`;
      const docRef = doc(collectionRef, docId);

      // Prepare data for Firestore
      const firestoreData = {
        id: record.id,
        data: { ...record },
        lastModified: serverTimestamp(),
        lastModifiedBy: deviceId
      };

      // Remove sync fields from data object
      delete firestoreData.data.cloudId;
      delete firestoreData.data.syncStatus;
      delete firestoreData.data.lastModified;
      delete firestoreData.data.lastModifiedBy;

      batch.set(docRef, firestoreData, { merge: true });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error(`Error syncing ${collectionName} to Firebase:`, error);
    throw error;
  }
};

/**
 * Download data from Firebase
 */
export const syncFromFirebase = async (collectionName) => {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  if (!onlineStatus) {
    throw new Error('Device is offline');
  }

  try {
    const collectionRef = collection(db, 'users', userId, collectionName);
    const snapshot = await getDocs(collectionRef);
    const records = [];

    snapshot.forEach((docSnapshot) => {
      const docData = docSnapshot.data();
      records.push({
        cloudId: docSnapshot.id,
        ...docData.data,
        lastModified: docData.lastModified?.toDate?.() || new Date(),
        lastModifiedBy: docData.lastModifiedBy
      });
    });

    return records;
  } catch (error) {
    console.error(`Error syncing ${collectionName} from Firebase:`, error);
    throw error;
  }
};

/**
 * Enable auto sync
 */
export const enableAutoSync = () => {
  autoSyncEnabled = true;
  localStorage.setItem('autoSyncEnabled', 'true');
  
  // Start real-time listeners
  if (auth.currentUser) {
    listenToProducts();
    listenToCustomers();
    listenToInvoices();
    listenToCompany();
  }

  // Sync immediately if online
  if (onlineStatus) {
    syncAll();
  }
};

/**
 * Disable auto sync
 */
export const disableAutoSync = () => {
  autoSyncEnabled = false;
  localStorage.setItem('autoSyncEnabled', 'false');
  
  // Stop all listeners
  Object.values(syncListeners).forEach(unsubscribe => {
    if (unsubscribe) unsubscribe();
  });
  syncListeners = {};
};

/**
 * Get last sync time for a collection
 */
export const getLastSyncTime = async (collectionName) => {
  try {
    const result = await dbQuery(
      'SELECT last_sync_time FROM sync_metadata WHERE collection_name = ?',
      [collectionName]
    );
    return result.length > 0 ? result[0].last_sync_time : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};

/**
 * Set last sync time for a collection
 */
export const setLastSyncTime = async (collectionName, timestamp = new Date()) => {
  try {
    await dbQuery(
      `INSERT OR REPLACE INTO sync_metadata (collection_name, last_sync_time, sync_status) 
       VALUES (?, ?, ?)`,
      [collectionName, timestamp.toISOString(), 'synced']
    );
  } catch (error) {
    console.error('Error setting last sync time:', error);
    throw error;
  }
};

// ============================================================================
// B. BIDIRECTIONAL SYNC
// ============================================================================

/**
 * Resolve conflict using last-write-wins strategy
 */
export const resolveConflict = (localData, cloudData) => {
  const localTime = new Date(localData.lastModified || 0).getTime();
  const cloudTime = new Date(cloudData.lastModified || 0).getTime();

  if (cloudTime > localTime) {
    return cloudData; // Cloud version is newer
  } else {
    return localData; // Local version is newer or equal
  }
};

/**
 * Sync company settings
 */
export const syncCompany = async () => {
  const userId = getUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  try {
    // Get local company
    const localCompanies = await dbQuery('SELECT * FROM companies LIMIT 1');
    const localCompany = localCompanies.length > 0 ? localCompanies[0] : null;

    // Get cloud company
    const companyRef = doc(db, 'users', userId, 'company', 'settings');
    const companySnap = await getDoc(companyRef);
    const cloudCompany = companySnap.exists() ? companySnap.data() : null;

    if (!localCompany && !cloudCompany) {
      return { success: true, message: 'No company data to sync' };
    }

    if (localCompany && cloudCompany) {
      // Conflict resolution
      const resolved = resolveConflict(localCompany, cloudCompany.data);
      
      if (resolved === cloudCompany.data) {
        // Update local with cloud data
        await dbQuery(
          `UPDATE companies SET 
           name = ?, phone = ?, address = ?, gstin = ?, logo = ?,
           cloudId = ?, syncStatus = 'synced', lastModified = ?, lastModifiedBy = ?
           WHERE id = ?`,
          [
            cloudCompany.data.name, cloudCompany.data.phone, cloudCompany.data.address,
            cloudCompany.data.gstin, cloudCompany.data.logo,
            companySnap.id, new Date(), cloudCompany.lastModifiedBy, localCompany.id
          ]
        );
      } else {
        // Upload local to cloud
        await setDoc(companyRef, {
          data: {
            name: localCompany.name,
            phone: localCompany.phone,
            address: localCompany.address,
            gstin: localCompany.gstin,
            logo: localCompany.logo
          },
          lastModified: serverTimestamp(),
          lastModifiedBy: getDeviceId()
        });
        
        await dbQuery(
          `UPDATE companies SET cloudId = ?, syncStatus = 'synced', lastModified = ? WHERE id = ?`,
          [companyRef.id, new Date(), localCompany.id]
        );
      }
    } else if (localCompany) {
      // Upload local to cloud
      const companyRef = doc(db, 'users', userId, 'company', 'settings');
      await setDoc(companyRef, {
        data: {
          name: localCompany.name,
          phone: localCompany.phone,
          address: localCompany.address,
          gstin: localCompany.gstin,
          logo: localCompany.logo
        },
        lastModified: serverTimestamp(),
        lastModifiedBy: getDeviceId()
      });
      
      await dbQuery(
        `UPDATE companies SET cloudId = ?, syncStatus = 'synced', lastModified = ? WHERE id = ?`,
        [companyRef.id, new Date(), localCompany.id]
      );
    } else if (cloudCompany) {
      // Download cloud to local
      await dbQuery(
        `INSERT INTO companies (name, phone, address, gstin, logo, userId, cloudId, syncStatus, lastModified, lastModifiedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
        [
          cloudCompany.data.name, cloudCompany.data.phone, cloudCompany.data.address,
          cloudCompany.data.gstin, cloudCompany.data.logo, userId, companySnap.id,
          new Date(), cloudCompany.lastModifiedBy
        ]
      );
    }

    await setLastSyncTime('company');
    return { success: true };
  } catch (error) {
    console.error('Error syncing company:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync products with conflict resolution
 */
export const syncProducts = async () => {
  const userId = getUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  try {
    // Get local products
    const localProducts = await dbQuery('SELECT * FROM products WHERE userId = ? OR userId IS NULL', [userId]);
    
    // Get cloud products
    const cloudProducts = await syncFromFirebase('products');
    
    const deviceId = getDeviceId();
    const batch = writeBatch(db);
    const productsRef = collection(db, 'users', userId, 'products');
    let hasBatchOperations = false;

    // Process local products
    for (const localProduct of localProducts) {
      if (localProduct.syncStatus === 'synced' && localProduct.cloudId) {
        continue; // Already synced
      }

      const cloudProduct = cloudProducts.find(p => p.id === localProduct.id || p.cloudId === localProduct.cloudId);
      
      if (cloudProduct) {
        // Conflict resolution
        const resolved = resolveConflict(localProduct, cloudProduct);
        
        if (resolved === cloudProduct) {
          // Update local with cloud
          await dbQuery(
            `UPDATE products SET 
             name = ?, description = ?, price = ?, hsn_code = ?, tax_rate = ?, stock = ?,
             cloudId = ?, syncStatus = 'synced', lastModified = ?, lastModifiedBy = ?
             WHERE id = ?`,
            [
              cloudProduct.name, cloudProduct.description, cloudProduct.price,
              cloudProduct.hsn_code, cloudProduct.tax_rate, cloudProduct.stock,
              cloudProduct.cloudId, new Date(), cloudProduct.lastModifiedBy, localProduct.id
            ]
          );
        } else {
          // Upload local to cloud
          const docRef = doc(productsRef, cloudProduct.cloudId || `local_${localProduct.id}`);
          batch.set(docRef, {
            id: localProduct.id,
            data: {
              name: localProduct.name,
              description: localProduct.description,
              price: localProduct.price,
              hsn_code: localProduct.hsn_code,
              tax_rate: localProduct.tax_rate,
              stock: localProduct.stock
            },
            lastModified: serverTimestamp(),
            lastModifiedBy: deviceId
          }, { merge: true });
          
          await dbQuery(
            `UPDATE products SET cloudId = ?, syncStatus = 'synced', lastModified = ?, userId = ? WHERE id = ?`,
            [docRef.id, new Date(), userId, localProduct.id]
          );
          hasBatchOperations = true;
        }
      } else {
        // New local product - upload to cloud
        const docRef = doc(productsRef, `local_${localProduct.id}`);
        batch.set(docRef, {
          id: localProduct.id,
          data: {
            name: localProduct.name,
            description: localProduct.description,
            price: localProduct.price,
            hsn_code: localProduct.hsn_code,
            tax_rate: localProduct.tax_rate,
            stock: localProduct.stock
          },
          lastModified: serverTimestamp(),
          lastModifiedBy: deviceId
        });
        
        await dbQuery(
          `UPDATE products SET cloudId = ?, syncStatus = 'synced', lastModified = ?, userId = ? WHERE id = ?`,
          [docRef.id, new Date(), userId, localProduct.id]
        );
        hasBatchOperations = true;
      }
    }

    // Process cloud products not in local
    for (const cloudProduct of cloudProducts) {
      const localProduct = localProducts.find(p => p.id === cloudProduct.id || p.cloudId === cloudProduct.cloudId);
      
      if (!localProduct) {
        // New cloud product - download to local
        await dbQuery(
          `INSERT INTO products (name, description, price, hsn_code, tax_rate, stock, userId, cloudId, syncStatus, lastModified, lastModifiedBy)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
          [
            cloudProduct.name, cloudProduct.description, cloudProduct.price,
            cloudProduct.hsn_code, cloudProduct.tax_rate, cloudProduct.stock,
            userId, cloudProduct.cloudId, new Date(), cloudProduct.lastModifiedBy
          ]
        );
      }
    }

    if (hasBatchOperations) {
      await batch.commit();
    }

    await setLastSyncTime('products');
    return { success: true };
  } catch (error) {
    console.error('Error syncing products:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync customers with conflict resolution
 */
export const syncCustomers = async () => {
  const userId = getUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  try {
    const localCustomers = await dbQuery('SELECT * FROM customers WHERE userId = ? OR userId IS NULL', [userId]);
    const cloudCustomers = await syncFromFirebase('customers');
    
    const deviceId = getDeviceId();
    const batch = writeBatch(db);
    const customersRef = collection(db, 'users', userId, 'customers');
    let hasBatchOperations = false;

    for (const localCustomer of localCustomers) {
      if (localCustomer.syncStatus === 'synced' && localCustomer.cloudId) {
        continue;
      }

      const cloudCustomer = cloudCustomers.find(c => c.id === localCustomer.id || c.cloudId === localCustomer.cloudId);
      
      if (cloudCustomer) {
        const resolved = resolveConflict(localCustomer, cloudCustomer);
        
        if (resolved === cloudCustomer) {
          await dbQuery(
            `UPDATE customers SET 
             name = ?, phone = ?, address = ?, gstin = ?,
             cloudId = ?, syncStatus = 'synced', lastModified = ?, lastModifiedBy = ?
             WHERE id = ?`,
            [
              cloudCustomer.name, cloudCustomer.phone, cloudCustomer.address, cloudCustomer.gstin,
              cloudCustomer.cloudId, new Date(), cloudCustomer.lastModifiedBy, localCustomer.id
            ]
          );
        } else {
          const docRef = doc(customersRef, cloudCustomer.cloudId || `local_${localCustomer.id}`);
          batch.set(docRef, {
            id: localCustomer.id,
            data: {
              name: localCustomer.name,
              phone: localCustomer.phone,
              address: localCustomer.address,
              gstin: localCustomer.gstin
            },
            lastModified: serverTimestamp(),
            lastModifiedBy: deviceId
          }, { merge: true });
          
          await dbQuery(
            `UPDATE customers SET cloudId = ?, syncStatus = 'synced', lastModified = ?, userId = ? WHERE id = ?`,
            [docRef.id, new Date(), userId, localCustomer.id]
          );
          hasBatchOperations = true;
        }
      } else {
        const docRef = doc(customersRef, `local_${localCustomer.id}`);
        batch.set(docRef, {
          id: localCustomer.id,
          data: {
            name: localCustomer.name,
            phone: localCustomer.phone,
            address: localCustomer.address,
            gstin: localCustomer.gstin
          },
          lastModified: serverTimestamp(),
          lastModifiedBy: deviceId
        });
        
        await dbQuery(
          `UPDATE customers SET cloudId = ?, syncStatus = 'synced', lastModified = ?, userId = ? WHERE id = ?`,
          [docRef.id, new Date(), userId, localCustomer.id]
        );
        hasBatchOperations = true;
      }
    }

    for (const cloudCustomer of cloudCustomers) {
      const localCustomer = localCustomers.find(c => c.id === cloudCustomer.id || c.cloudId === cloudCustomer.cloudId);
      
      if (!localCustomer) {
        await dbQuery(
          `INSERT INTO customers (name, phone, address, gstin, userId, cloudId, syncStatus, lastModified, lastModifiedBy)
           VALUES (?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
          [
            cloudCustomer.name, cloudCustomer.phone, cloudCustomer.address, cloudCustomer.gstin,
            userId, cloudCustomer.cloudId, new Date(), cloudCustomer.lastModifiedBy
          ]
        );
      }
    }

    if (hasBatchOperations) {
      await batch.commit();
    }

    await setLastSyncTime('customers');
    return { success: true };
  } catch (error) {
    console.error('Error syncing customers:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync invoices with conflict resolution
 */
export const syncInvoices = async () => {
  const userId = getUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  try {
    const localInvoices = await dbQuery('SELECT * FROM invoices WHERE userId = ? OR userId IS NULL', [userId]);
    const cloudInvoices = await syncFromFirebase('invoices');
    
    const deviceId = getDeviceId();
    const batch = writeBatch(db);
    const invoicesRef = collection(db, 'users', userId, 'invoices');
    let hasBatchOperations = false;

    for (const localInvoice of localInvoices) {
      if (localInvoice.syncStatus === 'synced' && localInvoice.cloudId) {
        continue;
      }

      const cloudInvoice = cloudInvoices.find(i => i.id === localInvoice.id || i.cloudId === localInvoice.cloudId);
      
      if (cloudInvoice) {
        const resolved = resolveConflict(localInvoice, cloudInvoice);
        
        if (resolved === cloudInvoice) {
          await dbQuery(
            `UPDATE invoices SET 
             invoice_number = ?, customer_id = ?, date = ?, subtotal = ?, discount_percentage = ?,
             discount_amount = ?, tax_amount = ?, total = ?, paid_amount = ?, balance = ?, status = ?, notes = ?,
             cloudId = ?, syncStatus = 'synced', lastModified = ?, lastModifiedBy = ?
             WHERE id = ?`,
            [
              cloudInvoice.invoice_number, cloudInvoice.customer_id, cloudInvoice.date,
              cloudInvoice.subtotal, cloudInvoice.discount_percentage, cloudInvoice.discount_amount,
              cloudInvoice.tax_amount, cloudInvoice.total, cloudInvoice.paid_amount,
              cloudInvoice.balance, cloudInvoice.status, cloudInvoice.notes,
              cloudInvoice.cloudId, new Date(), cloudInvoice.lastModifiedBy, localInvoice.id
            ]
          );
        } else {
          const docRef = doc(invoicesRef, cloudInvoice.cloudId || `local_${localInvoice.id}`);
          batch.set(docRef, {
            id: localInvoice.id,
            data: {
              invoice_number: localInvoice.invoice_number,
              customer_id: localInvoice.customer_id,
              date: localInvoice.date,
              subtotal: localInvoice.subtotal,
              discount_percentage: localInvoice.discount_percentage,
              discount_amount: localInvoice.discount_amount,
              tax_amount: localInvoice.tax_amount,
              total: localInvoice.total,
              paid_amount: localInvoice.paid_amount,
              balance: localInvoice.balance,
              status: localInvoice.status,
              notes: localInvoice.notes
            },
            lastModified: serverTimestamp(),
            lastModifiedBy: deviceId
          }, { merge: true });
          
          await dbQuery(
            `UPDATE invoices SET cloudId = ?, syncStatus = 'synced', lastModified = ?, userId = ? WHERE id = ?`,
            [docRef.id, new Date(), userId, localInvoice.id]
          );
          hasBatchOperations = true;
        }
      } else {
        const docRef = doc(invoicesRef, `local_${localInvoice.id}`);
        batch.set(docRef, {
          id: localInvoice.id,
          data: {
            invoice_number: localInvoice.invoice_number,
            customer_id: localInvoice.customer_id,
            date: localInvoice.date,
            subtotal: localInvoice.subtotal,
            discount_percentage: localInvoice.discount_percentage,
            discount_amount: localInvoice.discount_amount,
            tax_amount: localInvoice.tax_amount,
            total: localInvoice.total,
            paid_amount: localInvoice.paid_amount,
            balance: localInvoice.balance,
            status: localInvoice.status,
            notes: localInvoice.notes
          },
          lastModified: serverTimestamp(),
          lastModifiedBy: deviceId
        });
        
        await dbQuery(
          `UPDATE invoices SET cloudId = ?, syncStatus = 'synced', lastModified = ?, userId = ? WHERE id = ?`,
          [docRef.id, new Date(), userId, localInvoice.id]
        );
        hasBatchOperations = true;
      }
    }

    for (const cloudInvoice of cloudInvoices) {
      const localInvoice = localInvoices.find(i => i.id === cloudInvoice.id || i.cloudId === cloudInvoice.cloudId);
      
      if (!localInvoice) {
        await dbQuery(
          `INSERT INTO invoices (
            invoice_number, customer_id, date, subtotal, discount_percentage,
            discount_amount, tax_amount, total, paid_amount, balance, status, notes,
            userId, cloudId, syncStatus, lastModified, lastModifiedBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
          [
            cloudInvoice.invoice_number, cloudInvoice.customer_id, cloudInvoice.date,
            cloudInvoice.subtotal, cloudInvoice.discount_percentage, cloudInvoice.discount_amount,
            cloudInvoice.tax_amount, cloudInvoice.total, cloudInvoice.paid_amount,
            cloudInvoice.balance, cloudInvoice.status, cloudInvoice.notes,
            userId, cloudInvoice.cloudId, new Date(), cloudInvoice.lastModifiedBy
          ]
        );
      }
    }

    if (hasBatchOperations) {
      await batch.commit();
    }

    await setLastSyncTime('invoices');
    return { success: true };
  } catch (error) {
    console.error('Error syncing invoices:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync all collections
 */
export const syncAll = async () => {
  if (syncInProgress) {
    return { success: false, error: 'Sync already in progress' };
  }

  if (!onlineStatus) {
    return { success: false, error: 'Device is offline' };
  }

  syncInProgress = true;
  const results = {};

  try {
    results.company = await syncCompany();
    results.products = await syncProducts();
    results.customers = await syncCustomers();
    results.invoices = await syncInvoices();

    const allSuccess = Object.values(results).every(r => r.success);
    return { 
      success: allSuccess, 
      results 
    };
  } catch (error) {
    console.error('Error in syncAll:', error);
    return { success: false, error: error.message };
  } finally {
    syncInProgress = false;
  }
};

// ============================================================================
// C. REAL-TIME LISTENERS
// ============================================================================

/**
 * Listen to real-time product updates
 */
export const listenToProducts = () => {
  const userId = getUserId();
  if (!userId) return;

  // Stop existing listener
  if (syncListeners.products) {
    syncListeners.products();
  }

  const productsRef = collection(db, 'users', userId, 'products');
  const q = query(productsRef, orderBy('lastModified', 'desc'));

  syncListeners.products = onSnapshot(q, async (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'modified' || change.type === 'added') {
        const data = change.doc.data();
        const localProducts = await dbQuery('SELECT * FROM products WHERE cloudId = ?', [change.doc.id]);
        
        if (localProducts.length > 0) {
          // Update existing
          await dbQuery(
            `UPDATE products SET 
             name = ?, description = ?, price = ?, hsn_code = ?, tax_rate = ?, stock = ?,
             syncStatus = 'synced', lastModified = ?, lastModifiedBy = ?
             WHERE cloudId = ?`,
            [
              data.data.name, data.data.description, data.data.price,
              data.data.hsn_code, data.data.tax_rate, data.data.stock,
              new Date(), data.lastModifiedBy, change.doc.id
            ]
          );
        } else {
          // Insert new
          await dbQuery(
            `INSERT INTO products (name, description, price, hsn_code, tax_rate, stock, userId, cloudId, syncStatus, lastModified, lastModifiedBy)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
            [
              data.data.name, data.data.description, data.data.price,
              data.data.hsn_code, data.data.tax_rate, data.data.stock,
              userId, change.doc.id, new Date(), data.lastModifiedBy
            ]
          );
        }
      } else if (change.type === 'removed') {
        await dbQuery('DELETE FROM products WHERE cloudId = ?', [change.doc.id]);
      }
    });
  }, (error) => {
    console.error('Error listening to products:', error);
  });
};

/**
 * Listen to real-time customer updates
 */
export const listenToCustomers = () => {
  const userId = getUserId();
  if (!userId) return;

  if (syncListeners.customers) {
    syncListeners.customers();
  }

  const customersRef = collection(db, 'users', userId, 'customers');
  const q = query(customersRef, orderBy('lastModified', 'desc'));

  syncListeners.customers = onSnapshot(q, async (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'modified' || change.type === 'added') {
        const data = change.doc.data();
        const localCustomers = await dbQuery('SELECT * FROM customers WHERE cloudId = ?', [change.doc.id]);
        
        if (localCustomers.length > 0) {
          await dbQuery(
            `UPDATE customers SET 
             name = ?, phone = ?, address = ?, gstin = ?,
             syncStatus = 'synced', lastModified = ?, lastModifiedBy = ?
             WHERE cloudId = ?`,
            [
              data.data.name, data.data.phone, data.data.address, data.data.gstin,
              new Date(), data.lastModifiedBy, change.doc.id
            ]
          );
        } else {
          await dbQuery(
            `INSERT INTO customers (name, phone, address, gstin, userId, cloudId, syncStatus, lastModified, lastModifiedBy)
             VALUES (?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
            [
              data.data.name, data.data.phone, data.data.address, data.data.gstin,
              userId, change.doc.id, new Date(), data.lastModifiedBy
            ]
          );
        }
      } else if (change.type === 'removed') {
        await dbQuery('DELETE FROM customers WHERE cloudId = ?', [change.doc.id]);
      }
    });
  }, (error) => {
    console.error('Error listening to customers:', error);
  });
};

/**
 * Listen to real-time invoice updates
 */
export const listenToInvoices = () => {
  const userId = getUserId();
  if (!userId) return;

  if (syncListeners.invoices) {
    syncListeners.invoices();
  }

  const invoicesRef = collection(db, 'users', userId, 'invoices');
  const q = query(invoicesRef, orderBy('lastModified', 'desc'));

  syncListeners.invoices = onSnapshot(q, async (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'modified' || change.type === 'added') {
        const data = change.doc.data();
        const localInvoices = await dbQuery('SELECT * FROM invoices WHERE cloudId = ?', [change.doc.id]);
        
        if (localInvoices.length > 0) {
          await dbQuery(
            `UPDATE invoices SET 
             invoice_number = ?, customer_id = ?, date = ?, subtotal = ?, discount_percentage = ?,
             discount_amount = ?, tax_amount = ?, total = ?, paid_amount = ?, balance = ?, status = ?, notes = ?,
             syncStatus = 'synced', lastModified = ?, lastModifiedBy = ?
             WHERE cloudId = ?`,
            [
              data.data.invoice_number, data.data.customer_id, data.data.date,
              data.data.subtotal, data.data.discount_percentage, data.data.discount_amount,
              data.data.tax_amount, data.data.total, data.data.paid_amount,
              data.data.balance, data.data.status, data.data.notes,
              new Date(), data.lastModifiedBy, change.doc.id
            ]
          );
        } else {
          await dbQuery(
            `INSERT INTO invoices (
              invoice_number, customer_id, date, subtotal, discount_percentage,
              discount_amount, tax_amount, total, paid_amount, balance, status, notes,
              userId, cloudId, syncStatus, lastModified, lastModifiedBy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
            [
              data.data.invoice_number, data.data.customer_id, data.data.date,
              data.data.subtotal, data.data.discount_percentage, data.data.discount_amount,
              data.data.tax_amount, data.data.total, data.data.paid_amount,
              data.data.balance, data.data.status, data.data.notes,
              userId, change.doc.id, new Date(), data.lastModifiedBy
            ]
          );
        }
      } else if (change.type === 'removed') {
        await dbQuery('DELETE FROM invoices WHERE cloudId = ?', [change.doc.id]);
      }
    });
  }, (error) => {
    console.error('Error listening to invoices:', error);
  });
};

/**
 * Listen to real-time company settings updates
 */
export const listenToCompany = () => {
  const userId = getUserId();
  if (!userId) return;

  if (syncListeners.company) {
    syncListeners.company();
  }

  const companyRef = doc(db, 'users', userId, 'company', 'settings');

  syncListeners.company = onSnapshot(companyRef, async (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      const localCompanies = await dbQuery('SELECT * FROM companies LIMIT 1');
      
      if (localCompanies.length > 0) {
        await dbQuery(
          `UPDATE companies SET 
           name = ?, phone = ?, address = ?, gstin = ?, logo = ?,
           cloudId = ?, syncStatus = 'synced', lastModified = ?, lastModifiedBy = ?
           WHERE id = ?`,
          [
            data.data.name, data.data.phone, data.data.address,
            data.data.gstin, data.data.logo,
            snapshot.id, new Date(), data.lastModifiedBy, localCompanies[0].id
          ]
        );
      } else {
        await dbQuery(
          `INSERT INTO companies (name, phone, address, gstin, logo, userId, cloudId, syncStatus, lastModified, lastModifiedBy)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
          [
            data.data.name, data.data.phone, data.data.address,
            data.data.gstin, data.data.logo, userId, snapshot.id,
            new Date(), data.lastModifiedBy
          ]
        );
      }
    }
  }, (error) => {
    console.error('Error listening to company:', error);
  });
};

// ============================================================================
// D. SYNC STATUS
// ============================================================================

/**
 * Check online status
 */
export const checkOnlineStatus = () => {
  return navigator.onLine && onlineStatus;
};

/**
 * Get current sync status
 */
export const getSyncStatus = () => {
  if (!onlineStatus) {
    return 'offline';
  }
  if (syncInProgress) {
    return 'syncing';
  }
  return 'synced';
};

/**
 * Get pending changes count
 */
export const getPendingChanges = async () => {
  try {
    const pending = await dbQuery(
      `SELECT 
        (SELECT COUNT(*) FROM companies WHERE syncStatus = 'pending') as companies,
        (SELECT COUNT(*) FROM products WHERE syncStatus = 'pending') as products,
        (SELECT COUNT(*) FROM customers WHERE syncStatus = 'pending') as customers,
        (SELECT COUNT(*) FROM invoices WHERE syncStatus = 'pending') as invoices
      `
    );
    
    const counts = pending[0] || {};
    return {
      companies: counts.companies || 0,
      products: counts.products || 0,
      customers: counts.customers || 0,
      invoices: counts.invoices || 0,
      total: (counts.companies || 0) + (counts.products || 0) + (counts.customers || 0) + (counts.invoices || 0)
    };
  } catch (error) {
    console.error('Error getting pending changes:', error);
    return { companies: 0, products: 0, customers: 0, invoices: 0, total: 0 };
  }
};

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Sign in with email and password
 */
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem('userId', userCredential.user.uid);
    
    // Enable auto sync if it was enabled before
    if (localStorage.getItem('autoSyncEnabled') === 'true') {
      enableAutoSync();
    }
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign up with email and password
 */
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    localStorage.setItem('userId', userCredential.user.uid);
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign out
 */
export const signOutUser = async () => {
  try {
    disableAutoSync();
    await signOut(auth);
    localStorage.removeItem('userId');
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      localStorage.setItem('userId', user.uid);
    } else {
      localStorage.removeItem('userId');
    }
    callback(user);
  });
};

// Initialize auto sync if enabled
if (localStorage.getItem('autoSyncEnabled') === 'true') {
  onAuthStateChange((user) => {
    if (user) {
      enableAutoSync();
    }
  });
}

