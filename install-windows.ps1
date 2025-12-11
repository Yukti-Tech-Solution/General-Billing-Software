# Windows Installation Script for Billing Software
# Run this script as Administrator if needed

Write-Host "Billing Software - Windows Installation Script" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not installed!" -ForegroundColor Red
    exit 1
}

# Clean previous installation
Write-Host ""
Write-Host "Cleaning previous installation..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
}

# Set npm config for Visual Studio
Write-Host ""
Write-Host "Configuring npm for Windows build..." -ForegroundColor Yellow
npm config set msvs_version 2019
npm config set python python

# Try to install windows-build-tools (may require admin)
Write-Host ""
Write-Host "Attempting to install Windows Build Tools..." -ForegroundColor Yellow
Write-Host "Note: This may require Administrator privileges" -ForegroundColor Yellow
try {
    npm install --global windows-build-tools --verbose
} catch {
    Write-Host "Warning: Could not install windows-build-tools automatically" -ForegroundColor Yellow
    Write-Host "You may need to install Visual Studio Build Tools manually" -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Yellow
Write-Host ""

try {
    npm install --verbose
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS: All dependencies installed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Run 'npm run electron-dev' to start the development server" -ForegroundColor White
        Write-Host "2. Run 'npm run build' to build for production" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "ERROR: Installation failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Make sure Visual Studio Build Tools with Windows SDK is installed" -ForegroundColor White
        Write-Host "2. Open Visual Studio Installer and add Windows SDK component" -ForegroundColor White
        Write-Host "3. See INSTALL_WINDOWS.md for detailed instructions" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Installation failed with exception!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check INSTALL_WINDOWS.md for troubleshooting steps" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green

