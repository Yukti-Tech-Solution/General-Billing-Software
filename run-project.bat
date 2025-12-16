@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Billing Software - Setup & Run
color 0A

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%" >nul

echo.
echo =====================================================
echo   Billing Software - Setup and Run (Yukti Tech Solution)
echo =====================================================
echo.

:: Optional flags
set "NEED_INSTALL=0"
if /I "%~1"=="--force-install" set "NEED_INSTALL=1"
if /I "%~1"=="--force-reinstall" set "NEED_INSTALL=1"

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org/ (v18+ required).
    echo.
    pause
    exit /b 1
)
for /f "tokens=1* delims=v" %%a in ('node -v') do set "NODE_VERSION=%%b"
for /f "tokens=1 delims=." %%a in ("!NODE_VERSION!") do set "NODE_MAJOR=%%a"
if "!NODE_MAJOR!"=="" set "NODE_MAJOR=0"
if !NODE_MAJOR! LSS 18 (
    echo [ERROR] Node.js v18 or newer is required. Detected: v!NODE_VERSION!
    echo.
    pause
    exit /b 1
)
echo [✓] Node.js detected (v!NODE_VERSION!)

:: Check npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm not found. Please reinstall Node.js.
    echo.
    pause
    exit /b 1
)
for /f "tokens=1 delims= " %%a in ('npm -v') do set "NPM_VERSION=%%a"
echo [✓] npm detected (v!NPM_VERSION!)
echo.

:: Ensure dependency install
if not exist "node_modules" set "NEED_INSTALL=1"
if !NEED_INSTALL!==1 (
    echo [INFO] Installing dependencies (this may take a few minutes)...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] npm install failed. See logs above.
        echo.
        pause
        exit /b 1
    )
    echo [✓] Dependencies installed.
    echo.
) else (
    echo [✓] Dependencies already present. Use --force-install to reinstall.
    echo.
)

:: Ensure data folder exists
if not exist "data\bills" (
    echo [INFO] Creating data\bills directory...
    mkdir "data\bills" 2>nul
    echo [✓] data\bills ready.
    echo.
)

:: Ensure .env exists
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creating .env from .env.example ...
        copy ".env.example" ".env" >nul 2>&1
        echo [✓] .env created. Update values as needed.
        echo.
    ) else (
        echo [WARN] .env missing and .env.example not found. Create .env before running.
    )
)

echo =====================================================
echo   Starting Billing Software (Ctrl+C to stop)
echo =====================================================
echo.

call npm run electron-dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Application failed to start. Check the log above.
    echo.
    pause
    exit /b 1
)

popd >nul
endlocal
