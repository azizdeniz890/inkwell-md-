@echo off
echo MarkCraft kapatiliyor...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq MarkCraft*" > nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a > nul 2>&1
)
echo MarkCraft kapatildi.
timeout /t 2 /nobreak > nul
