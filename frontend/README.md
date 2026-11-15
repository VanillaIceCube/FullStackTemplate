# 🎨 FullStackTemplate frontend

The React application uses Vite and Material UI for pages, navigation,
authentication, and the application shell.

## 🧭 Structure

- `src/components/`: reusable interface components.
- `src/pages/`: application pages and routes.
- `src/services/`: API requests and session handling.
- `src/__tests__/`, `e2e/`: component and isolated browser tests.

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

An unset API origin defaults to localhost:8000 during development. Configure an
explicit origin in the shell or ignored `.env.local`; leave it blank in production.
Vite's `import.meta.env.BASE_URL` supplies the router/asset base. Development uses
port 3000; production Nginx serves the static build and preserves SPA deep links.

## 🗺️ Routes and behavior

Public routes are `/login`, `/register`, `/forgot-password`, and
`/reset-password?uid=...&token=...`. `/` is the protected starter page. Unknown
routes resolve to that protected page. Tokens live in sessionStorage; a failed
JWT refresh clears the session and redirects to login. Notifications remain
recipient-scoped.

## 🔐 Sessions and connections

Authentication forms disable submission while pending. Tokens and profile data
live in `sessionStorage`; new sessions trim profile fields and clear absent values.
Protected requests use the stored JWT when the caller omits Authorization.
Public authentication forms do not receive an injected access token.

The request wrapper preserves object, tuple-array, and native `Headers` values
through one JWT refresh/retry. Invalid refresh credentials clear the session;
temporary refresh failures retain it. Notification failures keep actions available
for Retry, and malformed mark-read responses must not navigate away.
Use semantic links for destinations and buttons for actions, with keyboard and
native new-tab coverage.

Optional consent and Connected Apps use `VITE_MCP_ENABLED=1`. Preserve JWT-only
consent and validated return paths. See the [backend MCP guide](../backend/README.md#-mcp-integration).

## 🎨 Style guide

### Foundations
- Use Material UI components and responsive `sx` values before adding custom
  layout primitives.
- Keep colors in the CSS custom properties declared in `src/App.css`.
- Preserve Notoli's theme tokens: dark `#1a1a1a` backgrounds, pale-yellow
  `#f5e79e` surfaces, amber `#ffc107` accents, gray `#555555` controls and
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

From `frontend/`:

```powershell
npm test
npm run lint:strict
npm run format:check
npm run build
```

## 🌐 Browser tests

`frontend/e2e/` owns the browser journeys and their helpers: `run_e2e.cjs` creates
and cleans up disposable state, `e2e_backend.py` starts the isolated loopback
backend, `e2e_settings.py` suppresses developer dotenv loading and selects temporary
SQLite/file mail, and `collect_browser_artifacts.py` collects bounded failure
evidence. `npm run test:e2e` invokes the runner from `frontend/`; CI collects reports
with `python e2e/collect_browser_artifacts.py` from the same directory.

Install backend requirements in an activated Python environment. From `frontend/`:

```powershell
npx playwright install chromium
npm run test:e2e
```

Ports 8001 and 3001 must be free. The wrapper starts Django and Vite with fresh,
marked temporary state and stops both before deleting that state. It uses synthetic
users, temporary SQLite and file mail; it does not load developer `.env` files,
reuse running servers, send external email, or make paid AI calls. The shared auth
journeys cover registration, session isolation, logout, protected routing, invalid
credentials, JWT expiry, and password reset. Product journeys belong under `e2e/`.

The suite uses one Chromium worker, no retries, and a ten-minute global timeout.
Linux CI installs Chromium with `--with-deps`. Failure artifacts are written to
`test-results/` and `playwright-report/`; CI retains bounded evidence for seven
days. Reports may include disposable tokens, so do not publish them in issues.

## 🛠️ Maintenance

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
jsdom CSS assertions, check computed transition/animation longhands and use real
browser tests for responsive geometry. Follow the Node range in `package.json`,
and verify clean installs, strict lint, formatting, tests and production builds.
See [Docker dependency maintenance](../deploy/README.md#development-dependency-reproducibility).

## 📚 Related guides

- [Backend and MCP integration](../backend/README.md).
- [Local Docker and production releases](../deploy/README.md).
