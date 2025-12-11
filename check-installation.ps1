# Check Installation Status
# This script checks if all required components are installed

Write-Host "Checking Installation Status..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Node.js:" -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "  Version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  NOT INSTALLED" -ForegroundColor Red
}

# Check npm
Write-Host "npm:" -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "  Version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  NOT INSTALLED" -ForegroundColor Red
}

# Check Visual Studio Build Tools
Write-Host "Visual Studio Build Tools:" -ForegroundColor Yellow
$vsPath = "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools"
if (Test-Path $vsPath) {
    Write-Host "  Found: Yes" -ForegroundColor Green
    Write-Host "  Path: $vsPath" -ForegroundColor Gray
} else {
    Write-Host "  Found: No" -ForegroundColor Red
}

# Check Windows SDK
Write-Host "Windows SDK:" -ForegroundColor Yellow
$sdkPath = "C:\Program Files (x86)\Windows Kits\10\Include"
if (Test-Path $sdkPath) {
    $sdkVersions = Get-ChildItem $sdkPath -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name
    if ($sdkVersions) {
        Write-Host "  Found: Yes" -ForegroundColor Green
        Write-Host "  Versions: $($sdkVersions -join ', ')" -ForegroundColor Gray
    } else {
        Write-Host "  Found: No" -ForegroundColor Red
    }
} else {
    Write-Host "  Found: No" -ForegroundColor Red
    Write-Host "  ACTION REQUIRED: Install Windows SDK" -ForegroundColor Yellow
}

# Check Python
Write-Host "Python:" -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  Version: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  NOT FOUND (optional, but recommended)" -ForegroundColor Yellow
}

# Check node_modules
Write-Host "Dependencies:" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  node_modules: Exists" -ForegroundColor Green
    
    # Check for better-sqlite3
    if (Test-Path "node_modules\better-sqlite3") {
        Write-Host "  better-sqlite3: Installed" -ForegroundColor Green
    } else {
        Write-Host "  better-sqlite3: NOT INSTALLED" -ForegroundColor Red
        Write-Host "    Reason: Requires Windows SDK" -ForegroundColor Yellow
    }
    
    # Check for other key dependencies
    $keyDeps = @("vite", "react", "electron", "concurrently")
    foreach ($dep in $keyDeps) {
        if (Test-Path "node_modules\$dep") {
            Write-Host "  $dep : Installed" -ForegroundColor Green
        } else {
            Write-Host "  $dep : NOT INSTALLED" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  node_modules: NOT FOUND" -ForegroundColor Red
    Write-Host "  Run: npm install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Summary and Recommendations
Write-Host "Recommendations:" -ForegroundColor Cyan

if (-not (Test-Path $sdkPath)) {
    Write-Host "1. Install Windows SDK:" -ForegroundColor Yellow
    Write-Host "   - Open Visual Studio Installer" -ForegroundColor White
    Write-Host "   - Modify Visual Studio 2019 Build Tools" -ForegroundColor White
    Write-Host "   - Add Windows SDK component" -ForegroundColor White
    Write-Host ""
}

if (-not (Test-Path "node_modules")) {
    Write-Host "2. Install dependencies:" -ForegroundColor Yellow
    Write-Host "   npm install" -ForegroundColor White
    Write-Host ""
} elseif (-not (Test-Path "node_modules\better-sqlite3")) {
    Write-Host "2. Install better-sqlite3:" -ForegroundColor Yellow
    Write-Host "   - First install Windows SDK (see above)" -ForegroundColor White
    Write-Host "   - Then run: npm install better-sqlite3" -ForegroundColor White
    Write-Host ""
    Write-Host "   OR install other dependencies first:" -ForegroundColor Yellow
    Write-Host "   .\install-without-sqlite.ps1" -ForegroundColor White
    Write-Host ""
}

Write-Host "For detailed instructions, see:" -ForegroundColor Cyan
Write-Host "  - INSTALL_STEPS.md" -ForegroundColor White
Write-Host "  - INSTALL_WINDOWS.md" -ForegroundColor White
Write-Host "  - QUICK_START.md" -ForegroundColor White

