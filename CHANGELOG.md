# Changelog

## 2026-07-26

### Added

- Added first-class `fullstacktemplate.localhost` support for Django, Nginx, Docker, local password-reset links, and browser access.
- Added a PowerShell helper that generates a local TLS certificate with `mkcert` or OpenSSL.
- Added the FullStackTemplate React and Material UI application shell.
- Added a protected Material UI component showcase covering common actions,
  forms, feedback, data display, loading, empty, and confirmation states.
- Added Django REST Framework authentication with registration, email-first JWT login, refresh tokens, forgot-password, and password-reset support.
- Added responsive authentication pages, shared snackbar feedback, session renewal, and logout behavior.
- Added frontend, backend, and repository-automation test coverage.
- Added Docker, Nginx, GHCR, SSH deployment, Dependabot, CodeQL, lint, test, vulnerability, malware, AI review, and security-alert workflows based on Notoli.
- Added the Modified MIT License (Non-Commercial Use Only).
- Added a working generic Workspace → Collection → Item example with CRUD,
  inline editing, drag-and-drop ordering, mobile gestures, collaborator
  sharing, authorization boundaries, and persisted activity notifications.
- Added scripts to initialize generated repositories and create a linked GitHub
  Project with reusable planning fields.
- Added first-run documentation for CI secrets, three AI reviewer Apps,
  security alert aggregation, branch rules, Cloudflare, DigitalOcean, GHCR,
  Resend, and production deployment.

### Fixed

- Preserved Dependabot source URLs through alert compaction and added regression
  coverage for generated security-issue links.
- Prevented Dependabot automation from merging pull requests while GitHub
  reports an unstable merge state.
- Pinned third-party and credential-handling GitHub Actions to immutable commit
  SHAs.
- Prevented AI reviewers from publishing a verdict and failed their check when
  the complete pull-request diff is truncated.
- Corrected the GitHub Project initializer to copy and verify Notoli's exact
  custom fields, option sets, views, filters, grouping, sorting, and supported
  workflows instead of creating an approximate Project manually.
- Fixed the npm malware gate so an initial frontend lockfile can be reviewed when the base branch has no lockfile.
- Fixed dependency-review reporting for large initial lockfiles by keeping detailed package JSON in the check logs and annotations.
- Removed the Dependabot-only auto-merge job from required status checks so normal pull requests are not blocked by its intentional skip.
- Replaced the inherited Create React App toolchain that introduced high and critical transitive dependency vulnerabilities.

### Changed

- Changed Project setup to link the copied Project to the target repository and
  set `SECURITY_ALERTS_PROJECT_ID` automatically.
- Changed local setup documentation and environment templates to use `fullstacktemplate.localhost`.
- Adapted application names, domains, image names, environment names, workflow prompts, and deployment paths from Notoli to FullStackTemplate.
- Limited npm malware advisory queries to the changed package versions instead of downloading the full npm malware catalog.
- Modernized the frontend build, test, and lint toolchain to Vite, Vitest, and Biome while retaining React, Material UI, and the existing authentication behavior.
- Configured the frontend container to proxy authentication, API, and admin requests to Django for direct-container and same-origin operation.
- Documented the exact Python 3.12 and Node.js 25 versions required for
  non-Docker development.
- Adapted Notoli's application-specific boards, lists, and notes into the
  reusable Workspace, Collection, and Item domain.
