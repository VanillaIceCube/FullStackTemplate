# 🚀 Production releases and recovery

For local development, use the [deployment README](../README.md).

FullStackTemplate adopts the versioned release standard from
[JudeAndrewAlabaInfrastructure](https://github.com/VanillaIceCube/JudeAndrewAlabaInfrastructure/blob/main/app-release/README.md).
The exact source commit is in `deploy/shared-source.json`; common runtime, tests,
checker, and workflow are hash-checked. Do not edit a vendored common file.
Change the shared source, regenerate its manifest, and synchronize every consumer.

## Ownership and onboarding gate

Follow the [main-first release policy](../../.github/README.md#main-first-releases).
Ordinary changes merge through reviewed main before promotion; exceptional
owner-authorized deployment experiments return to main promptly through review.
Intentional release lag is allowed until features are ready. This template has
no active `env-prod` branch; branch parity does not authorize provisioning one.

Infrastructure owns shared Nginx, TLS certificates, ports 80/443, route-network
lifecycle, and host capacity. This repository owns only its backend, frontend,
database, immutable images, and private release/recovery records. The template
does not provision networks or gateway routes and does not upload certificates.

`app.example.com`, `/opt/apps/fullstacktemplate`, and subnet `172.31.240.0/24` are
isolated examples. They do not approve a third app on the existing shared host.
Before activation, the designated operator must approve capacity, an actual
domain and subnet, gateway vhosts, existing full gateway network membership,
app aliases, bootstrap, credentials, filesystem ownership, locks, backups, and
an exact production plan. Preserve Notoli's exact proxy trust and both existing
apps. Replace the example `gateway` policy with the reviewed complete topology;
the preflight intentionally rejects a different active gateway network set.
See [Infrastructure coordination #4](https://github.com/VanillaIceCube/JudeAndrewAlabaInfrastructure/issues/4).

The initializer brands `deploy/production/app.json`, Compose, and the rendered
workflow while preserving canonical shared-source ownership and vendored bytes.
Review its diff before adopting a generated app. The database must already be a
nonempty, valid SQLite file created through a separately approved bootstrap;
the release engine never silently creates or truncates an existing database.


The release controller verifies running frontend bindings against the accepted
app policy and checks rendered Compose and Docker against the candidate policy.
Change both Compose and app.json when changing a publication.

## Production settings

Actions secrets: `DEPLOY_SSH_KEY`, `DJANGO_SECRET_KEY`, `DJANGO_EMAIL_HOST_KEY`.
Actions variables: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`,
`DEPLOY_HOST_FINGERPRINT`, optional `DEPLOY_PORT`, `DJANGO_EMAIL_BACKEND`,
`DJANGO_DEFAULT_FROM_EMAIL`, and optional SMTP settings from `app.json`.
Use ResendApiEmailBackend or Django's SMTP backend. Keep backend credentials out
of Git, public artifacts, Vite variables, and logs. GHCR pull access must already
be configured for private packages. Review read-versions/Docker runtimes too.

Application host, CORS/CSRF origins, frontend URL, database target, and debug mode
come from app policy. The frontend build uses blank `VITE_API_BASE_URL` for
same-origin requests. The gateway must overwrite forwarded scheme/client data
and pass the canonical Host. Django ignores forwarded host and trusts forwarded
HTTPS only behind the reviewed, restricted backend network boundary.

## Release sequence

Only explicitly approved promotion to protected `env-prod` may activate a release.
The workflow also refuses manual dispatch from any other branch. Merging to main
does not deploy, and this PR is not approval to promote or run host commands.

1. CI verifies parity before destination credentials or image publication, builds
   SHA-tagged images, and records their actual immutable digests.
2. CI creates a private bundle named by source SHA, run, and attempt. It contains
   only app Compose/configuration, the runtime script, environment, release data,
   and checksums; it never contains ingress files or certificates.
3. The operator-provisioned private app root contains `incoming/`, `releases/`,
   and the existing database. Shared maintenance and per-app lock files live
   outside replaceable releases under `/var/lib/jude-deploy-locks`, with reviewed
   ownership and modes. Uploads reserve a unique incoming directory.
4. The common transaction takes the host maintenance lock before the app lock,
   checks topology/capacity/runtime, captures matched recovery data, stops only
   this app's writers, and verifies SQLite backup/restore before migration.
5. It promotes only app-owned configuration, migrates, starts only the two app
   services, and checks direct API 401 plus public HTML 200 / JSON API 401 with
   bounded retries. It records success only after acceptance.

No host-wide pruning, shared proxy restart, network deletion, or automatic
database rollback occurs. Retain prior images, private environment/configuration,
and recovery sets until operator-reviewed retention cleanup.

## Failure and explicit recovery

Keep the failed attempt and `FAILED.json`; automatic retry cannot choose whether
to lose later database writes. Under a separately approved recovery decision, use
the retained bundle's `release.py rollback` with the selected app root, release
identity, and explicit restore/keep decision shown by `--help`. Restore requires
the matched image/configuration/database set. Use the retained offline script;
do not run a legacy proxy-owning deploy script as recovery. Verify this app and
the untouched gateway/companions before recording acceptance or releasing holds.

## Verification

```powershell
python deploy/check_parity.py
python -m unittest discover -s deploy/tests -v
node --test .github/actions/*/*.test.js
```

The full common suite needs Linux and a disposable Docker daemon. It creates
unique temporary resources and fake credentials, never the production host.
Fixtures derive synthetic values for additional required backend settings from
`app.json`; production bundling still requires explicit operator credentials.
Contract checks cover the existing gateway networks and application-owned MCP
readiness. Application-owned MCP profiles are defined by each app's current
policy; the template does not activate a production instance.
For local source development only, `--source-root <infrastructure-checkout>`
checks the same common hashes offline. CI always verifies the immutable pin.


## 🔌 Shared MCP framework

Follow the [MCP framework contract](../../backend/app_mcp/README.md) before activating an optional app. Notoli and MacroMapper retain their app-owned production MCP profiles and readiness contracts; consult each app's policy and release evidence for the accepted state. Use this guide for immutable app releases and explicit recovery; framework adoption does not provision a new template instance.

## Production verification

Use the [verification checklist](README.md#-independent-production-verification) before recording production-hardening acceptance. Capture current backend checks and authenticated edge/origin observations for each app.

## 🔎 Independent production verification

Use this checklist for each application. Record source revision, deployed image
identity, observation time and result. A local production-settings check verifies
the selected settings; it cannot establish the settings of a running container.
FullStackTemplate is an onboarding example with no production target.

### Verification checklist

1. In the accepted backend container, run `python manage.py check --deploy`.
   Record check IDs and assess each warning. Verify DEBUG is false, the allowed
   hosts are explicit, and session and CSRF cookies use Secure. Run the ordinary
   and enabled MCP profiles independently when both are supported.
2. Confirm HTTP redirects to HTTPS at the real edge. Review the accepted HSTS
   policy with the domain owner before enabling it. W004 requires that decision;
   W008 may be satisfied by an independently verified gateway redirect.
   For ASGI, verify that only the application's exact trusted proxy can supply
   forwarded scheme/client information.
3. With a nonprivileged test session, inspect auth, protected API and admin
   responses, including redirects and errors, through the public CDN and origin
   gateway. Record status, Cache-Control, Age and cache-hit headers. Check that
   personalized responses cannot be served from cache. Exercise a SPA deep link
   and an unknown API path. Retain only sanitized summaries.
4. List GitHub secret and variable **names** with `gh secret list` and
   `gh variable list`. Reconcile them with the application deploy workflow and
   runbook. Verify actual host key/env/TLS ownership and permissions through an
   authorized read-only host session. Record modes and identities, never values.
5. Inventory signup, login and reset abuse controls. Record any missing rate
   limits explicitly. AI request timeouts and concurrency limits do not establish
   per-user quotas. Track MacroMapper quota and credential rollout through
   [#298](https://github.com/VanillaIceCube/FullStackTemplate/issues/298) and
   [MacroMapper #289](https://github.com/VanillaIceCube/MacroMapper/issues/289).
6. Cite existing sender/domain and reset return-URL evidence. Inbox/Spam delivery
   requires an actual receipt. Reuse historical evidence with its original date.
   New mail and paid AI requests require authorization for those operations.
   Review provenance and unmatched-food behavior in MacroMapper's existing
   tests and acceptance records.
7. Mark each capability passed, failed or blocked, with the evidence type.
   Link independent app receipts. Keep the parent open while required runtime
   checks remain unverified.
