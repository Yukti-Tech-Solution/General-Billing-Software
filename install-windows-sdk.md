# How to Install Windows SDK - Step by Step

## Problem
The error message shows:
```
gyp ERR! find VS - missing any Windows SDK
```

This means Visual Studio 2019 Build Tools is installed, but the Windows SDK component is missing.

## Solution: Install Windows SDK

### Step 1: Open Visual Studio Installer

1. Press `Windows Key` and type "Visual Studio Installer"
2. Click on "Visual Studio Installer" from the search results
3. Or navigate to: `C:\Program Files (x86)\Microsoft Visual Studio\Installer\vs_installer.exe`

### Step 2: Modify Visual Studio 2019 Build Tools

1. In Visual Studio Installer, find **"Visual Studio 2019 Build Tools"**
2. Click the **"Modify"** button (not "Launch")

### Step 3: Add Windows SDK Component

1. In the modification dialog, click the **"Individual components"** tab (at the top)
2. In the search box, type: **"Windows SDK"**
3. Look for and check one of these:
   - **"Windows 10 SDK (10.0.19041.0)"** or newer
   - **"Windows 11 SDK (10.0.22000.0)"** or newer
   - Any Windows SDK version 10.0.19041.0 or higher

4. **Important**: Make sure the checkbox is checked (blue checkmark)

### Step 4: Install

1. Click the **"Modify"** button at the bottom right
2. Wait for the installation to complete (this may take 10-20 minutes)
3. You may need to restart your computer after installation

### Step 5: Verify Installation

After installation, verify it worked:

1. Open Visual Studio Installer again
2. Click "Modify" on Visual Studio 2019 Build Tools
3. Go to "Individual components" tab
4. Search for "Windows SDK"
5. You should see the Windows SDK you just installed with a checkmark

### Step 6: Install Dependencies

After Windows SDK is installed, run:

```powershell
npm install
```

This should now work without errors!

## Alternative: Install Full Visual Studio Community

If you prefer, you can install the full Visual Studio Community instead:

1. Download Visual Studio Community from: https://visualstudio.microsoft.com/vs/community/
2. During installation, select the **"Desktop development with C++"** workload
3. This automatically includes Windows SDK
4. After installation, run: `npm install`

## Troubleshooting

### If you can't find Visual Studio Installer:

1. Download it from: https://visualstudio.microsoft.com/downloads/
2. Scroll down to "Tools for Visual Studio"
3. Download "Build Tools for Visual Studio 2019"

### If the installation fails:

1. Make sure you have administrator privileges
2. Close all running applications
3. Try running Visual Studio Installer as Administrator
4. Check Windows Update - make sure your system is up to date

### If npm install still fails after installing Windows SDK:

1. Restart your computer
2. Open a new PowerShell window
3. Run: `npm install` again

## Quick Check

To verify Windows SDK is installed, you can check:

```powershell
Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\Include" -ErrorAction SilentlyContinue
```

If this folder exists and contains SDK versions, Windows SDK is installed.

## Still Having Issues?

1. Check the error message carefully
2. Make sure you selected the correct Windows SDK version (10.0.19041.0 or newer)
3. Try installing Windows 11 SDK instead of Windows 10 SDK
4. Restart your computer after installation
5. Run `npm install` in a new terminal window

## Summary

The issue is simple: **Windows SDK is missing from Visual Studio Build Tools**.

The fix is simple: **Add Windows SDK component through Visual Studio Installer**.

After that: **Run `npm install` and it should work!**

