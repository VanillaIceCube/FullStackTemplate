# Marty's Journal

## 2026-09-04 - Request Client Header Normalization and Session Sanitation **Learning:** Spreading `Headers` objects in JavaScript produces empty objects (`{ ...new Headers() }` -> `{}`), causing headers to be dropped when `apiFetch` retries requests after token refresh. **Action:** Always use `normalizeHeaders` in `requestClient.js` when handling request options so headers are safely preserved regardless of whether callers pass plain objects, `Headers` instances, or header arrays.
