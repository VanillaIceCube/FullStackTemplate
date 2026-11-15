# 🐳 FullStackTemplate deployment

Production uses the shared Infrastructure gateway and the app-only release
standard. The sole production/recovery procedure is
[deploy/production/README.md](production/README.md). `docker-compose.yml` and
`nginx-proxy.conf` below are local-only, standalone HTTPS fixtures. Never upload
them over shared host ingress or use them as production rollback scripts.

<a id="local-docker-with-applicationlocalhost"></a>

## 💻 Local Docker with `[application].localhost`
The template itself uses `fullstacktemplate.localhost`. When creating an application,
update its branding, Compose identifiers, and local hostnames manually.

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

<a id="routing-and-persistence"></a>

## 🧭 Routing and persistence
Nginx routes:

- `/` and SPA deep links to the frontend;
- `/auth/*`, `/api/*`, and `/admin/*` to Django;
- Django static files to the backend.

SQLite persists at `deploy/db.sqlite3` locally and at the approved application database path on the server. Back up that file before destructive server maintenance. For
larger applications, replace SQLite with a managed database before scaling to
multiple backend replicas.

<a id="vite-build-interface"></a>

## ⚙️ Vite build interface

The frontend Docker build accepts `VITE_API_BASE_URL` and copies `dist/` into
Nginx. The development Compose file uses the same variable and explicit Vite
polling. Blank production API origins retain same-origin routing. See
[frontend alignment](../frontend/README.md).


## 🔌 Shared MCP framework

The [MCP framework guide](../backend/app_mcp/README.md) defines opt-in ASGI/proxy/readiness requirements. Local development can call the backend directly; do not treat a local/legacy proxy as production MCP onboarding.

<a id="development-dependency-reproducibility"></a>

## 📦 Development dependency reproducibility

Development images pin reviewed multi-platform Node 26 and Miniforge 26.9.4-0
registry digests. Production Dockerfiles and the independent release engine are
unchanged by this development-image policy. Refresh tags/digests together after
registry verification and a disposable build/configuration check.

The frontend development entrypoint hashes both `package.json` and
`package-lock.json` inside its persistent `node_modules` volume. Fresh volumes
install with `npm ci`; unchanged restarts reuse dependencies; changing either
manifest reinstalls. Missing manifests or a failed installation stop startup and
retry on the next invocation. Use one volume per checkout and restart after edits.
Compose configuration
checks do not deploy or touch application data.

<a id="non-deploying-repository-validation"></a>

## 🧪 Repository validation

See [workflow checks and validation](../.github/workflows/README.md#-checks-and-diagnostics).


## 📚 Further reading

- [Live-server releases and recovery](production/README.md).
- [Backend configuration](../backend/README.md).
- [Frontend development](../frontend/README.md).
