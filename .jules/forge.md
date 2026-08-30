# Forge's Journal - Critical Learnings

This journal contains codebase-specific patterns, architectural constraints, and critical learnings to guide future runs.

## 2026-03-30 - Session Storage Management in Auth
**Learning:** `persistAuthSession` in `frontend/src/services/authSession.js` should explicitly remove stale profile keys (`username`, `email`) when not present in a new session payload to avoid displaying previous user credentials in UI header.
**Action:** Always clean up non-supplied session storage keys when persisting new auth data.
