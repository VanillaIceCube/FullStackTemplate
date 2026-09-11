# Marty's Journal 🦀

## 2026-09-11 - Frontend Auth Submitting States **Learning:** React form submission buttons and inputs across Login, Register, ForgotPassword, and ResetPassword lacked `isSubmitting` guards, allowing duplicate in-flight API requests when clicked rapidly. **Action:** Always manage `isSubmitting` state in async auth forms, disable input fields and primary submit button during request execution, and guarantee state reset in `finally` blocks.
