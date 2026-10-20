# Changelog

## 2026-10-20

### Fixed

- Corrected Jules agent PR ownership rules and continuation logic (v3.1): require strict title (`🦀 Marty:` / `🐚 Nora:`) and branch (`jules/marty/` / `jules/nora/`) prefixes so Dependabot, human, or other-persona PRs no longer cause false capacity stops or duplicate branch creation.
- Updated live schedule prompts for Nora and Marty across all 8 schedules and verified canonical PR maintenance.

## 2026-10-19

### Changed

- Separate Obi-Wan, Lint Eastwood, and RoboCop OpenAI secrets, including RoboCop alert aggregation; pass only each reviewer's own credentials, stage `OPENAI_REVIEWERS_PROJECT_ID` independently, and document the deferred per-repository key migration.

All notable changes to this project are documented in this file.

## 2026-10-18

### Added

- Added pinned Infrastructure release tools, parity checks, app-only policy,
  private immutable bundles, recovery tests, and explicit onboarding guidance.
- Verify generated apps preserve canonical shared-source metadata and hashes.

### Changed

- Separated local HTTPS/proxy fixtures from production ownership and stopped
  trusting forwarded Host in favor of the gateway's canonical Host.

### Removed

- Removed production certificate uploads, shared-proxy lifecycle, mutable-image
  activation, and host-wide Docker pruning from the template deploy workflow.

## 2026-10-18

### Fixed

- Preserve complete production hosts and theme-test renames when retained
  initializer checks run after application branding; apply replacements once.
- Keep generated frontend npm lockfile payloads out of AI source prompts while
  disclosing exclusions and preserving independent dependency/security gates,
  source byte limits, inline line numbers, and visible incomplete-review failures.

### Changed

- Replaced Create React App with the shared Vite/React-plugin build baseline,
  Vitest/jsdom tests, and supported ESLint 10 plugins; updated Docker, API-base
  configuration, CI build coverage, and template initialization together.
- Documented cross-app Vite conventions and the upgrade path for derived apps.

## 2026-10-18

### Fixed

- Upgraded Material UI and icons together, migrated removed layout system props
  to `sx`, and exercised real menu context, keyboard focus, dismissal, and logout.
- Aligned React and React DOM on the 19.3 release line to prevent mismatched
  runtime versions during frontend tests and rendering.
- Aligned the security-alert workflow test with the reviewed GitHub App token
  action v3.3.0 pin so intentional dependency updates pass automation checks.

### Changed

- Updated Nora and Marty to v3: one open PR per agent, with repeat runs maintaining the existing PR and integrating current main.

## 2026-10-17
### Removed
- Retire the recurring Jules Kris upstream-curation role, delete its external schedule, and preserve the evidence and remaining findings through explicit tickets.

## 2026-08-22

### Fixed

- Kept the CRA/Jest frontend test environment compatible with React Router 7's
  `react-router/dom` export and text encoder requirements.
- Removed the invalid root-level Docker Dependabot scan and documented that
  Docker dependency checks run from the backend and frontend directories.
- Made security-alert Project v2 reconciliation tolerate eventual consistency
  after GitHub reports that an issue already exists on the project board.

## 2026-08-14

### Fixed

- Prevented RoboCop from treating neutral CodeQL summaries for intentionally
  path-scoped language omissions as security coverage gaps when the authoritative
  scope and aggregate gates succeed and a default-branch baseline exists.

### Changed

- Added explicit CodeQL scope outputs, default-branch baseline interpretation,
  regression coverage, and a documented adoption path for repositories created
  from older FullStackTemplate revisions.

## 2026-08-12

### Added

- Added primary-source web search and bounded tracked-repository usage evidence
  to Obi-Wan's Dependabot semver-major reviews.

### Fixed

- Preserved every normalized major-upgrade field when publishing GitHub reviews
  so upstream rationale and repository exposure are no longer dropped.

### Changed

- Reframed Obi-Wan's major-upgrade brief around why the update appeared, why
  upstream required a major version, exact repository exposure, material
  benefits, sources, and a concrete recommendation while retaining his calm
  mentor voice.
- Condensed the major-upgrade brief to five items: dependency, why the upgrade
  matters, repository impact, recommendation, and sources.

## 2026-08-02

### Fixed

- Made Dependabot semver-major upgrade briefs collect the first release in the
  new major line and fail visibly when Obi-Wan omits the upstream change,
  repository impact, or recommendation required for an actionable review.

## 2026-07-27

### Added

- Added an advisory Obi-Wan major-upgrade brief for Dependabot semver-major
  updates, including external GitHub Release notes where available and
  concisely reporting upstream changes, repository impact, and a
  recommendation without adding a merge gate.
- Added required Dependabot-secret setup for the three AI reviewers so trusted
  dependency pull requests run the same reviewer gates as other repository PRs.
- Added a Notoli-derived GitHub repository setup guide covering merge methods,
  auto-merge, Actions permissions, fork approvals, security controls, alert
  labels, the `SECURITY_ALERTS_TOKEN` secret, and the complete main ruleset.
- Added and documented a Notoli-derived main-branch ruleset that requires
  pull requests, resolved review threads, and the independent CI/security
  check set while blocking force pushes and deletion.
- Added a Docker hot-reload development Compose workflow with React and Django
  source mounts.
- Bound development Docker ports to localhost and made documented `.env` and
  port overrides authoritative.

### Fixed

- Made the upstream major-upgrade collector executable under mocked registry
  and GitHub-release responses, including npm's string and object repository
  metadata forms and degraded lookup paths.
- Emitted a stable top-level `Auto Merge` check on every pull request so the
  required ruleset context no longer mismatches the nested Dependabot
  auto-merge workflow check.
- Removed the stale standalone `CodeQL` required-check context that blocked
  scope-empty pull requests while retaining the real CodeQL scope and analyzer
  checks.

### Changed

- Restored the three AI reviewer child checks and `Auto Merge` as required
  main-branch gates, matching Notoli's review policy while retaining the
  template's compatible CodeQL check set.
- Matched FullStackTemplate's live repository settings to Notoli while keeping
  a read-only default Actions permission, disabling default pull-request
  approvals by Actions, and omitting the standalone `CodeQL` context that the
  scope-aware template workflow does not emit for scope-empty pull requests.
- Added explicit least-privilege guidance for workflow permissions and documented
  the intentional ruleset difference from Notoli.
- Added `Tests / Automation Tests (Node)` to the required main-branch checks in
  FullStackTemplate and Notoli.
- Restored Notoli's yellow-and-gray theme across authentication, the
  application header, navigation drawer, profile and notification surfaces,
  and the protected placeholder page.
- Removed the persistent translucent selection overlay from the drawer's Home
  item.

### Removed

- Removed the shared multi-application local-ingress scripts and configuration;
  FullStackTemplate now uses its own application proxy like Notoli.

## 2026-07-26

### Added

- Added a shared local TLS ingress that routes Notoli, MacroMapper, and
  FullStackTemplate by `.localhost` hostname while one container owns ports
  80 and 443.
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

- Prevented port-free `fullstacktemplate.localhost` authentication requests
  from falling through to Notoli's backend when all three local applications
  are running.
- Made workspace, collection, and item creator metadata immutable so API
  clients cannot reassign `created_by` or grant access outside the workspace
  collaboration boundary.
- Preserved Dependabot source URLs through alert compaction and added regression
  coverage for generated security-issue links.
- Prevented Dependabot automation from merging pull requests while GitHub
  reports an unstable merge state.
- Pinned third-party and credential-handling GitHub Actions to immutable commit
  SHAs.
- Required each AI reviewer's GitHub App to explain an oversized diff under its
  own identity before failing the check without publishing a verdict.
- Corrected the GitHub Project initializer to copy and verify Notoli's exact
  custom fields, option sets, views, filters, grouping, sorting, and supported
  workflows instead of creating an approximate Project manually.
- Fixed the npm malware gate so an initial frontend lockfile can be reviewed when the base branch has no lockfile.
- Fixed dependency-review reporting for large initial lockfiles by keeping detailed package JSON in the check logs and annotations.
- Removed the Dependabot-only auto-merge job from required status checks so normal pull requests are not blocked by its intentional skip.
- Replaced the inherited Create React App toolchain that introduced high and critical transitive dependency vulnerabilities.

### Changed

- Reduced the authenticated frontend to a reusable header, navigation drawer,
  notifications, profile/logout controls, and one placeholder Material UI
  Paper.
- Replaced Vite, Vitest, and Biome with Notoli's Create React App,
  react-scripts, Jest, ESLint, and Prettier conventions.
- Decoupled persisted notifications from the removed sample domain while
  preserving recipient-scoped read and clear APIs.
- Standardized all three AI reviewers on one shared 512 KiB Git diff budget and
  bounded each review's output-token reservation.
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

### Removed

- Removed the Workspace, Collection, and Item backend, starter data, sharing,
  ordering, mobile gestures, component showcase, and related frontend routes,
  services, documentation, and tests.
