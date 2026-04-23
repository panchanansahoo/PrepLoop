@echo off
echo Testing backend startup...
cd backend
start /B node index.js > .tmp_backend_out.log 2> .tmp_backend_err.log
timeout /t 5 /nobreak > nul
curl -s http://localhost:5000/health
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Backend started successfully!
) else (
    echo.
    echo ❌ Backend failed to start. Check logs:
    type .tmp_backend_err.log
)
taskkill /F /IM node.exe > nul 2>&1
