# Changelog

All notable changes to this project are documented in this file.

## 2026-11-24

### Added

- Run the shared Gitleaks secret scan on pull requests and pass its result to RoboCop.

### Fixed

- Install the hash-pinned uv wheel directly so Python checks can start on hosted Linux runners.
- Supply the legacy malware scanner’s pinned semver dependency when a PR targets a base that predates the scanner migration.
- Require the current auto-merge run's pending Dependabot Policy check before enabling native auto-merge.

### Changed

- Organize GitHub automation tests by implementation name and check that each top-level suite has a matching source.
- Allow Dependabot to accept a skipped file-specific check when the changed-file list is empty.
- Use the automation manifest for the CI Node version. A frontend-only manifest edit selects the frontend checks independently of automation tests.
- Standardize GitHub automation programs and tests on JavaScript and move saved test data to `.github/fixtures/`. Use verb-first action and script names with matching entry files and dedicated tests.
- Group GitHub automation by how it runs. Standalone programs live in `.github/scripts/` alongside workflows, reusable actions and tests. Pull-request CI checks the layout.
- Simplify lint, test and security gates, consolidate CodeQL pin validation, and use Dependency Review’s native diagnostics.
- Check changed public npm and PyPI lockfile versions against GitHub and OpenSSF malware advisories before merging.
- Require explicit workflow-level permissions, compare proposed write grants with the exact base commit, and verify them again using reviewed default-branch code.
- Raise existing security groups to at least P1 for unknown source severity.
- Run full CodeQL scans and Dependabot alert tracking daily at midnight Pacific. Track CodeQL alerts after the scheduled scan succeeds.
- Run CodeQL for scoped pull requests, daily full scans, and manual requests, and skip duplicate scans after merges to main.
- Include Dependabot findings of every severity in grouped Project issues. Critical findings raise priority to P0 and high findings to at least P1.
- Limit reviewer lockfile exclusions to the regular frontend npm lockfile, align CodeQL evidence and narrow CI permissions.
- Align test-gate paths, frontend build sequencing, backend test profiles, and automation checks across the app repositories.
- Rename the hot-swap Dockerfiles and their matching ignore files to mirror compose.hotswap.yml.

## 2026-11-23

### Fixed

- Label the OAuth client ID correctly on the Connected Apps consent and approval screens.
- Ignore late authentication responses after leaving the form or changing sessions.
- Reject unreviewed gateway network attachments during app release preflight while allowing approved companion routes to be absent; retain app-specific network and trusted-peer checks.
- Explain why failure-reporting stream errors preserve the original release outcome.

### Changed

- Cancel older CI runs when a new run starts for the same pull request.
- Install the pinned Actionlint release directly in the CI workflow.
- Inline CI validation and reporting in the workflows that use them.
- Remove the automated production promotion comment workflows.
- Remove the generated CI workflow inventory and its architecture drift check.
- Review GitHub Actions write permissions in workflow PRs and remove the separate approval file.
- Give each of the four authentication forms an accessible name.

## 2026-11-22

### Changed

- Select the verified saved app controller and policy automatically for rollback; preserve their original readiness through recovery and later deployments while retaining explicit database choices and deployment locks.
- Limit production preflight policy to this app's route networks and exact trusted peers; Infrastructure retains full-host topology checks.
- Add readable production release and recovery progress, failing-step context, command exit codes and private-record pointers from the shared engine; preserve transaction order and private subprocess output.
- Put routine production release and recovery steps first in the existing guide; retain detailed setup, migration history, commands, section links and operational prerequisites in the same README.
- Rename local deployment files to `compose.yml`, `compose.hotswap.yml`, `.env.example` and `nginx.conf`; update setup, validation and test references while preserving configuration and runtime behavior.
- Align local Compose descriptions, readable startup-command formatting and environment-example sections across applications; preserve app-specific identities, isolated subnets and MacroMapper AI settings.

### Removed

- Stop recopying retired root-level Compose, proxy, script and environment files into new recovery sets; retain effective runtime, matched previous releases and SQLite recovery data.
- Remove the incoming port-policy fallback for recovered releases without a saved policy; require their checksummed accepted policy instead.
- Remove retired Resend backend-name conversion from Django settings and the shared bundle builder; new production bundles require an explicit maintained Anymail or SMTP backend.
- Remove the unused deployment root hint, repeated frontend build-argument selector and completed parity-checker cleanup migration.
- Remove repeated frontend proxy headers and combine matching backend routes while retaining redirects, query strings and existing API timeouts.

## 2026-11-16

### Fixed

- Guard standalone HTTPS routing for Django admin and DRF static assets so they continue to reach the backend instead of the frontend fallback.
- Keep the production release guide's source pin and canonical links aligned with app configuration, and reject documentation drift during repository validation.
- Remove the retired consumer parity checker only after successful shared-source synchronization; preserve it on failed validation and reject unsafe cleanup paths before writes.
- Clarify missing-only SQLite initialization and file checks before either local Compose profile starts, preserving existing databases.

### Changed

- Align production Compose layout and operational comments across applications while preserving existing service, network and port behavior.
- Align production app-policy JSON ordering and formatting while preserving all configuration values.
- Align production release guides across applications with consistent configuration, authorization, recovery, MCP, maintenance and verification guidance while preserving app-specific policy and onboarding safeguards.
- Align MCP enablement with the shared environment switch, preserve exact ASGI proxy trust while disabled, and retain explicit application enablement policies.
- Align local deployment profiles across applications: loopback-only ports, private backend networks, exact proxy trust, Uvicorn/Vite reload, matching MCP/browser origins and streaming routes, safe forwarded headers, cache controls and local setup instructions.
- Fold shared release verification and synchronization into the existing bundle builder; keep CI/deployment parity gates and store the immutable Infrastructure source pin in the existing app configuration.

### Removed

- Remove obsolete `DJANGO_FORCE_SCRIPT_NAME` support and its example/release-policy fields; retain unprefixed application and static URLs.
- Remove the standalone release parity checker and per-application shared-source JSON file while retaining their automated checks.
- Remove the optional local certificate PowerShell helper and document direct certificate generation for standalone local HTTPS.

## 2026-11-15

### Fixed

- Reject malformed notification display, identity, read-state and navigation fields before publishing list or mark-read results; preserve usable header controls, cached rows and retries.
- Discard JWT refresh results after logout or a new login, align post-refresh session expiry, and preserve pending connection navigation.
- Validate notification lists before rendering and retain usable error and retry controls.
- Return a newly signed action ticket after approval so the existing Cancel control works immediately without reloading; preserve the original action expiry and reject stale tickets.
- Verify the backend production/development uv bootstrap against reviewed binary wheel hashes for every platform in the pinned Python base; reject altered artifacts and source distributions across all three applications.
- Verify the CI uv bootstrap against a reviewed wheel SHA-256 before installation across all four repositories; reject unsupported runner targets and source distributions.
- Standardize sanitized MCP reconnect challenges and distinguish expired connections from missing scopes; synchronize framework runtime and regression coverage across applications.
- Align authentication request validation, duplicate-registration handling and exact password preservation across applications; reject malformed reset credentials with HTTP 400 and roll back failed signup onboarding.
- Require a nonblank production signing key consistently.

### Changed

- Centralize reactive frontend session ownership and notification lifecycle handling, isolate account changes and stale async results, and lazy-load route pages with usable loading and reload recovery across the shared application family.
- Centralize the existing dark/yellow palette and shared Material UI appearance in `frontend/src/theme.js`; preserve document typography, page sizing and specialized component layouts.
- Add direct authentication-shell regressions for accessible page headings and keyboard form submission.
- Pair frontend tests with the owning source basename and extension, consolidate behavior and integration cases without losing coverage, and align applicable shared regression checks.
- Use semantic authentication and Connected Apps links, align common frontend dependency ranges, and standardize Vite environment, router base and build-output configuration.
- Add optional JWT-only signed-preview action approval to the canonical MCP framework and existing Connections screen, with framing protection; the handler remains unconfigured here and domain behavior is unchanged.
- Clarify and regression-test MCP token scope resolution: omitted or blank scope continues to require the application's baseline scope, with identical framework coverage across applications.
- Raise the complete source-diff limit for all three AI reviewers to 2 MB (2,000,000 bytes) across all four repositories; preserve fail-closed incomplete reviews and all other context, token and model settings.
- Organize backend tests into owning `tests/` packages for authentication, notifications, production/email configuration and the canonical MCP framework, with descriptive behavior names, fixture-only helpers and preserved discovery/coverage.
- Use Django OAuth Toolkit's built-in MCP client registration, remove custom management commands and document explicit public-client onboarding and validation behavior (#341).

### Removed

- Remove the obsolete static-file storage selector while preserving current storage behavior.

## 2026-11-14

### Fixed

- Pin the production frontend builder to the existing multi-platform Node 26 digest used by frontend development.
- Reject unsafe paths, symlinks and duplicate members in exported ChatGPT ZIPs, bound archive expansion, and cover hostile exports with offline regressions.

### Changed

- Standardize README heading emojis, sentence case, reference labels and Markdown spacing while preserving substantive content, code examples and existing anchors.
- Move frontend connection contracts into session guidance and keep related guides as a final navigation section.
- Align frontend npm commands: production builds run strict lint first and `lint:fix` applies available lint fixes.
- Document frontend API configuration through development Compose and production build arguments, and exclude local frontend env files from Docker build contexts.
- Rename shared frontend test support to `src/test-helpers/`, retain application and feature tests beside their implementation, and preserve application-specific helper behavior.
- Consolidate shared frontend test setup, helpers and suites under `src/tests/`, update imports and discovery paths, and retain App, startup and feature tests beside their implementation.
- Replace mocked frontend startup wiring checks with real React entry-point integration coverage for the signed-out login route, isolated state and blocked network access.
- Consolidate global styles in `frontend/src/index.css`, remove the redundant app stylesheet and unused starter selectors, and preserve app-specific themes and accessibility rules.
- Group frontend Dockerfiles and Nginx configuration in `frontend/docker/`; update Compose, build workflows and Docker dependency discovery while retaining the frontend build context.
- Consolidate durable documentation into existing owning READMEs, move the active CI inventory beside workflow guidance, and repair links and architecture regressions.
- Restore consistent changelog titles, chronological dates, ordered categories, and spacing while preserving historical entries.
- Align shared agent instructions across the repository family while preserving application-specific contracts and Infrastructure authorization controls.
- Move active CI helpers into `.github/tools/`, browser helpers beside `frontend/e2e/` journeys, and the MCP checker into `backend/`; update callers, path filters, regressions, and owning guides while preserving existing checks and isolation.
- Consolidate MCP framework, tools and ChatGPT guidance into one `apps/mcp/README.md`, preserving permissions, tool catalogs and connection instructions.
- Give FullStackTemplate its own layered-code SVG mark for ChatGPT connector branding.
- Replace the custom Resend backend with pinned django-anymail, retain the existing credential/timeout environment variables, and cover masked reset failures at the maintained provider boundary (#340).
- Move provider email delivery into `apps/email/`; keep password-reset behavior and privacy tests with authentication and preserve existing provider semantics (#339).
- Consolidate MCP under `apps/mcp/`: canonical `framework/`, app-owned `tools/`, and `chatgpt/` packaging share one application namespace while preserving separate SDK imports and Django labels (#339).
- Group backend application modules under `apps/`, rename Django configuration to `config/` and the shared MCP package to `apps/mcp/framework/`, preserving database app labels and existing migrations (#339).
- Keep Dockerfile-specific production/development ignore files beside backend and frontend Dockerfiles; use the Python constraint in pyproject.toml without a separate version file.
- Replace Conda and environment exports with locked uv projects across local setup, CI and Docker; preserve Python 3.12 and existing server profiles (#338).
- Remove the standalone MCP parity checker and server launcher; retain MCP tests/manifests/pins and select the production server directly in Docker.
- Group backend Dockerfiles in `backend/docker/`; update Compose, build workflows and Docker dependency discovery while retaining the backend build context (FullStackTemplate #337).

### Removed

- Remove the unused shared AI-review publisher error binding and synchronize the release builder without its unused origin constant to Infrastructure source `15b9bdfaf7530de4979dce0ee3cef6baffa814ac`.
- Remove the unconsumed frontend environment sample, obsolete React Router future flags, ignored legacy Django static-storage setting, unused code-font rule, redundant test encoding polyfills, and unused auth-helper export; retain their active configuration and behavior.
- Remove the unused primary-color CSS token and its declaration-only assertion; retain all rendered theme colors.
- Remove the frontend env example; retain `deploy/backend.env` for backend configuration.
- Remove centralized frontend lint-configuration and theme-source suites; preserve shared support and all colocated application, component and service tests.
- Remove the unused shared deferred-promise and loading-wait test helpers.
- Remove the custom frontend development entrypoint and automatic dependency reinstall; start Vite directly and install changed dependencies manually in the development container.
- Remove frontend end-to-end suites, Playwright configuration and dependencies, browser-test helpers and CI jobs; retain component, backend, action-local and shared release checks.
- Remove the root `scripts/` folder, template initializer and GitHub Project helper; use manual application and Project setup.
- Remove duplicate documentation indexes, redirects, stale narratives and historical receipts after preserving useful contracts.
- Remove the root `tests/` directory and its CI invocations; retain backend, frontend/browser, action-local, and shared release suites.
- Remove unused MCP framework source-pin and hash-manifest metadata; retain coordinated source review and runtime tests.
- Remove the local ChatGPT package/listing builders and their test modules; retain source manifests/artwork and ordinary/MCP runtime checks.

## 2026-11-13

### Changed

- Standardize root ignore rules across the repository family for local environments, builds, caches, test reports, databases, and certificates; keep configuration examples and dependency lockfiles visible.
- Standardize GitHub documentation across the four repositories: setup in `.github/README.md`, workflow behavior in `.github/workflows/README.md`, and shared reviewer/action contracts in `.github/actions/README.md`.
- Consolidate current backend, frontend, and style guidance into the existing folder READMEs; remove separate reference/style files and historical duplication.
- Standardize ChatGPT package metadata, artwork, offline validation, portable archives, and existing-listing overlays under `backend/app_mcp/chatgpt/` (#324).
- Rename the shared MCP Python package to `app_mcp`, consolidate source pins and hashes beside it, and retain its existing Django app label and OAuth behavior (#324).
- Reorganize the main README as a project introduction with folder guides; consolidate setup, API/workflow references, scripts, tests, and documentation indexes with consistent emoji headings.
- Move shared MCP documentation beside the framework, retain legacy guide links, and make application MCP and plugin guides discoverable from the backend.
- Move the first-pull-request GitHub setup checklist into `.github/` and template initialization instructions into the scripts README.

### Removed

- Delete historical Batch 2/3 parity reports and hash snapshots; remove obsolete links without moving or consolidating documentation.
- Remove obsolete third-party Conda export attribution from the license and environment helper documentation.

## 2026-11-12

### Fixed

- Require secure session and CSRF cookies whenever production mode is active, including when optional MCP is disabled. Add production verification guidance and independent repository acceptance evidence (#299).

## 2026-11-11

### Fixed

- Handle non-JSON Connections API responses with safe HTTP status errors, preserve structured OAuth errors, and reject invalid success payloads without exposing response bodies. Reuse the existing safe parser and cover consent, listing, revocation and session recovery regressions ([shared rollout](https://github.com/VanillaIceCube/FullStackTemplate/issues/311)).
- Regenerate the workflow architecture inventory for the atomic CodeQL v4.39.3 action update and document dependency maintenance parity.
- Keep the shared release action-upgrade fixture independent of the previous pinned action version.

### Changed

- Align transitive Babel 7.29.13 tooling with the validated Notoli patch without adding a direct dependency or changing supported ranges.
- Synchronize Docker login action v4.8.0 from the canonical Infrastructure release source.
- Upgrade the template test environment to jsdom 31; the frontend suite and production build remain compatible.

### Removed

- Remove retired Jules notebooks, persona prompts and active operating instructions after the linked PRs merged and a fresh open-PR inventory passed (#286); preserve general maintenance guidance, historical evidence and independent CI/security/release controls.

## 2026-11-06

### Added

- Managed production-promotion impact summaries from the actual current target comparison, with bounded metadata, owned-comment updates and race/permission coverage.
- Source-linked Mermaid CI/CD architecture and checked per-repository workflow/action inventories, preserving application and gateway trust differences.
- Bounded, attributed human discussion context and conservative App-owned reviewer follow-ups, with adversarial, stale-head, idempotency and permission regressions.
- Safe Responses token/latency evidence, dated partial cost estimates and validated owner configuration/recovery controls; existing Luna model selection is preserved.

### Fixed

- Restore security-alert action loading by resolving repository variables in caller workflows and passing validated explicit composite inputs.
- Cover default, empty, explicit and invalid configuration plus empty/nonempty mocked alert pipelines and all three caller contracts.
- Transactional email failures now expose safe categories/status codes without exception payloads, tracebacks or recipient/token data; reset responses remain generic.
- Resend requests use a finite bounded timeout, with explicit safe fallback and mocked coverage for failure policy and both fail_silently modes.
- Architecture guidance no longer presents completed reviewer credential migration or obsolete test/runtime assumptions as future work.
- Reviewer ownership no longer falls back to persona-name matching; old-head verdicts are rejected and writer runs serialize.

## 2026-11-05

### Added

- Shared isolated authentication browser tests with disposable data and local-only reset mail.
- Repository syntax/Compose validation and mocked request/history/lint attribution coverage.
- Shared development dependency lifecycle regression for fresh, unchanged, changed and failed installs.
- Immutable workflow-policy and bounded changed-version malware regression coverage.
- Evidence-based Python malware scanning decision and shared release upgrade regression.

### Fixed

- Preserve early, failing and late CI diagnostics within bounded reviewer context and failure artifacts.
- Missing or invalid dependency evidence now fails PR malware review visibly.
- Bound malware classification to repository source advisories instead of scanning the global catalogue.
- Recover the exact structured concurrent-close response only after verifying saved lifecycle state and body.
- Recover omitted alert refs deterministically and interrupted Project synchronization without duplicate issues or resetting planning.
- Retry inconsistent exact-head Dependabot check readiness safely and route signed SHA-only Action updates to manual review.

### Changed

- Use bulk form setup for validation/API unit cases while retaining typed happy paths and assertions.
- Pin development Node/Miniforge multi-platform image digests and refresh frontend dependencies only when manifests change.
- Explicit scanner/path-filter grants support read-only repository defaults; unused orchestration issue writes removed.
- Adopt the reviewed Infrastructure release template/test contract with readable Action versions.

## 2026-11-03

### Fixed

- Collect usage evidence for every Dependabot dependency and use each major update's own versions and ecosystem for upstream release evidence.
- Preserve independent AI review findings during duplicate suppression and require valid HTTP(S) sources in major-upgrade briefs.
- Validate each deployment against its accepted frontend port policy and block unexpected candidate port bindings before release acceptance.
- Exclude credential-bearing URLs from published major-upgrade briefs.

## 2026-11-02

### Fixed

- Hold native Dependabot auto-merge behind a required policy result for each head; validate signed single-commit group metadata, paginate all open dependency alerts and support configured reviewer bot identities.
- Enforce atomic immutable CodeQL revisions with negative regression tests and guard Dependabot auto-merge with current-head approvals, live required checks, trusted default-branch execution and idempotent native activation (#240).
- Resolve the transitive minimatch advisory with a scoped modern-version override and regenerated frontend lockfile; document parent API compatibility and removal checks ([FullStackTemplate #267](https://github.com/VanillaIceCube/FullStackTemplate/issues/267)).
- Pin CodeQL init/analyze to the same immutable v4.39.1 revision as all three downstream repositories.

### Changed

- Group all CodeQL action entry points in coordinated Dependabot version and security updates while preserving existing schedules and review gates ([FullStackTemplate #271](https://github.com/VanillaIceCube/FullStackTemplate/issues/271)).

## 2026-10-30

### Changed

- Synchronize canonical release-contract regressions for app-owned MacroMapper MCP, preserving this application’s existing runtime, framework and OAuth policy.
- Use GPT-6 Luna for all OpenAI PR reviewers and security-alert grouping while preserving existing review gates, isolated credentials and token budgets.
- Document main-first release lineage across the four repositories, prompt
  reconciliation of exceptional deployment fixes, and intentional release holds.
  Treat the template's absent production branch as not applicable to deployment.

### Removed

- Withdraw the separate MCP issuer extension and restore the canonical app-owned
  OAuth framework pin. Each app manages MCP and authorization behind shared nginx;
  the optional template scaffold and ordinary app login remain unchanged.

## 2026-10-29

### Added

- Allow an application-owned MCP verifier to select a separate authorization
  issuer without changing resource identity or transport Host/Origin trust.

### Fixed

- Adopt the same reviewed Infrastructure release fixture pin `ee9c0d40421a8b3f4886340b188a21e86c6429cf` across all consumers, including exact app-mode topology and metadata content-type checks.
- Synchronize the shared release fixtures for required backend settings and
  reviewed MCP gateway/readiness profiles from Infrastructure PR #77.

## 2026-10-28

### Fixed

- Record the previously undocumented Resend fix from [PR #122](https://github.com/VanillaIceCube/FullStackTemplate/pull/122): catch HTTP errors with decoded API response bodies and map reply-to, HTML-only and multipart plain-text/HTML messages correctly (merged 2026-09-19).
- Preserve custom request headers through token-refresh retries, attach session tokens when omitted, and trim or remove stale profile values.
- Enforce registration password validators against the prospective user, preserve reset-password whitespace, normalize login email, and reject malformed reset user IDs.
- Disable authentication controls while submitting and display nested or field-level API validation errors.
- Add notification load retries and keep item/bulk actions disabled through response parsing, with inline action errors and guarded navigation.
- Execute recipient-scoped bulk notification mutations inside database transactions.

## 2026-10-20

### Added

- Add a read-only reviewer-gate audit and matching Notoli regressions for exact check names, trusted human/Dependabot eligibility, missing/skipped/cancelled results and verdict recovery.
- Add the reusable, hash-pinned MCP/OAuth framework and isolated consent, token lifecycle and transport tests.

### Fixed

- Fail closed on incomplete dependency reviews and retain sanitized structured evidence with a bounded RoboCop report.
- Preserve alert history and Project metadata before auto-close; verify concurrent closure without suppressing unrelated API errors and use the current Work type field.
- Fail each AI reviewer job after publishing a native `REQUEST_CHANGES`, including unchanged/repeated verdicts, while preserving successful approval/comment reviews and all existing failure gates.
- Reject missing or invalid verdict events as unavailable instead of passing a fallback comment.

### Changed

- Provide opt-in ASGI startup and optional consent/Connected Apps pages; retain ordinary REST/Gunicorn behavior with MCP disabled by default.

## 2026-10-19

### Changed

- Separate Obi-Wan, Lint Eastwood, and RoboCop OpenAI secrets, including RoboCop alert aggregation; pass only each reviewer's own credentials, stage `OPENAI_REVIEWERS_PROJECT_ID` independently, and document the deferred per-repository key migration.

## 2026-10-18

### Added

- Added pinned Infrastructure release tools, parity checks, app-only policy,
  private immutable bundles, recovery tests, and explicit onboarding guidance.
- Verify generated apps preserve canonical shared-source metadata and hashes.

### Fixed

- Preserve complete production hosts and theme-test renames when retained
  initializer checks run after application branding; apply replacements once.
- Keep generated frontend npm lockfile payloads out of AI source prompts while
  disclosing exclusions and preserving independent dependency/security gates,
  source byte limits, inline line numbers, and visible incomplete-review failures.
- Upgraded Material UI and icons together, migrated removed layout system props
  to `sx`, and exercised real menu context, keyboard focus, dismissal, and logout.
- Aligned React and React DOM on the 19.3 release line to prevent mismatched
  runtime versions during frontend tests and rendering.
- Aligned the security-alert workflow test with the reviewed GitHub App token
  action v3.3.0 pin so intentional dependency updates pass automation checks.

### Changed

- Separated local HTTPS/proxy fixtures from production ownership and stopped
  trusting forwarded Host in favor of the gateway's canonical Host.
- Replaced Create React App with the shared Vite/React-plugin build baseline,
  Vitest/jsdom tests, and supported ESLint 10 plugins; updated Docker, API-base
  configuration, CI build coverage, and template initialization together.
- Documented cross-app Vite conventions and the upgrade path for derived apps.
- Updated Nora and Marty to v3: one open PR per agent, with repeat runs maintaining the existing PR and integrating current main.

### Removed

- Removed production certificate uploads, shared-proxy lifecycle, mutable-image
  activation, and host-wide Docker pruning from the template deploy workflow.

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
