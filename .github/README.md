# ⚙️ GitHub automation

GitHub Actions, repository setup, dependency updates, and AI reviews for FullStackTemplate.
Source-controlled configuration and GitHub account/repository settings are separate.

## 🧭 Structure

- [Workflows](workflows/README.md): triggers, required gates, security checks, releases, and diagnostics.
- [Local actions](actions/README.md): reviewer context, feedback lifecycle, request policy, and regression tests.
- `dependabot.yml`: dependency-update configuration.
- `workflows/*.yml` and `actions/*/action.yml`: executable automation definitions.

## 🚦 Before your first pull request

1. Configure Actions, dependency alerts, advanced CodeQL, and available secret scanning/push protection using this repository's settings below.
2. Install the three reviewer GitHub Apps and set their App ID variables.
3. Store each persona's OpenAI key and App private key in both Actions and Dependabot secrets: six reviewer secrets in each store.
4. Configure this repository's reviewer project, security-alert Project, and separate Project token.
5. Verify fresh same-repository human and Dependabot PR results before activating or changing required checks.
6. Configure deployment separately through the app or gateway production guide.

Missing credentials and unavailable review evidence fail visibly. Existing secret
values are not recoverable from GitHub; use the original credentials through the
owner's approved process. Never weaken checks to make setup pass.

## ⚙️ Repository setup

### 0. Match the repository settings

FullStackTemplate starts from the live Notoli repository baseline. Apply this
configuration to a new repository before opening its first pull request. The
template intentionally keeps a read-only Actions default and omits the
standalone `CodeQL` required check; see the rationale below.

#### General

- Keep the default branch named `main`.
- Keep the repository public with Issues, Projects, Wiki, and Discussions
  enabled. Downloads remain disabled.
- Enable merge commits, squash merges, and rebase merges.
- Enable **Allow auto-merge**. Keep automatic head-branch deletion disabled,
  keep **Allow update branch** disabled, and leave commit signoff disabled.
- Keep the default merge titles/messages (`PR_TITLE`, `MERGE_MESSAGE`,
  `COMMIT_OR_PR_TITLE`, and `COMMIT_MESSAGES`).

#### Actions → General

- Enable Actions and allow all actions and reusable workflows.
- Set workflow permissions to **Read repository contents and packages
  permissions** (read-only default).
- Leave **Allow GitHub Actions to create and approve pull requests** disabled.
- Set fork pull-request approval to **Require approval for first-time
  contributors**.

The repository and workflow permissions are intentionally different: the
repository default matches Notoli, while individual workflows still request
the narrowest permissions they need.

#### Security → Code security and analysis

Enable the following repository controls:

- Dependency graph
- Dependabot alerts
- Dependabot security updates
- Secret scanning
- Secret scanning push protection

Do not enable GitHub's default CodeQL setup for this template. CodeQL is
already supplied by the pinned workflows under `.github/workflows/`; those
workflows upload the results to **Security → Code scanning**. The template
uses the same `actions`, JavaScript/TypeScript, and Python coverage as Notoli.

#### Labels used by security automation

Create these labels with the following descriptions so the scheduled alert
workflows can group and update their managed issues:

| Label | Description |
| --- | --- |
| `dependencies` | Dependabot-authored dependency update PRs |
| `codeql` | Grouped CodeQL security alerts. |
| `vulnerability` | Grouped non-urgent Dependabot vulnerability alerts. |
| `malware` | Grouped Dependabot malware alerts. |
| `codex` | Work generated or assisted by Codex |

### 1. Create the Project

Create a Project in GitHub or copy Notoli's Project (`VanillaIceCube` Project `8`)
without its linked issues. Update the Project title, description and README,
link the target repository, and set the repository variable
`SECURITY_ALERTS_PROJECT_ID` to the Project v2 node ID.

Verify the following fields against Notoli:

- `Status`: `Backlog`, `Ready`, `In Progress`, `In Review`, `Done`
- `Domain`: `Frontend`, `Backend`, `UX/UI`, `Data Model`, `Deployment`, `CI/CD`
- `Work type`: `Bug`, `Feature`, `Enhancement`, `Refactor`, `Chore`, `Research`,
  `Security`
- `Priority`: `P0`, `P1`, `P2`, `P3`
- `Size`: `XS`, `S`, `M`, `L`, `XL`
- `Estimate`, `Start date`, and `End date`

The copied views match Notoli's `Kanban`, `Detailed Kanban`, `New Issues`,
`Updated Issues`, `Issue Picker`, and `Roadmap` layouts, including their visible
fields, filters, grouping, and sorting.

Open the new Project's **Workflows** page and configure `Auto-add to project`
for the target repository. Verify the other workflows and views after copying.
GitHub documents this behavior in
[Copying an existing project](https://docs.github.com/en/issues/planning-and-tracking-with-projects/creating-projects/copying-an-existing-project).

### 2. Register the AI reviewer GitHub Apps

Create three private GitHub Apps under the repository owner. Give each app only
the listed repository permissions, generate one private key, and install it on
this repository.

| App | Repository permissions |
| --- | --- |
| Obi-Wan Code-nobi | Contents: read; Pull requests: read and write; Metadata: read |
| Lint Eastwood | Contents: read and write; Pull requests: read and write; Metadata: read |
| RoboCop | Contents: read; Pull requests: read and write; Checks: read; Issues: read and write; Code scanning alerts: read; Dependabot alerts: read; Metadata: read |

GitHub recommends choosing the minimum app permissions and protecting private
keys as credentials. See [registering a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)
and [managing private keys](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps).

Set these repository variables to the numeric App IDs:

```text
OBI_WAN_CODE_NOBI_APP_ID
LINT_EASTWOOD_APP_ID
ROBOCOP_APP_ID
```

Store each complete downloaded PEM as the matching repository secret:

```text
OBI_WAN_CODE_NOBI_PRIVATE_KEY
LINT_EASTWOOD_PRIVATE_KEY
ROBOCOP_PRIVATE_KEY
```

### 3. Configure secrets for Dependabot-triggered reviews

Dependabot-triggered workflows receive only **Dependabot** secrets, not the
normal **Actions** secrets. To run the same required AI reviewers for trusted
Dependabot pull requests, add these six values again under **Settings →
Secrets and variables → Dependabot → Secrets**:

```text
OBI_WAN_OPENAI_API_KEY
LINT_EASTWOOD_OPENAI_API_KEY
ROBOCOP_OPENAI_API_KEY
OBI_WAN_CODE_NOBI_PRIVATE_KEY
LINT_EASTWOOD_PRIVATE_KEY
ROBOCOP_PRIVATE_KEY
```

Use the same values as their Actions-secret counterparts. GitHub never reveals
or copies secret values between the stores, so this is a deliberate manual
setup step. Repository variables, including the OpenAI project and GitHub App
IDs, remain configured under **Actions → Variables**.

### 4. Configure OpenAI and security aggregation

Set:

```text
Variable: OPENAI_REVIEWERS_PROJECT_ID
Secret:   OBI_WAN_OPENAI_API_KEY
Secret:   LINT_EASTWOOD_OPENAI_API_KEY
Secret:   ROBOCOP_OPENAI_API_KEY
Variable: SECURITY_ALERTS_PROJECT_ID
Secret:   SECURITY_ALERTS_TOKEN
```

`SECURITY_ALERTS_TOKEN` must be a distinct user token with access to the
personal or organization Project. Do not reuse a GitHub App key or installation
token. The three scheduled/manual alert workflows use RoboCop to read alerts
and manage repository issues, while this token adds and updates those issues in
the Project.

Enable the repository settings in [the baseline above](#0-match-the-repository-settings),
then install RoboCop with the permissions listed in this guide. Add the
`SECURITY_ALERTS_TOKEN` secret before running an alert workflow; it cannot be
copied from Notoli because it is a credential.
Run each `Alert: ...` workflow manually once after the first successful CI run.
No-alert runs should succeed without creating issues.

### 6. Deployment configuration

The complete deployment variables and secrets are in
[the deployment guide](../deploy/README.md). The deploy workflow only runs on
`env-prod` pushes or manual dispatch, so application CI can be proven before
production credentials are ready.

### Production model for generated apps

Use the [app-only production guide](../deploy/production/README.md) for current
settings and onboarding. Infrastructure owns TLS and shared routing; the new
workflow does not consume `CLOUDFLARE_ORIGIN_CERT_PEM` or
`CLOUDFLARE_ORIGIN_KEY_PEM`. Configure the SSH host fingerprint and per-app
credentials, preserve the canonical shared source pin when initializing, and
protect `env-prod`. Main merges and source review do not authorize activation.

<a id="-separate-reviewer-keys"></a>

### Separate reviewer keys

Use the [exact key names and deferred migration steps](README.md#-credential-ownership). Each generated repository needs its own reviewer project and credentials; never copy this template's secrets.

## 🔑 Credential ownership

The four existing repositories already use the accepted persona-specific
credentials and reviewer projects. The following is an onboarding/operator
reference, not a pending model or credential migration. Configure these names
before activating a new installation; missing keys fail visibly and there is
no fallback to a shared `OPENAI_API_KEY`.

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
6. For configuration recovery, restore the last accepted persona-specific key/
   project bindings and validated reviewer variables, then rerun the latest head.
   Any source revert must use ordinary protected review and retain its matching
   credential contract. A legacy key used elsewhere is not an active reviewer
   fallback; never copy it into all three persona slots or expose key values.
   This reference does not rotate or provision credentials during Batch 3.

See [OpenAI key security, expiration and usage guidance](https://developers.openai.com/api/docs/guides/production-best-practices#api-keys).

## 🔒 Branch protection

### 5. Branch rules after the first PR

Wait until one pull request has produced the actual check names, then add the
Notoli-inspired ruleset for `main`:

- require a pull request before merging;
- require the independent lint, test, CodeQL scope, CodeQL analyzer,
  automation-test, vulnerability, and malware checks;
- require the three AI reviewer child checks and the `Auto Merge` check;
- require all review threads to be resolved;
- allow merge commits, squash merges, and rebases;
- block force pushes and branch deletion;
- configure no bypass actors.

Do not require a standalone `CodeQL` context. FullStackTemplate's reusable
CodeQL workflow emits `CodeQL / Detect CodeQL Scope` and the three analyzer
contexts. Scope-empty pull requests skip the analyzers and do not emit a
standalone parent check, so requiring that context would leave a permanent
pending check. Notoli follows the same scope-aware policy. Validate the actual check names from the first CI run before
saving the ruleset; GitHub status checks are matched by exact name.

The required AI reviewer contexts are:

```text
AI Code Review / Obi-Wan Code-nobi code review
AI Build Sheriff Review / Lint Eastwood build sheriff review
AI Security Review / RoboCop security review
Auto Merge
```

For all three personas, the shared publisher fails the required job after
publishing `REQUEST_CHANGES`, including unchanged/repeated blocking verdicts.
Valid `APPROVE` and `COMMENT` succeed; missing/invalid output and incomplete
reviews fail visibly. Verify a later successful review on the current head
before considering a prior failure resolved. Check both a human and a trusted
Dependabot PR before activating requirements. A missing check stays pending,
and a skipped reviewer must be rerun: GitHub itself accepts skipped required
jobs. Use the read-only audit in
[the branch-protection guidance](README.md#-branch-protection)
to verify actual successful reviewer results.

The reviewers run for trusted same-repository pull requests, including
Dependabot pull requests once [the Dependabot secrets](#3-configure-secrets-for-dependabot-triggered-reviews)
are present. CI always emits the required top-level `Auto Merge` context: it
reports not-applicable for ordinary pull requests and records gate eligibility
for Dependabot. A separate Dependabot-only job enables auto-merge for eligible
updates. Obi-Wan adds an advisory **Major upgrade brief** for Dependabot
semver-major updates. It reports exact Dependabot metadata alongside supplied
Dependabot information, externally retrieved GitHub Release notes where
available, repository-diff, and verification evidence. It explicitly marks
unknown information only when it affects the recommendation. The brief is part of Obi-Wan's
normal review and adds no required check. Fork pull requests intentionally
receive no sensitive secrets, so they
cannot satisfy these required reviewer child checks. Bring a fork change into a
trusted same-repository branch before merging it.

Do not require branches to be up to date before merging.

<a id="-per-head-dependabot-policy-activation"></a>

### Per-head Dependabot policy activation

After the protected auto-merge source is on main, add `Dependabot Policy` from
GitHub Actions (integration 15368) to the active main ruleset. Preserve all other
requirements and bypass restrictions. This check holds native auto-merge until
the successful CI head's dependency policy and approvals are validated, and must
be emitted afresh on later heads. Existing open PRs may need a fresh CI run.

When using newly created reviewer Apps, set `OBI_WAN_REVIEWER_LOGIN`,
`LINT_EASTWOOD_REVIEWER_LOGIN`, and `ROBOCOP_REVIEWER_LOGIN` to their actual bot
logins including `[bot]`; defaults use this template's existing persona Apps.
See the workflow guide for signed metadata, alert scope and activation evidence.

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
It publishes no aggregator and changes no rules. On October 20, 2026,
[PR #236](https://github.com/VanillaIceCube/FullStackTemplate/pull/236) showed
that reviews requesting changes caused [failed required checks](https://github.com/VanillaIceCube/FullStackTemplate/actions/runs/39519771086)
and blocked the merge. See the PR for follow-up validation after the fix and
[Notoli PR #942](https://github.com/VanillaIceCube/Notoli/pull/942) for the
corresponding failure and recovery in Notoli.

```powershell
gh api repos/VanillaIceCube/FullStackTemplate/rulesets/19855608 > ruleset.json
gh api "repos/VanillaIceCube/FullStackTemplate/commits/<HEAD_SHA>/check-runs?per_page=100" > head-check-runs.json
node .github/actions/publish-ai-review/verify-gates.js ruleset.json head-check-runs.json
```

<a id="-verification"></a>

## 🧪 Checks

Repository CI helpers live in `.github/tools/`: `bounded_log.py` retains bounded
reviewer diagnostics; `install_actionlint.sh` installs the pinned, checksum-verified
Linux Actionlint release; `validate_repository.py` checks workflow/script syntax
and synthetic Compose configuration; `ci_architecture.py` validates the documented
CI contract and regenerates `.github/workflows/ci-source-inventory.json`. Run these from the
repository root. See the [workflow checks](workflows/README.md#-checks-and-diagnostics)
and [CI architecture](workflows/README.md#-architecture-and-trust-boundaries) for dependencies and commands.

Verify the current head's independent checks and all three native review identities.
Distinguish synthetic local tests from actual GitHub runner/credential acceptance.
After an authorized merge, verify default-branch baselines and separately review
alert-workflow side effects before fresh manual dispatches. A successful human PR
does not prove access to the separate Dependabot secret store. Source review does
not authorize merging, branch promotion, production deployment, or key rotation.

<a id="-related-guides"></a>

## 📚 Reference

- [Workflow behavior and maintenance](workflows/README.md).
- [Shared action and reviewer contracts](actions/README.md).
- [CI/CD architecture](workflows/README.md#-architecture-and-trust-boundaries).
- [Application production setup and recovery](../deploy/production/README.md).

## 🤝 Shared engineering ownership and rollout

FullStackTemplate owns reusable application engineering and a canonical parent
issue tracks the entire rollout across FullStackTemplate, Notoli, MacroMapper and
Infrastructure. Infrastructure owns ingress, host operations and the versioned
release engine; its changes retain an Infrastructure parent linked to downstream
adoptions. Apps own domain behavior, UX, credentials, OAuth issuers, consent and
MCP tools. Preserve deliberate profile differences, exact proxy trust and
Infrastructure's Required CI/secret gate rather than forcing identical files.

For each shared change, inventory every repository as required, not applicable
with reason, already satisfied with evidence, or deferred with reason, owner,
tracking issue and acceptance. Validate the canonical source, then propagate through
independent reviewed PRs. Verify required checks, reviewer verdicts, documentation,
configuration and relevant acceptance on final PR heads and main. Record exact
PR/issue/commit/evidence links and deployment impact. Close the parent only after
all required downstream adoptions are merged and verified or explicitly accepted
as tracked deferrals; template-only success is insufficient. Prefer behavioral
parity, immutable manifests and explicit exceptions over byte equality of app policy.

When consolidating duplicate issues, retain original URLs, unique acceptance,
comments and Project history with bidirectional links. Superseded unfinished work
is not completed. Retain separate app-specific, in-flight, security-managed and
runtime-acceptance work. Preserve assignees/fields/status and avoid adding labels
that trigger automation. Reorganization grants no merge, deployment, schedule,
credential-rotation or security-bypass authority.

### Main-first releases

Ordinary source merges through reviewed `main` before exact-tree promotion through
the repository's existing `env-prod` process. A promotion merge may have a different
SHA while preserving the exact reviewed tree. Keep required CI, reviewers, owner
authorization and recovery gates. An explicitly owner-authorized narrow deployment
experiment must return its production-only changes and history promptly to main
through review before ordinary promotion resumes. Preserve newer main work and
both histories; never reset or force-push to manufacture parity.

Audit branch heads, ancestry and file differences separately. Main may remain ahead
while prerequisites or acceptance are unfinished; record held work and tracking
links rather than activating deferred changes to equalize hashes. Verify source-tree
parity and deployment acceptance when both branches are ready. An absent production
branch does not authorize creating one. FullStackTemplate remains an onboarding
example without an active production target. History reconciliation never authorizes
deployment. Infrastructure's existing owner-triggered gateway promotion decision
and separate initial setup/recovery scope remain in force.
