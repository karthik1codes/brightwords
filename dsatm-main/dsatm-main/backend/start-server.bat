@echo off
cd /d "%~dp0"
echo ========================================
echo Starting BrightWords Subscription API Server...
echo ========================================
echo.
echo Current directory: %CD%
echo.
node server.js
pause
