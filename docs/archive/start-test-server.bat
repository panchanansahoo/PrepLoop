@echo off
echo ========================================
echo  Fresher Interview Test Server
echo ========================================
echo.
echo Starting test server on port 5001...
echo No authentication required for testing
echo.
cd backend
node test-fresher-server.js
pause
