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

$frontendEnvFile = Join-Path $frontendRoot '.env.development'
if (-not (Test-Path $frontendEnvFile)) {
    throw "Frontend env file not found: $frontendEnvFile"
}

function Get-LocalIPv4Address {
    $ipAddress = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -ne '127.0.0.1' -and
        $_.IPAddress -notlike '169.254.*' -and
        $_.InterfaceAlias -notmatch 'Loopback|Virtual|Docker|vEthernet'
    } |
    Select-Object -First 1 -ExpandProperty IPAddress

    if (-not $ipAddress) {
        throw 'Could not determine a local IPv4 address.'
    }

    return $ipAddress
}

function Get-ApiBaseUrlFromEnvFile {
    param([string]$filePath)

    $line = Get-Content $filePath | Where-Object { $_ -match '^API_BASE_URL=' } | Select-Object -First 1
    if (-not $line) {
        return $null
    }

    return ($line -replace '^API_BASE_URL=', '').Trim()
}

function Set-ApiBaseUrlInEnvFile {
    param(
        [string]$filePath,
        [string]$apiBaseUrl
    )

    $content = Get-Content $filePath -Raw
    $newLine = "API_BASE_URL=$apiBaseUrl"

    if ($content -match '(?m)^API_BASE_URL=.*$') {
        $updated = [regex]::Replace($content, '(?m)^API_BASE_URL=.*$', $newLine, 1)
    }
    else {
        if ($content -and -not $content.EndsWith("`r`n") -and -not $content.EndsWith("`n")) {
            $content += "`r`n"
        }
        $updated = $content + $newLine + "`r`n"
    }

    Set-Content -Path $filePath -Value $updated -NoNewline
}

function Get-ListeningProcessDetails {
    param([int]$port)

    $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

    if (-not $listener) {
        return $null
    }

    return Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
}

$localApiBaseUrl = "http://$(Get-LocalIPv4Address):3000/api/v1"
$defaultRemoteApiBaseUrl = 'https://api.step-together.at/api/v1'
$currentApiBaseUrl = Get-ApiBaseUrlFromEnvFile -filePath $frontendEnvFile
$remoteApiBaseUrl = if ($currentApiBaseUrl -and $currentApiBaseUrl -match '^https://') { $currentApiBaseUrl } else { $defaultRemoteApiBaseUrl }

Write-Host ''
Write-Host 'Choose API server:'
Write-Host "1) Local backend ($localApiBaseUrl)"
Write-Host "2) Remote backend ($remoteApiBaseUrl)"

$serverChoice = Read-Host 'Enter 1 or 2'
while ($serverChoice -notin @('1', '2')) {
    Write-Host 'Invalid option. Please enter 1 or 2.'
    $serverChoice = Read-Host 'Enter 1 or 2'
}

$selectedApiBaseUrl = if ($serverChoice -eq '1') { $localApiBaseUrl } else { $remoteApiBaseUrl }
Set-ApiBaseUrlInEnvFile -filePath $frontendEnvFile -apiBaseUrl $selectedApiBaseUrl
Write-Host "Updated .env.development API_BASE_URL to: $selectedApiBaseUrl"
Write-Host ''

if ($serverChoice -eq '1') {
    $existingProcess = Get-ListeningProcessDetails -port 3000
    if ($existingProcess) {
        $cmd = [string]$existingProcess.CommandLine
        $isStepTogetherBackend = $cmd -match 'step_together_api'

        if (-not $isStepTogetherBackend) {
            Write-Host 'Port 3000 is already used by another process:'
            Write-Host "PID: $($existingProcess.ProcessId)"
            Write-Host "Name: $($existingProcess.Name)"
            Write-Host "Command: $cmd"
            Write-Host ''
            Write-Host 'Choose how to continue:'
            Write-Host '1) Stop conflicting process and continue'
            Write-Host '2) Continue anyway (local API will likely fail)'
            Write-Host '3) Cancel'

            $portChoice = Read-Host 'Enter 1, 2 or 3'
            while ($portChoice -notin @('1', '2', '3')) {
                Write-Host 'Invalid option. Please enter 1, 2 or 3.'
                $portChoice = Read-Host 'Enter 1, 2 or 3'
            }

            if ($portChoice -eq '1') {
                Stop-Process -Id $existingProcess.ProcessId -Force
                Write-Host "Stopped process on port 3000 (PID $($existingProcess.ProcessId))."
            }
            elseif ($portChoice -eq '3') {
                throw 'Start canceled by user because port 3000 is occupied.'
            }
        }
    }
}

if ($serverChoice -eq '1') {
    $backendPython = Join-Path $backendRoot 'venv\Scripts\python.exe'
    if (Test-Path $backendPython) {
        $backendCommand = "Set-Location '$backendRoot'; & '$backendPython' -m uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload"
    }
    else {
        $backendCommand = "Set-Location '$backendRoot'; uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload"
    }

    Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $backendCommand) -WorkingDirectory $backendRoot | Out-Null
}

$frontendCommand = "Set-Location '$frontendRoot'; `$env:API_BASE_URL = '$selectedApiBaseUrl'; `$env:EXPO_PUBLIC_API_BASE_URL = '$selectedApiBaseUrl'; npm run start:dev -- --clear"
Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $frontendCommand) -WorkingDirectory $frontendRoot | Out-Null

if ($serverChoice -eq '1') {
    Write-Host 'Started backend API and frontend app in separate PowerShell windows.'
}
else {
    Write-Host 'Started frontend app (using remote backend API).'
}