import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/calculations';
import { getDashboardStats, getLicenseStatus } from '../database/db';
import { toast } from 'react-toastify';
import { hasUnlimitedAccess } from '../utils/testCredentials';

const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    monthSales: 0,
    yearSales: 0,
    totalInvoices: 0,
    pendingPayments: 0,
    recentInvoices: []
  });
  const [loading, setLoading] = useState(true);
  const [licenseInfo, setLicenseInfo] = useState(null);
  const userHasUnlimited = hasUnlimitedAccess();

  useEffect(() => {
    loadStats();
    loadLicenseStatus();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard statistics');
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLicenseStatus = async () => {
    try {
      const status = await getLicenseStatus();
      setLicenseInfo(status);
    } catch (error) {
      console.error('Failed to load license status', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <Link
          to="/create-invoice"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Invoice
        </Link>
      </div>

      {userHasUnlimited && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">🎉 Unlimited Access Enabled</h3>
              <p className="text-sm opacity-90">
                You have full access to all features with no license restrictions
              </p>
            </div>
            <span className="text-3xl">✨</span>
          </div>
        </div>
      )}

      {licenseInfo?.status === 'valid' && (
        <div
          className={`rounded-lg border p-4 ${
            licenseInfo.daysRemaining <= 7
              ? 'bg-red-50 border-red-200 text-red-800'
              : licenseInfo.daysRemaining <= 30
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                License valid until {new Date(licenseInfo.license.expiry_date).toLocaleDateString()}
              </p>
              {licenseInfo.daysRemaining <= 30 && (
                <p className="text-sm">
                  {licenseInfo.daysRemaining} day(s) remaining. Please plan renewal.
                </p>
              )}
            </div>
            {licenseInfo.daysRemaining <= 30 && <span className="text-2xl">🛡️</span>}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon="💰"
          color="bg-green-500"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(stats.monthSales)}
          icon="📅"
          color="bg-blue-500"
        />
        <StatCard
          title="This Year"
          value={formatCurrency(stats.yearSales)}
          icon="📊"
          color="bg-purple-500"
        />
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices.toString()}
          icon="📄"
          color="bg-orange-500"
        />
      </div>

      {/* Pending Payments */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">Pending Payments</h3>
            <p className="text-2xl font-bold text-yellow-900 mt-2">
              {formatCurrency(stats.pendingPayments)}
            </p>
          </div>
          <span className="text-4xl">⚠️</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="New Invoice"
          description="Create a new invoice"
          link="/create-invoice"
          icon="➕"
          color="bg-blue-600"
        />
        <QuickActionCard
          title="View Products"
          description="Manage your products"
          link="/products"
          icon="📦"
          color="bg-green-600"
        />
        <QuickActionCard
          title="View Customers"
          description="Manage your customers"
          link="/customers"
          icon="👥"
          color="bg-purple-600"
        />
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Invoices</h2>
        {stats.recentInvoices.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No invoices yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(invoice.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className={`${color} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const QuickActionCard = ({ title, description, link, icon, color }) => {
  return (
    <Link
      to={link}
      className={`${color} text-white rounded-lg p-6 hover:opacity-90 transition-opacity`}
    >
      <div className="flex items-center space-x-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm opacity-90">{description}</p>
        </div>
      </div>
    </Link>
  );
};

export default Dashboard;

