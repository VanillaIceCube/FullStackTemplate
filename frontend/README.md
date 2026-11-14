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
`dist/`. See the [frontend reference](REFERENCE.md) for routes and settings.

## 🧪 Checks

From `frontend/`:

```powershell
npm test
npm run lint:strict
npm run format:check
npm run build
```

For isolated browser tests, install backend dependencies, then run
`npx playwright install chromium` and `npm run test:e2e` from `frontend/`.
The reference covers disposable data, required ports, and failure reports.

## 📚 Reference

- [Routes, components, browser tests, and maintenance](REFERENCE.md).
- [Backend and MCP integration](../backend/README.md).
- [Docker dependencies and image maintenance](../deploy/README.md#development-dependency-reproducibility).


<details>
<summary>Routing, testing, and maintenance sections</summary>

<a id="development-and-checks"></a>

- [Development and checks](REFERENCE.md#development-and-checks)

<a id="routes-and-api-settings"></a>

- [Routes and API settings](REFERENCE.md#routes-and-api-settings)

<a id="-shared-mcp-framework"></a>

- [🔌 Shared MCP framework](REFERENCE.md#-shared-mcp-framework)

<a id="shared-request-and-session-handling"></a>

- [Shared request and session handling](REFERENCE.md#shared-request-and-session-handling)

<a id="-transitive-dependency-maintenance"></a>

- [🔒 Transitive dependency maintenance](REFERENCE.md#-transitive-dependency-maintenance)

<a id="development-dependency-reproducibility"></a>

- [Development dependency reproducibility](REFERENCE.md#development-dependency-reproducibility)

<a id="optional-isolated-browser-tests"></a>

- [Optional isolated browser tests](REFERENCE.md#optional-isolated-browser-tests)

</details>
