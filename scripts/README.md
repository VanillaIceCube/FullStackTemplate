# 🧰 FullStackTemplate scripts

Repository maintenance helpers live here. Run documented commands from the
repository root with the dependencies required by the relevant guide.

## 🧭 Script index

| Script | Purpose |
| --- | --- |
| [bounded_log.py](bounded_log.py) | Bound reviewer logs while retaining early, failing, and late evidence. |
| [check_app_mcp.py](check_app_mcp.py) | Verify shared Python framework hashes against the canonical source pin. |
| [ci_architecture.py](ci_architecture.py) | Validate documented CI contracts and regenerate the source inventory. |
| [collect_browser_artifacts.py](collect_browser_artifacts.py) | Collect a bounded set of generated browser failure artifacts. |
| [create-github-project.ps1](create-github-project.ps1) | Create or copy the application GitHub Project; supports a preview. |
| [e2e_backend.py](e2e_backend.py) | Start only the isolated loopback backend used by browser tests. |
| [e2e_settings.py](e2e_settings.py) | Disposable test settings; excludes developer and production environment files. |
| [initialize-template.ps1](initialize-template.ps1) | Apply application branding and hostnames; supports `-WhatIf`. |
| [install_actionlint.sh](install_actionlint.sh) | Install the pinned, checksum-verified Linux Actionlint release. |
| [run_e2e.cjs](run_e2e.cjs) | Run isolated frontend/backend browser journeys and remove their generated state. |
| [test_dev_container.py](test_dev_container.py) | Verify dependency startup with a disposable Docker volume. |
| [validate_repository.py](validate_repository.py) | Validate workflow/script syntax and synthetic Compose configuration. |

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

Initializer tests remain in generated repositories and verify branding in
disposable copies, including slug-prefixed production hosts and renamed theme
tests. Host replacement precedes slug replacement; inserted values are applied
once so overlapping names cannot rewrite the chosen host. Canonical shared
framework and release files retain their pinned bytes.

Complete the [GitHub setup](../.github/GITHUB_SETUP.md) before the first pull request.
Local development can begin before reviewer credentials are configured.
Production onboarding and deployment follow the separate
[release and recovery guide](../deploy/production/README.md).

## 🔌 MCP maintenance

See the [framework README](../backend/app_mcp/README.md) for canonical
source ownership, manifests, and the local `--source-root` verification option.

## 📚 Further reading

- [Tests and validation](../tests/README.md).
- [GitHub setup and workflows](../.github/README-WORKFLOWS.md).
