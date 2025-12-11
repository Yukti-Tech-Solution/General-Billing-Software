# Installation helper script for Billing Software
# This script helps install dependencies and checks for required tools

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Billing Software - Installation Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
    
    # Check if Node.js version is compatible
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -lt 16) {
        Write-Host "⚠ Warning: Node.js v16 or higher is recommended" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check for Visual Studio Build Tools
Write-Host "Checking for Visual Studio Build Tools..." -ForegroundColor Yellow
$vsPaths = @(
    "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools",
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools",
    "C:\Program Files\Microsoft Visual Studio\2022\Community",
    "C:\Program Files\Microsoft Visual Studio\2022\Professional",
    "C:\Program Files\Microsoft Visual Studio\2022\Enterprise"
)

$hasVSTools = $false
foreach ($path in $vsPaths) {
    if (Test-Path $path) {
        $hasVSTools = $true
        Write-Host "✓ Visual Studio found: $path" -ForegroundColor Green
        break
    }
}

if (-not $hasVSTools) {
    Write-Host "⚠ Visual Studio Build Tools not found" -ForegroundColor Yellow
    Write-Host "  better-sqlite3 requires native compilation" -ForegroundColor Gray
    Write-Host "  Installing build tools is recommended for best performance" -ForegroundColor Gray
}

Write-Host ""

# Check for Windows SDK
Write-Host "Checking for Windows SDK..." -ForegroundColor Yellow
$sdkPaths = @(
    "C:\Program Files (x86)\Windows Kits\10\Include",
    "C:\Program Files\Windows Kits\10\Include"
)

$hasSDK = $false
foreach ($sdkPath in $sdkPaths) {
    if (Test-Path $sdkPath) {
        $hasSDK = $true
        $sdkVersions = Get-ChildItem $sdkPath -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name
        if ($sdkVersions) {
            Write-Host "✓ Windows SDK found: $($sdkVersions -join ', ')" -ForegroundColor Green
        } else {
            Write-Host "✓ Windows SDK found" -ForegroundColor Green
        }
        break
    }
}

if (-not $hasSDK) {
    Write-Host "⚠ Windows SDK not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To install Windows SDK:" -ForegroundColor Cyan
    Write-Host "1. Open Visual Studio Installer" -ForegroundColor White
    Write-Host "2. Click 'Modify' on your Visual Studio installation" -ForegroundColor White
    Write-Host "3. Select 'Desktop development with C++' workload" -ForegroundColor White
    Write-Host "4. Under 'Individual components', select Windows 10/11 SDK" -ForegroundColor White
    Write-Host "5. Click 'Modify' to install" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Options" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($hasVSTools -and $hasSDK) {
    Write-Host "Option 1: Standard Installation (Recommended)" -ForegroundColor Green
    Write-Host "  npm install" -ForegroundColor White
    Write-Host ""
    Write-Host "This will compile better-sqlite3 from source for optimal performance." -ForegroundColor Gray
} else {
    Write-Host "Option 1: Try Installation with Prebuilt Binaries" -ForegroundColor Yellow
    Write-Host "  \$env:npm_config_build_from_source='false'; npm install" -ForegroundColor White
    Write-Host ""
    Write-Host "This will use prebuilt binaries if available (may not work for Node.js v22)." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Option 2: Install Build Tools First" -ForegroundColor Yellow
Write-Host "  1. Install Visual Studio Build Tools 2022" -ForegroundColor White
Write-Host "  2. Include 'Desktop development with C++' workload" -ForegroundColor White
Write-Host "  3. Include Windows 10/11 SDK" -ForegroundColor White
Write-Host "  4. Restart computer" -ForegroundColor White
Write-Host "  5. Run: npm install" -ForegroundColor White

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Ask user what they want to do
Write-Host ""
$choice = Read-Host "Would you like to proceed with installation? (y/n)"

if ($choice -eq 'y' -or $choice -eq 'Y') {
    Write-Host ""
    Write-Host "Starting installation..." -ForegroundColor Green
    Write-Host ""
    
    if ($hasVSTools -and $hasSDK) {
        # Standard installation
        npm install
    } else {
        # Try with prebuilt binaries first
        Write-Host "Attempting installation with prebuilt binaries..." -ForegroundColor Yellow
        $env:npm_config_build_from_source = "false"
        npm install
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "Installation failed. You need to install build tools." -ForegroundColor Red
            Write-Host "Please follow Option 2 instructions above." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host ""
    Write-Host "Installation cancelled. Please install build tools and try again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "For more help, see TROUBLESHOOTING.md" -ForegroundColor Cyan

