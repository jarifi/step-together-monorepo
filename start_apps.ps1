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

Write-Host 'Choose what to start:'
Write-Host '1) Start backend API and frontend app'
Write-Host '2) Start frontend app only'

$choice = Read-Host 'Enter 1 or 2'
while ($choice -notin @('1', '2')) {
    Write-Host 'Invalid option. Please enter 1 or 2.'
    $choice = Read-Host 'Enter 1 or 2'
}

$frontendCommand = "Set-Location '$frontendRoot'; npm run start:dev"
Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $frontendCommand) -WorkingDirectory $frontendRoot | Out-Null

if ($choice -eq '1') {
    $backendPython = Join-Path $backendRoot 'venv\Scripts\python.exe'
    if (Test-Path $backendPython) {
        $backendCommand = "Set-Location '$backendRoot'; & '$backendPython' -m uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload"
    }
    else {
        $backendCommand = "Set-Location '$backendRoot'; uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload"
    }

    Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $backendCommand) -WorkingDirectory $backendRoot | Out-Null
    Write-Host 'Started backend API and frontend app in separate PowerShell windows.'
}
else {
    Write-Host 'Started frontend app in a separate PowerShell window.'
}