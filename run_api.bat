@echo off
setlocal
cd /d "%~dp0"
echo Starting JobTinder Python API...

REM Check if .env exists
if not exist .env (
    echo WARNING: .env not found in root!
)

python browser-use/api_server.py
pause
