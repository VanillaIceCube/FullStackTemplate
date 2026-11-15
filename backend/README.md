# 🛠️ FullStackTemplate backend

The Django REST Framework backend owns application data, authentication,
permissions, notifications, and application integrations.

## 🧭 Structure

- `app/`: settings and server entry points.
- `authentication/`, `notifications/`: accounts and notifications.
- `app_mcp/`: reusable MCP transport and OAuth.

## 💻 Local development

Use Python 3.12 in an isolated environment. From the repository root:

```powershell
python -m pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py runserver 8000
```

Local settings can be supplied in ignored `backend/.env`.
For Docker hot reload, follow the [deployment guide](../deploy/README.md).

## ⚙️ Configuration

Local runs load ignored `backend/.env`. The database defaults to
`backend/db.sqlite3`; set `DJANGO_SQLITE_PATH` to use another local database.
Use `app/settings.py` for current defaults.

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

Local development uses Django's console email backend. The included
Resend HTTPS backend is configured with:

```env
DJANGO_EMAIL_BACKEND=authentication.email_backends.ResendApiEmailBackend
DJANGO_EMAIL_HOST_KEY=<resend-api-key>
DJANGO_EMAIL_TIMEOUT=10
DJANGO_DEFAULT_FROM_EMAIL=<sender-on-a-verified-domain>
```

Keep `.localhost` senders with console delivery. Live delivery uses an approved
sender domain and private credentials configured through the production guide.
Plain text, HTML, multipart alternatives, `cc`, `bcc`, and `reply_to` are supported.

The socket-operation timeout defaults to 10 seconds and supports `0 < seconds <= 30`.
The environment value is parsed as an integer. Invalid runtime timeout values fall
back safely; malformed startup configuration fails visibly. A successful provider
response means acceptance, not confirmed inbox delivery.

Failures preserve `fail_silently`: false re-raises, while true skips failures and
returns the number sent. Password reset returns a generic response for known and
unknown accounts, including delivery failures. Logger `authentication.email_backends`
records safe category/status fields: `configuration`, `request`, `rate_limit`,
`provider`, `timeout`, `network`, or `unexpected`. Never log provider response
bodies, recipient details, reset tokens, message contents, or credentials.

Diagnose failures using those categories and the existing provider dashboard.
There is no automatic retry or resend: a timeout may occur after acceptance.
Use mocked delivery tests; production email receipt requires separate verification.

## 🔌 MCP integration

The shared-framework checker lives at `backend/check_app_mcp.py`, beside the backend
and outside the hash-verified package. Run `python backend/check_app_mcp.py` from
the repository root; use `--source-root <canonical-checkout>` for local offline
verification. See the [framework guide](app_mcp/README.md) for source ownership.

The [MCP README](app_mcp/README.md) explains shared transport,
OAuth, configuration, and verification.

The template is disabled by default and provides a sample connection tool;
derived applications implement and enable their own tools.

Connection manifests, artwork, and package builders live in
[chatgpt/](app_mcp/chatgpt/README.md).

## 🧪 Checks

From the repository root:

```powershell
python backend/manage.py test
ruff check backend
ruff format backend --check
python backend/manage.py makemigrations --check --dry-run
```

## 🛠️ Maintenance

Keep registration and reset validation against the prospective/existing user,
preserve password whitespace, and retain generic account-recovery responses.
Notification operations remain recipient-scoped; bulk mutations are atomic.
Preserve pending/error handling through response parsing in the frontend.

Maintain the Python version in `environment.yml` and pip dependencies in
`requirements.txt` together with CI and Docker. The test runner's fast password
hasher applies only during tests; normal settings retain secure hashing.
See [Docker dependency maintenance](../deploy/README.md#development-dependency-reproducibility).

The browser-test backend uses disposable SQLite, synthetic users, local file mail,
and loopback binding. It does not load developer dotenv files or use the developer
database. Install backend requirements before running the frontend browser suite.

## 🚀 Production

Use the [production release and recovery guide](../deploy/production/README.md)
for private configuration, exact proxy trust, migrations, static files and readiness.
Production sessions/CSRF cookies require HTTPS with debug disabled; backend ports
remain private. Local Docker files are development tools, not production release inputs.

See the [production verification checklist](../deploy/production/README.md#-independent-production-verification).
The template is an onboarding example without an active production target.
