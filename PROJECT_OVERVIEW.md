# 📋 Billing Software - Complete Project Overview

## 🎯 Project Summary

**Name:** Billing Software  
**Version:** 1.0.0  
**Type:** Desktop Application (Cross-platform)  
**Description:** A complete desktop billing and invoicing software application with offline-first architecture, cloud sync capabilities, and professional invoice generation.

---

## 🛠️ Technology Stack

### Core Technologies

#### **Frontend Framework**
- **React** (v18.2.0) - Modern UI library for building interactive user interfaces
- **React Router DOM** (v6.20.1) - Client-side routing and navigation
- **React Toastify** (v9.1.3) - User-friendly toast notifications

#### **Desktop Framework**
- **Electron** (v28.0.0) - Desktop application framework for cross-platform support
- **Electron Builder** (v24.9.1) - Packaging and distribution tool
- **Electron Rebuild** (v3.2.9) - Rebuilds native Node.js modules for Electron

#### **Build Tools**
- **Vite** (v5.0.8) - Fast build tool and dev server
- **@vitejs/plugin-react** (v4.2.1) - React plugin for Vite
- **PostCSS** (v8.4.32) - CSS processing tool
- **Autoprefixer** (v10.4.16) - CSS vendor prefixing

#### **Styling**
- **Tailwind CSS** (v3.3.6) - Utility-first CSS framework
- Custom color palette with primary blue theme

#### **Database**
- **better-sqlite3** (v9.2.2) - High-performance SQLite database (synchronous)
- Local SQLite database stored in user's app data directory
- SQLite with WAL (Write-Ahead Logging) mode for better performance

#### **Cloud Sync & Authentication**
- **Firebase** (v10.7.1) - Complete Firebase SDK
  - **Firebase Authentication** - Email/password authentication
  - **Cloud Firestore** - Real-time cloud database
  - Offline persistence support
  - Real-time listeners for multi-device sync

#### **PDF Generation**
- **jsPDF** (v2.5.1) - Client-side PDF generation library
- Professional invoice PDF export

#### **Utilities**
- **date-fns** (v2.30.0) - Modern JavaScript date utility library
- **Concurrently** (v8.2.2) - Run multiple commands concurrently
- **wait-on** (v7.2.0) - Wait for resources to be available

---

## 🏗️ Architecture

### Application Architecture

```
┌─────────────────────────────────────────────────┐
│          Electron Main Process                  │
│  - Window Management                            │
│  - Database Operations (IPC)                    │
│  - File System Access                           │
└─────────────────┬───────────────────────────────┘
                  │ IPC (Inter-Process Communication)
┌─────────────────▼───────────────────────────────┐
│          Electron Renderer Process              │
│  - React Application                            │
│  - UI Rendering                                 │
│  - User Interactions                            │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          React Application Layer                │
│  ┌────────────────────────────────────────┐    │
│  │  Pages (Route Components)              │    │
│  │  - Dashboard                           │    │
│  │  - Create Invoice                      │    │
│  │  - Invoice History                     │    │
│  │  - Products                            │    │
│  │  - Customers                           │    │
│  │  - Settings                            │    │
│  └────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────┐    │
│  │  Components (Reusable UI)              │    │
│  │  - Sidebar                             │    │
│  │  - Header                              │    │
│  │  - InvoicePreview                      │    │
│  │  - ProductForm                         │    │
│  │  - CustomerForm                        │    │
│  └────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────┐    │
│  │  Database Layer                        │    │
│  │  - db.js (Operations)                  │    │
│  │  - schema.js (Table Definitions)       │    │
│  │  - syncManager.js (Cloud Sync)         │    │
│  └────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────┐    │
│  │  Utilities                             │    │
│  │  - calculations.js                     │    │
│  │  - pdfGenerator.js                     │    │
│  │  - numberToWords.js                    │    │
│  └────────────────────────────────────────┘    │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Local Storage Layer                    │
│  - SQLite Database (better-sqlite3)             │
│  - File: billing.db (User Data Directory)       │
│  - WAL Mode Enabled                             │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Cloud Sync Layer                       │
│  - Firebase Firestore                           │
│  - Firebase Authentication                      │
│  - Real-time Sync                               │
│  - Offline Queue                                │
└─────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
User Action
    ↓
React Component
    ↓
Database Operations (db.js)
    ↓
IPC Call to Electron Main Process
    ↓
SQLite Database (Local Storage)
    ↓
Sync Manager (if authenticated)
    ↓
Firebase Firestore (Cloud Storage)
    ↓
Real-time Listeners (Other Devices)
```

---

## 📊 Database Schema

### Tables Structure

#### **1. Companies Table**
Stores company/business information (single record)

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| name | TEXT | Company name |
| phone | TEXT | Company phone |
| address | TEXT | Company address |
| gstin | TEXT | GST identification number |
| logo | TEXT | Logo image path/base64 |
| userId | TEXT | Firebase user ID (for sync) |
| cloudId | TEXT | Firestore document ID |
| syncStatus | TEXT | 'synced', 'pending', 'conflict' |
| lastModified | DATETIME | Last modification timestamp |
| lastModifiedBy | TEXT | Device identifier |
| created_at | DATETIME | Creation timestamp |

#### **2. Customers Table**
Stores customer information

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| name | TEXT NOT NULL | Customer name |
| phone | TEXT | Customer phone |
| address | TEXT | Customer address |
| gstin | TEXT | Customer GSTIN |
| userId | TEXT | Firebase user ID |
| cloudId | TEXT | Firestore document ID |
| syncStatus | TEXT DEFAULT 'pending' | Sync status |
| lastModified | DATETIME | Last modification timestamp |
| lastModifiedBy | TEXT | Device identifier |
| created_at | DATETIME | Creation timestamp |

#### **3. Products Table**
Stores product/service information

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| name | TEXT NOT NULL | Product name |
| description | TEXT | Product description |
| price | REAL NOT NULL DEFAULT 0 | Product price |
| hsn_code | TEXT | HSN code for GST |
| tax_rate | REAL NOT NULL DEFAULT 0 | Tax percentage |
| stock | REAL NOT NULL DEFAULT 0 | Stock quantity |
| userId | TEXT | Firebase user ID |
| cloudId | TEXT | Firestore document ID |
| syncStatus | TEXT DEFAULT 'pending' | Sync status |
| lastModified | DATETIME | Last modification timestamp |
| lastModifiedBy | TEXT | Device identifier |
| created_at | DATETIME | Creation timestamp |

#### **4. Invoices Table**
Stores invoice header information

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| invoice_number | TEXT UNIQUE NOT NULL | Invoice number (INV-YYYY-XXX) |
| customer_id | INTEGER NOT NULL | Foreign key to customers |
| date | TEXT NOT NULL | Invoice date |
| subtotal | REAL NOT NULL DEFAULT 0 | Subtotal amount |
| discount_percentage | REAL DEFAULT 0 | Discount percentage |
| discount_amount | REAL DEFAULT 0 | Discount amount |
| tax_amount | REAL DEFAULT 0 | Total tax amount |
| total | REAL NOT NULL DEFAULT 0 | Final total amount |
| paid_amount | REAL DEFAULT 0 | Amount paid |
| balance | REAL DEFAULT 0 | Remaining balance |
| status | TEXT DEFAULT 'pending' | Invoice status |
| notes | TEXT | Additional notes |
| userId | TEXT | Firebase user ID |
| cloudId | TEXT | Firestore document ID |
| syncStatus | TEXT DEFAULT 'pending' | Sync status |
| lastModified | DATETIME | Last modification timestamp |
| lastModifiedBy | TEXT | Device identifier |
| created_at | DATETIME | Creation timestamp |

**Foreign Key:** `customer_id` REFERENCES `customers(id)`

#### **5. Invoice Items Table**
Stores invoice line items

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| invoice_id | INTEGER NOT NULL | Foreign key to invoices |
| product_id | INTEGER NOT NULL | Foreign key to products |
| quantity | REAL NOT NULL | Item quantity |
| price | REAL NOT NULL | Item price |
| amount | REAL NOT NULL | Line total (quantity × price) |

**Foreign Keys:**
- `invoice_id` REFERENCES `invoices(id) ON DELETE CASCADE`
- `product_id` REFERENCES `products(id)`

#### **6. Sync Metadata Table**
Tracks sync status and timestamps

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| collection_name | TEXT UNIQUE NOT NULL | Collection name |
| last_sync_time | DATETIME | Last successful sync time |
| sync_status | TEXT DEFAULT 'idle' | Current sync status |
| pending_count | INTEGER DEFAULT 0 | Number of pending items |

### Database Indexes

For performance optimization:
- `idx_invoices_customer` - Index on invoices.customer_id
- `idx_invoices_date` - Index on invoices.date
- `idx_invoice_items_invoice` - Index on invoice_items.invoice_id
- `idx_invoice_items_product` - Index on invoice_items.product_id
- `idx_companies_userId` - Index on companies.userId
- `idx_customers_userId` - Index on customers.userId
- `idx_products_userId` - Index on products.userId
- `idx_invoices_userId` - Index on invoices.userId
- Sync status indexes for efficient querying

---

## ✨ Features & Functionalities

### 1. Dashboard
- **Sales Statistics:**
  - Today's sales total
  - Monthly sales total
  - Yearly sales total
  - Total invoices count
  
- **Pending Payments:**
  - Total outstanding balance
  - Visual indicator with warning
  
- **Recent Invoices:**
  - List of latest invoices
  - Quick access to invoice details
  
- **Quick Actions:**
  - Create new invoice button
  - Navigate to products/customers

### 2. Company Settings
- **Company Information Management:**
  - Company name
  - Phone number
  - Address
  - GSTIN number
  - Company logo upload/display
  
- **Firebase Authentication:**
  - Sign up with email/password
  - Sign in
  - Sign out
  - Current user display
  
- **Cloud Sync Configuration:**
  - Enable/disable auto sync
  - Manual sync button
  - Sync status indicator
  - Pending changes counter

### 3. Product Management
- **Product CRUD Operations:**
  - Add new products
  - Edit existing products
  - Delete products
  - Search/filter products
  
- **Product Fields:**
  - Product name
  - Description
  - Price
  - HSN code (for GST)
  - Tax rate (%)
  - Stock quantity
  
- **Features:**
  - Real-time search
  - Form validation
  - Toast notifications

### 4. Customer Management
- **Customer CRUD Operations:**
  - Add new customers
  - Edit existing customers
  - Delete customers
  - Search/filter customers
  
- **Customer Fields:**
  - Customer name (required)
  - Phone number
  - Address
  - GSTIN number
  
- **Features:**
  - Real-time search
  - Form validation
  - Toast notifications

### 5. Invoice Creation & Editing
- **Invoice Header:**
  - Auto-generated invoice number (INV-YYYY-XXX format)
  - Invoice date selection
  - Customer selection with search
  - Notes/terms field
  
- **Invoice Items:**
  - Add multiple products
  - Product search/selection
  - Quantity input
  - Price override (optional)
  - Remove items
  - Real-time amount calculation
  
- **Calculations:**
  - Subtotal (sum of all items)
  - Discount (percentage or flat amount)
  - Tax calculation (based on product tax rates)
  - Total amount
  - Paid amount tracking
  - Balance calculation
  
- **Payment Tracking:**
  - Paid amount input
  - Balance calculation
  - Status: pending/paid
  
- **Features:**
  - Real-time calculations
  - Form validation
  - Edit existing invoices
  - Save as draft
  - Invoice preview

### 6. Invoice History
- **Invoice Listing:**
  - All invoices table
  - Filter by date range
  - Search by invoice number/customer
  - Sort by date/amount
  
- **Invoice Actions:**
  - View invoice details
  - Edit invoice
  - Delete invoice
  - Preview/Print invoice
  - Download PDF
  
- **Invoice Information:**
  - Invoice number
  - Customer name
  - Date
  - Total amount
  - Payment status
  - Balance

### 7. Invoice Preview & Export
- **Professional Invoice Layout:**
  - Company logo and details
  - Invoice header (INVOICE text, ref number, date)
  - Bill To section (customer details)
  - Itemized table (SR, Name, Qty, Price, Amount)
  - Totals section:
    - Subtotal
    - Discount (if any)
    - Tax (if any)
    - Total
    - Paid amount
    - Balance/You Saved
  
- **Additional Features:**
  - Amount in words (Indian numbering system)
  - Notes section
  - Footer message
  - Professional styling
  
- **Export Options:**
  - Print invoice
  - Download as PDF (jsPDF)
  - PDF filename: `INV-YYYY-XXX_CustomerName.pdf`

### 8. Cloud Sync & Multi-Device Support
- **Firebase Integration:**
  - Firebase Authentication (email/password)
  - Cloud Firestore database
  - Real-time data synchronization
  
- **Sync Features:**
  - **Auto Sync:** Automatic synchronization when online
  - **Manual Sync:** Trigger sync on demand
  - **Real-time Listeners:** Instant updates across devices
  - **Offline Support:** Queue changes when offline, sync when online
  - **Conflict Resolution:** Last-write-wins strategy
  
- **Sync Status Tracking:**
  - Online/offline indicator
  - Sync in progress indicator
  - Pending changes counter
  - Last sync timestamp
  
- **Data Security:**
  - User-specific data isolation
  - Firebase security rules
  - Authentication required for sync

### 9. Utilities

#### **Number to Words Converter**
- Converts invoice amount to Indian English words
- Supports Crores, Lakhs, Thousands, Hundreds
- Includes Rupees and Paise
- Format: "X Lakh Y Thousand Z Rupees Only"

#### **Calculation Utilities**
- Item amount calculation
- Subtotal calculation
- Discount calculation (percentage/flat)
- Tax calculation
- Total calculation
- Balance calculation
- Currency formatting (₹ symbol)

#### **PDF Generator**
- Professional invoice PDF generation
- Company logo support
- Multi-page support
- Custom styling
- Auto filename generation

---

## 📁 Project Structure

```
Billing Software/
│
├── electron/                          # Electron main process
│   ├── main.js                       # Main Electron process (window, IPC)
│   └── preload.js                    # Preload script (security bridge)
│
├── src/                              # React application source
│   ├── components/                   # Reusable React components
│   │   ├── CustomerForm.jsx         # Customer form component
│   │   ├── Header.jsx               # Application header
│   │   ├── InvoicePreview.jsx       # Invoice preview component
│   │   ├── ProductForm.jsx          # Product form component
│   │   └── Sidebar.jsx              # Navigation sidebar
│   │
│   ├── pages/                        # Page components (routes)
│   │   ├── CreateInvoice.jsx        # Create/edit invoice page
│   │   ├── Customers.jsx            # Customer management page
│   │   ├── Dashboard.jsx            # Dashboard/home page
│   │   ├── InvoiceHistory.jsx       # Invoice listing page
│   │   ├── Products.jsx             # Product management page
│   │   └── Settings.jsx             # Settings page
│   │
│   ├── database/                     # Database layer
│   │   ├── db.js                    # Database operations wrapper
│   │   ├── schema.js                # Database schema & initialization
│   │   └── syncManager.js           # Firebase sync manager
│   │
│   ├── firebase/                     # Firebase configuration
│   │   └── config.js                # Firebase config & initialization
│   │
│   ├── utils/                        # Utility functions
│   │   ├── calculations.js          # Invoice calculation utilities
│   │   ├── numberToWords.js         # Number to words converter
│   │   └── pdfGenerator.js          # PDF generation utility
│   │
│   ├── App.jsx                       # Main React app component
│   ├── index.jsx                     # React entry point
│   └── index.css                     # Global styles & Tailwind imports
│
├── public/                           # Static files
│   ├── icon-info.txt                # Icon information
│   └── (icon.png)                   # App icon (optional)
│
├── index.html                        # HTML entry point
│
├── Configuration Files:
│   ├── package.json                 # Dependencies & scripts
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── postcss.config.js            # PostCSS configuration
│   └── .env                         # Environment variables (not in repo)
│
├── Documentation Files:
│   ├── README.md                    # Main documentation
│   ├── QUICK_START.md              # Quick start guide
│   ├── FIREBASE_SETUP.md           # Firebase setup instructions
│   ├── INSTALL_WINDOWS.md          # Windows installation guide
│   ├── TROUBLESHOOTING.md          # Troubleshooting guide
│   ├── START_HERE.txt              # Quick fix guide
│   └── MANUAL_INSTALL_STEPS.txt    # Manual installation steps
│
├── Installation Scripts (Windows):
│   ├── install.ps1                  # Main installation script
│   ├── fix-installation.ps1         # Fix installation script
│   ├── install-windows-sdk.ps1      # Windows SDK installer
│   ├── check-installation.ps1       # Installation checker
│   ├── install-without-sqlite.ps1   # Install without SQLite
│   ├── open-visual-studio-installer.bat # VS Installer launcher
│   ├── RUN_THIS_FIRST.bat           # First run batch file
│   └── start-dev.bat                # Development starter
│
└── node_modules/                    # Dependencies (generated)
```

---

## 🚀 Installation & Setup

### Prerequisites

1. **Node.js** (v16 or higher, recommended: v18 LTS or v20 LTS)
2. **npm** (comes with Node.js)
3. **Windows SDK** (Windows only - for better-sqlite3 compilation)
   - Visual Studio Build Tools 2019 or later
   - Windows 10 SDK (10.0.19041.0) or newer

### Windows Installation

#### Quick Method (Recommended):
1. Run the fix script:
   ```powershell
   .\fix-installation.ps1
   ```
2. Follow the prompts to install Windows SDK
3. Install dependencies:
   ```powershell
   npm install
   ```
4. Start development:
   ```powershell
   npm run electron-dev
   ```

#### Manual Method:
1. Install Windows SDK through Visual Studio Installer
2. Install dependencies: `npm install`
3. Start development: `npm run electron-dev`

### All Platforms

```bash
# Install dependencies
npm install

# Start development server
npm run electron-dev
```

---

## 🏃 Development

### Available Scripts

```bash
# Development server (Vite)
npm run dev

# Electron app (production build)
npm run electron

# Electron app (development - runs Vite + Electron together)
npm run electron-dev

# Rebuild native modules (better-sqlite3)
npm run rebuild

# Build React app for production
npm run build

# Preview production build
npm run preview

# Build distribution packages
npm run dist          # All platforms
npm run dist:win      # Windows only
npm run dist:mac      # macOS only
npm run dist:linux    # Linux only
```

### Development Workflow

1. **Start Development:**
   ```bash
   npm run electron-dev
   ```
   - Starts Vite dev server on port 5173
   - Launches Electron window
   - Hot module replacement enabled

2. **Database Location:**
   - Windows: `%APPDATA%\billing-software\billing.db`
   - macOS: `~/Library/Application Support/billing-software/billing.db`
   - Linux: `~/.config/billing-software/billing.db`

3. **Debugging:**
   - Electron DevTools automatically opens in development
   - Check browser console for React errors
   - Check Electron main process logs in terminal

---

## 📦 Building for Production

### Build Process

1. **Build React App:**
   ```bash
   npm run build
   ```
   - Creates optimized production build in `dist/` folder

2. **Package Electron App:**
   ```bash
   npm run dist
   ```
   - Creates installers for all platforms
   - Output in `dist/` folder

### Distribution Packages

- **Windows:** NSIS installer (.exe)
- **macOS:** DMG disk image (.dmg)
- **Linux:** AppImage (.AppImage)

### Build Configuration

Defined in `package.json`:
```json
{
  "build": {
    "appId": "com.billingsoftware.app",
    "productName": "Billing Software",
    "win": { "target": "nsis" },
    "mac": { "target": "dmg" },
    "linux": { "target": "AppImage" }
  }
}
```

---

## 🔐 Firebase Setup (Optional)

### Required for Cloud Sync

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project

2. **Enable Services:**
   - Authentication (Email/Password)
   - Firestore Database

3. **Configure Credentials:**
   - Get Firebase config from Project Settings
   - Add to `.env` file or `src/firebase/config.js`

4. **Set Security Rules:**
   - Configure Firestore security rules
   - Ensure user data isolation

See `FIREBASE_SETUP.md` for detailed instructions.

---

## 📝 Key Functionalities in Detail

### Invoice Number Format

Format: `INV-YYYY-XXX`
- `INV`: Invoice prefix
- `YYYY`: Current year (4 digits)
- `XXX`: Sequential number (3 digits, resets each year)

Example: `INV-2024-001`, `INV-2024-002`, etc.

### Invoice Calculations

1. **Subtotal:** Sum of all invoice items (quantity × price)
2. **Discount:** 
   - Percentage: `subtotal × (discount_percentage / 100)`
   - Flat: Direct discount amount
3. **Tax:** Sum of taxes from all products
   - Product tax: `(item_amount × tax_rate) / 100`
4. **Total:** `subtotal - discount_amount + tax_amount`
5. **Balance:** `total - paid_amount`

### Number to Words (Indian System)

- Supports: Crores, Lakhs, Thousands, Hundreds
- Format: "X Lakh Y Thousand Z Rupees Only"
- Includes Paise conversion if decimal exists

### Sync Strategy

1. **Local First:** All changes saved to SQLite immediately
2. **Background Sync:** Sync happens in background when online
3. **Conflict Resolution:** Last-write-wins (based on timestamp)
4. **Offline Queue:** Changes marked as 'pending', sync when online
5. **Real-time Updates:** Firestore listeners for instant sync

---

## 🎨 UI/UX Features

### Design System

- **Color Scheme:** Blue primary theme
- **Framework:** Tailwind CSS utility classes
- **Responsive:** Works on different window sizes
- **Minimalist:** Clean, professional interface

### User Experience

- **Toast Notifications:** Success/error feedback
- **Loading States:** Spinner indicators during operations
- **Form Validation:** Real-time validation feedback
- **Search/Filter:** Quick search in lists
- **Keyboard Navigation:** Tab navigation support

### Components

- **Sidebar:** Navigation menu with icons
- **Header:** App title and sync status
- **Forms:** Consistent form styling
- **Tables:** Sortable, filterable data tables
- **Cards:** Stat cards for dashboard

---

## 🔧 Configuration

### Environment Variables (Optional)

Create `.env` file in project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Tailwind Configuration

Custom primary color palette:
- Primary Blue: #3b82f6 to #1e3a8a (50-900 shades)

### Vite Configuration

- Base path: `./` (relative paths)
- Port: `5173`
- React plugin enabled
- Path alias: `@` → `./src`

---

## 🐛 Troubleshooting

### Common Issues

1. **Windows SDK Missing:**
   - Install Visual Studio Build Tools
   - Add Windows SDK component
   - See `INSTALL_WINDOWS.md`

2. **better-sqlite3 Compilation Failed:**
   - Install Windows SDK
   - Rebuild: `npm run rebuild`
   - Check Node.js version compatibility

3. **Firebase Not Working:**
   - Check Firebase config
   - Verify internet connection
   - Check browser console for errors

4. **Database Errors:**
   - Check database file permissions
   - Verify database schema
   - Check console for SQL errors

See `TROUBLESHOOTING.md` for detailed solutions.

---

## 📚 Additional Documentation

- **README.md** - Main project documentation
- **QUICK_START.md** - Quick installation guide
- **FIREBASE_SETUP.md** - Firebase configuration guide
- **INSTALL_WINDOWS.md** - Detailed Windows setup
- **TROUBLESHOOTING.md** - Common issues and solutions
- **START_HERE.txt** - Quick fix guide for Windows SDK

---

## 🔄 Version Information

- **Current Version:** 1.0.0
- **License:** MIT
- **Author:** Your Name (Update in package.json)

---

## 🚀 Future Enhancements (Potential)

- Multi-currency support
- Multiple companies/organizations
- Reports and analytics
- Barcode scanning
- Email invoice sending
- Payment reminders
- Inventory management
- Advanced reporting
- User roles and permissions
- Backup/restore functionality

---

## 📞 Support

For issues or questions:
1. Check documentation files
2. Review error messages in console
3. Check Firebase Console (if using sync)
4. Review code comments in source files

---

**Last Updated:** Generated on project scan
**Project Path:** E:\Programming\Yukti Tech Solution\Billing Software

