param(
    [string]$NotoliRepository = (
        Join-Path $PSScriptRoot "..\..\..\Notoli"
    )
)

$ErrorActionPreference = "Stop"
$notoliRoot = [System.IO.Path]::GetFullPath($NotoliRepository)
$notoliCompose = Join-Path $notoliRoot "deploy\docker-compose.yml"
$notoliOverride = Join-Path $PSScriptRoot "notoli-port-override.yml"
$ingressCompose = Join-Path $PSScriptRoot "docker-compose.yml"

if (-not (Test-Path -LiteralPath $notoliCompose -PathType Leaf)) {
    throw "Notoli Compose file was not found at $notoliCompose."
}

& docker compose `
    -f $notoliCompose `
    -f $notoliOverride `
    up -d --no-deps --force-recreate proxy
if ($LASTEXITCODE -ne 0) {
    throw "Notoli could not be rebound to local HTTPS port 8442."
}

& docker compose -f $ingressCompose up -d --force-recreate
if ($LASTEXITCODE -ne 0) {
    throw "The shared local ingress could not be started."
}

Write-Output "Shared local ingress is listening on ports 80 and 443."
