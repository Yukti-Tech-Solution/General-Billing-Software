// Calculation utilities for invoices

export const calculateItemAmount = (quantity, price) => {
  return parseFloat((quantity * price).toFixed(2));
};

export const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0);
};

export const calculateDiscount = (subtotal, discountPercentage, discountAmount, usePercentage = true) => {
  if (usePercentage) {
    return parseFloat((subtotal * (discountPercentage / 100)).toFixed(2));
  }
  return parseFloat((discountAmount || 0).toFixed(2));
};

export const calculateTax = (items) => {
  // Calculate tax based on each item's tax rate
  let totalTax = 0;
  items.forEach(item => {
    if (item.tax_rate && item.amount) {
      totalTax += (item.amount * item.tax_rate / 100);
    }
  });
  return parseFloat(totalTax.toFixed(2));
};

export const calculateTotal = (subtotal, discount, tax) => {
  return parseFloat((subtotal - discount + tax).toFixed(2));
};

export const calculateBalance = (total, paid) => {
  return parseFloat((total - paid).toFixed(2));
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (num) => {
  return parseFloat(num).toFixed(2);
};

