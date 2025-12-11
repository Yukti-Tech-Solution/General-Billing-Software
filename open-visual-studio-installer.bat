@echo off
echo ========================================
echo Billing Software - Windows SDK Installation
echo ========================================
echo.

echo Checking for Visual Studio Installer...
echo.

set "VS_INSTALLER=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vs_installer.exe"
if exist "%VS_INSTALLER%" (
    echo Found Visual Studio Installer!
    echo Opening Visual Studio Installer...
    echo.
    start "" "%VS_INSTALLER%"
    echo.
    echo ========================================
    echo INSTRUCTIONS:
    echo ========================================
    echo.
    echo 1. Find "Visual Studio 2019 Build Tools" and click "Modify"
    echo 2. Click "Individual components" tab (at the top)
    echo 3. Search for "Windows SDK"
    echo 4. Check "Windows 10 SDK (10.0.19041.0)" or newer
    echo 5. Click "Modify" to install (takes 10-20 minutes)
    echo 6. After installation, run: npm install
    echo.
) else (
    echo Visual Studio Installer not found in standard location.
    echo.
    echo Please:
    echo 1. Download Visual Studio Installer from:
    echo    https://visualstudio.microsoft.com/downloads/
    echo.
    echo 2. Or install Visual Studio Community (includes everything):
    echo    https://visualstudio.microsoft.com/vs/community/
    echo.
)

echo.
pause

