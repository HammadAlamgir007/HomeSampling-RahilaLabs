@echo off
REM Add Flutter to PATH for this session
set PATH=%PATH%;C:\scr\flutter\bin

REM Install dependencies
echo Installing Flutter dependencies...
flutter pub get

REM Check for devices
echo.
echo Available devices:
flutter devices

REM Ask user which device to use
echo.
echo Run the app with one of these commands:
echo   flutter run -d chrome          (Run in Chrome browser)
echo   flutter run -d windows         (Run as Windows desktop app)
echo   flutter run                    (Choose device interactively)
echo.

REM Keep window open
pause
