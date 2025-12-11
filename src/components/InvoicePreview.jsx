import React, { useEffect, useState } from 'react';
import { getCompany } from '../database/db';
import { getCustomer } from '../database/db';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800">Invoice Preview</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Download PDF
            </button>
            <button
              onClick={onPrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-8 print-area">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            {/* Company Details */}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {company?.logo ? (
                    <img src={company.logo} alt="Logo" className="w-full h-full object-contain rounded-full" />
                  ) : (
                    'M'
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{company?.name || 'Company Name'}</h1>
                  {company?.address && (
                    <p className="text-sm text-gray-600 mt-1">{company.address}</p>
                  )}
                  {company?.phone && (
                    <p className="text-sm text-gray-600">Phone: {company.phone}</p>
                  )}
                  {company?.gstin && (
                    <p className="text-sm text-gray-600">GSTIN: {company.gstin}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="text-right">
              <h2 className="text-3xl font-bold text-blue-600 mb-4">INVOICE</h2>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <span className="font-semibold">Ref No:</span> {invoiceNumber}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Date of Issue:</span> {format(new Date(invoice.date), 'dd MMM yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Bill To:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-800">{customer?.name || 'Customer Name'}</p>
              {customer?.phone && (
                <p className="text-gray-600 mt-1">Phone: {customer.phone}</p>
              )}
              {customer?.address && (
                <p className="text-gray-600 mt-1">{customer.address}</p>
              )}
              {customer?.gstin && (
                <p className="text-gray-600 mt-1">GSTIN: {customer.gstin}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-300">
                    SR
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-300">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-300">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-300">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">{item.product_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-300">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-300">{formatCurrency(item.price)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations */}
          <div className="mb-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Discount ({invoice.discount_percentage}%):
                    </span>
                    <span className="font-semibold text-red-600">-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-semibold">{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Received:</span>
                  <span className="font-semibold">{formatCurrency(invoice.paid_amount || 0)}</span>
                </div>
                {invoice.balance > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Balance:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(invoice.balance)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">You Saved:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(Math.abs(invoice.balance))}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Amount in Words:</span>{' '}
              <span className="italic">{numberToWords(invoice.total)}</span>
            </p>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes:</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-300 text-center">
            <p className="text-blue-600 font-semibold">Thanks for doing business with us!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;

