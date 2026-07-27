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

The script creates and links a GitHub Project, adds `Domain`, `Type`,
`Priority`, `Size`, `Estimate`, `Start date`, and `End date`, and prints its
node ID. The current GitHub GraphQL API can create Projects and fields, but
Project views and built-in workflows still need to be configured in the web
interface.

In the Project:

1. Change `Status` options to `Backlog`, `Ready`, `In Progress`, `In Review`,
   and `Done`.
2. Create a board view grouped by `Status`.
3. Create a table view showing `Status`, `Domain`, `Type`, `Priority`, `Size`,
   `Estimate`, `Start date`, and `End date`.
4. Create a security view filtered to `Type:Security`.
5. Enable the built-in workflow that adds repository issues and pull requests
   to the Project.
6. Enable the built-in workflow that sets newly added items to `Backlog`.
7. Copy the printed Project node ID into repository variable
   `SECURITY_ALERTS_PROJECT_ID`.

GitHub documents the supported Project mutations in its
[Projects GraphQL reference](https://docs.github.com/en/graphql/reference/projects).

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
