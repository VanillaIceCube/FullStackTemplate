# Marty's Journal

## 2026-09-03 - DRF Error Parsing & Authentication Form Submitting States
**Learning:** Django REST Framework validation errors returned as objects (e.g. `{"email": ["This field is required."]}`) or `non_field_errors` arrays were previously unformatted or lost when parsed by standard string-fallback functions. Additionally, form submit handlers on auth pages lacked `isSubmitting` guards, allowing rapid multi-submission clicks.
**Action:** Always format DRF field error objects into user-readable strings and guard async form submissions with `isSubmitting` state and `finally` reset blocks across all authentication views.
