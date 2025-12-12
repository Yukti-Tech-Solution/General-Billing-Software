import React, { useState } from 'react';
import { activateExistingLicense } from '../utils/licenseValidator';

const LicenseActivation = ({ status, license, onActivated }) => {
  const [email, setEmail] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    setError('');
    if (!email || !licenseKey) {
      setError('Email and license key are required.');
      return;
    }
    try {
      setLoading(true);
      const result = await activateExistingLicense(email, licenseKey);
      if (result.success) {
        onActivated();
      } else {
        setError('Invalid or expired license. Please check your details.');
      }
    } catch (err) {
      setError(`Activation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">
          {status === 'expired' ? 'License Expired' : 'Activate Software'}
        </h2>

        {status === 'expired' && license && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            <p>Your license expired on {new Date(license.expiry_date).toLocaleDateString()}.</p>
            <p>Please contact support to renew.</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">License Key</label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="w-full px-3 py-2 border rounded font-mono"
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            onClick={handleActivate}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Activating...' : 'Activate'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Contact: contact@yuktitechsolution.co.in</p>
          <p>For license purchase or renewal</p>
        </div>
      </div>
    </div>
  );
};

export default LicenseActivation;

