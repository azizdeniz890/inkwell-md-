@echo off
title Inkwell
color 0A
echo.
echo    _____      _                _ _ 
echo   ^|_   _^|    ^| ^|              ^| ^| ^|
echo     ^| ^|  _ __^| ^| ___      __ _^| ^| ^|
echo     ^| ^| ^| '_ \ ^|/ / ^| /^| / / _ \ ^| ^|
echo    _^| ^|_^| ^| ^| ^|   ^<\ V  V /  __/ ^| ^|
echo   ^|_____^|_^| ^|_^|_^|\_\\\_/\_/ \___^|_^|_^|
echo.
echo   GitHub README Editor with AI
echo   ========================================
echo.

cd /d "%~dp0"

:: Kill any existing process on port 5173
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo   [*] Starting server...

:: Open browser after a delay
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"

echo   [*] Opening browser...
echo.
echo   -----------------------------------
echo    Close this window to stop Inkwell
echo   -----------------------------------
echo.

:: Run vite directly so it dies with the CMD window
npx vite --host
