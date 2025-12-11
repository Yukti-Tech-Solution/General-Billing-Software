# Troubleshooting Guide

## Installation Issues

### Issue: better-sqlite3 compilation fails

**Error Message:**
```
gyp ERR! find VS missing any Windows SDK
```

**Solutions:**

1. **Install Windows SDK via Visual Studio Installer**
   - Open Visual Studio Installer
   - Modify Visual Studio 2019 Build Tools
   - Add "Windows 10/11 SDK" component
   - Run `npm install` again

2. **Install Visual Studio Community**
   - Download from https://visualstudio.microsoft.com/vs/community/
   - Select "Desktop development with C++" workload
   - This includes Windows SDK automatically

3. **Use Windows Build Tools**
   ```powershell
   npm install --global windows-build-tools
   npm install
   ```

### Issue: Dependencies not found after installation

**Error Message:**
```
'vite' is not recognized as an internal or external command
```

**Solution:**
```powershell
# Clean install
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### Issue: EPERM errors during installation

**Error Message:**
```
EPERM: operation not permitted, rmdir
```

**Solutions:**

1. **Close all applications using node_modules**
   - Close VS Code, terminals, etc.
   - Try installing again

2. **Run as Administrator**
   - Right-click PowerShell
   - Select "Run as Administrator"
   - Run `npm install`

3. **Manual cleanup**
   ```powershell
   # Close all Node processes
   taskkill /F /IM node.exe
   # Remove node_modules
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

## Runtime Issues

### Issue: Database not initialized

**Error Message:**
```
Failed to initialize database
```

**Solutions:**

1. **Check database path permissions**
   - Database is stored in user data directory
   - Ensure the directory has write permissions

2. **Delete database file to reset**
   - Windows: `%APPDATA%\billing-software\billing.db`
   - Delete the file and restart the app

### Issue: Electron won't start

**Error Message:**
```
Cannot find module 'electron'
```

**Solution:**
```powershell
npm install
npm run electron-dev
```

### Issue: Dev server not starting

**Error Message:**
```
Port 5173 is already in use
```

**Solution:**
```powershell
# Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or change port in vite.config.js
```

## Build Issues

### Issue: Build fails

**Error Message:**
```
'electron-builder' is not recognized
```

**Solution:**
```powershell
# Install dependencies
npm install

# Build
npm run build
npm run dist
```

### Issue: Missing icon file

**Error Message:**
```
Cannot find icon file
```

**Solution:**
- Icon is optional for development
- Add `public/icon.png` (256x256) for production builds
- Or remove icon references from package.json

## Common Solutions

### Clean Install

```powershell
# Remove all installed packages
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

### Reset Database

```powershell
# Windows
Remove-Item "$env:APPDATA\billing-software\billing.db"

# The database will be recreated on next app start
```

### Check Node.js Version

```powershell
node -v
# Should be v16 or higher
# Recommended: v18 LTS or v20 LTS
```

### Verify Installation

```powershell
# Check if all dependencies are installed
npm list --depth=0

# Check for missing dependencies
npm audit
```

## Getting Help

If you continue to have issues:

1. Check the error messages carefully
2. Review INSTALL_WINDOWS.md for Windows-specific issues
3. Check Node.js and npm versions
4. Verify Visual Studio Build Tools installation
5. Try a clean install
6. Check file permissions

## Alternative Solutions

If `better-sqlite3` continues to cause issues, consider:

1. **Use Node.js LTS version** (v18 or v20)
   - Better compatibility with native modules
   - More prebuilt binaries available

2. **Switch to sql.js** (JavaScript-only SQLite)
   - No native compilation required
   - Requires code changes
   - Slower but more compatible

3. **Use Docker** (for development)
   - Isolated environment
   - No Windows SDK needed
   - More complex setup
