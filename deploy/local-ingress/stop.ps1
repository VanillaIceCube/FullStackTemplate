param(
    [string]$NotoliRepository = (
        Join-Path $PSScriptRoot "..\..\..\Notoli"
    )
)

$ErrorActionPreference = "Stop"
$notoliRoot = [System.IO.Path]::GetFullPath($NotoliRepository)
$notoliCompose = Join-Path $notoliRoot "deploy\docker-compose.yml"
$ingressCompose = Join-Path $PSScriptRoot "docker-compose.yml"

if (-not (Test-Path -LiteralPath $notoliCompose -PathType Leaf)) {
    throw "Notoli Compose file was not found at $notoliCompose."
}

& docker compose -f $ingressCompose down
if ($LASTEXITCODE -ne 0) {
    throw "The shared local ingress could not be stopped."
}

& docker compose -f $notoliCompose up -d --no-deps --force-recreate proxy
if ($LASTEXITCODE -ne 0) {
    throw "Notoli could not be restored to local ports 80 and 443."
}

Write-Output "Shared local ingress stopped; Notoli again owns ports 80 and 443."
