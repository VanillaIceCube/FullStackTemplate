# FullStackTemplate frontend

React 19 and Material UI 9 use Vite 8 with the React plugin. Tests run in Vitest
and jsdom with Testing Library; standalone ESLint 10 uses `eslint.config.mjs`.
Create React App, its Jest runtime, and the React Router export workaround have
been removed. The app shell, authentication routes, notifications, theme, and
real menu keyboard coverage are preserved.

## Development and checks

Use Node.js 24.15 or newer (the same minimum as MacroMapper):

```powershell
npm ci
npm start
npm test
npm run test:watch
npm run lint:strict
npm run format:check
npm run build
```

Vite listens on localhost:3000 and accepts `fullstacktemplate.localhost`.
Docker sets `HOST=0.0.0.0`; published development ports stay on loopback.
`CHOKIDAR_USEPOLLING=true` enables Docker source watching. The build is written
to `dist/`, which the frontend image copies into Nginx's static directory.

## Routes and API settings

Public routes are `/login`, `/register`, `/forgot-password`, and
`/reset-password?uid=...&token=...`. `/` is the protected starter page. Unknown
routes resolve to that protected page. Tokens live in sessionStorage; a failed
JWT refresh clears the session and redirects to login. Notifications remain
recipient-scoped.

Set `VITE_API_BASE_URL=http://localhost:8000` in the shell or an untracked
frontend `.env.local` for an explicit API origin. An unset development value
defaults to localhost:8000. Leave it unset or blank for production same-origin
requests. Vite exposes this value to the browser: never put secrets in `VITE_*`.
`import.meta.env.BASE_URL` provides the router/asset base; subdomain-root `/`
remains the default. `REACT_APP_*` and `PUBLIC_URL` are legacy CRA settings and
are not read by this template. See [the alignment and upgrade guide](../docs/FRONTEND-ALIGNMENT.md).

Keep React/React DOM on matching versions and Material UI/icons on compatible
v9 versions. Use `sx` for layout and `slotProps` for component slots. Supported
build targets are Chrome 117, Edge 121, Firefox 121, and Safari 17 or newer.

Production frontend releases publish no host port. The Infrastructure gateway
serves the same-origin app domain; Vite still builds `dist/` with a blank API
base. Follow [the production guide](../deploy/production/README.md).


## 🔌 Shared MCP framework

See [the MCP framework guide](../docs/MCP-FRAMEWORK.md). Optional consent and Connected Apps routes require `VITE_MCP_ENABLED=1` in the template/MacroMapper; Notoli keeps its existing enabled UI. Preserve JWT-only consent and validated connection return paths.

## Shared request and session handling

`apiFetch` preserves plain-object, tuple-array, and native `Headers` entries
through token refresh. Protected requests use the stored access token when the
caller omits authorization; explicit authorization is preserved until a refresh
requires replacement. Authentication-form requests do not receive an injected
access token. Session profile values are trimmed, and missing or blank username
and email fields clear stale values.

## 🔒 Transitive dependency maintenance

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
versions, regenerate the lockfile and repeat those checks. Canonical rollout:
[FullStackTemplate #267](https://github.com/VanillaIceCube/FullStackTemplate/issues/267).

## Development dependency reproducibility

Development images pin reviewed multi-platform Node 26 and Miniforge 26.9.4-0
registry digests. Production Dockerfiles and the independent release engine are
unchanged by this development-image policy. Refresh tags/digests together after
registry verification and a disposable build/configuration check.

The frontend development entrypoint hashes both `package.json` and
`package-lock.json` inside its persistent `node_modules` volume. Fresh volumes
install with `npm ci`; unchanged restarts reuse dependencies; changing either
manifest reinstalls. Missing manifests or a failed installation stop startup and
retry on the next invocation. Use one volume per checkout and restart after edits.
Run `node --test tests/dev-dependencies.test.cjs` from the repository root for the
credential-free mocked lifecycle/exit-status regression. Compose configuration
checks do not deploy or touch application data.
