@echo off
chcp 65001 >nul 2>&1
title Card Survival: Ruined City

echo.
echo  Card Survival: Ruined City
echo  --------------------------

:: Node.js check
where node >nul 2>&1
if %errorlevel% == 0 (
    echo  Starting with Node.js...
    node serve.js
    goto :end
)

:: Python check
where python >nul 2>&1
if %errorlevel% == 0 (
    echo  Starting with Python...
    echo  Open browser: http://localhost:8080
    start "" "http://localhost:8080"
    python -m http.server 8080
    goto :end
)

:: Python3 check
where python3 >nul 2>&1
if %errorlevel% == 0 (
    echo  Starting with Python3...
    start "" "http://localhost:8080"
    python3 -m http.server 8080
    goto :end
)

echo.
echo  [ERROR] Node.js or Python not found.
echo.
echo  Install one of the following:
echo    Node.js  : https://nodejs.org
echo    Python   : https://python.org
echo.
pause

:end
