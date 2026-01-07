# --- SAFE CLEANUP OF ORPHANED .MSP FILES ---
# Author: ChatGPT x Bety Special Edition 💥

# Folder where Windows keeps installer files
$InstallerPath = "$env:windir\Installer"

# Folder to move orphaned files into (change if you want)
$BackupPath = "C:\InstallerBackup"

# Create backup folder if it doesn't exist
if (!(Test-Path -Path $BackupPath)) {
    New-Item -Path $BackupPath -ItemType Directory | Out-Null
    Write-Host "Created backup folder at: $BackupPath" -ForegroundColor Cyan
}

# Get list of registered MSPs (those that Windows still needs)
$RegisteredMSPs = Get-WmiObject -Class Win32_PatchPackage | Select-Object -ExpandProperty PackageName

# Get all MSP files physically present
$AllMSPs = Get-ChildItem -Path $InstallerPath -Filter *.msp -Recurse -ErrorAction SilentlyContinue

# Identify orphaned MSPs (not linked to any installed patch)
$OrphanedMSPs = $AllMSPs | Where-Object { $RegisteredMSPs -notcontains $_.Name }

Write-Host "`nTotal MSP files found: $($AllMSPs.Count)"
Write-Host "Orphaned MSP files (safe to move): $($OrphanedMSPs.Count)" -ForegroundColor Yellow

if ($OrphanedMSPs.Count -eq 0) {
    Write-Host "`nNo orphaned MSP files found. System clean!" -ForegroundColor Green
    return
}

# --- Show the list before moving ---
Write-Host "`nOrphaned MSP files to move:" -ForegroundColor Cyan
$OrphanedMSPs.FullName

# --- Confirm before moving ---
$confirm = Read-Host "`nDo you want to MOVE these orphaned MSP files to $BackupPath ? (Y/N)"
if ($confirm -eq 'Y' -or $confirm -eq 'y') {
    foreach ($file in $OrphanedMSPs) {
        try {
            Move-Item -Path $file.FullName -Destination $BackupPath -Force
            Write-Host "Moved: $($file.Name)" -ForegroundColor Green
        }
        catch {
            Write-Host "Failed to move: $($file.FullName)" -ForegroundColor Red
        }
    }
    Write-Host "`nAll orphaned files moved successfully!" -ForegroundColor Cyan
    Write-Host "They're safe in: $BackupPath"
    Write-Host "If no issues occur after 2–3 weeks, you can delete them permanently." -ForegroundColor Yellow
} else {
    Write-Host "Operation canceled. No files were moved." -ForegroundColor Yellow
}
