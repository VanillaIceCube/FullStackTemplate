# Marty the Crab - Learnings Journal

## 2026-09-08 - Notification State and Transaction Concurrency Guard **Learning:** Bulk notification operations (`mark_all_read` and `clear_all`) require database transaction isolation (`transaction.atomic()`), and frontend notification popovers need per-notification action state tracking (`pendingIds`) to prevent duplicate clicks and race conditions. **Action:** Always wrap DRF bulk update/delete actions in `transaction.atomic()` and disable notification buttons during pending async updates.
