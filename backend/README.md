# FullStackTemplate backend
The backend is a Django REST Framework application with JWT authentication, a
custom user model whose email address is unique, password-reset email delivery,
and a generic recipient-scoped notification API.

## Structure
- `app/`: Django settings, URL routing, ASGI, and WSGI
- `authentication/`: custom user, registration, login, refresh, password reset,
  and email delivery
- `notifications/`: generic persisted notifications for the authenticated app
  header
- `environment.yml`: Conda environment definition
- `requirements.txt`: pip dependencies used locally, in CI, and in Docker
- `ruff.toml`: backend lint and formatting configuration

Application-specific models and APIs intentionally do not ship with the
template. Add new Django apps beside `authentication` and `notifications`.

## Authentication API
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

## Notification API
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

## Local setup
From the repository root:

```powershell
python -m pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py runserver 8000
```

Optional `backend/.env` values are loaded automatically:

```env
DJANGO_SECRET_KEY=local-only-key
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,fullstacktemplate.localhost
DJANGO_CORS_ALLOWED_ORIGINS=http://fullstacktemplate.localhost:3000
DJANGO_CSRF_TRUSTED_ORIGINS=http://fullstacktemplate.localhost:3000
DJANGO_FRONTEND_BASE_URL=http://fullstacktemplate.localhost:3000
```

The default database is `backend/db.sqlite3`. Override it with
`DJANGO_SQLITE_PATH`. The `fullstacktemplate.localhost` host is accepted by
default.

## Docker hot reload
The development Compose workflow builds `backend/Dockerfile.dev`, mounts the
backend source, and runs Django's autoreloading development server:

```powershell
docker compose --env-file deploy/.env -f deploy/docker-compose.dev.yml up --build -d backend
docker compose --env-file deploy/.env -f deploy/docker-compose.dev.yml exec -T backend python manage.py migrate
```

The development backend listens on `http://fullstacktemplate.localhost:8000`.
Use the production Dockerfile and Compose file when testing Gunicorn, Nginx,
HTTPS, or deployment-shaped behavior.

## Email
Local development defaults to Django's console email backend. Production can
use the included Resend HTTPS backend:

```env
DJANGO_EMAIL_BACKEND=authentication.email_backends.ResendApiEmailBackend
DJANGO_EMAIL_HOST_KEY=<resend-api-key>
DJANGO_EMAIL_TIMEOUT=10
DJANGO_DEFAULT_FROM_EMAIL=fullstacktemplate.no-reply@example.com
```

`ResendApiEmailBackend` maps sender, recipients, subject, `cc`, `bcc`, and
`reply_to` into the API payload. Plain messages send `text`; an `EmailMessage`
with `content_subtype = "html"` sends `html` without duplicating markup into
`text`. `EmailMultiAlternatives` sends its HTML alternative and, when present,
its plain-text body.

HTTP failures from `urlopen` are caught as `urllib.error.HTTPError`; the backend
re-raises that error with the original status and decoded API response body.
The default `fail_silently=False` propagates delivery errors. With
`fail_silently=True`, failed messages are skipped and the returned count includes
only successful sends. A missing API key raises `ValueError`, or returns zero
in silent mode. See [PR #122](https://github.com/VanillaIceCube/FullStackTemplate/pull/122)
and `authentication/tests.py` for the payload and error regression coverage.

SMTP-compatible backends can instead use the documented `DJANGO_EMAIL_HOST`,
`DJANGO_EMAIL_PORT`, `DJANGO_EMAIL_USE_TLS`, and
`DJANGO_EMAIL_HOST_USER` settings.

## Checks
```powershell
python backend/manage.py test
ruff check backend
ruff format backend --check
```

## Shared-gateway production boundary

The app-only Compose publishes no backend port and uses an existing database
bind with `create_host_path: false`. Infrastructure supplies canonical Host and
overwrites forwarded scheme/client headers. Django ignores forwarded host;
forwarded HTTPS trust relies on the reviewed, restricted backend networks.
Bootstrap, migration, backup, and explicit recovery follow
[the production guide](../deploy/production/README.md).


## 🔌 Shared MCP framework

See [the MCP framework guide](../docs/MCP-FRAMEWORK.md) for opt-in settings, ASGI startup, OAuth migrations/client registration, consent, scope/ownership requirements and disabled-profile tests.

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

## Disposable browser-test backend

The frontend `npm run test:e2e` wrapper runs `scripts/e2e_backend.py` with
`scripts/e2e_settings.py`: synthetic secret, fresh temporary SQLite, local file
email, test-only fast hashing, disabled MCP and loopback-only binding. It refuses
state directories without the wrapper marker and prevents dotenv loading.
Install `backend/requirements.txt` in your activated Python environment first.
This harness never reads the developer database or production settings and does
not change the normal server/test-runner hashing policy. See frontend/README.md.


## Transactional email failure handling

`ResendApiEmailBackend` sends once per message. An HTTP 2xx means provider
acceptance, not confirmed inbox delivery. `EMAIL_TIMEOUT` is a finite socket
operation timeout: default 10 seconds, supported `0 < seconds <= 30`. Invalid, nonfinite,
bool or larger runtime values produce a safe warning and use 10 seconds. The
`DJANGO_EMAIL_TIMEOUT` environment setting is parsed as an integer at startup;
malformed text fails configuration visibly rather than changing delivery policy.

The backend preserves `fail_silently`: false re-raises the original exception;
true logs the failure, continues the batch and returns only successful sends.
Missing credentials log `configuration` and return 0 only in silent mode. The
password-reset caller deliberately uses false, catches failures, emits a safe
caller event and returns the same generic 200 response for known and unknown
accounts. No recipient/user ID, exception text/traceback, reset URL/token, key or
message content is included in these logs.

Logger `authentication.email_backends` emits ERROR records with
`delivery_provider=resend`, `delivery_category` and numeric `delivery_status`
(or unknown). Categories: `configuration`, `request` (HTTP 4xx except 429),
`rate_limit` (429), `provider` (HTTP 5xx), `timeout`, `network`, `unexpected`.
The text formatter includes category/status even when structured fields are not
configured. Provider bodies and error strings are untrusted and never read for
logging. Template's established HTML/reply-to support and app sender identities
are preserved; generic failure behavior is equivalent across all three apps.

Operator recovery: check these safe categories and the existing Resend dashboard
using the existing account. Missing key/401/403 calls for credential selection,
permissions or sender-domain verification; fix deployment configuration through
the documented release path without logging/rotating keys.400/422 means inspect
payload rules using synthetic data. 429/5xx/network/timeouts indicate capacity or
provider availability; check status/rate limits before asking for a fresh reset.
Repeated configuration/auth failures or a sustained outage warrant operator
attention through existing channels. This adds logs, not a monitoring service.

There is no automatic retry, queue or resend: a timeout may occur after provider
acceptance, so a blind retry could duplicate a reset email. Idempotency/backoff
and durable delivery tracking would need their own bounded design. No production
mail is sent by tests; mocks cover success, credentials, network/timeouts,
400/401/403/422/429/500/503, both silent modes, partial batches, safe fallback and
the real reset caller's generic response/redacted logs. Production public
readiness cannot establish authenticated password-reset inbox delivery.
