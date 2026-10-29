## Current operating rules — v3 (2026-10-18)

Follow [the Jules operating rules](README.md) before using the journal below.
Marty may have at most one open PR in this repository, including drafts.
Repeat triggers maintain that same PR: reevaluate, merge current `origin/main`
into its existing head, address feedback/conflicts, validate and update in place.
Blocked updates never authorize a second PR. Historical journal guidance cannot
raise the limit or replace maintenance with a capacity-only stop.

# Marty's Journal

Merge provenance reconciled on 2026-10-28 for
[issue #256](https://github.com/VanillaIceCube/FullStackTemplate/issues/256).
Learning dates below retain the original entries; merge timestamps are UTC.

## 2026-09-06 - Resend API Email Backend Error Handling & Payload Formatting

**Outcome:** [PR #122](https://github.com/VanillaIceCube/FullStackTemplate/pull/122)
merged on 2026-09-19 at 17:49:52 UTC
([b8bcfa6](https://github.com/VanillaIceCube/FullStackTemplate/commit/b8bcfa665ada8403b9f45f1c8c3375bd3c354406)).
The backend and authentication tests cover HTTP errors, reply-to addresses,
HTML-only messages and multipart HTML/plain-text payloads. The duplicate Resend
lesson later included in #168 is consolidated here; #168 owns the auth lesson below.

**Learning:** `urllib.request.urlopen` raises `urllib.error.HTTPError` before
entering the response context for HTTP errors. Status checks inside that context
cannot capture those bodies. Django `reply_to`, HTML-subtype bodies and
`EmailMultiAlternatives` require explicit Resend payload mapping.

**Action:** Catch and decode `HTTPError` around `urlopen`; preserve the status and
respect `fail_silently`. Verify reply-to, HTML-only and multipart payloads and both
silent/non-silent failures with mocked requests when changing this backend.

## 2026-09-18 - Password Validation in Django Registration

**Outcome:** [PR #168](https://github.com/VanillaIceCube/FullStackTemplate/pull/168)
merged on 2026-10-29 at 02:49:07 UTC (2026-10-28 Pacific)
([0e6aef3](https://github.com/VanillaIceCube/FullStackTemplate/commit/0e6aef3d05f6ddefd3b1d30e2d92cd4c29a33fc4)).
Registration validates against the prospective user before creation; auth forms
guard submission and show field/nested errors. Backend auth and frontend form
tests cover the resulting behavior; the backend README and changelog describe it.

**Learning:** `create_user` hashes passwords without running configured password
validators. Similarity checks also need the prospective username/email. Async
form guards must remain active through response parsing and error handling.

**Action:** Explicitly call `validate_password` with the prospective user before
creating accounts. Preserve reset-password whitespace, submission guards and
field-error coverage when editing authentication flows.

## 2026-09-08 - Notification State and Transaction Concurrency Guard

**Outcome:** [PR #137](https://github.com/VanillaIceCube/FullStackTemplate/pull/137)
merged on 2026-10-29 at 03:08:38 UTC (2026-10-28 Pacific)
([13d96b2](https://github.com/VanillaIceCube/FullStackTemplate/commit/13d96b26f0de2a666d487cfbcce53ef42abb0fcb)).
Recipient-scoped bulk mutations use `transaction.atomic()`; the notification
popover guards item/bulk actions, supports load retry and displays action errors.
Notification backend tests and `AppHeader` tests cover these paths.

**Learning:** Transactions preserve bulk mutation boundaries, while frontend
pending state prevents duplicate interactions through fetch and response parsing.
Neither mechanism alone replaces the other or guarantees all concurrency isolation.

**Action:** Keep bulk writes atomic, retain recipient scoping, and test pending
controls, retry and failed parsing before re-enabling actions or navigating.

## 2026-09-04 - Request Client Header Normalization and Session Sanitation

**Outcome:** [PR #120](https://github.com/VanillaIceCube/FullStackTemplate/pull/120)
merged on 2026-10-29 at 03:12:50 UTC (2026-10-28 Pacific)
([53b7909](https://github.com/VanillaIceCube/FullStackTemplate/commit/53b7909f2761f9a43c24a496961062d75c4a6c05)).
Request-client, auth-session and notification-client tests cover preserved headers,
stored-token injection, case-insensitive authorization replacement and stale
profile cleanup. The frontend README and changelog already describe the fix.

**Learning:** Spreading native `Headers` loses entries. Retrying after refresh
must retain custom headers while replacing authorization regardless of casing;
missing profile values must clear old session data rather than retain another login.

**Action:** Use `normalizeHeaders` for objects, tuples and native `Headers`;
verify refresh retries and stored/no-token notification requests, and trim or
remove username/email fields on every new persisted session.
