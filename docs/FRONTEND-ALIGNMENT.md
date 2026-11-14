# Frontend alignment and CRA upgrade guide

The shared build baseline is Vite 8.3.4 with `@vitejs/plugin-react` 6.1.2,
port 3000, explicit API-base configuration, a production static build, and
same-origin production routing. App features and compatibility aliases remain
app-owned. Infrastructure owns gateway/release tooling, not a browser app.

| Repository | Build | Tests | API setting | Static output |
| --- | --- | --- | --- | --- |
| MacroMapper | Vite 8 / React plugin 6 | Vitest 5 / jsdom | `VITE_API_BASE_URL` | `dist/` |
| Notoli | Vite 8 / React plugin 6 | Standalone Jest 30 / Babel 7 | existing `REACT_APP_API_BASE_URL` compatibility mapping | `build/` |
| FullStackTemplate | Vite 8 / React plugin 6 | Vitest 5 / jsdom | `VITE_API_BASE_URL` | `dist/` |

MacroMapper supplies the template's native Vite/Vitest convention. Notoli already
uses Vite; its environment alias and output directory preserve its existing
deployment interface, and its independent Jest suite is not CRA. Those explicit
compatibility choices do not require a production migration in this PR.

## Upgrade an existing template-derived app

1. Replace `react-scripts`, `eslint-config-react-app`, and the legacy eslintrc
   file with the Vite/React plugin, Vitest/jsdom, and compatible flat ESLint
   configuration. Keep application React/Router/MUI versions independently
   reviewed. Regenerate the npm lockfile without force or legacy-peer-deps.
2. Move `public/index.html` to `frontend/index.html`, add the JSX module entry,
   replace CRA public URL placeholders with Vite's BASE_URL, and retain assets
   in `public/`. Use `import.meta.env.BASE_URL` for router/redirect prefixes.
3. Rename the API variable in app code, frontend environment files, Docker
   build arguments, Compose, CI, and deployment settings to `VITE_API_BASE_URL`.
   Unset development defaults and blank production same-origin values differ;
   test both. No secret belongs in a Vite browser environment variable.
4. Convert Jest mocks to Vitest (including hoisted mock factories and ESM
   imports). Replace process-env stubs with `vi.stubEnv`; keep actual MUI menu
   contexts and keyboard behavior in tests. Remove CRA-only Router mappings.
5. Copy `dist/` in the frontend image and keep Nginx history fallback routing.
   Enable polling explicitly in Vite for Docker. Keep host ports on loopback
   and allow only the app's local hostname.
6. Update initialization rules for `.mjs`/`.cjs` files, then initialize a sample
   repository. Run clean install, peer validation, tests, lint, formatting, build,
   environment-value checks, and dev-server/deep-link checks. Do not deploy as
   part of this source migration.

The production release architecture is a separate change tracked in #217.
