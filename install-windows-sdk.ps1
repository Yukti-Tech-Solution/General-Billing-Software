# PowerShell script to help with Windows SDK installation

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Better-SQLite3 Build Tools Checker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Visual Studio Build Tools is installed
Write-Host "Checking for Visual Studio Build Tools..." -ForegroundColor Yellow

$vsPath2019 = "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools"
$vsPath2022 = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools"

$hasVS2019 = Test-Path $vsPath2019
$hasVS2022 = Test-Path $vsPath2022

if ($hasVS2019) {
    Write-Host "✓ Visual Studio 2019 Build Tools found" -ForegroundColor Green
    Write-Host "  Path: $vsPath2019" -ForegroundColor Gray
} elseif ($hasVS2022) {
    Write-Host "✓ Visual Studio 2022 Build Tools found" -ForegroundColor Green
    Write-Host "  Path: $vsPath2022" -ForegroundColor Gray
} else {
    Write-Host "✗ Visual Studio Build Tools not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Visual Studio Build Tools:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022" -ForegroundColor Cyan
    Write-Host "2. Install with 'Desktop development with C++' workload" -ForegroundColor Cyan
    Write-Host "3. Include Windows 10/11 SDK" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "Checking for Windows SDK..." -ForegroundColor Yellow

# Check for Windows SDK
$sdkPaths = @(
    "C:\Program Files (x86)\Windows Kits\10\Include",
    "C:\Program Files\Windows Kits\10\Include"
)

$hasSDK = $false
foreach ($sdkPath in $sdkPaths) {
    if (Test-Path $sdkPath) {
        $hasSDK = $true
        Write-Host "✓ Windows SDK found" -ForegroundColor Green
        Write-Host "  Path: $sdkPath" -ForegroundColor Gray
        break
    }
}

if (-not $hasSDK) {
    Write-Host "✗ Windows SDK not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install Windows SDK:" -ForegroundColor Yellow
    Write-Host "1. Open Visual Studio Installer" -ForegroundColor Cyan
    Write-Host "2. Click 'Modify' on your Build Tools installation" -ForegroundColor Cyan
    Write-Host "3. Select 'Desktop development with C++' workload" -ForegroundColor Cyan
    Write-Host "4. Under 'Individual components', select Windows 10/11 SDK" -ForegroundColor Cyan
    Write-Host "5. Click 'Modify' to install" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node -v
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All checks passed! You should be able to install better-sqlite3." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Try running: npm install" -ForegroundColor Yellow

