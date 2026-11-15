# 🧰 FullStackTemplate onboarding scripts

This folder retains the two manual onboarding tools. Run them from the repository
root; active CI, browser, backend, and test helpers live beside their owners.

## 🧭 Script index

| Script | Purpose |
| --- | --- |
| [initialize-template.ps1](initialize-template.ps1) | Apply application branding and hostnames; supports `-WhatIf`. |
| [create-github-project.ps1](create-github-project.ps1) | Create or copy the application GitHub Project; supports a preview. |

## 🧱 Create an application

Create a repository from FullStackTemplate and clone it. From the new
repository's root in PowerShell, add `-WhatIf` to preview this command first:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/initialize-template.ps1 `
  -ApplicationName 'ExampleApplication' `
  -ApplicationSlug 'example-application' `
  -ProductionHost 'example-application.example.com' `
  -GitHubOwner 'YOUR_GITHUB_OWNER'
```


| Parameter | Purpose |
| --- | --- |
| `ApplicationName` | Application display name and compact code identifiers |
| `ApplicationSlug` | Lowercase, hyphenated identifiers and local hostname |
| `ProductionHost` | Production hostname, without a scheme or path |
| `GitHubOwner` | Owner used for container registry image names |

The initializer updates display names, Docker/Conda identifiers, GHCR image
names, workflow markers, production settings, and local hostnames. It also
renames the starter SVG mark and theme test. Review the diff and replace the
starter mark with your application's branding.

Local development uses `http://[application-slug].localhost:3000` for React
and port 8000 for Django. Standalone local HTTPS uses
`https://[application-slug].localhost`. Browsers normally resolve `.localhost`
names to loopback without a hosts-file entry. Production uses a subdomain such
as `https://[application-slug].[base-domain]`; the gateway routes `/auth`,
`/api`, and `/admin` to Django and other application paths to React.

Host replacement precedes slug replacement; inserted values are applied once
so overlapping names cannot rewrite the chosen host. Canonical shared framework
and release files retain their pinned bytes. The former root initializer regression
suite has been removed; review generated configuration and branding before use.

Complete the [GitHub setup](../.github/README.md#-before-your-first-pull-request) before the first pull request.
Local development can begin before reviewer credentials are configured.
Production onboarding and deployment follow the separate
[release and recovery guide](../deploy/production/README.md).

## 📚 Further reading

- [GitHub Project setup](../.github/README.md#1-create-the-project).
- [Workflow checks and validation](../.github/workflows/README.md#-checks-and-diagnostics).
- [Browser helpers](../frontend/README.md#-browser-tests).
- [MCP verification](../backend/app_mcp/README.md#-verification).
- [Documentation index](../docs/README.md).
