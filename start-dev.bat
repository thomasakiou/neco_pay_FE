@echo off
REM Auto-start NECO Payment Manager Frontend
REM This script starts the development server automatically

cd /d "G:\Projects\neco-payment-manager-FE"

REM Start the development server
start "NECO Payment Manager - Frontend" cmd /k npm run dev

REM Optional: Wait a few seconds and open browser
timeout /t 5 /nobreak
start http://localhost:3000
