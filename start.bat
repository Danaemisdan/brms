@echo off
title BRMS Launcher
echo.
echo =====================================================
echo   BRMS - Brand Review Management System Launcher
echo =====================================================
echo.

REM ── 1. Kill anything already on port 5001 ──────────────────────────────
echo [*] Clearing port 5001 if occupied...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5001" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

REM ── 2. Start Backend (Node.js) ─────────────────────────────────────────
echo [*] Starting Backend API (port 5001)...
start "BRMS Backend" cmd /k "cd /d "%~dp0server" && npm run dev"

REM Give backend time to initialise
timeout /t 5 /nobreak >nul

REM ── 3. Start Python Agent ──────────────────────────────────────────────
echo [*] Starting Local Agent (WhatsApp + Review Verifier)...
set AGENT_DIR=%~dp0local_agent\Agent\LocalManager
set VENV_PYTHON=%AGENT_DIR%\venv\Scripts\python.exe

if exist "%VENV_PYTHON%" (
    start "BRMS Agent" cmd /k "cd /d "%AGENT_DIR%" && "%VENV_PYTHON%" main.py"
) else (
    echo [!] Python venv not found at: %VENV_PYTHON%
    echo [!] Please create it first:  cd local_agent\Agent\LocalManager ^& python -m venv venv ^& venv\Scripts\pip install -r requirements.txt
)

REM ── 4. Start Cloudflare Tunnel ─────────────────────────────────────────
echo [*] Starting Cloudflare Tunnel...
where cloudflared >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start "BRMS Cloudflare Tunnel" cmd /k "cloudflared tunnel --url http://localhost:5001"
) else (
    REM Try via npx if cloudflared not globally installed
    start "BRMS Cloudflare Tunnel" cmd /k "npx --yes cloudflared tunnel --url http://localhost:5001"
)

echo.
echo =====================================================
echo  All 3 processes launched in separate windows:
echo    1. BRMS Backend        (port 5001)
echo    2. BRMS Agent          (WhatsApp + Review AI)
echo    3. BRMS Cloudflare     (look here for tunnel URL)
echo.
echo  Copy the https://*.trycloudflare.com URL from the
echo  "BRMS Cloudflare Tunnel" window and paste it into
echo  your Vercel NEXT_PUBLIC_API_URL variable.
echo =====================================================
echo.
pause
