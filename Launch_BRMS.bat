@echo off
title BRMS Launcher
echo ==========================================
echo Starting BRMS Launcher Application
echo ==========================================
echo Please wait while the environment is checked...
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0launcher_core.ps1"
if %errorlevel% neq 0 pause
