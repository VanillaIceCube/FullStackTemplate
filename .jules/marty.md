# Marty's Journal - Critical Learnings

## 2026-09-13 - Backend Django Password Validation and Email Normalization **Learning:** `RegisterView` needs explicit `validate_password(password, user=User(username=username, email=email))` calls to enforce password complexity rules prior to `create_user()`, and `EmailTokenObtainPairSerializer` requires string stripping on email input to ensure whitespace in email inputs does not cause auth mismatch. **Action:** Always enforce password validation in registration views and normalize string inputs before serializer authentication.
