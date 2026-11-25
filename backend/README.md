# 🛠️ FullStackTemplate backend

The Django REST Framework backend owns application data, authentication,
permissions, notifications, and application integrations.

## 🧭 Structure

- `config/`: settings and server entry points.
- `docker/`: production/development Dockerfiles and their matching Dockerfile-specific
  ignore files; keep `backend/` as the build context.
- `apps/authentication/`, `apps/notifications/`: accounts and notifications.
- `apps/mcp/`: shared `framework/`, application `tools/`, and `chatgpt/` packaging.

## 💻 Local development

Install uv, then synchronize the locked Python 3.12 project from the repository root:

```powershell
uv sync --locked --project backend
uv run --locked --project backend python backend/manage.py migrate
uv run --locked --project backend python backend/manage.py runserver 8000
```

Local settings can be supplied in ignored `backend/.env`.
For Docker hot reload, follow the [deployment guide](../deploy/README.md).

## ⚙️ Configuration

Production (`DJANGO_DEBUG=0`) requires an explicit nonblank `DJANGO_SECRET_KEY`.
Static files use Django's default storage and the retained WhiteNoise middleware.

Local runs load ignored `backend/.env`. The database defaults to
`backend/db.sqlite3`; set `DJANGO_SQLITE_PATH` to use another local database.
Use `config/settings.py` for current defaults.

| Setting | Purpose |
| --- | --- |
| `DJANGO_SECRET_KEY`, `DJANGO_DEBUG` | Stable local signing key and debug mode; use a private key and disable debug in production. |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated accepted hosts. |
| `DJANGO_CORS_ALLOWED_ORIGINS`, `DJANGO_CSRF_TRUSTED_ORIGINS` | Explicit frontend origins, including the port during development. |
| `DJANGO_FRONTEND_BASE_URL` | Browser redirects and password-reset links. |
| `DJANGO_EMAIL_BACKEND`, `DJANGO_DEFAULT_FROM_EMAIL` | Delivery backend and sender. |
| `DJANGO_EMAIL_HOST`, `DJANGO_EMAIL_PORT`, `DJANGO_EMAIL_USE_TLS` | SMTP configuration when using an SMTP backend. |
| `DJANGO_EMAIL_HOST_USER`, `DJANGO_EMAIL_HOST_KEY`, `DJANGO_EMAIL_TIMEOUT` | Delivery credentials and timeout; keep credentials out of source control. |

For Docker hot reload and dependency volumes, use the
[deployment README](../deploy/README.md).

## 🔐 Authentication API

Registration, login and reset preserve passwords exactly, including leading and
trailing spaces. Request serializers reject malformed credential/link types with
HTTP 400; email addresses are trimmed and normalized. Registration returns an
explicit client error for duplicate identities and rolls back account creation,
required onboarding and session creation together if any step fails. Recovery
responses remain generic for valid email-shaped input.

- `POST /auth/register/`
  - Body: `email`, `password`, and optional `username`
  - Enforces configured Django password validators, including similarity to the prospective username/email; invalid passwords return HTTP 400 before account creation.
  - Returns: `access`, `refresh`, `username`, `email`, and a success message
- `POST /auth/login/`
  - Body: `email`, `password`
  - Returns: `access`, `refresh`, `username`, and `email`
- `POST /auth/refresh/`
  - Body: `refresh`
  - Returns a new access token
- `POST /auth/forgot-password/`
  - Body: `email`
  - Always returns a generic success response for valid email-shaped input
- `POST /auth/reset-password/`
  - Body: `uid`, `token`, `password`
  - Validates passwords against the existing user and preserves password whitespace exactly.

## 🔔 Notification API

All `/api/` endpoints require a JWT access token. Notification querysets are
always scoped to the authenticated recipient.

- `GET /api/notifications/`
- `PATCH /api/notifications/{id}/` with `{"is_read": true}` or
  `{"is_read": false}`
- `DELETE /api/notifications/{id}/`
- `PATCH /api/notifications/mark-all-read/`
- `DELETE /api/notifications/clear-all/`

Bulk mark-read and clear operations run in atomic transactions and accept empty
recipient lists. Authentication and recipient scoping apply to both actions.

Notifications retain a generic event type, title, message, optional actor, and
optional frontend `target_path`. Future application apps can create them
without depending on a template-owned domain model.

## ✉️ Email

Local development keeps Django's console backend. Resend API delivery uses the
maintained `django-anymail==15.2` backend:

```env
DJANGO_EMAIL_BACKEND=anymail.backends.resend.EmailBackend
DJANGO_EMAIL_HOST_KEY=<resend-api-key>
DJANGO_EMAIL_TIMEOUT=10
DJANGO_DEFAULT_FROM_EMAIL=<sender-on-a-verified-domain>
```

The existing key becomes `ANYMAIL["RESEND_API_KEY"]` only when nonblank. Existing
SMTP/custom backend selectors remain configurable; known historical Resend class
paths map to the maintained backend without retaining an application wrapper.
Only outbound sending is configured: no webhook routes or optional `svix` package.

The startup integer timeout maps to `ANYMAIL["REQUESTS_TIMEOUT"]`: values in
`0 < seconds <= 30` are honored; out-of-range values use the safe 10-second default.
Malformed integers still fail startup visibly. API debug output is explicitly off,
and the requests session adds no automatic retries. A timeout may occur after
provider acceptance, so retries need a separately designed idempotency policy.

Operational failures retain `fail_silently` and successful-message counts.
Anymail deliberately raises configuration errors (including a missing API key)
even in silent mode, before HTTP. Password reset catches failures and keeps the
same generic response for known and unknown accounts. Its log message contains
no exception text/traceback, provider body, recipients, credentials or reset tokens.
Anymail exceptions can carry provider data: do not log exception representations
or enable `DEBUG_API_REQUESTS`. Provider acceptance does not prove inbox delivery.

Project-owned configuration and mocked provider-boundary tests live in
`config/tests/`; authentication retains real reset-call privacy regressions.
Plain text, HTML, reply-to, cc and bcc use Anymail's maintained serialization.

## 🔌 MCP integration

The [MCP README](apps/mcp/README.md#framework) explains shared transport,
OAuth, configuration, and verification.

The template is disabled by default and provides a sample connection tool;
derived applications implement and enable their own tools.

Connection manifests and artwork live in
[chatgpt/](apps/mcp/README.md#chatgpt).

## 🧪 Checks

Backend tests live in an owning `tests/` package beside each app or configuration
module. Use descriptive `test_*.py` filenames and behavior-based test class names,
keep `__init__.py` empty, and put shared setup/builders in fixture-only modules
such as `helpers.py`. Helpers must not define test cases or import test modules.
Split independent behavior groups when that makes failures easier to locate;
keep related end-to-end scenarios together.

Authentication packages share registration, login, password recovery/reset and
recovery-privacy groups. Configuration owns production settings and email
configuration/delivery. The canonical MCP framework has identical profile, OAuth
and transport test modules in all three applications; app tools remain app-owned.

Notification API tests remain in `apps/notifications/tests/`. The default profile
keeps MCP disabled; run the enabled profile described in the MCP guide as well.

From the repository root:

```powershell
uv run --locked --project backend python backend/manage.py test backend
uv run --locked --project backend ruff check backend
uv run --locked --project backend ruff format backend --check
uv run --locked --project backend python backend/manage.py makemigrations --check --dry-run
```

## 🛠️ Maintenance

Keep registration and reset validation against the prospective/existing user,
preserve password whitespace, and retain generic account-recovery responses.
Notification operations remain recipient-scoped; bulk mutations are atomic.
Preserve pending/error handling through response parsing in the frontend.

Maintain the Python 3.12 constraint in `pyproject.toml`; declare dependencies
in `pyproject.toml` and commit `uv.lock`. Use `uv add --project backend <package>`
or `uv lock --project backend --upgrade-package <package>` for deliberate changes,
then `uv sync --locked --project backend`. CI and Docker consume the same lockfile. Django uses its default test runner and secure password hashing; focused tests may
override hashing within their own test scope.
See [Docker dependency maintenance](../deploy/README.md#development-dependency-reproducibility).

## 🚀 Production

Use the [production launch guide](../deploy/production/README.md)
for private configuration, exact proxy trust, migrations, static files and readiness.
Production sessions/CSRF cookies require HTTPS with debug disabled; backend ports
remain private. Local Docker files are development tools, not production release inputs.

See the [production verification checklist](../deploy/production/README.md#-independent-production-verification).
The template is an onboarding example without an active production target.
