// Convert number to words (Indian numbering system)

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

const convertHundreds = (num) => {
  let result = '';
  
  if (num > 99) {
    result += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  
  if (num > 19) {
    result += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }
  
  if (num > 0) {
    result += ones[num] + ' ';
  }
  
  return result;
};

export const numberToWords = (num) => {
  if (num === 0) return 'Zero';
  
  const numStr = num.toString();
  const [integerPart, decimalPart] = numStr.split('.');
  
  let integerNum = parseInt(integerPart);
  const decimalNum = decimalPart ? parseInt(decimalPart.padEnd(2, '0').substring(0, 2)) : 0;
  
  if (integerNum === 0 && decimalNum === 0) return 'Zero';
  
  let result = '';
  
  // Handle negative
  if (integerNum < 0) {
    result += 'Negative ';
    integerNum = Math.abs(integerNum);
  }
  
  // Crores
  if (integerNum >= 10000000) {
    result += convertHundreds(Math.floor(integerNum / 10000000)) + 'Crore ';
    integerNum %= 10000000;
  }
  
  // Lakhs
  if (integerNum >= 100000) {
    result += convertHundreds(Math.floor(integerNum / 100000)) + 'Lakh ';
    integerNum %= 100000;
  }
  
  // Thousands
  if (integerNum >= 1000) {
    result += convertHundreds(Math.floor(integerNum / 1000)) + 'Thousand ';
    integerNum %= 1000;
  }
  
  // Hundreds
  if (integerNum > 0) {
    result += convertHundreds(integerNum);
  }
  
  result = result.trim();
  
  // Add "Rupees" if there's an integer part
  if (result) {
    result += 'Rupees';
  }
  
  // Add paise if decimal part exists
  if (decimalNum > 0) {
    const paiseWords = convertHundreds(decimalNum).trim();
    if (paiseWords) {
      result += (result ? ' and ' : '') + paiseWords + 'Paise';
    }
  } else {
    result += ' Only';
  }
  
  return result;
};

