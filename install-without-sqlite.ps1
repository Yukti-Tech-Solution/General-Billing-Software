# Install all dependencies except better-sqlite3
# This allows you to work on the app while fixing Windows SDK issue

Write-Host "Installing dependencies (excluding better-sqlite3)..." -ForegroundColor Yellow
Write-Host ""

# Read package.json
$packageJsonContent = Get-Content "package.json" -Raw
$packageJson = $packageJsonContent | ConvertFrom-Json

# Remove better-sqlite3 from dependencies temporarily
$originalDeps = $packageJson.dependencies
$newDeps = @{}
foreach ($key in $originalDeps.PSObject.Properties.Name) {
    if ($key -ne "better-sqlite3") {
        $newDeps[$key] = $originalDeps.$key
    }
}
$packageJson.dependencies = $newDeps

# Save modified package.json
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json.temp"

# Backup original
Copy-Item "package.json" "package.json.backup"

# Use temporary package.json
Copy-Item "package.json.temp" "package.json" -Force

Write-Host "Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
npm install

# Restore original package.json
Copy-Item "package.json.backup" "package.json" -Force
Remove-Item "package.json.backup" -Force
Remove-Item "package.json.temp" -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation complete (without better-sqlite3)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Install Windows SDK (see fix-installation.ps1)" -ForegroundColor White
Write-Host "2. After Windows SDK is installed, run:" -ForegroundColor White
Write-Host "   npm install better-sqlite3" -ForegroundColor Green
Write-Host ""
Write-Host "Note: The app won't work without better-sqlite3." -ForegroundColor Yellow
Write-Host "      You need to install Windows SDK first." -ForegroundColor Yellow
