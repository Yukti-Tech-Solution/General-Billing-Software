# Billing Software

A complete desktop billing software application built with Electron, React, SQLite, and Tailwind CSS.

## Features

- **Dashboard**: View sales statistics, pending payments, and recent invoices
- **Company Settings**: Manage company details and logo
- **Product Management**: Add, edit, delete, and search products
- **Customer Management**: Add, edit, delete, and search customers
- **Invoice Creation**: Create invoices with automatic calculations
- **Invoice History**: View, filter, edit, and delete invoices
- **Invoice Preview & Print**: Professional invoice preview with print and PDF export
- **PDF Generation**: Export invoices as PDF files
- **Local Database**: SQLite database for offline data storage

## Technology Stack

- **Electron**: Desktop application framework
- **React**: Frontend framework
- **SQLite (better-sqlite3)**: Local database
- **Tailwind CSS**: Styling
- **Vite**: Build tool
- **React Router**: Navigation
- **jsPDF**: PDF generation
- **date-fns**: Date formatting
- **react-toastify**: Notifications

## Prerequisites

- Node.js (v16 or higher) - Recommended: v18 LTS or v20 LTS
- npm or yarn
- **Windows Users**: Visual Studio Build Tools with Windows SDK (see Windows Installation below)

## Installation

### Windows Users - IMPORTANT

**Before installing dependencies, you MUST install Windows SDK:**

1. **Open Visual Studio Installer**
   - Search for "Visual Studio Installer" in Windows Start menu
   - Or download from: https://visualstudio.microsoft.com/downloads/

2. **Modify Visual Studio 2019 Build Tools**
   - Click "Modify" on Visual Studio 2019 Build Tools
   - Go to "Individual components" tab
   - Search for "Windows SDK"
   - Select "Windows 10 SDK (10.0.19041.0)" or newer
   - Click "Modify" to install

3. **After Windows SDK is installed, run:**
   ```bash
   npm install
   ```

**Alternative**: Run the fix script:
```powershell
.\fix-installation.ps1
```

### All Platforms

1. Clone the repository or extract the project files

2. Install dependencies:
```bash
npm install
```

**Note**: If `better-sqlite3` installation fails on Windows, see [INSTALL_WINDOWS.md](INSTALL_WINDOWS.md) for detailed troubleshooting.

## Development

1. Start the development server:
```bash
npm run dev
```

2. In a separate terminal, start Electron:
```bash
npm run electron-dev
```

Or use the combined command:
```bash
npm run electron-dev
```

## Building for Production

1. Build the React app:
```bash
npm run build
```

2. Create distribution packages:

For Windows:
```bash
npm run dist:win
```

For macOS:
```bash
npm run dist:mac
```

For Linux:
```bash
npm run dist:linux
```

Or build for all platforms:
```bash
npm run dist
```

The built installers will be in the `dist` folder.

## Project Structure

```
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Electron preload script
├── src/
│   ├── components/      # React components
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── InvoicePreview.jsx
│   │   ├── ProductForm.jsx
│   │   └── CustomerForm.jsx
│   ├── pages/           # Page components
│   │   ├── Dashboard.jsx
│   │   ├── CreateInvoice.jsx
│   │   ├── InvoiceHistory.jsx
│   │   ├── Products.jsx
│   │   ├── Customers.jsx
│   │   └── Settings.jsx
│   ├── database/        # Database operations
│   │   ├── db.js
│   │   └── schema.js
│   ├── utils/           # Utility functions
│   │   ├── calculations.js
│   │   ├── pdfGenerator.js
│   │   └── numberToWords.js
│   ├── App.jsx          # Main app component
│   ├── index.jsx        # React entry point
│   └── index.css        # Global styles
├── public/              # Static files
│   ├── index.html
│   └── icon.png
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Database Schema

### Companies
- id, name, phone, address, gstin, logo, created_at

### Customers
- id, name, phone, address, gstin, created_at

### Products
- id, name, description, price, hsn_code, tax_rate, stock, created_at

### Invoices
- id, invoice_number, customer_id, date, subtotal, discount_percentage, discount_amount, tax_amount, total, paid_amount, balance, status, notes, created_at

### Invoice Items
- id, invoice_id, product_id, quantity, price, amount

## Usage

1. **Setup Company**: Go to Settings and add your company details
2. **Add Products**: Navigate to Products and add your products
3. **Add Customers**: Navigate to Customers and add your customers
4. **Create Invoice**: Go to Create Invoice, select customer, add items, and save
5. **View Invoices**: Check Invoice History to view, edit, or delete invoices
6. **Print/Export**: Use the Preview button to print or download as PDF

## Invoice Number Format

Invoices are automatically numbered in the format: `INV-YYYY-001`
- INV: Invoice prefix
- YYYY: Current year
- 001: Sequential number (resets each year)

## Features in Detail

### Dashboard
- Today's sales, monthly sales, yearly sales
- Total invoices count
- Pending payments
- Recent invoices list
- Quick action buttons

### Invoice Creation
- Customer selection with search
- Product selection with search
- Real-time calculations
- Discount (percentage or flat amount)
- Tax calculation based on product tax rates
- Payment tracking
- Notes/terms section

### Invoice Preview
- Professional GST invoice format
- Company logo and details
- Customer details
- Itemized list
- Tax breakdown
- Amount in words
- Print and PDF export

## Troubleshooting

### Database Issues
If you encounter database errors, the database file is stored in the user data directory. You can delete it to start fresh (all data will be lost).

### Build Issues
If you encounter build issues with better-sqlite3:
- Windows: Install windows-build-tools
- macOS: Install Xcode Command Line Tools
- Linux: Install build-essential

### Electron Issues
If Electron doesn't start:
- Make sure all dependencies are installed
- Check that the dev server is running on port 5173
- Check the console for errors

## License

MIT

## Support

For issues or questions, please check the code comments or create an issue in the repository.

## Version

1.0.0

