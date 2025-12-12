import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceHistory from './pages/InvoiceHistory';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import LicenseManagement from './pages/LicenseManagement';
import LicenseActivation from './components/LicenseActivation';
import { initializeDatabase } from './database/schema';
import { getLicenseStatus } from './database/db';

function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [checkingLicense, setCheckingLicense] = useState(true);
  const [adminMode, setAdminMode] = useState(
    () => localStorage.getItem('adminMode') === 'true'
  );

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize Electron API
        await window.electronAPI.dbInit();
        // Initialize database schema
        const result = await initializeDatabase();
        if (result.success) {
          setDbInitialized(true);
          try {
            const status = await getLicenseStatus();
            setLicenseStatus(status);
          } catch (error) {
            console.error('License status check failed:', error);
            setLicenseStatus({ status: 'not_found' });
          } finally {
            setCheckingLicense(false);
          }
        } else {
          console.error('Failed to initialize database:', result.error);
          setCheckingLicense(false);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setCheckingLicense(false);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        setAdminMode((prev) => {
          const next = !prev;
          localStorage.setItem('adminMode', next ? 'true' : 'false');
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  if (!dbInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center text-red-600">
          <p>Failed to initialize database. Please restart the application.</p>
        </div>
      </div>
    );
  }

  if (checkingLicense) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking license...</p>
        </div>
      </div>
    );
  }

  if (licenseStatus?.status === 'not_found' || licenseStatus?.status === 'expired') {
    return (
      <LicenseActivation
        status={licenseStatus.status}
        license={licenseStatus.license}
        onActivated={async () => {
          const status = await getLicenseStatus();
          setLicenseStatus(status);
          setCheckingLicense(false);
        }}
      />
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar adminMode={adminMode} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-invoice" element={<CreateInvoice />} />
              <Route path="/invoices" element={<InvoiceHistory />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/settings" element={<Settings />} />
              <Route
                path="/licenses"
                element={adminMode ? <LicenseManagement /> : <Navigate to="/dashboard" replace />}
              />
            </Routes>
          </main>
        </div>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;

