# Quick Fix Script for Windows Installation Issues
# This script helps resolve better-sqlite3 compilation issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Billing Software - Installation Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Visual Studio Installation
Write-Host "Step 1: Checking Visual Studio Installation..." -ForegroundColor Yellow
$vsInstallerPath = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vs_installer.exe"

if (Test-Path $vsInstallerPath) {
    Write-Host "✓ Visual Studio Installer found" -ForegroundColor Green
    Write-Host "  Location: $vsInstallerPath" -ForegroundColor Gray
} else {
    Write-Host "✗ Visual Studio Installer not found" -ForegroundColor Red
    Write-Host "  Please install Visual Studio Build Tools first" -ForegroundColor Yellow
    Write-Host "  Download from: https://visualstudio.microsoft.com/downloads/" -ForegroundColor Cyan
    exit 1
}

# Step 2: Instructions
Write-Host ""
Write-Host "Step 2: Windows SDK Installation Required" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "To fix the better-sqlite3 compilation error:" -ForegroundColor White
Write-Host ""
Write-Host "1. Open Visual Studio Installer" -ForegroundColor Cyan
Write-Host "   - Search for 'Visual Studio Installer' in Start Menu" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Modify Visual Studio 2019 Build Tools" -ForegroundColor Cyan
Write-Host "   - Click 'Modify' button" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Add Windows SDK Component" -ForegroundColor Cyan
Write-Host "   - Go to 'Individual components' tab" -ForegroundColor Gray
Write-Host "   - Search for 'Windows SDK'" -ForegroundColor Gray
Write-Host "   - Check 'Windows 10 SDK (10.0.19041.0)' or newer" -ForegroundColor Gray
Write-Host "   - Or check 'Windows 11 SDK'" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Click 'Modify' to install" -ForegroundColor Cyan
Write-Host "   - Wait for installation to complete" -ForegroundColor Gray
Write-Host ""
Write-Host "5. After installation, run:" -ForegroundColor Cyan
Write-Host "   npm install" -ForegroundColor Green
Write-Host ""

# Step 3: Ask if user wants to open Visual Studio Installer
Write-Host "Do you want to open Visual Studio Installer now? (Y/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'Y' -or $response -eq 'y') {
    Write-Host ""
    Write-Host "Opening Visual Studio Installer..." -ForegroundColor Green
    Start-Process $vsInstallerPath
    Write-Host ""
    Write-Host "After adding Windows SDK and installing, run: npm install" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Manual steps:" -ForegroundColor Yellow
    Write-Host "1. Open Visual Studio Installer manually" -ForegroundColor White
    Write-Host "2. Add Windows SDK component" -ForegroundColor White
    Write-Host "3. Run: npm install" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix script completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
