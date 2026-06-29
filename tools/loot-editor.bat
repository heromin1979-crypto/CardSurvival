@echo off
REM District Loot Editor — Windows launcher
REM Double-click to start: auto-opens browser, edits go directly to js/data/districts.js

setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found in PATH.
    echo Install Node.js from https://nodejs.org/  (LTS 권장)
    pause
    exit /b 1
)

echo [loot-editor] Node found, starting server...
echo.
node "%~dp0loot-editor-server.mjs"

if errorlevel 1 (
    echo.
    echo [loot-editor] 서버가 종료되었습니다.
    pause
)
endlocal
