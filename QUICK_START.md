# Quick Start Guide

## Windows Installation (5 Minutes)

### ⚠️ IMPORTANT: Windows SDK Required

The `better-sqlite3` package requires Windows SDK to compile. You **must** install it first.

### Step 1: Install Windows SDK (Required)

**Quick Method: Run the Fix Script**

```powershell
.\fix-installation.ps1
```

This will:
- Check if Visual Studio Installer is installed
- Open Visual Studio Installer for you
- Guide you through adding Windows SDK

**Manual Method:**

1. Open **Visual Studio Installer** from Start Menu
   - Press `Windows Key` and type "Visual Studio Installer"
   
2. Find **Visual Studio 2019 Build Tools** and click **Modify**

3. Go to **"Individual components"** tab (at the top)

4. Search for **"Windows SDK"**

5. Check **"Windows 10 SDK (10.0.19041.0)"** or newer
   - Or check "Windows 11 SDK" if available

6. Click **"Modify"** button and wait for installation (10-20 minutes)

**Detailed Instructions:** See [install-windows-sdk.md](install-windows-sdk.md) for step-by-step screenshots and troubleshooting.

### Step 2: Install Dependencies

```powershell
npm install
```

### Step 3: Run the Application

```powershell
npm run electron-dev
```

## Troubleshooting

### If `npm install` fails with "missing Windows SDK":

1. **Verify Windows SDK is installed:**
   - Open Visual Studio Installer
   - Check that Windows SDK component is installed
   - If not, install it (see Step 1)

2. **Clean install:**
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Force package-lock.json
   npm install
   ```

3. **Check Node.js version:**
   ```powershell
   node -v
   ```
   - Should be v16 or higher
   - If using Node.js 22, you may need Windows SDK 10.0.22000 or newer

### If Visual Studio Installer is not found:

1. **Download Visual Studio Build Tools:**
   - https://visualstudio.microsoft.com/downloads/
   - Select "Build Tools for Visual Studio 2019"
   - Install with "Desktop development with C++" workload

2. **Or install Visual Studio Community:**
   - Includes everything needed
   - Select "Desktop development with C++" during installation

## Common Issues

### Issue: "better-sqlite3 compilation failed"

**Solution**: Install Windows SDK (see Step 1 above)

### Issue: "vite is not recognized"

**Solution**: 
```powershell
npm install
```

### Issue: "EPERM errors"

**Solution**:
1. Close all applications (VS Code, terminals, etc.)
2. Run PowerShell as Administrator
3. Run `npm install`

## Next Steps

After successful installation:

1. **Start development:**
   ```powershell
   npm run electron-dev
   ```

2. **Build for production:**
   ```powershell
   npm run build
   npm run dist
   ```

3. **Add company logo:**
   - Add `public/icon.png` (256x256 pixels)
   - Uncomment icon line in `electron/main.js`

## Need Help?

- See [INSTALL_WINDOWS.md](INSTALL_WINDOWS.md) for detailed Windows instructions
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Check error messages carefully for specific guidance
