param(
    [string]$ServerIp = "91.99.231.235",
    [Parameter(Mandatory = $true)]
    [string]$ServerUser,
    [string]$RemotePath = "/srv/step_together_api/app",
    [string]$SshKeyPath,
    [switch]$UseUserSshConfig,
    [switch]$DryRun,
    [string]$ServiceName = "step_together_api.service",
    [switch]$SkipServiceStart
)

$ErrorActionPreference = "Stop"

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Command failed with exit code $LASTEXITCODE"
    }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiRoot = Resolve-Path (Join-Path $scriptDir "..")
$appPath = Join-Path $apiRoot "app"

if (-not (Test-Path $appPath)) {
    throw "Could not find app directory at: $appPath"
}

$tempDir = Join-Path $env:TEMP ("step_together_deploy_" + [guid]::NewGuid().ToString("N"))
$null = New-Item -ItemType Directory -Path $tempDir -Force
$archivePath = Join-Path $tempDir "app_payload.tar.gz"
$remoteArchivePath = "/tmp/app_payload_$([DateTime]::UtcNow.ToString('yyyyMMddHHmmss')).tar.gz"

try {
    Write-Host "Creating deployment archive from app (excluding db and media)..." -ForegroundColor Cyan

    Push-Location $apiRoot
    try {
        Invoke-CheckedCommand -Command "tar" -Arguments @(
            "-czf",
            $archivePath,
            "--exclude=app/db",
            "--exclude=app/media",
            "app"
        )
    }
    finally {
        Pop-Location
    }

    Write-Host "Archive created: $archivePath" -ForegroundColor Green

    if ($DryRun) {
        Write-Host "Dry run enabled. Skipping upload and remote extract." -ForegroundColor Yellow
        return
    }

    $sshTarget = "$ServerUser@$ServerIp"

    $scpArgs = @()
    $sshArgs = @()

    if (-not $UseUserSshConfig) {
        # Ignore malformed ~/.ssh/config on Windows unless explicitly requested.
        $scpArgs += @("-F", "NUL")
        $sshArgs += @("-F", "NUL")
    }

    if (-not [string]::IsNullOrWhiteSpace($SshKeyPath)) {
        $scpArgs += @("-i", $SshKeyPath)
        $sshArgs += @("-i", $SshKeyPath)
    }

    $scpArgs += @($archivePath, ("{0}:{1}" -f $sshTarget, $remoteArchivePath))

    Write-Host "Uploading archive to $sshTarget..." -ForegroundColor Cyan
    Invoke-CheckedCommand -Command "scp" -Arguments $scpArgs

    $remoteCommands = @(
        "set -euo pipefail",
        "sudo systemctl stop '$ServiceName'",
        "mkdir -p '$RemotePath'",
        "find '$RemotePath' -mindepth 1 -maxdepth 1 ! -name 'db' ! -name 'media' -exec rm -rf {} +",
        "tar -xzf '$remoteArchivePath' -C '$RemotePath' --strip-components=1",
        "rm -f '$remoteArchivePath'"
    )

    if (-not $SkipServiceStart) {
        $remoteCommands += "sudo systemctl restart '$ServiceName'"
        $remoteCommands += "sudo systemctl status '$ServiceName' --no-pager --lines=20"
    }

    $remoteScript = $remoteCommands -join "; "

    Write-Host "Extracting archive on server..." -ForegroundColor Cyan
    Invoke-CheckedCommand -Command "ssh" -Arguments ($sshArgs + @($sshTarget, $remoteScript))

    Write-Host "Deployment finished successfully." -ForegroundColor Green
}
finally {
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force
    }
}
