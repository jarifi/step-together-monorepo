@echo off
setlocal

REM Install Python dependencies for API
cd step_together_api
python -m pip install -r requirements.txt
cd ..

REM Install npm dependencies for React Native app
cd step-together-react-native
npm install
cd ..

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_apps.ps1"

endlocal