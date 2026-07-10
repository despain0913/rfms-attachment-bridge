<#
.SYNOPSIS
  Silently installs or updates RFMS Attachment Bridge on a Windows PC.

.DESCRIPTION
  Reads the same latest.json manifest used by the app's in-app update check
  (see latest.json.example), compares its version to whatever is currently
  installed, and — only if the manifest is newer — downloads and silently
  runs the installer (NSIS /S). Safe to run repeatedly / on a schedule: if
  the machine is already up to date it does nothing and exits 0.

  Designed to run as a TacticalRMM script under the SYSTEM account. Requires
  the installer to be built with `perMachine: true` (see electron-builder.yml)
  so it installs to Program Files rather than a per-user profile — a
  per-user install run as SYSTEM would be invisible to the actual user.

.PARAMETER ManifestPath
  HTTPS URL or UNC/local file path to latest.json. Example values:
    https://intranet.weberflooring.com/rfms/latest.json
    \\fileserver\apps\RFMS Attachment Bridge\latest.json
  Pass this as a TacticalRMM script argument, e.g.:
    -ManifestPath "https://intranet.weberflooring.com/rfms/latest.json"
  or hardcode it below by replacing the default value.

.NOTES
  Exit code 0 = up to date, or installed/updated successfully.
  Exit code 1 = something went wrong — see script output in the TacticalRMM
  task history for details.
#>

param(
    [string]$ManifestPath = "REPLACE_WITH_MANIFEST_URL_OR_UNC_PATH"
)

$ErrorActionPreference = 'Stop'
$AppDisplayName = 'RFMS Attachment Bridge'

function Write-Log {
    param([string]$Message)
    Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
}

# Numeric MAJOR.MINOR.PATCH comparison (mirrors src/main/updater.js). Returns
# a positive number if $a is newer than $b, 0 if equal, negative if older.
function Compare-AppVersion {
    param([string]$a, [string]$b)
    $pa = ($a -split '\.') | ForEach-Object { [int]([regex]::Match($_, '\d+').Value) }
    $pb = ($b -split '\.') | ForEach-Object { [int]([regex]::Match($_, '\d+').Value) }
    for ($i = 0; $i -lt 3; $i++) {
        $x = if ($i -lt $pa.Count) { $pa[$i] } else { 0 }
        $y = if ($i -lt $pb.Count) { $pb[$i] } else { 0 }
        if ($x -ne $y) { return $x - $y }
    }
    return 0
}

try {
    if ($ManifestPath -eq 'REPLACE_WITH_MANIFEST_URL_OR_UNC_PATH') {
        Write-Log "ManifestPath is not configured. Pass -ManifestPath, or edit the default in this script."
        exit 1
    }

    Write-Log "Reading manifest: $ManifestPath"
    if ($ManifestPath -match '^https?://') {
        $manifest = Invoke-RestMethod -Uri $ManifestPath -UseBasicParsing
    } else {
        $manifest = Get-Content -Path $ManifestPath -Raw | ConvertFrom-Json
    }

    $latestVersion = [string]$manifest.version
    $installerUrl  = [string]$manifest.url
    if (-not $latestVersion -or -not $installerUrl) {
        Write-Log "Manifest is missing 'version' or 'url'. Aborting."
        exit 1
    }
    Write-Log "Latest available version: $latestVersion"

    # Machine-wide uninstall registry entry (requires perMachine: true installer).
    $installed = Get-ItemProperty 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayName -eq $AppDisplayName } |
        Select-Object -First 1
    $installedVersion = $installed.DisplayVersion

    if ($installedVersion) {
        Write-Log "Installed version: $installedVersion"
        if ((Compare-AppVersion $installedVersion $latestVersion) -ge 0) {
            Write-Log "Already up to date. Nothing to do."
            exit 0
        }
    } else {
        Write-Log "App is not currently installed on this machine."
    }

    $tempDir = Join-Path $env:TEMP 'rfms-attachment-bridge-deploy'
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    $installerPath = Join-Path $tempDir "RFMS-Attachment-Bridge-Setup-$latestVersion.exe"

    Write-Log "Downloading installer from $installerUrl"
    if ($installerUrl -match '^https?://') {
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
    } else {
        Copy-Item -Path $installerUrl -Destination $installerPath -Force
    }

    # Strip any zone/Mark-of-the-Web info so a silent run isn't blocked.
    Unblock-File -Path $installerPath -ErrorAction SilentlyContinue

    Write-Log "Running silent install (/S)..."
    $proc = Start-Process -FilePath $installerPath -ArgumentList '/S' -Wait -PassThru
    Write-Log "Installer exit code: $($proc.ExitCode)"

    Remove-Item -Path $installerPath -Force -ErrorAction SilentlyContinue

    if ($proc.ExitCode -ne 0) {
        Write-Log "Install failed with exit code $($proc.ExitCode)."
        exit 1
    }

    Write-Log "Successfully installed/updated RFMS Attachment Bridge to version $latestVersion."
    exit 0
}
catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    exit 1
}
