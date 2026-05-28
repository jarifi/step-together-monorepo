# ====================================================================
# SCRIPT: Pair over Wi-Fi, build local APK, install via ADB
# ====================================================================

$ErrorActionPreference = "Stop"
$autoGrantHealthPermissions = $true

function Run-Checked {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,
        [string[]]$Args = @()
    )

    & $Command @Args
    if ($LASTEXITCODE -ne 0) {
        throw "$Command failed with exit code $LASTEXITCODE"
    }
}

function Get-AdbTlsConnectEndpoints {
    $out = adb mdns services 2>$null
    $items = @()

    foreach ($line in $out) {
        if ($line -notmatch "_adb-tls-connect\._tcp\.") {
            continue    
        }
        if ($line -match "([A-Za-z0-9\.-]+:\d+)") {
            $items += $Matches[1]
        }
    }

    return $items | Select-Object -Unique
}

function Test-AdbDeviceOnline {
    $devicesOut = adb devices
    $onlineDevices = $devicesOut | Select-String -Pattern "device$"
    return [bool]$onlineDevices
}

function Get-ConnectedWirelessDeviceSerial {
    $devicesOut = adb devices

    foreach ($line in $devicesOut) {
        if ($line -match "^([0-9A-Za-z\.-]+:\d+)\s+device$") {
            return $Matches[1]
        }
    }

    return $null
}

function Get-ConnectedUsbDeviceSerials {
    $devicesOut = (& adb devices 2>$null | Out-String)
    $items = @()

    foreach ($line in ($devicesOut -split "`r?`n")) {
        $trimmed = $line.Trim()
        if ([string]::IsNullOrWhiteSpace($trimmed)) {
            continue
        }
        if ($trimmed -like "List of devices attached*") {
            continue
        }

        if ($trimmed -match "^(\S+)\s+device(\s|$)") {
            $serial = $Matches[1].Trim()
            # USB serials should not contain ':'; keep wireless serials out of this list.
            if ($serial -notlike "*:*") {
                $items += $serial
            }
        }
    }

    return @($items | Select-Object -Unique)
}

function Parse-Endpoint {
    param([string]$Endpoint)

    if ($Endpoint -notmatch "^([^:]+):(\d+)$") {
        throw "Invalid endpoint. Use format IP:PORT"
    }

    return @{ Ip = $Matches[1]; Port = $Matches[2] }
}

function Validate-Port {
    param([string]$PortValue, [string]$Label)

    $n = 0
    if (-not [int]::TryParse($PortValue, [ref]$n) -or $n -lt 1 -or $n -gt 65535) {
        throw "$Label must be a number between 1 and 65535."
    }
}

function Get-AndroidApplicationId {
    param([string]$ProjectPath)

    $gradlePath = Join-Path $ProjectPath "android\app\build.gradle"
    if (Test-Path $gradlePath) {
        $line = Get-Content $gradlePath | Select-String -Pattern 'applicationId\s+[''\"]([^''\"]+)[''\"]' | Select-Object -First 1
        if ($line -and $line.Matches.Count -gt 0) {
            return $line.Matches[0].Groups[1].Value
        }
    }

    return $null
}

function Remove-AndroidPackageForUser0 {
    param(
        [Parameter(Mandatory = $true)]
        [string]$DeviceSerial,
        [Parameter(Mandatory = $true)]
        [string]$ApplicationId
    )

    Write-Host "Checking existing install for package $ApplicationId on user 0..." -ForegroundColor Yellow

    try {
        # Prefer removing for user 0 because expo install uses --user 0.
        & adb -s $DeviceSerial shell pm uninstall --user 0 $ApplicationId | Out-Null
    }
    catch {
        # Ignore and try full uninstall next.
    }

    try {
        # Fallback to full uninstall for regular user-installed package.
        & adb -s $DeviceSerial uninstall $ApplicationId | Out-Null
    }
    catch {
        # Ignore; verify state below.
    }

    $remaining = & adb -s $DeviceSerial shell pm list packages $ApplicationId 2>$null
    if ($remaining -match "package:$([Regex]::Escape($ApplicationId))") {
        throw "Package $ApplicationId is still installed. Uninstall it manually once: adb -s $DeviceSerial uninstall $ApplicationId"
    }
}

function Grant-DevHealthPermissions {
    param(
        [Parameter(Mandatory = $true)]
        [string]$DeviceSerial,
        [Parameter(Mandatory = $true)]
        [string]$ApplicationId
    )

    Write-Host "Granting development health/activity permissions..." -ForegroundColor Yellow

    $permissions = @(
        "android.permission.ACTIVITY_RECOGNITION",
        "android.permission.BODY_SENSORS"
    )

    foreach ($perm in $permissions) {
        $granted = $false

        # First try user-scoped grant (expo installs with --user 0).
        & adb -s $DeviceSerial shell pm grant --user 0 $ApplicationId $perm 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $granted = $true
        }
        else {
            # Fallback without user scope for older Android behavior.
            & adb -s $DeviceSerial shell pm grant $ApplicationId $perm 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $granted = $true
            }
        }

        if ($granted) {
            Write-Host "  granted: $perm" -ForegroundColor DarkGreen
        }
        else {
            Write-Host "  could not grant via pm: $perm" -ForegroundColor DarkYellow
        }
    }

    # On some devices, runtime permission state may still be blocked by AppOps.
    $appOps = @(
        "ACTIVITY_RECOGNITION",
        "android:activity_recognition",
        "BODY_SENSORS",
        "android:body_sensors"
    )

    foreach ($op in $appOps) {
        try {
            & adb -s $DeviceSerial shell appops set $ApplicationId $op allow | Out-Null
        }
        catch {
            # Not all op aliases exist on all Android versions.
        }

        try {
            & adb -s $DeviceSerial shell cmd appops set --uid $ApplicationId $op allow | Out-Null
        }
        catch {
            # Not all Android versions support this form.
        }
    }

    try {
        $dump = & adb -s $DeviceSerial shell dumpsys package $ApplicationId 2>$null
        $hasActivityGranted = ($dump | Select-String -Pattern "android.permission.ACTIVITY_RECOGNITION: granted=true")
        if ($hasActivityGranted) {
            Write-Host "  verify: ACTIVITY_RECOGNITION granted=true" -ForegroundColor DarkGreen
        }
        else {
            Write-Host "  verify: ACTIVITY_RECOGNITION not confirmed in dumpsys" -ForegroundColor DarkYellow
        }

        $ops = & adb -s $DeviceSerial shell cmd appops get $ApplicationId ACTIVITY_RECOGNITION 2>$null
        if ($ops) {
            Write-Host "  appops: $($ops -join ' ')" -ForegroundColor DarkCyan
        }
    }
    catch {
        # Verification is best-effort.
    }
}

Write-Host "=== ADB Device Setup ===" -ForegroundColor Cyan
Run-Checked -Command "adb" -Args @("start-server")

$deviceSerial = ""
$phoneIp = ""
$pairPort = ""
$pairCode = ""
$connectPort = ""

$connectionMode = (Read-Host "Connection mode [U=USB / W=Wireless] (default: U)").Trim().ToUpperInvariant()
if ([string]::IsNullOrWhiteSpace($connectionMode)) {
    $connectionMode = "U"
}

if ($connectionMode -eq "U") {
    Write-Host "Checking for connected USB devices..." -ForegroundColor Yellow
    $usbDevices = @(Get-ConnectedUsbDeviceSerials)

    if ($usbDevices.Count -eq 0) {
        throw "No USB device found. Connect a phone via USB, enable USB debugging, accept the RSA prompt, then rerun."
    }

    if ($usbDevices.Count -eq 1) {
        $deviceSerial = $usbDevices[0]
        Write-Host "Using USB device: $deviceSerial" -ForegroundColor Green
    }
    else {
        Write-Host "Multiple USB devices found:" -ForegroundColor Green
        for ($i = 0; $i -lt $usbDevices.Count; $i++) {
            Write-Host ("  [{0}] {1}" -f ($i + 1), $usbDevices[$i])
        }

        $selection = (Read-Host "Select device number").Trim()
        $idx = 0
        if (-not [int]::TryParse($selection, [ref]$idx) -or $idx -lt 1 -or $idx -gt $usbDevices.Count) {
            throw "Invalid USB device selection."
        }

        $deviceSerial = $usbDevices[$idx - 1]
        Write-Host "Using USB device: $deviceSerial" -ForegroundColor Green
    }
}
elseif ($connectionMode -eq "W") {
    Write-Host "Checking for already connected wireless ADB device..." -ForegroundColor Yellow
    $deviceSerial = Get-ConnectedWirelessDeviceSerial

    if (-not [string]::IsNullOrWhiteSpace($deviceSerial)) {
        Write-Host "Found already connected device: $deviceSerial" -ForegroundColor Green

        if ($deviceSerial -match "^([^:]+):(\d+)$") {
            $phoneIp = $Matches[1]
            $connectPort = $Matches[2]
        }
    }
    else {
        Write-Host "No connected wireless device found. Starting pairing flow." -ForegroundColor Yellow
        Write-Host "Choose pairing mode:" -ForegroundColor DarkCyan
        Write-Host "  1) QR (pair on phone camera first, then script connects)" -ForegroundColor DarkCyan
        Write-Host "  2) Manual (pair code + ports in script)" -ForegroundColor DarkCyan
        Write-Host ""
        Write-Host "Manual mode mapping (important):" -ForegroundColor Yellow
        Write-Host "  Phone IP      -> only IP, e.g. 10.12.100.57 (NO :port)" -ForegroundColor Yellow
        Write-Host "  Pair port     -> from 'Pair device with pairing code'" -ForegroundColor Yellow
        Write-Host "  Pairing code  -> 6-digit code from phone" -ForegroundColor Yellow
        Write-Host "  Connect port  -> from Wireless debugging main screen" -ForegroundColor Yellow
        Write-Host ""

        $pairMode = (Read-Host "Mode [1/2]").Trim()
        if ([string]::IsNullOrWhiteSpace($pairMode)) {
            $pairMode = "1"
        }

        if ($pairMode -eq "1") {
            Write-Host "On phone: Developer options -> Wireless debugging -> Pair device with QR code." -ForegroundColor Yellow
            Write-Host "Trying to discover connect endpoints from adb mDNS..." -ForegroundColor Yellow

            $connectEndpoint = ""
            $mdnsEndpoints = Get-AdbTlsConnectEndpoints
            if ($mdnsEndpoints.Count -gt 0) {
                Write-Host "Discovered endpoints:" -ForegroundColor Green
                for ($i = 0; $i -lt $mdnsEndpoints.Count; $i++) {
                    Write-Host ("  [{0}] {1}" -f ($i + 1), $mdnsEndpoints[$i])
                }

                $selection = (Read-Host "Select number, or press Enter to type endpoint manually").Trim()
                if (-not [string]::IsNullOrWhiteSpace($selection)) {
                    $idx = 0
                    if (-not [int]::TryParse($selection, [ref]$idx) -or $idx -lt 1 -or $idx -gt $mdnsEndpoints.Count) {
                        throw "Invalid selection."
                    }
                    $connectEndpoint = $mdnsEndpoints[$idx - 1]
                }
            }

            if ([string]::IsNullOrWhiteSpace($connectEndpoint)) {
                Write-Host "No endpoint selected. Enter endpoint from phone Wireless debugging screen." -ForegroundColor Yellow
                $connectEndpoint = (Read-Host "Connect endpoint (example 10.12.100.57:42165)").Trim()
            }

            $parsed = Parse-Endpoint -Endpoint $connectEndpoint
            $phoneIp = $parsed.Ip
            $connectPort = $parsed.Port
        }
        elseif ($pairMode -eq "2") {
            Write-Host "Open Android -> Developer options -> Wireless debugging -> Pair device with pairing code" -ForegroundColor DarkCyan
            Write-Host "Example values:" -ForegroundColor DarkCyan
            Write-Host "  IP: 10.12.100.57" -ForegroundColor DarkCyan
            Write-Host "  Pair port: 36469" -ForegroundColor DarkCyan
            Write-Host "  Pair code: 123456" -ForegroundColor DarkCyan
            Write-Host "  Connect port: 42165" -ForegroundColor DarkCyan

        $phoneIp = (Read-Host "Phone IP ONLY (example 10.12.100.57) [NO :port]").Trim()
        if ([string]::IsNullOrWhiteSpace($phoneIp)) {
            throw "Phone IP is required."
        }
        if ($phoneIp.Contains(":")) {
            throw "Phone IP must NOT contain a port. Enter only IP, for example 10.12.100.57"
        }

        $pairPort = (Read-Host "Pair port (from 'Pair device with pairing code')").Trim()
        if ([string]::IsNullOrWhiteSpace($pairPort)) {
            throw "Pair port is required."
        }
        Validate-Port -PortValue $pairPort -Label "Pair port"

        $pairCode = (Read-Host "Pairing code (exactly 6 digits)").Trim()
        if ([string]::IsNullOrWhiteSpace($pairCode)) {
            throw "Pairing code is required."
        }
        if ($pairCode -notmatch "^\d{6}$") {
            throw "Pairing code must be exactly 6 digits."
        }

        $connectPort = (Read-Host "Connect port (from Wireless debugging main screen)").Trim()
        if ([string]::IsNullOrWhiteSpace($connectPort)) {
            throw "Connect port is required."
        }
        Validate-Port -PortValue $connectPort -Label "Connect port"
        }
        else {
            throw "Unknown mode. Enter 1 (QR) or 2 (Manual)."
        }

    Write-Host "Restarting ADB server..." -ForegroundColor Yellow
    Run-Checked -Command "adb" -Args @("kill-server")
    Run-Checked -Command "adb" -Args @("start-server")

    $maxAttempts = 5
    $connected = $false

    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        Write-Host ("ADB connect attempt {0}/{1}" -f $attempt, $maxAttempts) -ForegroundColor Yellow

        if ($pairMode -eq "2") {
            try {
                Write-Host "Pairing with $phoneIp`:$pairPort ..." -ForegroundColor Yellow
                Run-Checked -Command "adb" -Args @("pair", "$phoneIp`:$pairPort", $pairCode)
            }
            catch {
                Write-Host "Pair failed." -ForegroundColor Red
                if ($attempt -lt $maxAttempts) {
                    $retryPair = (Read-Host "Retry pair with new code/ports? [y/N]").Trim().ToLowerInvariant()
                    if ($retryPair -eq "y") {
                        $phoneIp = (Read-Host "Phone IP ONLY (e.g. 10.12.100.57)").Trim()
                        if ([string]::IsNullOrWhiteSpace($phoneIp) -or $phoneIp.Contains(":")) {
                            throw "Phone IP must be IP only (no :port)."
                        }
                        $pairPort = (Read-Host "Pair port").Trim()
                        Validate-Port -PortValue $pairPort -Label "Pair port"
                        $pairCode = (Read-Host "Pairing code (6 digits)").Trim()
                        if ($pairCode -notmatch "^\d{6}$") {
                            throw "Pairing code must be exactly 6 digits."
                        }
                        $connectPort = (Read-Host "Connect port").Trim()
                        Validate-Port -PortValue $connectPort -Label "Connect port"
                        continue
                    }
                }
                throw
            }
        }

        try {
            Write-Host "Connecting to $phoneIp`:$connectPort ..." -ForegroundColor Yellow
            Run-Checked -Command "adb" -Args @("connect", "$phoneIp`:$connectPort")
        }
        catch {
            Write-Host "Connect failed." -ForegroundColor Red

            if ($attempt -lt $maxAttempts) {
                if ($pairMode -eq "1") {
                    $refresh = (Read-Host "Refresh mDNS endpoints? [Y/n]").Trim().ToLowerInvariant()
                    if ($refresh -ne "n") {
                        $mdnsEndpoints = Get-AdbTlsConnectEndpoints
                        if ($mdnsEndpoints.Count -gt 0) {
                            Write-Host "Discovered endpoints:" -ForegroundColor Green
                            for ($i = 0; $i -lt $mdnsEndpoints.Count; $i++) {
                                Write-Host ("  [{0}] {1}" -f ($i + 1), $mdnsEndpoints[$i])
                            }
                        }
                    }
                }

                $newEp = (Read-Host "Enter new connect endpoint (or press Enter to retry same)").Trim()
                if (-not [string]::IsNullOrWhiteSpace($newEp)) {
                    $parsed = Parse-Endpoint -Endpoint $newEp
                    $phoneIp = $parsed.Ip
                    $connectPort = $parsed.Port
                }
                continue
            }

            throw
        }

        if (Test-AdbDeviceOnline) {
            $connected = $true
            break
        }

        if ($attempt -lt $maxAttempts) {
            Write-Host "No online device yet, retrying..." -ForegroundColor Yellow
        }
    }

    if (-not $connected) {
        throw "No online ADB device found after retries."
    }

        Write-Host "Device is connected and ready." -ForegroundColor Green
        $deviceSerial = "$phoneIp`:$connectPort"
    }
}
else {
    throw "Unknown connection mode. Enter U (USB) or W (Wireless)."
}
$appId = Get-AndroidApplicationId -ProjectPath (Get-Location).Path
if (-not [string]::IsNullOrWhiteSpace($appId)) {
    Write-Host "Preparing clean install for package $appId (avoids version downgrade errors)..." -ForegroundColor Yellow
    Remove-AndroidPackageForUser0 -DeviceSerial $deviceSerial -ApplicationId $appId
}

Write-Host "Starting Android build + install (Expo run, Windows-compatible)..." -ForegroundColor Yellow
Write-Host "This will create native android project if needed and install directly on the connected device." -ForegroundColor DarkYellow

$projectPath = (Get-Location).Path
$shortPath = "C:\_st"
$createdJunction = $false
$useShortPath = $false

try {
    if (-not (Test-Path $shortPath)) {
        New-Item -ItemType Junction -Path $shortPath -Target $projectPath | Out-Null
        $createdJunction = $true
        $useShortPath = $true
    }
    else {
        $item = Get-Item $shortPath -ErrorAction Stop
        if ($item.LinkType -eq "Junction") {
            $useShortPath = $true
        }
        else {
            Write-Host "Path shortening skipped: $shortPath exists and is not a junction." -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "Could not create junction path. Continuing without path shortening." -ForegroundColor Yellow
}

try {
    if ($useShortPath) {
        Write-Host "Using short path $shortPath to avoid Windows path-length build errors..." -ForegroundColor Cyan
        Push-Location $shortPath
    }

    Run-Checked -Command "npx.cmd" -Args @("expo", "run:android", "--device")

    if ($autoGrantHealthPermissions -and -not [string]::IsNullOrWhiteSpace($appId)) {
        Grant-DevHealthPermissions -DeviceSerial $deviceSerial -ApplicationId $appId
    }
}
finally {
    if ($useShortPath) {
        Pop-Location
    }
    if ($createdJunction -and (Test-Path $shortPath)) {
        & cmd /c "rmdir /s /q $shortPath" | Out-Null
    }
}

Write-Host "Done. App built and installed successfully." -ForegroundColor Green
