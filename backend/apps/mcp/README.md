# 🔌 FullStackTemplate MCP

This guide owns MCP setup, application tools, permissions and ChatGPT connection
metadata. The public registry factory is `apps.mcp.tools.server.create_server`.
The installed `mcp` SDK remains a separate third-party package.

## 🧭 Structure

| Folder | Responsibility |
| --- | --- |
| `framework/` | Canonical OAuth, transport and ASGI lifecycle; shared runtime files match across consumers. |
| `tools/` | This application's registry, domain operations, permissions and validation. |
| `chatgpt/` | Connection manifests, branding and artwork; no local package/listing builders. |

- [Shared framework](#framework)
- [Application tools](#application-tools)
- [ChatGPT connection and branding](#chatgpt)

<a id="framework"></a>

## 🔌 Shared framework

`backend/apps/mcp/framework` provides shared OAuth consent, discovery, token verification,
Streamable HTTP transport and ASGI lifecycle. Application registries own their
models, permissions and tools. FullStackTemplate is the canonical source.
Shared framework changes are reviewed there first, then synchronized to each
consumer. Keep the shared runtime implementation aligned while preserving each
application's own tools, branding and permissions. Record reviewed source commits
and adoption evidence in the coordinated change's tracking issue.

Infrastructure routes requests through nginx to each application's own MCP
endpoint and OAuth provider. The framework is shared source, deployed inside each
application; it does not introduce a shared authorization service or another
account registry. `create_server(instructions=...)` uses that application's
`MCP_BASE_URL` as its issuer and `MCP_RESOURCE_URL` as its protected resource.
Accounts, client registrations, grants and tool permissions remain application
owned. Ordinary website login/REST JWTs retain their existing local behavior.
The previous external-issuer extension and centralized rollout are withdrawn;
template scaffolding remains disabled until an app implements its own tools.

All applications read the same `DJANGO_MCP_ENABLED` switch: only `1` enables
MCP discovery, OAuth routes and transport. Disabled ASGI profiles retain exact
proxy validation for ordinary REST traffic. `VITE_MCP_ENABLED=1` enables the
matching browser routes/menu; disabling it redirects stale connection links to
the app's normal landing flow. Bare backend settings and all local env examples
default MCP off. Reviewed MacroMapper and Notoli production policies explicitly
enable MCP; Template's production policy leaves it off.

Client setup and branding live in [chatgpt/](#chatgpt).

### 🧭 Framework files

- `server.py`, `asgi.py`, `routing.py`: server factory, transport, and ASGI lifecycle.
- `oauth.py`, `views.py`, `urls.py`: OAuth consent and connection management.
- `errors.py`: reconnectable connection failures and sanitized MCP auth challenges.
- `apps.py`: the canonical origin, HTTPS and registry configuration checks.
- `config.py`, `proxy.py`: application settings and exact proxy trust.
- `tests/`: profile, OAuth consent, and transport regressions grouped by behavior.


Connection failures discovered during a tool invocation return a sanitized MCP
error with `_meta["mcp/www_authenticate"]`, the local protected-resource metadata
URL, `invalid_token` or `insufficient_scope`, and the operation's required scopes.
Expired/revoked connections can reconnect; object ownership or membership denials
do not request a new grant. HTTP authentication still rejects invalid credentials
before tool dispatch. Exception bodies, tokens and record identifiers never enter
these challenges. App-owned `permissions.py` defines scopes and live principal
checks; `framework/oauth.py` retains the OAuth lifecycle.

### ⚙️ Enabling a derived application

MCP is off by default in FullStackTemplate. Derived applications own their
enablement and tool registries; see the [backend guide](../../README.md#-mcp-integration)
for this application's profile. Disabled applications keep
their existing Gunicorn/REST behavior, install no OAuth Django app, and expose no
backend MCP/discovery/OAuth routes. Dependencies are installed so enabling the
profile does not require changing the image's Python packages.

For an isolated development database:

```sh
export DJANGO_MCP_ENABLED=1
export DJANGO_MCP_BASE_URL=http://localhost:8000
uv run --locked --project backend python backend/manage.py migrate
uv run --locked --project backend python backend/manage.py createapplication public authorization-code \
  --client-id fullstacktemplate-chatgpt --name 'FullStackTemplate for ChatGPT' \
  --redirect-uris 'https://client.example/callback'
cd backend
uv run --locked uvicorn config.asgi:application --port 8000 --no-proxy-headers
```

Use the exact HTTPS callback supplied by the client, without credentials,
fragments or wildcards. Multiple reviewed callbacks are space-separated inside
`--redirect-uris`. Registration uses Django OAuth Toolkit's built-in
[`createapplication`](https://django-oauth-toolkit.readthedocs.io/en/latest/management_commands.html);
there is no repository-owned registration script. Enable the MCP profile and
apply migrations first: disabled profiles do not install the OAuth app or expose
its command. Use the explicit application-specific client ID and name above.

The public authorization-code client uses S256 PKCE and authentication method
`none`; do not pass `--skip-authorization`. The toolkit may print a generated
`client_secret`, but public clients do not use it: leave the client secret blank
in ChatGPT. Dynamic registration remains disabled. Duplicate client IDs and
callbacks rejected by model validation produce messages without changing existing rows;
the toolkit can still exit successfully, so verify its success message and the
application in Django admin rather than relying on exit status alone. Review
existing registration edits explicitly in Django admin. HTTPS schemes and
`ALLOW_URI_WILDCARDS=False` retain callback restrictions. Toolkit's generic
registration may store a URI containing credentials or a literal asterisk;
the shared OAuth validator refuses to use these callbacks for authorization
(including default callbacks) or code exchange. Onboarding must still use the
exact HTTPS callback supplied, without credentials, fragments or asterisks.
Configure
`DJANGO_FRONTEND_BASE_URL` for the actual React origin; build/start React with
`VITE_MCP_ENABLED=1` (Docker: `--build-arg VITE_MCP_ENABLED=1`). Enable backend and
frontend together. The template production build leaves this flag off; enabled applications
configure their own reviewed build and runtime profiles. No template instance is provisioned by merging this framework.

The template defaults to `apps.mcp.tools.server.create_server`: its sole tool,
`connection_status`, returns `{"connected": true}` after authentication and
reads no application data. Derived applications select their own registry with
`DJANGO_MCP_SERVER_FACTORY`; the sample is a transport test, not a domain tool
implementation. Notoli and MacroMapper supply their own application tools.

For real adoption, configure an application-owned factory returning
`create_server(instructions=...)`, explicitly declare OAuth scopes and required
scopes, and register tools with typed inputs/outputs, bounded results, accurate
read/write/destructive/idempotent annotations and OAuth scope metadata. Resolve
the current OAuth token's user and check scope, ownership and current membership
for every operation. Never trust a user ID supplied by a caller. Transport
authentication alone does not establish object permissions. Validate consequential
writes and application-specific mutation controls in the application service; keep REST behavior aligned.

### 🔐 Browser consent and credentials

Browser GET `/auth/mcp/authorize/` redirects to React `/connections/authorize`
with the original OAuth query. Login preserves only validated local connection
destinations. Consent shows the client, signed-in identity and every requested
permission; Allow/Cancel submits a signed, account-bound request valid for ten
minutes. JWTs stay in sessionStorage/header, never URLs. `/connections` lists
current-account access/refresh grants, including pending authorization codes,
and revokes them transactionally. Cookie authentication and posted user IDs cannot
grant access. Revocation is rechecked against the database on every MCP request.
Token resolution with an omitted or blank scope still requires the first
configured `MCP_REQUIRED_SCOPES` entry; it never skips scope authorization. An
explicit scope must be present in the live grant. The transport also requires
every configured baseline scope before accepting an MCP request.

Applications may configure `MCP_ACTION_APPROVAL_HANDLER` with an app-owned callable
`(user, reference, decision=None)` in an existing service module. It must return a
complete JSON preview and lock/check actor, preparation, live grant and exact state
inside the framework transaction before applying `allow`/`cancel`.
`GET/POST /auth/mcp/action-approval/` accepts only the app user's JWT. Signed tickets
bind user, opaque reference and exact preview digest for five minutes; POST
rechecks under the same transaction. Unconfigured applications return 404.
MacroMapper configures this hook; FullStackTemplate and Notoli do not, preserving
their domain policies. The existing React action mode renders complete safe-text
previews and explicit decisions; credentials/tickets never enter URLs.

OAuth tokens are distinct from REST JWTs. The provider requires the exact `/mcp`
resource, S256 PKCE and state; authorization codes expire in 120 seconds, access
tokens in one hour, and refresh tokens in 30 days. Refresh rotates with reuse
protection and cannot escalate scope. Stored access tokens are hashed. Keep
tokens, codes, tickets, private configuration and credentials out of logs/results.
An operator may schedule toolkit token cleanup separately; this change schedules
no production maintenance. No OIDC login or automatic account linking is added.

### 🌐 Hosting, readiness and rollback

Production requires an HTTPS origin in `DJANGO_MCP_BASE_URL`, correct frontend,
host/CORS/CSRF origins, a strong independent Django secret and
`uv run --locked --project backend python backend/manage.py check --deploy`. MCP uses ASGI, one worker for SQLite,
stateless JSON Streamable HTTP, a 64 KiB request limit and lifespan-managed SDK
sessions. Preserve the exact `/mcp` path; `/mcp/` is a different URL. The transport
validates Host/Origin and rejects REST JWTs as MCP credentials.

Only the dedicated trusted gateway may forward scheme/client metadata. Set
`DJANGO_TRUSTED_PROXY_IPS` to individually reviewed peer IPs on a private backend
network, never a wildcard or subnet. Do not publish the backend. The ASGI wrapper
strips untrusted forwarded headers and Django ignores forwarded host/proto headers.
The generic framework supplies no production subnet or ingress attachment.
Each application retains its reviewed exact proxy addresses and network policy;
consult its deployment guide rather than inferring addresses from the framework.

Infrastructure owns gateway routing; each file under `nginx/vhosts/` shows its
MCP and discovery locations directly. Coordinate exact `/mcp`, discovery,
`/auth/mcp/` forwarding, no caching or interactive edge challenges, HTTP/1.1,
buffering off and the 120-second upstream idle timeout. JSON mode does not require
WebSockets. Test REST/frontend routes and cross-app isolation as well as MCP.
An ordinary app must not advertise OAuth metadata or an MCP challenge; a SPA
fallback may return HTML at unknown paths and is not MCP discovery.

Enabled release readiness must assert the issuer and exact resource JSON,
unauthenticated `/mcp` status 401 and resource-metadata challenge, alongside
ordinary HTML/API health. Use existing app-specific `app.json` readiness fields;
no shared release engine change is required. Disabled apps retain ordinary
readiness. Do not add a live vhost, network or production client before reviewed
onboarding and operator authorization. Review Cloudflare route/cache/challenge
policy when activating a new app; this extraction changes no domain or edge rule.

Use the existing app-only immutable release/recovery guide and maintenance lock.
Retain previous images and private recovery evidence. Roll back the affected
component explicitly; never recreate shared networks, restore a historical
database casually, prune images globally or replay the initial cutover. Disabling
a newly adopted profile hides routes/UI; retain OAuth tables/data for deliberate
operator cleanup rather than reversing migrations or silently revoking grants.
Moving framework documentation changes no application issuer, scopes, consent
salt, client IDs, database tables, credentials, domain tools or readiness policy.

<a id="-verification"></a>

### 🧪 Framework checks

Run the ordinary backend suite from `backend/`, then run a separate enabled
profile against an isolated test database:

```sh
uv run --locked python manage.py test
DJANGO_MCP_ENABLED=1 DJANGO_MCP_SERVER_FACTORY=apps.mcp.tools.server.create_server uv run --locked python manage.py test apps.mcp.framework
```

The framework tests cover discovery/initialization/sample calls, absent/invalid
credentials, REST-JWT rejection, token expiry/resource/scope/revocation, S256 code
exchange and refresh rotation, account-bound consent, foreign-account revocation,
pending grants, exact client registration and sanitized reconnect challenges.
Keep all framework runtime files and test-package files identical across the three
applications (line-ending normalization is allowed). Frontend tests cover displayed
permissions, login return paths, Allow/Cancel, expired consent and revocation.
Run frontend tests/lint/build in both default and enabled builds. Notoli also runs
its application tool/permission/transport/proxy regressions. Live ChatGPT writes
and new production test accounts/grants remain separate acceptance work; framework
rollout verification must not alter the owner's connection or business records.

<a id="application-tools"></a>

## 🧰 Application tools

`server.create_server()` supplies the sample `connection_status` tool through the shared framework. It reads no application data and remains disabled by default. Derived applications own their registries, permissions and domain models here. See the [framework guide](#framework) and [backend guide](../../README.md#-mcp-integration).

<a id="chatgpt"></a>

## 💬 ChatGPT connection and branding

This is a starter package for a derived application. Its `app.example.com`
origin is an example, and the backend MCP profile is disabled by default.
Configure a real application endpoint before connecting.

### 🚦 Prepare a derived application

1. Manually update the application name, slug, host, client ID, scopes, and artwork
   text in the starter configuration and package metadata.
2. Implement and review the application-owned tools and permissions. The sample
   `connection_status` tool reads no application data.
3. Configure the real HTTPS origin and enable the backend/frontend MCP profiles
   as described in the [MCP README](#framework).
4. Register the public OAuth client using the exact callback supplied by the
   client. Review the application branding and package metadata before building.

<a id="-files"></a>

### 🧭 Connection files

- `plugin.json`: starter listing metadata and presentation.
- `mcp.json`: predefined public OAuth client and connection scope.
- `assets/logo.svg`: FullStackTemplate's layered-code mark; derived applications should supply their own branding.

The folder contains source metadata and artwork only. There are no local package
or listing builders. Its `.gitignore` excludes ZIP exports and account-specific
`.app.json` files.
