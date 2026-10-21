# FullStackTemplate GitHub automation
FullStackTemplate carries forward the proven CI/CD and security automation from
Notoli and MacroMapper, adapted to the template's repository, images, and
generic GitHub Project.

## Repository settings baseline
The live FullStackTemplate repository uses the Notoli baseline with intentional
least-privilege differences: auto-merge is enabled; merge commits, squash
merges, and rebases are allowed; Actions allow all actions with a read-only
default workflow permission; and GitHub Actions cannot create or approve pull
requests by default. Fork pull requests require approval from first-time
contributors. Workflows request write permissions explicitly when required.

Code security uses the repository's enabled Dependabot alerts/security updates,
secret scanning, and push protection controls. CodeQL default setup remains
unconfigured because the pinned CodeQL workflows in this repository provide the
scanner. The `dependencies`, `codeql`, `vulnerability`, `malware`, and `codex`
labels are used by the alert and operational automation. New repositories must
recreate these settings, labels, and the `SECURITY_ALERTS_TOKEN` secret; see
[`docs/GITHUB_SETUP.md`](../docs/GITHUB_SETUP.md).

## Pull-request CI
`.github/workflows/ci-orchestrator.yml` coordinates:

- Frontend Prettier and ESLint checks
- Backend Ruff checks and formatting
- React/Jest tests
- Django tests
- Node tests for repository automation
- CodeQL for Python, JavaScript/TypeScript, and GitHub Actions
- GitHub dependency review at high/critical severity, with detailed findings retained in the check logs and annotations
- npm malware advisory review for changed lockfile packages, including initial lockfile additions against an empty dependency baseline and batched `package@version` advisory queries
- AI code, build, and security reviews for trusted same-repository pull requests
- Dependabot auto-merge after all independent gates pass

For a Dependabot semver-major update, Obi-Wan also publishes a structured
**Major upgrade brief**. It uses Dependabot's exact package/version metadata,
the target release and first release of the new major line retrieved from
GitHub Releases where available, package-registry metadata for npm and PyPI
packages to locate those release notes, the supplied Dependabot pull-request
description, primary-source web search, the repository diff, and a bounded
exact-match search of tracked repository text with lockfiles excluded. Web
search is enabled only for semver-major code reviews. The brief must explain
the dependency, a cohesive upstream story covering why the update appeared,
why it required a major release, and what the repository gains, followed by a
repository-impact paragraph, a recommendation, and primary sources.
Incomplete briefs fail visibly instead of being published. The verdict and
recommendation retain Obi-Wan's calm mentor character without weakening the
technical explanation.
The brief is advisory: it does not add a required status check or replace the
existing lint, test, CodeQL, vulnerability, malware, or reviewer gates.

Path detection prevents unrelated application suites from running. A detector failure is treated as a CI failure instead of silently skipping checks.

RoboCop consumes the CodeQL scope detector's explicit language outputs and
normalizes them against successful analyzer checks and CodeQL analyses on the
default branch. A neutral GitHub summary saying that a default-branch language
configuration was omitted from a pull-request analysis is informational when
that language was intentionally out of scope and its default-branch baseline
exists. It does not block RoboCop approval when the scope and aggregate CodeQL
gates succeeded. Scope-detection failures, aggregate failures, required
analyzer failures, baseline-query failures, and genuinely absent baselines
remain visible evidence gaps.

Repositories generated before this policy was added must adopt the
`.github/actions/collect-codeql-evidence` action and the corresponding changes
to `gate-codeql.yml`, `ci-orchestrator.yml`, `review-security.yml`, and
`gate-test.yml`. Newly generated repositories inherit the policy from the
template automatically.

## AI review apps
Three GitHub Apps provide separate review identities:

- Obi-Wan Code-nobi: code review
- Lint Eastwood: build review and lint auto-fix commits
- RoboCop: security review and security-alert issue management

Required repository variables:

- `OPENAI_REVIEWERS_PROJECT_ID`
- `OBI_WAN_CODE_NOBI_APP_ID`
- `LINT_EASTWOOD_APP_ID`
- `ROBOCOP_APP_ID`

Required repository secrets:

- `OBI_WAN_OPENAI_API_KEY`, `LINT_EASTWOOD_OPENAI_API_KEY`, and `ROBOCOP_OPENAI_API_KEY`
- `OBI_WAN_CODE_NOBI_PRIVATE_KEY`
- `LINT_EASTWOOD_PRIVATE_KEY`
- `ROBOCOP_PRIVATE_KEY`

Install the Apps on the generated repository with the permissions in
[`docs/GITHUB_SETUP.md`](../docs/GITHUB_SETUP.md). Store the same six review
secrets in both the Actions and Dependabot secret stores. Dependabot workflows
receive only Dependabot secrets, so this duplication lets their pull requests
run the required reviewers. Fork pull requests never receive either store's
secrets and cannot satisfy the required reviewer child checks.

## Security-alert aggregation
The daily/manual `alert-codeql.yml`, `alert-vulnerability.yml`, and `alert-malware.yml` workflows group open alerts into managed FullStackTemplate issues and synchronize them with the FullStackTemplate Project.

Additional configuration:

- Repository variable `SECURITY_ALERTS_PROJECT_ID` set to the generated
  Project v2 node ID
- Repository secret `SECURITY_ALERTS_TOKEN` with personal Project v2 access
- RoboCop installed with `Issues: write`, `Code scanning alerts: read`, and `Dependabot alerts: read`

RoboCop's short-lived App token reads alerts and performs issue mutations. `SECURITY_ALERTS_TOKEN` is used only for personal Project v2 reads/writes. The action intentionally rejects missing or reused credentials.

The Project must contain:

- `Status`: `Backlog`, `Ready`, `In Progress`, `In Review`, `Done`
- `Domain`: including `CI/CD`
- `Type`: including `Security`
- `Priority`: `P0` through `P3`
- `Size`: `XS` through `XL`
- Numeric `Estimate`
- `Start date` and `End date`

`scripts/create-github-project.ps1` copies Notoli's Project structure, links it
to the target repository, verifies its fields, views, and supported workflows,
and sets `SECURITY_ALERTS_PROJECT_ID`. GitHub excludes the repository-scoped
`Auto-add to project` workflow from Project copies, so configure it for the
target repository in the GitHub UI as described in
[`docs/GITHUB_SETUP.md`](../docs/GITHUB_SETUP.md).

## Deployment
`.github/workflows/ci-deploy.yml` runs on `env-prod` pushes or manually. It:

1. Builds and pushes `fullstacktemplate-backend` and `fullstacktemplate-frontend` to GHCR.
2. Uploads Docker Compose, Nginx, and optional Cloudflare origin certificates.
3. Connects over SSH, writes the backend environment, recreates the stack, and runs Django migrations.

Repository variables:

- `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, optional `DEPLOY_PORT`
- `DJANGO_DEBUG`, `DJANGO_SQLITE_PATH`
- `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS`, `DJANGO_CSRF_TRUSTED_ORIGINS`
- optional `DJANGO_FORCE_SCRIPT_NAME`
- `DJANGO_FRONTEND_BASE_URL`, `DJANGO_EMAIL_BACKEND`, `DJANGO_EMAIL_TIMEOUT`, `DJANGO_DEFAULT_FROM_EMAIL`
- optional `VITE_API_BASE_URL`

Repository secrets:

- `DEPLOY_SSH_KEY`
- `DJANGO_SECRET_KEY`
- `DJANGO_EMAIL_HOST_KEY`
- optional automated TLS secrets `CLOUDFLARE_ORIGIN_CERT_PEM` and `CLOUDFLARE_ORIGIN_KEY_PEM`

See `deploy/README.md` for server and Cloudflare details.

## Dependabot
`.github/dependabot.yml` checks npm, pip, GitHub Actions, and Docker dependencies daily. Docker dependencies are checked from the `/backend` and `/frontend` directories, where the repository's Dockerfiles live. Patch and minor Dependabot updates can auto-merge only after the lint, test, CodeQL, vulnerability, and malware gates succeed.

The main-branch ruleset mirrors Notoli and includes the orchestrator-level
`Auto Merge` context among its required checks. CI emits that top-level context
for every pull request: it reports not-applicable for ordinary contributors and
records the independent-gate result for Dependabot. A separate Dependabot-only
job enables auto-merge for eligible updates, so its nested reusable-workflow
check name never becomes a branch-protection dependency. Dependabot pull
requests remain pending while GitHub reports an unstable merge state and are
never merged directly. Third-party Actions are pinned to
immutable commit SHAs, with release-version comments retained for maintenance.
Credential-handling GitHub Actions are pinned the same way. When a complete
  pull-request source diff exceeds an AI reviewer's configured budget, that reviewer's
GitHub App posts an explicit incomplete-review comment under its own identity
and then fails the check without publishing a verdict.
All three reviewers inherit the same 512 KiB source-diff budget from
`.github/actions/get-pr-diff/action.yml`; reviewer workflows do not override it.
Only the regular generated `frontend/package-lock.json` payload is excluded
from the source diff and Obi-Wan's changed-file contents. This exact path is
covered by the independent Dependency Review and npm malware gates; other
lockfiles and symlinks/executable files at that path remain in source review.
Each AI prompt and job summary discloses excluded files and the full diff size.
Manifests and source retain their review budget and added/context/deleted-line
legend with correct RIGHT-side line numbers. Oversized source diffs still
publish an incomplete review and fail. Lockfile-only PRs explicitly have no
source diff: an empty source review is not dependency-safety evidence, and all
independent security gates remain required. Behavioral tests execute the real
action against temporary Git histories, including oversized diffs and failures.
MacroMapper already filters generated lockfiles; this template's narrower policy
is scoped to its actual scanner coverage. Other repositories need their own
scanner-coverage review before adopting it.
OpenAI review requests also cap combined reasoning and visible output at 16,000
tokens so they do not reserve the model's full output allowance against project
rate limits.

## Main branch protection
The active `main` ruleset requires pull requests, resolved review threads, the
lint/test/CodeQL scope and analyzer/dependency checks, the Automation Tests
check, all three AI reviewer child checks, and `Auto Merge`. The reviewers run
for trusted same-repository pull requests, including Dependabot once its six
review secrets are configured. The ruleset blocks force pushes and branch
deletion and has no bypass actors. The standalone `CodeQL` context is
intentionally not required because the scope-aware workflow does not emit that
parent check for scope-empty pull requests. Notoli now requires the same three
reviewer contexts and excludes that standalone CodeQL context. Validate exact
check names after the first CI run when creating a generated app's ruleset.

The required reviewer contexts are:

- `AI Code Review / Obi-Wan Code-nobi code review`
- `AI Build Sheriff Review / Lint Eastwood build sheriff review`
- `AI Security Review / RoboCop security review`

The shared publisher submits the native review first, then fails the job for
`REQUEST_CHANGES`, including repeated/unchanged verdicts. Valid `APPROVE` and
`COMMENT` succeed; an approval on a later head can restore a passing check.
Missing credentials, missing/invalid verdicts, malformed output, incomplete major
briefs and over-budget diffs continue to fail visibly. Build/security reviews
use `always()` so upstream failures or skipped gates cannot suppress them.
All eligible same-repository PRs, including Dependabot and documentation changes,
run the reviewers. Forks receive no private reviewer secrets; bring the change
to a trusted same-repository branch for review.

Missing required checks remain pending; failed/cancelled checks require a clean
rerun on the current head. GitHub accepts skipped jobs for required checks, so a
skipped reviewer is not proof of a review. The read-only audit below rejects
missing, skipped, cancelled, neutral and all other non-success reviewer results.
It publishes no aggregator and changes no rules. [The dated ruleset
snapshot](review-gating-evidence.json) records the existing requirements,
Notoli's live verdict/failure/recovery parity reference, and PR #236's own native
requested-changes reviews, failed required checks and blocked merge state.
The PR's final validation tracks approval/check recovery after the completed fix.

```powershell
gh api repos/VanillaIceCube/FullStackTemplate/rulesets/19855608 > ruleset.json
gh api "repos/VanillaIceCube/FullStackTemplate/commits/<HEAD_SHA>/check-runs?per_page=100" > head-check-runs.json
node .github/actions/publish-ai-review/verify-gates.js ruleset.json head-check-runs.json
```

## Local automation checks
```powershell
node --test .github/actions/collect-upstream-major-upgrade-evidence/collect-upstream-major-upgrade-evidence.test.js .github/actions/publish-ai-review/*.test.js .github/actions/security-alerts/sync-security-alerts.test.js
docker run --rm -v "${PWD}:/repo" --workdir /repo rhysd/actionlint:latest -color
```

When updating the pinned `actions/create-github-app-token` revision, update the
security-alert workflow assertion in
`.github/actions/security-alerts/sync-security-alerts.test.js` and rerun the
repository automation tests. The current reviewed action revision is
`64ab729a6294000f5aa4a4bc0b73d1f32bc45510` (v3.3.0).

## Vite frontend and template checks

The frontend test gate runs Vitest, the production Vite build, and an initialized
sample-app Docker image/SPA smoke test as one failure gate. The container test
uses random local-only images/containers and loopback ports, then removes only
its own resources. Automation coverage includes the PowerShell template initializer, whose
`.mjs`/`.cjs` branding support is required by Vite and flat ESLint. The browser
API variable is `VITE_API_BASE_URL`; never publish secrets through Vite env.

## Shared app-only deployment

The deploy workflow is rendered from the immutable Infrastructure source pin.
It runs only for `env-prod`, serializes attempts, checks parity before deployment
credentials/images, records image digests, stages private app-only bundles, and
uses the shared lock/SQLite/readiness/recovery transaction. It never uploads TLS
keys, owns shared ingress, or prunes the host. Automation tests include parity,
all common release suites on disposable Linux/Docker, and generated-app
provenance checks. Destination credentials include `DEPLOY_HOST_FINGERPRINT`;
missing settings fail visibly. See `deploy/production/README.md`.

## 🔑 Separate OpenAI reviewer credentials

Credential provisioning is a separate operator step. Configure the new secrets
and project variable before activating these workflows. Missing keys fail
visibly; there is no fallback to the old shared `OPENAI_API_KEY`.

Use a dedicated **FullStackTemplate · AI Reviewers** OpenAI project (or the
repository's existing reviewer-only project). Never share credentials between
repositories. Create three distinct keys with these exact display names:

| OpenAI key display name | GitHub secret | Consumer |
| --- | --- | --- |
| `CI · Obi-Wan · Code Review` | `OBI_WAN_OPENAI_API_KEY` | Obi-Wan PR reviews |
| `CI · Lint Eastwood · Build Review` | `LINT_EASTWOOD_OPENAI_API_KEY` | Lint Eastwood PR reviews |
| `CI · RoboCop · Security Review` | `ROBOCOP_OPENAI_API_KEY` | RoboCop PR reviews and all three scheduled/manual alert feeds |

In this repository, add all three keys as **Actions repository secrets** and
also as **Dependabot repository secrets**, with identical names and values in
both stores. Keep the three existing GitHub App private-key secrets in both
stores as well (six review secrets total).

1. In OpenAI Platform, select the repository's reviewer project, open its API
   keys page, and create the three keys above. Restrict each key to the API
   permissions needed for Responses requests; retain model access and Obi-Wan's
   existing semver-major web-search capability. Choose an expiration under your
   rotation policy and record when replacement is due.
2. In GitHub **Settings → Secrets and variables → Actions → Secrets**, add the
   exact secret names in the table. Each value is the full secret key from its
   matching OpenAI entry, not its display name or key ID. Use Dependabot's
   separate secret settings too where specified above.
3. In **Actions → Variables**, set `OPENAI_REVIEWERS_PROJECT_ID` to that same OpenAI
   project's actual `proj_...` ID. All three keys and the project header must
   match. This is an OpenAI project ID; `SECURITY_ALERTS_PROJECT_ID` is a separate
   GitHub Project node ID and stays unchanged. App identity variables/private
   keys and deployment credentials also stay unchanged.
4. Run a same-repository PR smoke test for all three reviewers. Where supported,
   also verify a Dependabot PR using its separate secret store. After an
   approved merge, manually run CodeQL Alert, Vulnerability Alert, and Malware
   Alert on the default branch and observe their next scheduled runs. Do not
   run production deployment to test reviewer credentials.
5. In OpenAI Usage, filter by the reviewer project and individual API key to
   confirm each persona's attribution. An empty alert feed may make no model
   call; record that outcome rather than assuming usage was verified.
6. Stage the new secrets and `OPENAI_REVIEWERS_PROJECT_ID` while leaving the
   legacy `OPENAI_API_KEY` and `OPENAI_PROJECT_ID` unchanged. Existing default-
   branch jobs can continue using the legacy pair until the source is merged.
   Keep old keys valid until every affected consumer has verified the new keys;
   retain any Default-project key still used elsewhere. To reverse the source
   change, revert the workflow change; the retained legacy pair remains usable.
   Do not place a shared legacy key into the three new secret slots or expose
   key values in logs/issues.

See [OpenAI key security, expiration and usage guidance](https://developers.openai.com/api/docs/guides/production-best-practices#api-keys).


## 🔌 Shared MCP framework

The backend test gate checks the pinned MCP framework manifest. Template/MacroMapper run both ordinary tests and an isolated MCP-enabled sample profile; production remains disabled there. Notoli runs its existing enabled protocol/domain suite. See [the framework guide](../docs/MCP-FRAMEWORK.md).
