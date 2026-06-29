@echo off
REM Sprite Animation Editor — Windows launcher
REM Double-click to start: auto-opens browser, lists combat spritesheets, saves aligned PNG back.

setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found in PATH.
    echo Install Node.js from https://nodejs.org/  (LTS 권장)
    pause
    exit /b 1
)

echo [sprite-anim] Node found, starting server...
echo.
node "%~dp0sprite-anim-server.mjs"

if errorlevel 1 (
    echo.
    echo [sprite-anim] 서버가 종료되었습니다.
    pause
)
endlocal
