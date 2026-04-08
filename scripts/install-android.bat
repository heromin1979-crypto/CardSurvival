@echo off
set ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe
set APK=%~dp0..\android\app\build\outputs\apk\debug\app-debug.apk
set PKG=com.cardsurvival.ruinedcity

echo Installing APK on connected device...
echo APK: %APK%
echo.

REM 기존 앱 강제 종료
"%ADB%" shell am force-stop %PKG% >nul 2>&1

"%ADB%" install -r "%APK%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] APK installed!
    echo Starting app fresh...
    "%ADB%" shell am start -n %PKG%/.MainActivity
) else (
    echo.
    echo [FAILED] Installation failed. Check device connection and USB debugging settings.
)

pause
