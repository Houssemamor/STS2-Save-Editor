@echo off
setlocal

set PORT=%~1
if "%PORT%"=="" set PORT=8080

set PYTHON_CMD=
where py >nul 2>nul
if %errorlevel%==0 set PYTHON_CMD=py -3

if "%PYTHON_CMD%"=="" (
    where python >nul 2>nul
    if %errorlevel%==0 set PYTHON_CMD=python
)

if "%PYTHON_CMD%"=="" (
    where python3 >nul 2>nul
    if %errorlevel%==0 set PYTHON_CMD=python3
)

if "%PYTHON_CMD%"=="" (
    echo Python was not found. Install Python 3 and try again.
    exit /b 1
)

echo Starting local server at http://127.0.0.1:%PORT%/
start "" "http://127.0.0.1:%PORT%/"
%PYTHON_CMD% -m http.server %PORT% --bind 127.0.0.1
