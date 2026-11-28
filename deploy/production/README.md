# Production launches

The template has no active `env-prod` branch. Its domain and networks are examples for an independently provisioned application. Application settings and readiness checks live in [app.json](app.json). The [Compose file](compose.yml) defines the two services. The [shared release guide](https://github.com/VanillaIceCube/infrastructure/blob/51a48938ab24c11c4fe14a6e8d1becfce9936595/deploy/README.md) describes the Infrastructure-owned launcher. For local development, see the [deployment README](../README.md).

## Release sequence

1. The owner promotes the reviewed source to `env-prod`. The [workflow](../../.github/workflows/ci-deploy.yml) verifies its shared source pin, builds the images, and records their immutable digests.
2. The workflow verifies the SSH host key, reserves a private incoming directory, and uploads the app’s Compose file, configuration and environment there.
3. The launcher validates the bundle and host, pulls the images, stops this app's services and saves the pre-migration SQLite database and any existing backend and frontend containers. Django's deployment checks and migrations run after the backup completes.
4. Compose starts both services. A failed startup, network isolation check or exhausted backend or public health check takes both services offline. The shared gateway and other apps continue serving.

## Host preparation and activation

Provision the app’s private `DEPLOY_PATH` and `incoming/` directory, owned by the deployment identity with mode 0700. Supply the existing, nonempty SQLite file at `$DEPLOY_PATH/db.sqlite3`. Preserve its ownership and mode. Provision `/var/lib/jude-deploy-locks` (0700) with private `maintenance.lock` and `fullstacktemplate.lock` files (0600). The shared gateway and the external networks declared in the Compose file must exist. An app’s first launch can attach its own services to those networks.

The workflow executes this command on the host with its unique incoming bundle.

```sh
python3 "$DEPLOY_PATH/incoming/$RELEASE_ID/release.py" \
  --root "$DEPLOY_PATH" --bundle "$DEPLOY_PATH/incoming/$RELEASE_ID"
```

The private `$DEPLOY_PATH/incoming/$RELEASE_ID/before-migration/` directory holds the verified database, loadable container archives and their runtime settings. Each retry keeps its own copy. The shared release guide above covers retention and manual recovery. A failed deployment leaves the database in place. Preserve any reported SQLite journal and its writer container for the database owner. Check for writes accepted since the backup before any manual restore.

## ⚙️ Configuration

[app.json](app.json) owns the app's services, container names, domain,
environment, networks, database and readiness policy; [compose.yml](compose.yml)
defines its two services. Common release and bundle code has no app-name branches.
The gateway section describes this app's route networks and trusted peers.
`gateway.allowed_networks`, when present, lists all approved gateway attachments;
otherwise only this app's route networks are allowed. Unknown attachments and
missing app routes fail preflight; approved companion routes may be absent.
Infrastructure's `gateway/scripts/check_host.py` retains detailed full-host topology checks.
`workflow.extra_env` adds only app-specific Actions inputs;
all frontend builds use `VITE_API_BASE_URL=` for same-origin API requests.
The `shared_source` field pins the reviewed Infrastructure commit. The release workflow checks its code, tests and rendered workflow against that revision.

Required Actions access variables: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`,
`DEPLOY_HOST_FINGERPRINT` (independently verified SSH host key fingerprint).
Optional `DEPLOY_PORT` defaults to 22. Required access secret: `DEPLOY_SSH_KEY`.
Required app secrets: `DJANGO_SECRET_KEY`, `DJANGO_EMAIL_HOST_KEY`.
Required app variables: `DJANGO_EMAIL_BACKEND`, `DJANGO_DEFAULT_FROM_EMAIL`.
Use `anymail.backends.resend.EmailBackend` or
`django.core.mail.backends.smtp.EmailBackend` explicitly. The builder rejects retired custom backend names.
Optional mail settings: `DJANGO_EMAIL_HOST`, `DJANGO_EMAIL_PORT`,
`DJANGO_EMAIL_USE_TLS`, `DJANGO_EMAIL_HOST_USER`, `DJANGO_EMAIL_TIMEOUT`.
Defaults are `smtp.resend.com`, port 587, TLS enabled, user `resend`, timeout 10
seconds. Host/port/TLS/user settings apply to SMTP; the timeout also bounds
Resend API calls.

The bundle builder applies required, default and fixed settings from `app.json`;
incompatible explicit overrides of fixed production settings fail. Debug is off,
hosts/origins are explicit and the database target is `/backend/db.sqlite3`.
The frontend build uses blank `VITE_API_BASE_URL` for same-origin requests.
Both apps and the template use domain-root routes, without a configurable Django
path prefix: frontend `/`, authentication `/auth/`, admin `/admin/`, APIs `/api/`.
Environment values use single-line raw env files, preserving literal dollar
signs, hashes and quotes. Keep credentials out of Git, public artifacts, Vite
variables and logs. Keep release bundles private.

Template domain: `app.example.com`; Compose services: `backend` / `frontend`;
container/image names: `fullstacktemplate-backend` / `fullstacktemplate-frontend`.
Its example networks are `fullstacktemplate-ingress` and
`fullstacktemplate_default`. Review real domain, networks and exact proxy trust
before activation. The disabled production policy does not set an MCP issuer or
trusted-peer override. The gateway must overwrite forwarded scheme/client data
and pass the canonical Host within a reviewed restricted backend boundary;
Django ignores forwarded host metadata.

## MCP integration

MCP is disabled in the template production profile. A derived app must choose its own public origin, trusted gateway peer, credentials, readiness checks, and authorization scopes before enabling it. Client registration, owner consent, and plugin installation are separate from a launch. See the [app MCP guide](../../backend/apps/mcp/README.md).

<a id="-independent-production-verification"></a>

## Checks

From the repository root, verify the shared pin and run the release tests using a disposable Linux Docker environment.

```sh
python3 deploy/production/build_bundle.py --check-parity
python3 -m unittest discover -s deploy/tests -v
```

For live acceptance, confirm the deployed image digests, direct backend response, public HTML and authenticated API boundary against `app.json`. Use the declared public probes for the app’s enabled profile. Record the reviewed source and observed readiness in the deployment run.
