@echo off
setlocal

REM Navigate to the project root (same folder as this script)
cd /d "%~dp0"

title Billing Software - Start Dev Environment
echo =========================================
echo   Billing Software - Dev Environment
echo =========================================
echo.

REM Install dependencies on first run
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :error

  echo Rebuilding native modules...
  call npm run rebuild
  if errorlevel 1 goto :error
) else (
  echo Dependencies already installed. Skipping npm install.
)

echo.
echo Launching Electron + Vite (Ctrl+C to stop)...
echo.
call npm run electron-dev
if errorlevel 1 goto :error

goto :end

:error
echo.
echo Failed to start the development environment.
echo Review the errors above for details.
exit /b 1

:end
endlocal

