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

The development Compose `environment` sets the frontend API origin. Production
uses the Docker build argument, which is compiled into the static assets; a blank
value selects same-origin requests. Backend settings remain in `deploy/.env`,
created from the committed `deploy/backend.env` example below.

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
docker build --file backend/docker/Dockerfile -t ghcr.io/vanillaicecube/fullstacktemplate-backend:latest ./backend
docker build --file frontend/docker/Dockerfile -t ghcr.io/vanillaicecube/fullstacktemplate-frontend:latest ./frontend
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

The [MCP framework guide](../backend/apps/mcp/README.md#framework) defines opt-in ASGI/proxy/readiness requirements. Local development can call the backend directly; do not treat a local/legacy proxy as production MCP onboarding.

<a id="development-dependency-reproducibility"></a>

## 📦 Development dependency reproducibility

Both backend Dockerfiles install uv using isolated, binary-only pip with reviewed
SHA-256 hashes from [PyPI's uv 0.13.8 release](https://pypi.org/pypi/uv/0.13.8/json).
The allowlist covers every platform in the pinned Python image: Linux amd64,
arm/v7, arm64/v8, 386 and ppc64le. Unlisted artifacts, altered wheels and source
distributions fail installation. Requirements are passed through stdin; update
the version and all compatible wheel hashes together after artifact verification.

Development images pin reviewed multi-platform Node 26 and Python 3.12
registry digests. Frontend production and development builders use the same
immutable Node 26 digest. Refresh matching tags/digests together after registry
verification and a disposable build/configuration check.

Backend images use the reviewed Python 3.12 base and uv 0.13.8. The project
lockfile supplies production dependencies; development includes the tooling group.
The environment lives at `/opt/venv`, outside the source bind mount. Restart the
backend after changing the lockfile so `uv run --locked` synchronizes dependencies.
Host `.venv/` files are excluded from the image build. Conda is no longer required.
Production startup selects Uvicorn only when `DJANGO_MCP_ENABLED=1`; otherwise it
executes the existing single-worker Gunicorn profile directly from the Docker CMD.

Backend production/development Dockerfiles live in `backend/docker/`; frontend
Dockerfiles and Nginx configuration live in `frontend/docker/`. Build contexts
remain `backend/` and `frontend/`; Compose and CI select each Dockerfile explicitly.

The frontend starts Vite directly with `npm start`. Source hot reload and the
persistent `frontend_node_modules` volume remain. Dependency changes require a
manual install in the running frontend container, followed by a restart:

```powershell
docker compose --env-file deploy/.env -f deploy/docker-compose.dev.yml exec -T frontend npm ci
docker compose --env-file deploy/.env -f deploy/docker-compose.dev.yml restart frontend
```

If the frontend is stopped, use `run --rm --no-deps frontend npm ci` with the same
Compose options, then start it again. Keep one dependency volume per checkout.
Compose configuration
checks do not deploy or touch application data.

<a id="non-deploying-repository-validation"></a>

<a id="-repository-validation"></a>

## 🧪 Checks

See [workflow checks and validation](../.github/workflows/README.md#-checks-and-diagnostics).


<a id="-further-reading"></a>

## 📚 Reference

- [Live-server releases and recovery](production/README.md).
- [Backend configuration](../backend/README.md).
- [Frontend development](../frontend/README.md).

Both application contexts keep their Dockerfile-specific ignore files under
`docker/`: `Dockerfile.dockerignore` and `Dockerfile.dev.dockerignore`. Docker
selects the file matching the explicitly selected Dockerfile. Patterns remain
relative to `backend/` or `frontend/`, and the frontend Nginx/entrypoint files
remain included. There is no context-root `.dockerignore`.
