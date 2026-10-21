@echo off
echo =========================================================================
echo   IdleAlert: Real-Time Classroom Monitoring & Energy Management System
echo =========================================================================
echo.

echo Starting FastAPI Backend AI Service (Port 8000)...
start "IdleAlert Backend API" cmd /k "cd backend && python run.py"

timeout /t 2 >nul

echo Starting Vite React Frontend UI (Port 5173)...
start "IdleAlert Frontend Web App" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo =========================================================================
echo   Services Launched!
echo   Frontend: http://localhost:5173
echo   Backend API Docs: http://localhost:8000/docs
echo =========================================================================
pause
