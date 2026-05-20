Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Join-Path $repoRoot 'step_together_api'
$frontendRoot = Join-Path $repoRoot 'step-together-react-native'

if (-not (Test-Path $backendRoot)) {
    throw "Backend folder not found: $backendRoot"
}

if (-not (Test-Path $frontendRoot)) {
    throw "Frontend folder not found: $frontendRoot"
}

$backendPython = Join-Path $backendRoot 'venv\Scripts\python.exe'
if (Test-Path $backendPython) {
    $backendCommand = "Set-Location '$backendRoot'; & '$backendPython' -m uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload"
}
else {
    $backendCommand = "Set-Location '$backendRoot'; uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload"
}

$frontendCommand = "Set-Location '$frontendRoot'; npm run start:dev"

Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $backendCommand) -WorkingDirectory $backendRoot | Out-Null
Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $frontendCommand) -WorkingDirectory $frontendRoot | Out-Null

Write-Host 'Started backend API and frontend app in separate PowerShell windows.'