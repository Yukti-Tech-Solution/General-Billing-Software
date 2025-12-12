import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getCustomers, getProducts, getNextInvoiceNumber, saveInvoice, getInvoice, getInvoiceItems, saveCustomer, saveProduct } from '../database/db';
import { 
  calculateItemAmount, 
  calculateSubtotal, 
  calculateDiscount, 
  calculateTax, 
  calculateTotal, 
  calculateBalance,
  formatCurrency 
} from '../utils/calculations';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import InvoicePreview from '../components/InvoicePreview';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoice, setInvoice] = useState({
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    customer_gstin: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    subtotal: 0,
    discount_percentage: 0,
    discount_amount: 0,
    tax_amount: 0,
    total: 0,
    paid_amount: 0,
    balance: 0,
    status: 'pending',
    notes: ''
  });
  const [items, setItems] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [usePercentageDiscount, setUsePercentageDiscount] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerMode, setCustomerMode] = useState('saved'); // 'saved' | 'quick'
  const [productMode, setProductMode] = useState('saved'); // 'saved' | 'quick'
  const [quickCustomer, setQuickCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    gstin: '',
    saveToDatabase: false
  });
  const [quickProduct, setQuickProduct] = useState({
    name: '',
    price: '',
    description: '',
    hsn_code: '',
    tax_rate: 0,
    quantity: 1,
    saveToDatabase: false
  });

  useEffect(() => {
    const init = async () => {
      await loadCustomers();
      await loadProducts();
      await loadInvoiceNumber();
      
      // Check if editing invoice from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const invoiceId = urlParams.get('id');
      if (invoiceId) {
        await loadInvoiceForEdit(invoiceId);
      }
    };
    init();
  }, []);

  useEffect(() => {
    updateCalculations();
  }, [items, invoice.discount_percentage, invoice.discount_amount, invoice.paid_amount, usePercentageDiscount]);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const loadInvoiceNumber = async () => {
    try {
      const number = await getNextInvoiceNumber();
      setInvoiceNumber(number);
    } catch (error) {
      toast.error('Failed to load invoice number');
    }
  };

  const loadInvoiceForEdit = async (id) => {
    try {
      setLoading(true);
      setEditingInvoiceId(parseInt(id));
      const invoiceData = await getInvoice(id);
      const invoiceItemsData = await getInvoiceItems(id);
      
      if (invoiceData) {
        setInvoice({
          id: invoiceData.id,
          customer_id: invoiceData.customer_id,
          customer_name: invoiceData.customer_name || '',
          customer_phone: invoiceData.customer_phone || '',
          customer_address: invoiceData.customer_address || '',
          customer_gstin: invoiceData.customer_gstin || '',
          date: invoiceData.date,
          subtotal: invoiceData.subtotal,
          discount_percentage: invoiceData.discount_percentage || 0,
          discount_amount: invoiceData.discount_amount || 0,
          tax_amount: invoiceData.tax_amount || 0,
          total: invoiceData.total,
          paid_amount: invoiceData.paid_amount || 0,
          balance: invoiceData.balance || 0,
          status: invoiceData.status,
          notes: invoiceData.notes || ''
        });
        setInvoiceNumber(invoiceData.invoice_number);
        
        // Set customer search text from invoice data
        if (invoiceData.customer_name) {
          setCustomerSearch(invoiceData.customer_name);
        }
        
        setItems(invoiceItemsData.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          description: item.description || '',
          quantity: item.quantity,
          price: item.price,
          amount: item.amount,
          tax_rate: item.tax_rate || 0,
          hsn_code: item.hsn_code || ''
        })));
      }
    } catch (error) {
      toast.error('Failed to load invoice');
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCalculations = () => {
    const subtotal = calculateSubtotal(items);
    const discount = calculateDiscount(
      subtotal,
      invoice.discount_percentage,
      invoice.discount_amount,
      usePercentageDiscount
    );
    const tax = calculateTax(items);
    const total = calculateTotal(subtotal, discount, tax);
    const balance = calculateBalance(total, invoice.paid_amount);

    setInvoice(prev => ({
      ...prev,
      subtotal,
      discount_amount: discount,
      tax_amount: tax,
      total,
      balance,
      status: balance <= 0 ? 'paid' : 'pending'
    }));
  };

  const handleProductSelect = (product) => {
    setProductMode('saved');
    setSelectedProduct(product);
    setItemPrice(product.price);
    setItemQuantity(1);
  };

  const handleAddItem = () => {
    if (productMode === 'saved') {
      if (!selectedProduct) {
        toast.error('Please select a product');
        return;
      }
      if (itemQuantity <= 0) {
        toast.error('Quantity must be greater than 0');
        return;
      }
      const amount = calculateItemAmount(itemQuantity, itemPrice);
      const newItem = {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        description: selectedProduct.description || '',
        quantity: itemQuantity,
        price: itemPrice,
        amount,
        tax_rate: selectedProduct.tax_rate || 0,
        hsn_code: selectedProduct.hsn_code || ''
      };
      setItems([...items, newItem]);
      setSelectedProduct(null);
      setItemQuantity(1);
      setItemPrice(0);
      setProductSearch('');
      toast.success('Item added');
    } else {
      if (!quickProduct.name || !quickProduct.price || !quickProduct.quantity) {
        toast.error('Please enter product name, price, and quantity');
        return;
      }
      const quantity = Number(quickProduct.quantity) || 1;
      const price = Number(quickProduct.price) || 0;
      const amount = calculateItemAmount(quantity, price);
      const newItem = {
        product_id: null,
        product_name: quickProduct.name,
        description: quickProduct.description || '',
        quantity,
        price,
        amount,
        tax_rate: Number(quickProduct.tax_rate) || 0,
        hsn_code: quickProduct.hsn_code || '',
        saveToDatabase: quickProduct.saveToDatabase
      };
      setItems([...items, newItem]);
      setQuickProduct({
        name: '',
        price: '',
        description: '',
        hsn_code: '',
        tax_rate: 0,
        quantity: 1,
        saveToDatabase: false
      });
      toast.success('Custom item added');
    }
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async (isDraft = false) => {
    if (customerMode === 'saved' && !invoice.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    if (customerMode === 'quick' && (!quickCustomer.name || !quickCustomer.phone)) {
      toast.error('Please enter customer name and phone');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      setLoading(true);
      let customerId = invoice.customer_id || null;

      if (customerMode === 'quick') {
        // Save quick customer if requested
        if (quickCustomer.saveToDatabase) {
          customerId = await saveCustomer({
            name: quickCustomer.name,
            phone: quickCustomer.phone,
            address: quickCustomer.address,
            gstin: quickCustomer.gstin
          });
        }
      }

      // Persist custom products that are marked for save
      const enrichedItems = [];
      for (const item of items) {
        if (!item.product_id && item.saveToDatabase) {
          const newId = await saveProduct({
            name: item.product_name,
            description: item.description || '',
            price: item.price,
            hsn_code: item.hsn_code || '',
            tax_rate: item.tax_rate || 0,
            stock: 0
          });
          enrichedItems.push({ ...item, product_id: newId });
        } else {
          enrichedItems.push({ ...item });
        }
      }

      const invoiceData = {
        ...invoice,
        invoice_number: invoiceNumber,
        customer_id: customerMode === 'saved' ? customerId : customerId || null,
        customer_name: customerMode === 'quick' ? quickCustomer.name : invoice.customer_name,
        customer_phone: customerMode === 'quick' ? quickCustomer.phone : invoice.customer_phone,
        customer_address: customerMode === 'quick' ? quickCustomer.address : invoice.customer_address,
        customer_gstin: customerMode === 'quick' ? quickCustomer.gstin : invoice.customer_gstin
      };

      if (customerMode === 'saved') {
        const selected = customers.find(c => c.id === customerId);
        if (selected) {
          invoiceData.customer_name = selected.name;
          invoiceData.customer_phone = selected.phone;
          invoiceData.customer_address = selected.address;
          invoiceData.customer_gstin = selected.gstin;
        }
      } else if (!quickCustomer.saveToDatabase) {
        invoiceData.customer_id = null;
      }

      if (editingInvoiceId) {
        invoiceData.id = editingInvoiceId;
      }

      const savedInvoiceId = await saveInvoice(invoiceData, enrichedItems);
      toast.success(isDraft ? 'Invoice saved as draft' : 'Invoice saved successfully');

      if (!isDraft) {
        navigate('/invoices');
      } else if (!editingInvoiceId) {
        setEditingInvoiceId(savedInvoiceId);
        setInvoice(prev => ({ ...prev, id: savedInvoiceId }));
      }
    } catch (error) {
      toast.error('Failed to save invoice');
      console.error('Error saving invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (loading && editingInvoiceId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">
          {editingInvoiceId ? 'Edit Invoice' : 'Create Invoice'}
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowPreview(true)}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Preview
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={loading}
            className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Save & Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Details</h2>
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                type="button"
                onClick={() => setCustomerMode('saved')}
                className={`px-4 py-2 rounded-lg border ${customerMode === 'saved' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
              >
                Select Saved Customer
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode('quick')}
                className={`px-4 py-2 rounded-lg border ${customerMode === 'quick' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
              >
                Quick Customer Entry
              </button>
            </div>

            {customerMode === 'saved' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Customer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {customerSearch && (
                    <div className="mt-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                      {filteredCustomers.map(customer => (
                        <div
                          key={customer.id}
                          onClick={() => {
                            setInvoice(prev => ({ ...prev, customer_id: customer.id }));
                            setCustomerSearch(customer.name);
                            setInvoice(prev => ({
                              ...prev,
                              customer_name: customer.name,
                              customer_phone: customer.phone || '',
                              customer_address: customer.address || '',
                              customer_gstin: customer.gstin || ''
                            }));
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                        >
                          <div className="font-medium">{customer.name}</div>
                          {customer.phone && (
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {invoice.customer_id && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {customers.find(c => c.id === invoice.customer_id)?.name}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={quickCustomer.name}
                  onChange={(e) => setQuickCustomer({ ...quickCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
                <input
                  type="tel"
                  placeholder="Contact Number *"
                  value={quickCustomer.phone}
                  onChange={(e) => setQuickCustomer({ ...quickCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Address (optional)"
                  value={quickCustomer.address}
                  onChange={(e) => setQuickCustomer({ ...quickCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="GSTIN (optional)"
                  value={quickCustomer.gstin}
                  onChange={(e) => setQuickCustomer({ ...quickCustomer, gstin: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={quickCustomer.saveToDatabase}
                    onChange={(e) => setQuickCustomer({ ...quickCustomer, saveToDatabase: e.target.checked })}
                  />
                  <span>Save this customer for future use</span>
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoice.date}
                  onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Add Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Items</h2>

            <div className="flex flex-wrap gap-3 mb-4">
              <button
                type="button"
                onClick={() => setProductMode('saved')}
                className={`px-4 py-2 rounded-lg border ${productMode === 'saved' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
              >
                Select from Product List
              </button>
              <button
                type="button"
                onClick={() => setProductMode('quick')}
                className={`px-4 py-2 rounded-lg border ${productMode === 'quick' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
              >
                Add Custom Item
              </button>
            </div>

            {productMode === 'saved' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Product
                  </label>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {productSearch && (
                    <div className="mt-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                      {filteredProducts.map(product => (
                        <div
                          key={product.id}
                          onClick={() => handleProductSelect(product)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            Price: {formatCurrency(product.price)} | Stock: {product.stock}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedProduct && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(parseFloat(e.target.value) || 0)}
                        min="0.01"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price
                      </label>
                      <input
                        type="number"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleAddItem}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <input
                  type="text"
                  placeholder="Product Name *"
                  value={quickProduct.name}
                  onChange={(e) => setQuickProduct({ ...quickProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Price *"
                    value={quickProduct.price}
                    min="0"
                    step="0.01"
                    onChange={(e) => setQuickProduct({ ...quickProduct, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Quantity *"
                    value={quickProduct.quantity}
                    min="1"
                    step="0.01"
                    onChange={(e) => setQuickProduct({ ...quickProduct, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="HSN Code (optional)"
                    value={quickProduct.hsn_code}
                    onChange={(e) => setQuickProduct({ ...quickProduct, hsn_code: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Tax Rate % (optional)"
                    value={quickProduct.tax_rate}
                    min="0"
                    step="0.01"
                    onChange={(e) => setQuickProduct({ ...quickProduct, tax_rate: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={quickProduct.description}
                    onChange={(e) => setQuickProduct({ ...quickProduct, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={quickProduct.saveToDatabase}
                    onChange={(e) => setQuickProduct({ ...quickProduct, saveToDatabase: e.target.checked })}
                  />
                  <span>Save this product for future use</span>
                </label>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddItem}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Add Custom Item
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Invoice Items</h2>
            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items added yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SR</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">{item.product_name}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.amount)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Notes/Terms</h2>
            <textarea
              value={invoice.notes}
              onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter any notes or terms and conditions..."
            />
          </div>
        </div>

        {/* Right Column - Calculations */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Calculations</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={usePercentageDiscount}
                    onChange={(e) => setUsePercentageDiscount(e.target.checked)}
                    className="rounded"
                  />
                  <label className="text-sm text-gray-700">Use Percentage Discount</label>
                </div>
                {usePercentageDiscount ? (
                  <div>
                    <input
                      type="number"
                      value={invoice.discount_percentage}
                      onChange={(e) => setInvoice(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="Discount %"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <input
                      type="number"
                      value={invoice.discount_amount}
                      onChange={(e) => setInvoice(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      placeholder="Discount Amount"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
                {invoice.discount_amount > 0 && (
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-semibold">{formatCurrency(invoice.tax_amount)}</span>
              </div>

              <div className="border-t border-gray-300 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatCurrency(invoice.total)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Received Amount
                </label>
                <input
                  type="number"
                  value={invoice.paid_amount}
                  onChange={(e) => setInvoice(prev => ({ ...prev, paid_amount: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="border-t border-gray-300 pt-4">
                {invoice.balance > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(invoice.balance)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">You Saved:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(Math.abs(invoice.balance))}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {showPreview && (
        <InvoicePreview
          invoice={invoice}
          invoiceNumber={invoiceNumber}
          items={items}
          customer={
            invoice.customer_id
              ? customers.find(c => c.id === invoice.customer_id)
              : {
                  name: invoice.customer_name || quickCustomer.name,
                  phone: invoice.customer_phone || quickCustomer.phone,
                  address: invoice.customer_address || quickCustomer.address,
                  gstin: invoice.customer_gstin || quickCustomer.gstin
                }
          }
          onClose={() => setShowPreview(false)}
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
};

export default CreateInvoice;

