@echo off
REM AgentAssist Backend Startup Script for Windows

echo ======================================
echo AgentAssist Backend Launcher
echo ======================================
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo Virtual environment not found!
    echo.
    echo Please run setup first:
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo.
    echo Please copy .env.example to .env and configure it.
    echo.
    pause
    exit /b 1
)

REM Start the server
echo Starting backend server...
echo.
python startup.py

pause
