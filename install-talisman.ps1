$ErrorActionPreference = "Stop"

$release = Invoke-RestMethod -Uri "https://api.github.com/repos/thoughtworks/talisman/releases/latest" -Headers @{ "User-Agent" = "PowerShell" }
$asset = $release.assets | Where-Object { $_.name -eq "talisman_windows_amd64.zip" } | Select-Object -First 1

if (-not $asset) {
    throw "Could not find talisman_windows_amd64.zip in latest release."
}

$zipPath = "$env:TEMP\talisman.zip"
$installDir = "$env:LOCALAPPDATA\Programs\Talisman"

New-Item -ItemType Directory -Force -Path $installDir | Out-Null
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath
Expand-Archive -Path $zipPath -DestinationPath $installDir -Force

$envPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($envPath -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$envPath;$installDir", "User")
}




Write-Host "Talisman installed to $installDir"
Write-Host "Restart PowerShell, then run: talisman --version"
