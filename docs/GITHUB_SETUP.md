# GitHub setup
Complete this setup before opening the first pull request so every required workflow can run.

## 1. Create the Project
Authenticate GitHub CLI with repository and Projects access:

```powershell
gh auth login
gh auth refresh -s project
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/create-github-project.ps1 `
  -Owner YOUR_GITHUB_OWNER `
  -Repository YOUR_REPOSITORY
```

The script uses Notoli's Project as the reusable Project template. It:

1. Refuses to create a duplicate Project with the same title.
2. Copies Notoli's views, custom fields, configured workflows, and insights
   without copying its linked issues.
3. Rewrites the Project description and README for the target repository.
4. Links the copied Project to the target repository.
5. Verifies the copied fields, views, and supported workflows against Notoli.
6. Sets the target repository variable `SECURITY_ALERTS_PROJECT_ID`.

The copied fields match Notoli:

- `Status`: `Backlog`, `Ready`, `In Progress`, `In Review`, `Done`
- `Domain`: `Frontend`, `Backend`, `UX/UI`, `Data Model`, `Deployment`, `CI/CD`
- `Type`: `Bug`, `Feature`, `Enhancement`, `Refactor`, `Chore`, `Research`,
  `Security`
- `Priority`: `P0`, `P1`, `P2`, `P3`
- `Size`: `XS`, `S`, `M`, `L`, `XL`
- `Estimate`, `Start date`, and `End date`

The copied views match Notoli's `Kanban`, `Detailed Kanban`, `New Issues`,
`Updated Issues`, `Issue Picker`, and `Roadmap` layouts, including their visible
fields, filters, grouping, and sorting.

GitHub does not copy the repository-scoped `Auto-add to project` workflow.
After the script completes, open the new Project's **Workflows** page and
configure `Auto-add to project` for the target repository. The remaining
configured workflows, including `Auto-add sub-issues to project`, are copied
and verified by the script.
GitHub documents this behavior in
[Copying an existing project](https://docs.github.com/en/issues/planning-and-tracking-with-projects/creating-projects/copying-an-existing-project).

Notoli is the default source (`VanillaIceCube` Project `8`). A different source
can be supplied with `-SourceProjectOwner` and `-SourceProjectNumber`.

## 2. Register the AI reviewer GitHub Apps
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

## 3. Configure OpenAI and security aggregation
Set:

```text
Variable: OPENAI_PROJECT_ID
Secret:   OPENAI_API_KEY
Variable: SECURITY_ALERTS_PROJECT_ID
Secret:   SECURITY_ALERTS_TOKEN
```

`SECURITY_ALERTS_TOKEN` must be a distinct user token with access to the
personal or organization Project. Do not reuse a GitHub App key or installation
token. The three scheduled/manual alert workflows use RoboCop to read alerts
and manage repository issues, while this token adds and updates those issues in
the Project.

Enable GitHub code scanning, Dependabot alerts, and Actions for the repository.
Run each `Alert: ...` workflow manually once after the first successful CI run.
No-alert runs should succeed without creating issues.

## 4. Branch rules after the first PR
Wait until one pull request has produced the actual check names, then add a
ruleset for `main`:

- require a pull request before merging;
- require the independent lint, test, CodeQL, vulnerability, and malware
  checks;
- require the AI reviewer checks if you want them to block merges;
- require branches to be up to date;
- block force pushes and branch deletion.

Do not require the Dependabot-only `Auto Merge` check; ordinary contributor
pull requests intentionally skip it.

## 5. Deployment configuration
The complete deployment variables and secrets are in
[the deployment guide](../deploy/README.md). The deploy workflow only runs on
`env-prod` pushes or manual dispatch, so application CI can be proven before
production credentials are ready.
