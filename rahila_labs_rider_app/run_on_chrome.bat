@echo off
REM Add Flutter to PATH for this session
set PATH=%PATH%;C:\scr\flutter\bin

echo ========================================
echo   Rahila Labs Rider App - Chrome
echo ========================================
echo.

REM Check if backend is running
echo Checking backend connection...
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend might not be running!
    echo Please start backend in another terminal:
    echo   cd e:\Rahila-Labs-website\backend
    echo   python app.py
    echo.
    echo Press any key to continue anyway...
    pause >nul
)

echo Starting Flutter app on Chrome...
echo This may take 1-2 minutes on first run...
echo.

REM Run Flutter
flutter run -d chrome

REM Keep window open if there was an error
if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERROR: Flutter failed to run
    echo ========================================
    echo.
    echo Common solutions:
    echo 1. Make sure Chrome is installed
    echo 2. Run: flutter doctor
    echo 3. Try: flutter clean, then run again
    echo.
)

echo.
echo Press any key to close...
pause >nul
