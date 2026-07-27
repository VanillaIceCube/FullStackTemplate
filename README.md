# FullStackTemplate
An authentication-first React, Material UI, Django REST Framework, Docker,
notification, CI/CD, and deployment foundation. It keeps the proven stack and
automation patterns from Notoli without carrying an opinionated application
domain.

## Before the first pull request
Start here. The pull-request workflow deliberately exposes missing reviewer
configuration, so add these GitHub repository settings before asking CI to run.

### Required CI and reviewer secrets
Add under **Settings → Secrets and variables → Actions → Secrets**:

```text
OPENAI_API_KEY
OBI_WAN_CODE_NOBI_PRIVATE_KEY
LINT_EASTWOOD_PRIVATE_KEY
ROBOCOP_PRIVATE_KEY
```

Add under **Actions → Variables**:

```text
OPENAI_PROJECT_ID
OBI_WAN_CODE_NOBI_APP_ID
LINT_EASTWOOD_APP_ID
ROBOCOP_APP_ID
```

The three private keys come from three GitHub Apps:

- Obi-Wan Code-nobi reviews application code.
- Lint Eastwood reviews build failures and can push lint-only fixes.
- RoboCop reviews security results and manages security-alert issues.

Use [the GitHub setup guide](docs/GITHUB_SETUP.md) to create the Apps with the
correct minimum permissions, install them on the repository, and create the
matching GitHub Project.

### Required security aggregation settings
```text
Variable: SECURITY_ALERTS_PROJECT_ID
Secret:   SECURITY_ALERTS_TOKEN
```

The Project initializer copies Notoli's Project structure, links the new
repository, verifies its fields/views/workflows, and sets
`SECURITY_ALERTS_PROJECT_ID` automatically.
`SECURITY_ALERTS_TOKEN` is a separate user token with access to that Project.
Code scanning and Dependabot alerts must also be enabled in repository
settings.

### Deployment settings can wait
The deploy workflow runs only from `env-prod` or manual dispatch. It needs the
DigitalOcean, Cloudflare, and Resend values listed in
[deploy/README.md](deploy/README.md), but those do not block the first
application pull request.

## Create an application from this template
After creating a repository from FullStackTemplate, clone it and run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/initialize-template.ps1 `
  -ApplicationName 'ExampleApplication' `
  -ApplicationSlug 'example-application' `
  -ProductionHost 'example-application.example.com' `
  -GitHubOwner 'YOUR_GITHUB_OWNER'
```

Use `-WhatIf` first to preview the files and renames. The initializer updates
display names, Docker/Conda identifiers, GHCR image names, workflow markers,
the production host, and every local host to:

```text
https://[application-slug].localhost
```

That subdomain convention is an invariant of the template. Browsers resolve
`.localhost` names to loopback, so no hosts-file entry is normally needed.
Production uses the same shape: `https://[application-slug].[base-domain]`.
All browser traffic stays same-origin; Nginx routes `/auth`, `/api`, and
`/admin` to Django and all other paths to React.

Review the initializer diff, replace the starter SVG mark, then complete the
GitHub settings above before opening the first PR.

## What is included
- React 19, Create React App, Material UI, and a responsive application shell
- Django REST Framework, custom user model, and versioned migrations
- Email-first registration and JWT login/refresh
- Forgot-password and tokenized reset email delivery through Resend
- Protected routes and automatic session renewal
- Header with a generic navigation drawer, notifications, profile details, and
  logout
- Recipient-scoped notification APIs with read and clear actions
- One intentionally minimal protected Material UI Paper ready to replace with
  application-specific content
- Docker images, Docker Compose, same-origin Nginx proxy, local HTTPS, GHCR,
  SSH deployment, and migrations
- Ruff, ESLint, Prettier, React/Django tests, CodeQL, dependency review, malware
  review, Dependabot, and auto-merge gates
- Three AI reviewer identities and scheduled security-alert-to-Project
  aggregation
- Modified MIT License restricted to non-commercial use

## Run locally in Docker
Requirements: Docker Desktop and either `mkcert` or OpenSSL.

```powershell
Copy-Item deploy/backend.env deploy/.env
New-Item -ItemType File -Path deploy/db.sqlite3 -Force
./deploy/create-local-certificate.ps1

docker build -t ghcr.io/vanillaicecube/fullstacktemplate-backend:latest ./backend
docker build -t ghcr.io/vanillaicecube/fullstacktemplate-frontend:latest ./frontend

Set-Location deploy
docker compose up -d
docker compose exec -T backend python manage.py migrate
```

Open `https://fullstacktemplate.localhost`, register, and log in. The protected
home page contains the reusable application header and a minimal placeholder
Paper.

When Notoli, MacroMapper, and FullStackTemplate run together, keep their
application proxies on ports 8442, 8443, and 8444, then start the shared local
ingress:

```powershell
powershell -ExecutionPolicy Bypass -File ./deploy/local-ingress/start.ps1
```

The ingress owns ports 80 and 443 and routes TLS by hostname, so all three apps
remain available without ports:

- `https://notoli.localhost`
- `https://macromapper.localhost`
- `https://fullstacktemplate.localhost`

Run
`powershell -ExecutionPolicy Bypass -File ./deploy/local-ingress/stop.ps1` to
stop the shared ingress and restore Notoli as the direct owner of ports 80 and
443.

`deploy/.env`, `deploy/db.sqlite3`, and certificate keys are ignored. Do not
commit them.

## Run without Docker
Requirements: Python 3.12 and Node.js 25. Docker remains the simplest option
when those exact versions are not already installed.

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

Open `http://fullstacktemplate.localhost:3000`.

## Validate changes
```powershell
Set-Location frontend
npm run format:check
npm run lint:strict
npm test
npm run build

Set-Location ../backend
ruff format --check .
ruff check .
python manage.py makemigrations --check --dry-run
python manage.py test

Set-Location ..
node --test .github/actions/publish-ai-review/publish-ai-review.test.js `
  .github/actions/security-alerts/sync-security-alerts.test.js
```

CI runs the same application and automation checks, plus CodeQL, dependency,
malware, and AI review gates.

## Documentation
- [GitHub Apps, Project, reviewers, and branch rules](docs/GITHUB_SETUP.md)
- [Cloudflare, DigitalOcean, Resend, Docker, and deployment](deploy/README.md)
- [Backend API and email settings](backend/README.md)
- [Frontend routes and component conventions](frontend/README.md)
- [Workflow behavior](.github/README-WORKFLOWS.md)
- [Repository working conventions](AGENTS.md)
- [Changelog](CHANGELOG.md)

## License
FullStackTemplate uses the
[Modified MIT License (Non-Commercial Use Only)](LICENSE.md). It permits use,
copying, modification, and distribution for non-commercial purposes; commercial
use requires separate permission from the copyright holder.
