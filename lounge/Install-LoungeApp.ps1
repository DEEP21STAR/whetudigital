<#
.SYNOPSIS
    Installs Lounge as a native-feeling Windows app (Start Menu + Desktop
    shortcuts, no browser chrome, taskbar icon) -- no Electron, no build
    chain, matches UI_STANDARD's "vanilla, no build chain" rule.

.DESCRIPTION
    Lounge is already a fully-configured PWA (manifest.json, service worker,
    icon set) -- Edge/Chrome's own "Install app" already does exactly this
    from the browser UI at zero extra cost. This script exists for one real
    reason: it gets Deep to the same result WITHOUT opening the site in a
    normal tab first and hunting for the install icon, which is the actual
    "I want a Windows exe installer" ask (2026-08-18) restated as a shortcut
    problem, not an installer-technology problem.

    What it does:
      1. Finds an installed Chromium browser (Edge preferred -- ships with
         every Windows 11 install, matches PHOENIX's browser stack).
      2. Creates a Start Menu shortcut AND a Desktop shortcut that launch
         the browser in --app= mode -- a real separate window, its own
         taskbar entry, no address bar/tabs, using Lounge's real .ico.
      3. Nothing is downloaded, installed, or modified system-wide -- two
         .lnk files, fully reversible (delete them and it's gone).

    This is NOT a compiled .exe. A real double-click .exe installer (via
    ps2exe or Inno Setup) needs a tool that isn't on this machine and
    wasn't going to be installed unattended overnight -- flagged to Deep
    as the next step if he wants the literal .exe file, not just this
    same result reached a different way.

.NOTES
    Author: Claude (autonomous /loop tick, 2026-08-19 00:xx, Deep's standing
            "keep working on fixes and upgrades on lmc" authorization)
    Safe to re-run -- overwrites its own shortcuts, touches nothing else.
#>

$ErrorActionPreference = 'Stop'

$LoungeUrl = 'https://lounge.whetudigital.co.nz/'
$AppName   = 'Lounge'
$IconPath  = Join-Path $PSScriptRoot 'icons\lounge.ico'

if (-not (Test-Path $IconPath)) {
    Write-Warning "Icon not found at $IconPath -- shortcuts will use the browser's default icon instead."
    $IconPath = $null
}

# Prefer Edge (ships with Windows 11, already used elsewhere in the PHOENIX
# stack per hardware_inventory.md) -- fall back to Chrome if Edge is missing.
function Find-Browser {
    $candidates = @(
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { return $c }
    }
    return $null
}

$browserPath = Find-Browser
if (-not $browserPath) {
    Write-Error "No Edge or Chrome install found -- Lounge needs a Chromium browser for app-mode (--app=) windows. Install one, then re-run this script."
    exit 1
}

function New-LoungeShortcut {
    param([string]$Path)
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($Path)
    $shortcut.TargetPath = $browserPath
    # --app= opens a chromeless window (no tabs/address bar) -- the actual
    # thing "install as an app" gives you. Separate --user-data-dir profile
    # so this doesn't share cookies/session with Deep's normal browsing.
    $profileDir = Join-Path $env:LOCALAPPDATA 'LoungeAppProfile'
    $shortcut.Arguments = "--app=$LoungeUrl --user-data-dir=""$profileDir"""
    $shortcut.WorkingDirectory = Split-Path $browserPath
    if ($IconPath) { $shortcut.IconLocation = $IconPath }
    $shortcut.Description = 'Lounge Media Center'
    $shortcut.Save()
    Write-Host "Created: $Path"
}

$desktopPath    = Join-Path ([Environment]::GetFolderPath('Desktop')) "$AppName.lnk"
$startMenuPath  = Join-Path ([Environment]::GetFolderPath('StartMenu')) "Programs\$AppName.lnk"

New-LoungeShortcut -Path $desktopPath
New-LoungeShortcut -Path $startMenuPath

Write-Host ""
Write-Host "Done. $AppName is on your Desktop and in the Start Menu -- opens as its own window, no browser chrome, no tabs." -ForegroundColor Cyan
Write-Host "Uses browser: $browserPath" -ForegroundColor DarkGray
