# Marty's Journal

## 2026-09-17 - Password Validation Parity Across Auth Views **Learning:** `RegisterView` created users using `User.objects.create_user` directly, bypassing Django's `AUTH_PASSWORD_VALIDATORS` configured in `settings.py`, while `ResetPasswordView` explicitly ran `validate_password`. **Action:** Always ensure `validate_password(password, user=...)` is called in any view setting or changing passwords before persisting user objects.
