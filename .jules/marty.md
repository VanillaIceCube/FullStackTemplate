# Marty's Journal

## 2026-09-18 - Password Validation in Django Registration
**Learning:** `User.objects.create_user` in Django hashes passwords using `set_password` but does not automatically execute Django's configured `AUTH_PASSWORD_VALIDATORS`.
**Action:** Always invoke `django.contrib.auth.password_validation.validate_password(password)` explicitly in DRF registration views before creating users.
