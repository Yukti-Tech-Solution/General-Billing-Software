# Windows Installation Guide

## Problem
The `better-sqlite3` package requires native compilation, which needs Visual Studio Build Tools with Windows SDK.

## Solution Options

### Option 1: Install Windows SDK (Recommended)

1. **Open Visual Studio Installer**
   - Search for "Visual Studio Installer" in Windows Start menu
   - Or download from: https://visualstudio.microsoft.com/downloads/

2. **Modify Visual Studio 2019 Build Tools**
   - Click "Modify" on your Visual Studio 2019 Build Tools installation
   - Go to "Individual components" tab
   - Search for "Windows SDK"
   - Select the latest Windows 10/11 SDK (e.g., "Windows 10 SDK (10.0.19041.0)" or newer)
   - Click "Modify" to install

3. **Install Dependencies**
   ```powershell
   npm install
   ```

### Option 2: Install Visual Studio Community (Full Installation)

1. **Download Visual Studio Community**
   - Download from: https://visualstudio.microsoft.com/vs/community/
   - Run the installer

2. **Select Workloads**
   - Select "Desktop development with C++"
   - This automatically includes Windows SDK

3. **Install Dependencies**
   ```powershell
   npm install
   ```

### Option 3: Use Pre-built Binaries (If Available)

Try installing with the `--build-from-source=false` flag first to use pre-built binaries:

```powershell
npm install better-sqlite3 --build-from-source=false
npm install
```

### Option 4: Install Windows Build Tools (Alternative)

1. **Install Windows Build Tools**
   ```powershell
   npm install --global windows-build-tools
   ```

2. **Install Dependencies**
   ```powershell
   npm install
   ```

## Verification

After installing Windows SDK, verify the installation:

```powershell
npm install
```

If successful, you should see:
- All packages installed without errors
- `better-sqlite3` compiled successfully

## Troubleshooting

### If npm install still fails:

1. **Clean install**
   ```powershell
   rm -r node_modules
   rm package-lock.json
   npm install
   ```

2. **Check Node.js version**
   ```powershell
   node -v
   ```
   - Should be v16 or higher
   - Node.js 22.20.0 should work, but if issues persist, try Node.js 18 LTS

3. **Install with verbose logging**
   ```powershell
   npm install --verbose
   ```

### If Visual Studio is not found:

1. **Set environment variables manually**
   ```powershell
   $env:npm_config_msvs_version = "2019"
   npm install
   ```

2. **Use npm config**
   ```powershell
   npm config set msvs_version 2019
   npm install
   ```

## Quick Fix Script

Run this PowerShell script as Administrator:

```powershell
# Install Windows Build Tools
npm install --global windows-build-tools

# Set npm config
npm config set msvs_version 2019

# Install dependencies
npm install
```

## Alternative: Use sql.js (No Native Compilation)

If you continue to have issues, we can switch to `sql.js` which doesn't require native compilation. This would require code changes but would work immediately.

