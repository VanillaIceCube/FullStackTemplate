[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$ApplicationName,

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$')]
    [string]$ApplicationSlug,

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$')]
    [string]$ProductionHost,

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[A-Za-z0-9-]+$')]
    [string]$GitHubOwner
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$compactName = $ApplicationName -replace '[^A-Za-z0-9]', ''

if ([string]::IsNullOrWhiteSpace($compactName)) {
    throw 'ApplicationName must contain at least one letter or number.'
}

$upperSlug = ($ApplicationSlug -replace '-', '_').ToUpperInvariant()
$replacementPairs = @(
    # Match the complete host before a slug that may also occur inside it.
    [pscustomobject]@{ Old = 'app.example.com'; New = $ProductionHost },
    [pscustomobject]@{ Old = 'Full Stack Template'; New = $compactName },
    [pscustomobject]@{ Old = 'FullStackTemplate'; New = $compactName },
    [pscustomobject]@{ Old = 'fullStackTemplate'; New = $compactName },
    [pscustomobject]@{ Old = 'fullstacktemplate'; New = $ApplicationSlug },
    [pscustomobject]@{ Old = 'FULLSTACKTEMPLATE'; New = $upperSlug },
    [pscustomobject]@{ Old = 'vanillaicecube'; New = $GitHubOwner.ToLowerInvariant() }
)
$replacementValues = [System.Collections.Generic.Dictionary[string, string]]::new([System.StringComparer]::Ordinal)
foreach ($pair in $replacementPairs) {
    $replacementValues[$pair.Old] = $pair.New
}
$replacementPattern = ($replacementPairs | ForEach-Object { [regex]::Escape($_.Old) }) -join '|'

$excludedDirectories = @('.git', 'node_modules', '.venv', 'venv', 'dist', 'build', 'coverage')
$textExtensions = @(
    '.css', '.env', '.html', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.ps1', '.py',
    '.svg', '.txt', '.yaml', '.yml'
)
$explicitTextNames = @('.gitignore', 'Dockerfile', 'Dockerfile.dev')
# These exact bytes are owned by the pinned Infrastructure standard, not branding.
$sharedFiles = @(
    'deploy/shared-source.json', 'deploy/check_parity.py',
    'deploy/production/release.py', 'deploy/production/build_bundle.py'
)


$files = Get-ChildItem -LiteralPath $repoRoot -Recurse -File -Force | Where-Object {
    $relativePath = $_.FullName.Substring($repoRoot.Length).TrimStart([char[]]@('\', '/'))
    $normalizedPath = $relativePath.Replace('\', '/')
    if ($sharedFiles -contains $normalizedPath -or $normalizedPath.StartsWith('deploy/tests/')) { return $false }
    $segments = $relativePath -split '[\\/]'
    $isExcluded = $segments | Where-Object { $excludedDirectories -contains $_ }
    (-not $isExcluded) -and (
        $textExtensions -contains $_.Extension.ToLowerInvariant() -or
        $explicitTextNames -contains $_.Name -or
        $_.Name.EndsWith('.env.example')
    )
}

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    # One pass prevents inserted names/hosts from being replaced a second time.
    $updated = [regex]::Replace($content, $replacementPattern, [System.Text.RegularExpressions.MatchEvaluator] {
        param($match)
        $replacementValues[$match.Value]
    })

    if ($updated -ne $content -and $PSCmdlet.ShouldProcess($file.FullName, 'Apply template branding')) {
        [System.IO.File]::WriteAllText(
            $file.FullName,
            $updated,
            [System.Text.UTF8Encoding]::new($false)
        )
    }
}

$renames = @(
    @{
        Source = Join-Path $repoRoot 'frontend/public/fullstacktemplate-mark.svg'
        Target = Join-Path $repoRoot "frontend/public/$ApplicationSlug-mark.svg"
    },
    @{
        Source = Join-Path $repoRoot 'frontend/src/__tests__/fullStackTemplateThemeStyles.test.js'
        Target = Join-Path $repoRoot "frontend/src/__tests__/${compactName}ThemeStyles.test.js"
    }
)

foreach ($rename in $renames) {
    if (
        (Test-Path -LiteralPath $rename.Source) -and
        $rename.Source -ne $rename.Target -and
        $PSCmdlet.ShouldProcess($rename.Source, "Rename to $($rename.Target)")
    ) {
        Move-Item -LiteralPath $rename.Source -Destination $rename.Target
    }
}

Write-Output "Template configured for $ApplicationName."
Write-Output "Local URL: https://$ApplicationSlug.localhost"
Write-Output "Production URL: https://$ProductionHost"
Write-Output 'Review git diff, replace the starter SVG, and follow README.md before opening the first PR.'
