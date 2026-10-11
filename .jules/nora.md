## 2026-09-09 - Colocate domain layout components and maintain JSX extension consistency

**Learning:** Component layout shells specific to a single domain (such as `AuthPageShell`) belong in feature/domain component folders rather than global layout roots. Maintaining consistent `.jsx` file extensions across all React components prevents structural drift and static test resolution failures.

**Action:** Ensure global `src/components` contains only top-level, application-wide layout or bridge components. Place domain-specific page shells and components inside dedicated domain component directories (e.g., `src/components/authentication/`). Enforce `.jsx` file extension across all React component definitions.
