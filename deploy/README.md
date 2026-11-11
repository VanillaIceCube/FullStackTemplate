# Local Docker and production ownership

Production uses the shared Infrastructure gateway and the app-only release
standard. The sole production/recovery procedure is
[deploy/production/README.md](production/README.md). `docker-compose.yml` and
`nginx-proxy.conf` below are local-only, standalone HTTPS fixtures. Never upload
them over shared host ingress or use them as production rollback scripts.

## Local Docker with `[application].localhost`
The template itself uses `fullstacktemplate.localhost`. A generated repository
uses the slug passed to `initialize-template.ps1`.

For fast source iteration, start the development Compose workflow over HTTP
(no certificate required):

```powershell
if (-not (Test-Path deploy/.env)) { Copy-Item deploy/backend.env deploy/.env }
if (-not (Test-Path deploy/db.sqlite3)) { New-Item -ItemType File -Path deploy/db.sqlite3 }
docker compose --env-file deploy/.env -f deploy/docker-compose.dev.yml up --build -d
docker compose --env-file deploy/.env -f deploy/docker-compose.dev.yml exec -T backend python manage.py migrate
```

This mounts both source trees, runs React's hot-reload server and Django's
autoreloading `runserver`, and uses direct HTTP ports 3000 and 8000 bound to
localhost only. Set `FULLSTACKTEMPLATE_DEV_FRONTEND_PORT` or
`FULLSTACKTEMPLATE_DEV_BACKEND_PORT` in `deploy/.env` to override the host
ports. It does not require a certificate, Nginx proxy, or shared local
ingress. Open `http://fullstacktemplate.localhost:3000`.

Use the standalone local HTTPS commands below when testing HTTPS, Nginx, or the
deployment image path.

```powershell
if (-not (Test-Path deploy/.env)) { Copy-Item deploy/backend.env deploy/.env }
if (-not (Test-Path deploy/db.sqlite3)) { New-Item -ItemType File -Path deploy/db.sqlite3 }
./deploy/create-local-certificate.ps1
docker build -t ghcr.io/vanillaicecube/fullstacktemplate-backend:latest ./backend
docker build -t ghcr.io/vanillaicecube/fullstacktemplate-frontend:latest ./frontend
Set-Location deploy
docker compose up -d
docker compose exec -T backend python manage.py migrate
```

Open `https://fullstacktemplate.localhost`.

The Compose project is named `fullstacktemplate`. Defaults are ports
80/443/8000/3000. FullStackTemplate owns its own proxy and can be run
independently of other application repositories.

Open `https://fullstacktemplate.localhost` after starting the stack. If another
application already owns ports 80/443, override this application's proxy,
backend, and frontend host ports in `deploy/.env` and use that application's
direct host ports instead.

## Routing and persistence
Nginx routes:

- `/` and SPA deep links to the frontend;
- `/auth/*`, `/api/*`, and `/admin/*` to Django;
- Django static files to the backend.

SQLite persists at `deploy/db.sqlite3` locally and at the approved application database path on the server. Back up that file before destructive server maintenance. For
larger applications, replace SQLite with a managed database before scaling to
multiple backend replicas.

## Vite build interface

The frontend Docker build accepts `VITE_API_BASE_URL` and copies `dist/` into
Nginx. The development Compose file uses the same variable and explicit Vite
polling. Blank production API origins retain same-origin routing. See
[frontend alignment](../docs/FRONTEND-ALIGNMENT.md).


## 🔌 Shared MCP framework

The [MCP framework guide](../docs/MCP-FRAMEWORK.md) defines opt-in ASGI/proxy/readiness requirements. Local development can call the backend directly; do not treat a local/legacy proxy as production MCP onboarding.

## Development dependency reproducibility

Development images pin reviewed multi-platform Node 26 and Miniforge 26.9.4-0
registry digests. Production Dockerfiles and the independent release engine are
unchanged by this development-image policy. Refresh tags/digests together after
registry verification and a disposable build/configuration check.

The frontend development entrypoint hashes both `package.json` and
`package-lock.json` inside its persistent `node_modules` volume. Fresh volumes
install with `npm ci`; unchanged restarts reuse dependencies; changing either
manifest reinstalls. Missing manifests or a failed installation stop startup and
retry on the next invocation. Use one volume per checkout and restart after edits.
Run `node --test tests/dev-dependencies.test.cjs` from the repository root for the
credential-free mocked lifecycle/exit-status regression. Compose configuration
checks do not deploy or touch application data.

## Non-deploying repository validation

CI runs `python scripts/validate_repository.py` from the repository root with
Actionlint, pinned PyYAML 6.0.3, Git Bash/Bash, PowerShell 7 and Docker Compose
installed. `scripts/install_actionlint.sh` installs the checksum-verified Linux
validator; other platforms can install the same Actionlint 1.7.12 release.
The validator parses maintained scripts, checks workflow/composite syntax and
renders development/local/production Compose using temporary synthetic env files.
It starts no containers and reads no private `.env`, database or certificate.
Actionlint's only compatibility exception is its unrecognized GitHub
`vulnerability-alerts` permission; other findings fail normally.

Browser checks use separate loopback ports and disposable settings, not the
production release path. The Infrastructure-owned release source pin and parity
enforcement stay authoritative; see docs/BATCH2-PARITY.md. Documentation/workflow
changes alone do not justify restarting the application or shared gateway.


Production-promotion PRs receive a managed impact summary derived from their
current env-prod comparison. It informs review; release authorization, migration
guards and data-safe recovery still follow the [production guide](production/README.md).
See [CI/CD architecture](../docs/CI-CD-ARCHITECTURE.md).
