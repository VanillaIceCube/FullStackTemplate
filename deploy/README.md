# Local Docker and production ownership

Production uses the shared Infrastructure gateway and the app-only release
standard. The sole production/recovery procedure is
[deploy/production/README.md](production/README.md). `docker-compose.yml` and
`nginx-proxy.conf` below are local-only, standalone HTTPS fixtures. Never upload
them over shared host ingress or use them as production rollback scripts.

## Local Docker with `[application].localhost`
The template itself uses `fullstacktemplate.localhost`. A generated repository
uses the slug passed to `initialize-template.ps1`.

For fast source iteration, use the development Compose file instead of the
standalone local HTTPS stack:

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
