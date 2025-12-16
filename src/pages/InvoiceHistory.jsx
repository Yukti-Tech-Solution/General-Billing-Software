import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getInvoices, getInvoice, getInvoiceItems, deleteInvoice, getCustomer } from '../database/db';
import { formatCurrency } from '../utils/calculations';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import InvoicePreview from '../components/InvoicePreview';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { getCompany } from '../database/db';

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);
  const [previewCustomer, setPreviewCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setFromDate(format(firstDay, 'yyyy-MM-dd'));
    setToDate(format(today, 'yyyy-MM-dd'));
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      loadInvoices();
    }
  }, [fromDate, toDate]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await getInvoices(fromDate, toDate);
      setInvoices(data);
    } catch (error) {
      toast.error('Failed to load invoices');
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (invoice) => {
    try {
      const invoiceData = await getInvoice(invoice.id);
      const items = await getInvoiceItems(invoice.id);
      const customer = await getCustomer(invoice.customer_id);
      setPreviewInvoice(invoiceData);
      setPreviewItems(items);
      setPreviewCustomer(customer);
    } catch (error) {
      toast.error('Failed to load invoice details');
    }
  };

  const handleEdit = (invoice) => {
    navigate(`/create-invoice?id=${invoice.id}`);
  };

  const handleDelete = async (id) => {
    try {
      await deleteInvoice(id);
      toast.success('Invoice deleted successfully');
      setDeleteConfirm(null);
      loadInvoices();
    } catch (error) {
      toast.error('Failed to delete invoice');
      console.error('Error deleting invoice:', error);
    }
  };

  const handlePrint = async () => {
    if (window.electronAPI && window.electronAPI.printInvoice) {
      try {
        await window.electronAPI.printInvoice();
      } catch (error) {
        console.error('Print error:', error);
        toast.error('Failed to print: ' + error.message);
      }
    } else {
      window.print();
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const invoiceData = await getInvoice(invoice.id);
      const items = await getInvoiceItems(invoice.id);
      const customer = await getCustomer(invoice.customer_id);
      const company = await getCompany();
      const result = await generateInvoicePDF(invoiceData, company, customer, items);
      if (result.success) {
        toast.success(`PDF saved successfully!`);
      } else {
        toast.error(`Failed to generate PDF: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Failed to generate PDF: ' + error.message);
      console.error('Error generating PDF:', error);
    }
  };

  const calculateTotal = () => {
    return invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Invoice History</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadInvoices}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Total Summary */}
      {invoices.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-blue-800">
              Total Invoices: {invoices.length}
            </span>
            <span className="text-lg font-bold text-blue-900">
              Total Amount: {formatCurrency(calculateTotal())}
            </span>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No invoices found for the selected date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice No
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.customer_name || 'N/A'}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(invoice)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(invoice.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          invoiceNumber={previewInvoice.invoice_number}
          items={previewItems}
          customer={previewCustomer}
          onClose={() => {
            setPreviewInvoice(null);
            setPreviewItems([]);
            setPreviewCustomer(null);
          }}
          onPrint={handlePrint}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;

