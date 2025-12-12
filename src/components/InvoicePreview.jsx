import React, { useEffect, useState } from 'react';
import { getCompany, getCustomer } from '../database/db';
import { formatCurrency } from '../utils/calculations';
import { numberToWords } from '../utils/numberToWords';
import { format } from 'date-fns';
import { generateInvoicePDF } from '../utils/pdfGenerator';

const InvoicePreview = ({ invoice, invoiceNumber, items, onClose, onPrint, customer: propCustomer }) => {
  const [company, setCompany] = useState(null);
  const [customer, setCustomer] = useState(propCustomer || null);

  useEffect(() => {
    loadCompany();
    if (invoice.customer_id && !propCustomer) {
      loadCustomer();
    }
  }, [invoice.customer_id]);

  const loadCompany = async () => {
    try {
      const companyData = await getCompany();
      setCompany(companyData);
    } catch (error) {
      console.error('Error loading company:', error);
    }
  };

  const loadCustomer = async () => {
    try {
      const customerData = await getCustomer(invoice.customer_id);
      setCustomer(customerData);
    } catch (error) {
      console.error('Error loading customer:', error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await generateInvoicePDF(invoice, company, customer, items);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const resolvedInvoiceNumber = invoiceNumber || invoice.invoice_number || 'N/A';
  const formatDisplayDate = (value) => (value ? format(new Date(value), 'dd MMM yyyy') : '-');
  const taxRate =
    invoice.tax_rate != null
      ? Number(invoice.tax_rate)
      : items.length
      ? items.reduce((sum, item) => sum + Number(item.tax_rate || 0), 0) / items.length
      : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800">Invoice Preview</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm"
            >
              Download PDF
            </button>
            <button
              onClick={onPrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 shadow-sm"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-8 print-area bg-gray-50">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-[#2B7A8B] text-white px-8 py-6 flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden">
                    {company?.logo ? (
                      <img src={company.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xl font-bold">{(company?.name || 'M')[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/80">Invoice</p>
                    <h1 className="text-3xl font-bold leading-tight">INVOICE</h1>
                  </div>
                </div>
                <p className="text-sm text-white/90">
                  {company?.name || 'Company Name'}
                </p>
                {company?.address && <p className="text-xs text-white/80">{company.address}</p>}
                {(company?.phone || company?.email) && (
                  <p className="text-xs text-white/80">
                    {company?.phone ? `Phone: ${company.phone}` : ''}{' '}
                    {company?.email ? `| Email: ${company.email}` : ''}
                  </p>
                )}
              </div>

              <div className="mt-6 sm:mt-0 text-right space-y-1">
                <p className="text-sm text-white/80">Invoice No.</p>
                <p className="text-xl font-semibold">{resolvedInvoiceNumber}</p>
                <p className="text-sm text-white/80 mt-2">Date of Issue</p>
                <p className="text-lg font-semibold">{formatDisplayDate(invoice.date)}</p>
                {invoice.due_date && (
                  <>
                    <p className="text-sm text-white/80 mt-2">Due Date</p>
                    <p className="text-lg font-semibold">{formatDisplayDate(invoice.due_date)}</p>
                  </>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Invoice Info</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice No.</span>
                    <span className="font-semibold">{resolvedInvoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date of Issue</span>
                    <span className="font-semibold">{formatDisplayDate(invoice.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Due Date</span>
                    <span className="font-semibold">
                      {invoice.due_date ? formatDisplayDate(invoice.due_date) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Bill To</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p className="font-semibold">{customer?.name || 'Customer Name'}</p>
                  {customer?.address && <p className="text-gray-600">{customer.address}</p>}
                  {(customer?.phone || customer?.email) && (
                    <p className="text-gray-600">
                      {customer?.phone ? `Phone: ${customer.phone}` : ''}{' '}
                      {customer?.email ? `| Email: ${customer.email}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="px-8 pb-6">
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-[#2B7A8B] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Hours</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.product_name || 'Item'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.description || '—'}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{Number(item.quantity || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="px-8 pb-6 flex flex-col items-end">
              <div className="w-full md:w-80 space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Discount ({Number(invoice.discount_percentage || 0).toFixed(2)}%)
                    </span>
                    <span className="font-semibold text-red-600">- {formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax Rate</span>
                  <span className="font-semibold">{taxRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax Amount</span>
                  <span className="font-semibold">{formatCurrency(invoice.tax_amount || 0)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-[#2B7A8B]">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount in words */}
            <div className="px-8 pb-6">
              <div className="bg-slate-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                <span className="font-semibold text-gray-800">Amount in Words: </span>
                <span className="italic text-gray-600">
                  {`${numberToWords(invoice.total || 0)} only`}
                </span>
              </div>
            </div>

            {/* Notes / Terms */}
            {invoice.notes && (
              <div className="px-8 pb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Terms / Notes</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {invoice.notes}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="bg-[#2B7A8B] text-white text-center py-4 px-8">
              <p className="font-semibold">Thank you for your business!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;

