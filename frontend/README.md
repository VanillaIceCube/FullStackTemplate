# 🎨 FullStackTemplate frontend

The React application uses Vite and Material UI for pages, navigation,
authentication, and the application shell.

## 🧭 Structure

- `docker/`: production/development Dockerfiles and Nginx configuration.
  Docker builds keep `frontend/` as their context; `.dockerignore` stays at the
  frontend root.
- `src/theme.js`: application palette, document typography, shared Material UI defaults
  and the existing CSS color variables, applied through `ThemeProvider` and `CssBaseline`.
- `src/index.css`: platform font rendering and remaining app-specific global rules,
  loaded by `src/index.jsx`. Keep responsive page geometry in the owning component.
- `src/components/`: reusable interface components.
- `src/pages/`: application pages and routes.
- `src/services/`: API requests and session handling.
- `src/test-helpers/`: shared test setup and reusable helpers.
  App, startup and feature tests stay beside the files they exercise.

## 💻 Local development

Use Node.js 24.15+ within 24.x or Node.js 26.x, matching `package.json`.
From the repository root:

```powershell
Set-Location frontend
npm ci
npm start
```

Open `http://fullstacktemplate.localhost:3000`. For Docker hot reload, follow the
[deployment guide](../deploy/README.md).

## ⚙️ Configuration

`VITE_API_BASE_URL` controls the API origin. Leave it blank for production same-origin
requests; client-side settings must contain no secrets. The build output is
`dist/`.

Development Compose supplies `VITE_API_BASE_URL` through its `environment`
settings. Production Docker builds pass the matching build argument, which is
compiled into the static assets; a blank value selects same-origin requests.
Local `.env` files are excluded from Docker build contexts.

For direct `npm` development, an unset API origin uses `http://localhost:8000`.
An explicit shell value overrides that default; an explicit blank uses same-origin.
Vite's `import.meta.env.BASE_URL` supplies the router/asset base. Development uses
port 3000; production Nginx serves the static build and preserves SPA deep links.

## 🗺️ Routes and behavior

Public routes are `/login`, `/register`, `/forgot-password`, and
`/reset-password?uid=...&token=...`. `/` is the protected starter page. Unknown
routes resolve to that protected page. Tokens live in sessionStorage; a failed
JWT refresh clears the session and redirects to login. Notifications remain
recipient-scoped.

Authentication-page destinations use React Router links with real `href` values,
keyboard activation and native new-tab behavior. Connected Apps is discoverable
in the profile menu when the connector is enabled.

## 🔐 Sessions and connections

Authentication forms disable submission while pending. Tokens and profile data
live in `sessionStorage`; new sessions trim profile fields and clear absent values.
Protected requests use the stored JWT when the caller omits Authorization.
Public authentication forms do not receive an injected access token.

The request wrapper preserves object, tuple-array, and native `Headers` values
through one JWT refresh/retry. Invalid refresh credentials or a second protected
401 after refresh clear the session;
temporary refresh failures retain it. Refresh results belong to the login that
started them: logout or a new login invalidates pending work. Background failures
preserve an active, validated connection path and query through login.
Notification failures keep actions available
for Retry, and malformed mark-read responses must not navigate away.
Use semantic links for destinations and buttons for actions, with keyboard and
native new-tab coverage.

Optional consent and Connected Apps use `VITE_MCP_ENABLED=1`. Preserve JWT-only
consent and validated return paths. See the [backend MCP guide](../backend/README.md#-mcp-integration).

### Connections response contract

Successful consent, decision, list and revoke responses must be JSON objects.
Unreadable, empty, null, scalar or array successes reject with `Request failed.`;
a protocol failure must not follow a callback or claim revocation succeeded.
HTTP failures use the first nonblank string in `error_description`, `detail`, then
`error`, otherwise `HTTP <status>`. Never expose raw HTML/plaintext, parser errors,
nested objects or unrelated JSON fields as fallback messages. Backend public error
fields must be safe to display. Preserve JWT-only headers, omitted cookies, form
encoding, signed consent tickets and validated callbacks. Invalid refresh credentials
clear the session; transient proxy/refresh failures retain it for retry. All three applications share the same post-refresh 401
and session-lifecycle contract.

## 🎨 Style guide

`src/theme.js` owns the dark document background, pale-yellow paper surfaces and
neutral gray controls. MUI uses light control semantics on these pale surfaces;
body text remains white on the dark document. Preserve the system document font,
Roboto MUI controls and content-box document sizing when changing the baseline.
The four existing CSS color variables come from this theme, not duplicated CSS
literals. App bars, overlay frames, outlined white fields and focus colors share
theme defaults. Standard inline editors remain transparent; specialized field
surfaces, divider emphasis/insets and responsive layout remain component-owned.
Test helpers use the actual app theme with only ripple suppression added.

### Foundations

- Use Material UI components and responsive `sx` values before adding custom
  layout primitives.
- Define colors once in `src/theme.js`; `CssBaseline` exposes the existing CSS custom
  properties for component-specific styles.
- Preserve Notoli's theme tokens: dark `#1a1a1a` backgrounds, pale-yellow
  `#f5e79e` surfaces, gray `#555555` controls and
  surface text, and white `#ffffff` text on dark backgrounds.
- Use the FullStackTemplate secondary color for focused Material UI text
  fields.
- Keep authenticated and public routes visually consistent with the shared
  application shell.

### Authentication

- Build public authentication pages with `AuthPageShell`.
- Give every form a visible heading, native submit behavior, and browser
  autocomplete metadata.
- Show API outcomes through the shared application snackbar.
- Avoid exposing whether an email address belongs to an account in
  forgot-password responses.

### Application shell

- Keep `Full Stack Template` as the placeholder app-header title until a
  generated application replaces it.
- Preserve the generic drawer, notification, profile, and logout entry points
  when adding application routes.
- Replace the placeholder Paper with application content instead of expanding
  the template into another sample domain.
- Add future product routes behind `AuthenticatedRoute` unless they are
  intentionally public.

## 🧪 Checks

Keep every test beside its implementation with the same basename and extension:
`Component.jsx` pairs with `Component.test.jsx`, and `service.js` pairs with
`service.test.js`. Put behavior and integration scenarios in that owning suite
using scoped `describe` blocks, rather than adding standalone behavior-named or
`.integration.test` files. JavaScript hooks and components that return no JSX keep
`.test.js` harnesses using `createElement` when necessary. Shared setup and reusable
helpers belong in `src/test-helpers/`; tests of a domain package's public API pair
with its `index.js` entry point.

Keep shared session, request, connection and navigation regressions aligned across
FullStackTemplate, MacroMapper and Notoli when the behavior applies. Preserve real
React Router and Material UI keyboard/exit coverage when consolidating suites;
app-specific domain and route expectations remain in their owning application.

`AuthPageShell.test.jsx` checks the accessible heading and native keyboard form
submission. The small `sessionState.js` version counter is covered through
`requestClient.test.js` logout, account-switch and concurrent-refresh regressions;
avoid duplicate tests that only restate its getter/increment implementation.

`src/index.test.jsx` boots the real entry point, React root and application in
jsdom, then checks the signed-out login route and usable form without private API
requests or uncaught startup errors. It unmounts the real root and restores test
state afterward. It also types into the themed login field and verifies shared
focus/action colors, document sizing and font ownership. Existing Material UI test
shims still apply; browser layout and built HTML are outside this test's scope.

`npm run build` runs strict lint before Vite's production build. Use
`npm run lint:fix` to apply available lint fixes.

From `frontend/`:

```powershell
npm test
npm run lint:strict
npm run format:check
npm run build
```

## 🛠️ Maintenance

Shared frontend dependency ranges align across the template and both applications:
React/React DOM 19.3.1, Material UI/icons 9.5, React Router 8.5.1, and Prettier 3.10.
Use `react-router` imports. Testing Library belongs in development dependencies;
TypeScript is explicitly pinned for the tooling peer graph. Keep app-specific
packages, including Notoli drag-and-drop and its test lint plugin, app-owned.

The frontend temporarily overrides `minimatch@>=9 <11.0.1` to `^11.0.1` for
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).
ESLint, its config-array, the JSX accessibility plugin and typescript-estree
still request older majors; upgrading ESLint alone does not remove the advisory.
The lockfile resolves minimatch 11.0.4. These are build/lint dependencies, not
browser globbing APIs. Keep the version selector scoped to the affected modern
API family; do not apply it to legacy callable minimatch 3 consumers.

Minimatch 11 removes `makeRe`, `AST` and internal matcher methods. The current
parents use the retained matching API. Validate a clean `npm ci`, `npm ls
minimatch glob --all`, strict lint, tests and the production build whenever a
parent or override changes. Review upstream API changes before widening the
selector. Remove overrides once all parent ranges natively accept patched
versions, regenerate the lockfile and repeat those checks.

Keep Material UI and icons on compatible versions and regenerate the lockfile
together. Prefer `sx` and `slotProps`; preserve accessible control labels. For
jsdom CSS assertions, check computed transition/animation longhands; inspect
responsive geometry in a browser. Follow the Node range in `package.json`,
and verify clean installs, strict lint, formatting, tests and production builds.
See [Docker dependency maintenance](../deploy/README.md#development-dependency-reproducibility).

<a id="-related-guides"></a>

## 📚 Reference

- [Backend and MCP integration](../backend/README.md).
- [Local Docker and production releases](../deploy/README.md).
