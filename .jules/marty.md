# Marty's Journal

## 2026-09-18 - Password Validation in Django Registration
**Learning:** `User.objects.create_user` in Django hashes passwords using `set_password` but does not automatically execute Django's configured `AUTH_PASSWORD_VALIDATORS`.
**Action:** Always invoke `django.contrib.auth.password_validation.validate_password(password)` explicitly in DRF registration views before creating users.

## 2026-09-06 - Resend API Email Backend Error Handling & Payload Formatting
**Learning:** In Python's `urllib.request.urlopen`, non-2xx status responses raise `urllib.error.HTTPError` directly before entering the context manager block, making status code checks inside `with request.urlopen` unreachable for HTTP errors. Additionally, Django `EmailMessage` instances using `content_subtype = "html"` or `reply_to` require explicit payload mapping for the Resend API.
**Action:** Future runs touching `ResendApiEmailBackend` or custom urllib-based API clients should wrap `request.urlopen` in a `try...except error.HTTPError` block to catch and parse error response bodies, and verify `reply_to` and `content_subtype` payload bindings.
