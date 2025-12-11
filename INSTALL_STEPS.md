# Step-by-Step Installation Guide

## Current Issue
`better-sqlite3` requires Windows SDK to compile, which is missing from your Visual Studio 2019 Build Tools installation.

## Solution: Install Windows SDK

### Step 1: Open Visual Studio Installer

1. Press `Windows Key` and search for **"Visual Studio Installer"**
2. Click to open it
3. If not found, download from: https://visualstudio.microsoft.com/downloads/

### Step 2: Modify Visual Studio 2019 Build Tools

1. In Visual Studio Installer, find **"Visual Studio 2019 Build Tools"**
2. Click the **"Modify"** button

### Step 3: Add Windows SDK Component

1. In the modification window, click the **"Individual components"** tab
2. In the search box, type: **"Windows SDK"**
3. Check the box for:
   - **"Windows 10 SDK (10.0.19041.0)"** or newer
   - OR **"Windows 11 SDK"** (recommended for Node.js 22)
4. Click **"Modify"** button at the bottom right
5. Wait for installation to complete (may take 10-30 minutes)

### Step 4: Install Dependencies

After Windows SDK is installed, run:

```powershell
npm install
```

This should now work successfully!

## Alternative: Install Other Dependencies First

If you want to install other dependencies while fixing the Windows SDK issue:

```powershell
.\install-without-sqlite.ps1
```

This will install all dependencies except `better-sqlite3`. After installing Windows SDK, run:

```powershell
npm install better-sqlite3
```

## Quick Reference

### Check if Windows SDK is installed:
```powershell
Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\Include" -ErrorAction SilentlyContinue
```

### Open Visual Studio Installer:
```powershell
Start-Process "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vs_installer.exe"
```

### After Windows SDK is installed:
```powershell
npm install
npm run electron-dev
```

## Troubleshooting

### If Visual Studio Installer is not found:
1. Download Visual Studio Build Tools from: https://visualstudio.microsoft.com/downloads/
2. Install with "Desktop development with C++" workload
3. This includes Windows SDK automatically

### If installation still fails:
1. Make sure Windows SDK version matches Node.js version requirements
2. For Node.js 22, use Windows 11 SDK or Windows 10 SDK 10.0.22000 or newer
3. Try restarting your computer after installing Windows SDK

### If you get "EPERM" errors:
1. Close all applications (VS Code, terminals, etc.)
2. Run PowerShell as Administrator
3. Run `npm install` again

## Need Help?

- See `INSTALL_WINDOWS.md` for detailed instructions
- See `TROUBLESHOOTING.md` for common issues
- Check error messages for specific guidance

