@echo off
echo ========================================
echo   AI DevOps Monitor - Starting All Services
echo ========================================
echo. 
echo IMPORTANT: Make sure you have run "npm install" in both backend and frontend folders at least once.
echo.

echo [1/3] Starting Backend (localhost:5002)...
start "Backend" cmd /k "cd backend && npm start" || pause
echo.
echo Waiting 10 seconds for Backend to fully start...
timeout /t 10 /nobreak >nul
echo.

echo [2/3] Starting Frontend (localhost:3001)...
start "Frontend" cmd /k "cd frontend && npm start" || pause
echo.

echo.
echo ========================================
echo   Services are Starting...
echo   Backend:  http://127.0.0.1:5002
echo   Frontend: http://127.0.0.1:3001
echo   Dashboard: http://127.0.0.1:3001
echo ========================================
echo.
echo Press any key to open the dashboard...
pause >nul 
start http://127.0.0.1:3001
