# Production verification

Use this checklist for each application. Record source revision, deployed image
identity, observation time and result. A local production-settings check verifies
the selected settings; it cannot establish the settings of a running container.
FullStackTemplate is an onboarding example with no production target.

## Checklist

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

## Accepted production state

The owner requested completion of the remaining hardening work on November 12,
2026 Pacific. The [final receipt](https://github.com/VanillaIceCube/FullStackTemplate/issues/299#issuecomment-6845431487)
records the release links and sanitized observations.

| Repository | Accepted state |
| --- | --- |
| FullStackTemplate | Production cookie regression passed for both MCP profiles. Reusable checklist and matrix delivered. Owner retained the template without a production target. |
| Notoli | Signing key rotated through the repository secret and normal release workflow; W009 cleared. Authenticated notification, connection and admin responses stayed uncached through CDN and origin. Reset email reached Inbox with a valid token. |
| MacroMapper | Authenticated notification and connection responses stayed uncached through CDN and origin. Zero active staff accounts; ordinary-user admin access stayed denied and uncached. Reset email reached Inbox with a valid token. Current source/provenance and unmatched-item tests passed. |
| Infrastructure | One-hour HSTS policy reviewed and deployed through #137/#138. Exact header passed 28 public/origin route checks. Existing HTTPS redirects and private TLS/env permissions verified. |

The gateway sends Strict-Transport-Security with max-age=3600 on both app hosts.
Subdomain and preload directives are omitted. This is an intentional initial
one-hour policy, with expiry and max-age=0 recovery documented in
[the gateway architecture](https://github.com/VanillaIceCube/JudeAndrewAlabaInfrastructure/blob/1ecf9d08336ea4b4df387c59c2cc29d5c5ba5f97/docs/architecture-v2.md).
Django W004/W008 remain visible because HSTS and HTTPS redirects are enforced by
the verified gateway. No warnings were silenced.

Cache checks used anonymous, authenticated and then anonymous requests against
the same protected URLs, with no forced cache-bypass request header. API and
connection responses were 401, 200, 401, all no-store with no Age or cache-hit
status. Notoli admin responses were 302, 200, 302. The origin TLS connection used
the installed origin certificate as its trust anchor. Temporary verification
sessions were removed; short-lived JWTs expired after two minutes.

Exactly one password-reset email per app was requested for the owner-designated
mailbox. Both arrived in Inbox with SPF and DKIM passing. Their received links
used the correct HTTPS origin and reset path; Django validated each token
read-only. Passwords were unchanged. New signing credentials and reset tokens
were excluded from public evidence. Existing Notoli signed sessions/JWTs may
require signing in again after rotation.

Current MacroMapper evidence includes 38 backend integrity/recipe tests and
57 diary/meal-item frontend tests using mocked providers. Historical paid AI
acceptance remains explicitly historical. No new paid request was needed.

Auth/signup throttle inspection found no explicit application throttle. AI
timeouts/concurrency do not provide per-user quotas. The separate work in
[#298](https://github.com/VanillaIceCube/FullStackTemplate/issues/298) and
[MacroMapper #289](https://github.com/VanillaIceCube/MacroMapper/issues/289)
continues under its own acceptance criteria.

The following initial observations are retained as history and are superseded
by the accepted production state and linked receipts above.

## Initial source and observations

Reviewed on November 12, 2026 Pacific. Source baselines are Template
`161b7cd`, Notoli `baf9564`, MacroMapper `59e8942` and Infrastructure
`af21c6d`. The template cookie correction is in the PR linked from
[tracking issue #299](https://github.com/VanillaIceCube/FullStackTemplate/issues/299).

| Capability | FullStackTemplate | Notoli | MacroMapper | Infrastructure |
| --- | --- | --- | --- | --- |
| Production cookies | Corrected for ordinary and MCP profiles; regression covers DEBUG on/off | Already sets both Secure flags from DEBUG | Already sets both Secure flags from DEBUG | Application responsibility |
| Deployment checks | Synthetic production configuration passes with W004/W008 after correction | Local command blocked by missing oauth2_provider dependency; production result unverified | Synthetic production configuration passes with W004/W008 | Nginx source redirects HTTP to HTTPS; no Django target |
| Proxy and private caching | Existing host test rejects a spoofed forwarded host; MCP proxy trust tests are separate | App-owned ASGI trust; runtime check blocked | App-owned optional ASGI trust; runtime check blocked | Explicit vhosts and private.conf disable proxy caching and add no-store; ingress tests cover private routes |
| Current public observations | No production target | Seven unauthenticated GETs returned 403 | Seven unauthenticated GETs returned 403 | Origin behavior was not observable from these requests |
| Auth abuse controls | No explicit application throttle found in authentication views/settings | No explicit application throttle found in authentication views/settings | No explicit application throttle found in authentication views/settings | No signup/login limit in the inspected vhosts; external CDN controls unverified |
| Credential configuration | Reviewer names present; production provisioning remains app onboarding | Required deploy/reviewer names present | Deploy/reviewer and existing application inference key names present | Deploy/reviewer names present; actual host/TLS permissions unverified |
| Mail, AI and quotas | Mocked mail tests; no live sender | Historical functional mail evidence; current deliverability unverified | Historical reset and AI evidence; Spam limitation remains; dual-key/quota rollout unverified | Historical acceptance receipts only |

The seven GET paths for each app were /auth, /auth/login/, /api/notifications/,
/admin, /admin/, a SPA deep link (/board/1 or /diary), and an unknown API path.
Each response was 403 with private/no-store Cache-Control and no Age header.
Those access-denied responses do not verify Django routing, authenticated caching,
error handling or the configured HSTS policy. Authenticated and origin-side
observations remain blocked by access. No response bodies or cookies were retained.

The local deployment commands used synthetic secrets, DEBUG=0, explicit hosts,
an in-memory database and disabled optional MCP. This is source evidence.
Notoli owns its enabled OAuth profile and requires its documented dependencies.

## Evidence to reuse

- [Template settings and regression](../backend/app/tests.py) and
  [settings](../backend/app/settings.py).
- [Notoli settings](https://github.com/VanillaIceCube/Notoli/blob/baf956430396aaa1b09759dd87b4fb344919bd7d/backend/app/settings.py)
  and [MacroMapper settings](https://github.com/VanillaIceCube/MacroMapper/blob/59e8942be9d78fc2267d99d6c62e88edf354ee59/backend/app/settings.py).
- [Gateway vhosts](https://github.com/VanillaIceCube/JudeAndrewAlabaInfrastructure/tree/af21c6d4c96138eccef0abd2a9b7d39f91ff660b/nginx/vhosts),
  [private routing](https://github.com/VanillaIceCube/JudeAndrewAlabaInfrastructure/blob/af21c6d4c96138eccef0abd2a9b7d39f91ff660b/nginx/snippets/private.conf),
  and [ingress tests](https://github.com/VanillaIceCube/JudeAndrewAlabaInfrastructure/blob/af21c6d4c96138eccef0abd2a9b7d39f91ff660b/tests/test_ingress.py).
- [Batch 2 parity](BATCH2-PARITY.md) and [Batch 3 parity](BATCH3-PARITY.md)
  supply source/CI adoption evidence. Their runtime limitations still apply.
- [Historical functional acceptance](https://github.com/VanillaIceCube/JudeAndrewAlabaInfrastructure/issues/4#issuecomment-6136015187)
  and [cleanup checkpoint](https://github.com/VanillaIceCube/JudeAndrewAlabaInfrastructure/issues/4#issuecomment-6136067190)
  cover prior functional checks. MacroMapper reset mail reached Spam.
- [Representative AI acceptance](https://github.com/VanillaIceCube/MacroMapper/issues/245#issuecomment-6115252761)
  is historical. Current canonical food/portion behavior has independent tests in
  [MacroMapper #406](https://github.com/VanillaIceCube/MacroMapper/pull/406).
- The old Docker login parity gap has delivered source updates in
  [Infrastructure #130](https://github.com/VanillaIceCube/JudeAndrewAlabaInfrastructure/pull/130),
  [MacroMapper #398](https://github.com/VanillaIceCube/MacroMapper/pull/398) and
  [Notoli #1033](https://github.com/VanillaIceCube/Notoli/pull/1033).
  Historical dependency-upgrade failures are not current deployment failures.

## Completion

The final production receipt resolves the runtime evidence gaps from the initial
review. Re-run the checklist when application settings, ingress, authentication,
mail delivery or AI behavior changes. Independent quota/key features retain
their own tickets.
