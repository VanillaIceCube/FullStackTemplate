# AGENTS.md

Shared MCP changes follow [docs/MCP-FRAMEWORK.md](docs/MCP-FRAMEWORK.md).
Each application owns its MCP endpoint, OAuth provider and permissions behind
the shared nginx gateway. Synchronize canonical framework hashes/pins; do not
introduce a shared authorization service or cross-application account mapping.
FullStackTemplate uses manual setup steps; do not assume Django or Node dependencies are installed.

When setup, routing, environment variables, deployment, or CI/CD changes, update the relevant documentation:

- Root overview: `README.md`
- Backend/authentication: `backend/README.md`
- Frontend/routing: `frontend/README.md`
- Deployment: `deploy/README.md`
- GitHub automation: `.github/README-WORKFLOWS.md`
- User-visible or operational changes: `CHANGELOG.md`

## Changelog format
Add a dated section at the top of `CHANGELOG.md` and use only the non-empty headings below, in this order:

1. `### Added`
2. `### Fixed`
3. `### Changed`
4. `### Removed`

## Local development
Backend:

```powershell
python -m pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py runserver 8000
```

Frontend:

```powershell
Set-Location frontend
npm ci
npm start
```

Optional backend variables:

- `DJANGO_SECRET_KEY` (a local-only development default is provided)
- `DJANGO_DEBUG` (local default: `1`)
- `DJANGO_SQLITE_PATH` (default: `backend/db.sqlite3`)
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `DJANGO_CSRF_TRUSTED_ORIGINS`
- `DJANGO_FORCE_SCRIPT_NAME` (leave blank for subdomain-root routing)
- `DJANGO_FRONTEND_BASE_URL` (default: `http://localhost:3000`)
- `DJANGO_EMAIL_BACKEND`
- `DJANGO_EMAIL_HOST`
- `DJANGO_EMAIL_PORT`
- `DJANGO_EMAIL_USE_TLS`
- `DJANGO_EMAIL_HOST_USER`
- `DJANGO_EMAIL_HOST_KEY`
- `DJANGO_EMAIL_TIMEOUT`
- `DJANGO_DEFAULT_FROM_EMAIL`

Optional frontend variable:

- `VITE_API_BASE_URL` (development default: `http://localhost:8000`; leave blank in same-origin production)

## Checks
Run checks in proportion to the change:

```powershell
python backend/manage.py test
ruff check backend
ruff format backend --check
Set-Location frontend
npm test
npm run lint:strict
npm run format:check
npm run build
```

## Production

Follow [main-first releases](docs/SHARED-ROLLOUT-POLICY.md#main-first-releases):
review and merge ordinary changes into `main` before promoting an exact reviewed
source tree to `env-prod`. Return explicitly authorized deployment experiments
to `main` promptly through review. Preserve history and intentional release holds;
do not deploy unready features or create an absent production branch for parity.

Production is designed for `https://app.example.com` behind Cloudflare and an origin Nginx proxy.

- Frontend: `/`
- Authentication: `/auth/`
- Django admin: `/admin/`
- Notification and future application APIs: `/api/`
- GitHub deployment branch: `env-prod`
- GHCR images: `fullstacktemplate-backend` and `fullstacktemplate-frontend`
- Suggested deployment path: `/opt/apps/fullstacktemplate`

Review Infrastructure gateway/vhosts, app release policy, Cloudflare settings,
and allowlist/base-URL variables whenever domains or routes change. The local
proxy/Compose files are not production release inputs.

## GitHub automation

Main requires `AI Code Review / Obi-Wan Code-nobi code review`, `AI Build Sheriff Review / Lint Eastwood build sheriff review`, and `AI Security Review / RoboCop security review`. The shared publisher must fail after publishing any `REQUEST_CHANGES`, including unchanged verdicts; valid `APPROVE`/`COMMENT` pass and unavailable/invalid output fails. Preserve all existing required checks, same-repository human/Dependabot eligibility and fork credential isolation. Run both publisher test files and Actionlint when changing this contract; use the read-only `verify-gates.js` audit for actual successful reviewer results. See `.github/README-WORKFLOWS.md`.
The copied Notoli automation includes lint, tests, CodeQL, dependency review, npm malware review, Dependabot auto-merge, AI PR reviewers, deployment, and scheduled security-alert aggregation.

Secret-dependent workflows must fail visibly when their credentials are unavailable. Keep GitHub App permissions and the credential separation described in `.github/README-WORKFLOWS.md`.

Frontend tooling uses Vite 8, Vitest 5/jsdom, and ESLint 10 flat configuration.
Build output is `frontend/dist/`. Keep Docker, CI, `VITE_API_BASE_URL`, and
template-initializer coverage aligned; see `docs/FRONTEND-ALIGNMENT.md`.

Production release ownership follows `deploy/production/README.md`. Common
release code/tests/checker/workflow are pinned to Infrastructure in
`deploy/shared-source.json`; update the shared source and synchronize consumers,
never edit only a vendored copy. Keep new-app onboarding/capacity and live
activation separate from source review. Initializer changes must preserve
canonical shared-source metadata and hash-verified files.

## Jules recurring agents

Nora and Marty use the [v3 operating rules](.jules/README.md): at most one open
PR per agent per repository. Repeat runs maintain the existing PR, integrate
current main, and verify its latest head instead of opening another PR.

## 🔑 OpenAI reviewer isolation

Use `OBI_WAN_OPENAI_API_KEY`, `LINT_EASTWOOD_OPENAI_API_KEY`, and
`ROBOCOP_OPENAI_API_KEY` for their respective reviewers; RoboCop also owns
all security-alert model calls. `OPENAI_REVIEWERS_PROJECT_ID` identifies this repository's
reviewer project. Keep credentials separate across repositories and application
environments, preserve visible missing-key failures, and follow the deferred
cutover steps in `.github/README-WORKFLOWS.md`.


## 🔌 Shared MCP framework

MCP framework changes follow [docs/MCP-FRAMEWORK.md](docs/MCP-FRAMEWORK.md). FullStackTemplate owns the canonical Python package; keep all consumer hashes/pins aligned. MacroMapper stays disabled without business tools. Preserve Notoli credentials, scopes, tool permissions and exact proxy trust.

## Shared application ownership and downstream rollout

For any reusable framework, GitHub automation, test or security change, follow [docs/SHARED-ROLLOUT-POLICY.md](docs/SHARED-ROLLOUT-POLICY.md): one FullStackTemplate canonical issue must track applicability, implementation and verification in MacroMapper, Notoli and Infrastructure. The parent is not done when only the template merges. Infrastructure remains the source owner for the shared gateway/release engine and host operations; application domain work stays in each app. Preserve live PRs, production controls, issue history and non-triggering labels during consolidation.

## 🤖 Reviewer model policy

Use `gpt-6-luna` for OpenAI code, build and security reviewers and security-alert grouping. Preserve each reviewer’s existing key/project isolation, budgets and blocking gates. Application AI model selection remains app-owned.
