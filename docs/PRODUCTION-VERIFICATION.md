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

## Source and current observations

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

## Remaining acceptance

The app owner/operator must supply current in-container deployment-check output,
authenticated edge/origin cache receipts, deployed TLS/env permission receipts,
sender/domain and reset return-URL evidence, and current provenance/unmatched-food
acceptance. The domain owner must record the intended HSTS policy. Quotas and
dual runtime credentials retain their own implementation tickets. Issue #299
continues to track these gaps after the template PR merges.
