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
