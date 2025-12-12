import React, { useEffect, useState } from 'react';
import {
  getLicenses,
  insertLicense,
  extendLicense,
  disableLicense,
} from '../database/db';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const durationOptions = [
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
  { label: '2 years', days: 730 },
];

const LicenseManagement = () => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    email: '',
    name: '',
    duration: 365,
    notes: '',
  });

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try {
      setLoading(true);
      const data = await getLicenses(search);
      setLicenses(data);
    } catch (error) {
      toast.error('Failed to load licenses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.email || !form.name) {
      toast.error('Email and name are required');
      return;
    }
    try {
      setLoading(true);
      const res = await insertLicense({
        email: form.email,
        name: form.name,
        durationDays: Number(form.duration) || 365,
        notes: form.notes,
      });
      toast.success(`License created. Key: ${res.license_key}`);
      setForm({ email: '', name: '', duration: 365, notes: '' });
      await loadLicenses();
    } catch (error) {
      toast.error('Failed to create license');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async (id, days) => {
    try {
      await extendLicense(id, days);
      toast.success(`Extended by ${days} days`);
      await loadLicenses();
    } catch (error) {
      toast.error('Failed to extend license');
      console.error(error);
    }
  };

  const handleDisable = async (id) => {
    try {
      await disableLicense(id);
      toast.success('License disabled');
      await loadLicenses();
    } catch (error) {
      toast.error('Failed to disable license');
      console.error(error);
    }
  };

  const filtered = licenses.filter((l) => {
    const term = search.toLowerCase();
    return (
      l.customer_email?.toLowerCase().includes(term) ||
      l.customer_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">License Manager</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Generate New License</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="email"
            placeholder="Customer Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="px-4 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Customer Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="px-4 py-2 border rounded"
          />
          <select
            value={form.duration}
            onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
            className="px-4 py-2 border rounded"
          >
            {durationOptions.map((opt) => (
              <option key={opt.days} value={opt.days}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="px-4 py-2 border rounded"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Generate License'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">All Licenses</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by email or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border rounded"
            />
            <button
              onClick={loadLicenses}
              className="px-4 py-2 bg-gray-100 rounded border"
            >
              Refresh
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-500">No licenses found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Key</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Activation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((lic) => {
                  const expired = new Date(lic.expiry_date) < new Date();
                  return (
                    <tr key={lic.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{lic.customer_email}</td>
                      <td className="px-4 py-3 text-sm">{lic.customer_name}</td>
                      <td className="px-4 py-3 text-sm font-mono">{lic.license_key}</td>
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(lic.activation_date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(lic.expiry_date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            lic.is_active
                              ? expired
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {lic.is_active ? (expired ? 'Expired' : 'Active') : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        {durationOptions.map((opt) => (
                          <button
                            key={opt.days}
                            onClick={() => handleExtend(lic.id, opt.days)}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 text-xs"
                          >
                            +{opt.label}
                          </button>
                        ))}
                        <button
                          onClick={() => handleDisable(lic.id)}
                          className="px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200 text-xs"
                        >
                          Disable
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LicenseManagement;

