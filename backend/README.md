# 🛠️ FullStackTemplate backend

The Django REST Framework backend owns application data, authentication,
permissions, notifications, and application integrations.

## 🧭 Structure

- `app/`: settings and server entry points.
- `authentication/`, `notifications/`: accounts and notifications.
- `app_mcp/`: reusable MCP transport and OAuth.

## 💻 Local development

Use Python 3.12 in an isolated environment. From the repository root:

```powershell
python -m pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py runserver 8000
```

Local settings can be supplied in ignored `backend/.env`. See the
[configuration and API reference](REFERENCE.md) for settings and endpoint details.
For Docker hot reload, follow the [deployment guide](../deploy/README.md).

## 🧪 Checks

From the repository root:

```powershell
python backend/manage.py test
ruff check backend
ruff format backend --check
python backend/manage.py makemigrations --check --dry-run
```

## 🔌 MCP integration

The [MCP README](app_mcp/README.md) explains shared transport,
OAuth, configuration, and verification.

The template is disabled by default and provides a sample connection tool;
derived applications implement and enable their own tools.

Connection manifests, artwork, and package builders live in
[chatgpt/](app_mcp/chatgpt/README.md).

## 📚 Reference

Use the [backend reference](REFERENCE.md) for API contracts, configuration,
email delivery, and maintenance details. Live-server procedures belong to
the [production guide](../deploy/production/README.md).


<details>
<summary>API, configuration, and maintenance sections</summary>

<a id="structure"></a>

- [Structure](REFERENCE.md#structure)

<a id="authentication-api"></a>

- [Authentication API](REFERENCE.md#authentication-api)

<a id="notification-api"></a>

- [Notification API](REFERENCE.md#notification-api)

<a id="local-setup"></a>

- [Local setup](REFERENCE.md#local-setup)

<a id="docker-hot-reload"></a>

- [Docker hot reload](REFERENCE.md#docker-hot-reload)

<a id="email"></a>

- [Email](REFERENCE.md#email)

<a id="checks"></a>

- [Checks](REFERENCE.md#checks)

<a id="shared-gateway-production-boundary"></a>

- [Shared-gateway production boundary](REFERENCE.md#shared-gateway-production-boundary)

<a id="-shared-mcp-framework"></a>

- [🔌 Shared MCP framework](REFERENCE.md#-shared-mcp-framework)

<a id="development-dependency-reproducibility"></a>

- [Development dependency reproducibility](REFERENCE.md#development-dependency-reproducibility)

<a id="disposable-browser-test-backend"></a>

- [Disposable browser-test backend](REFERENCE.md#disposable-browser-test-backend)

<a id="transactional-email-failure-handling"></a>

- [Transactional email failure handling](REFERENCE.md#transactional-email-failure-handling)

<a id="authentication-and-notification-maintenance"></a>

- [Authentication and notification maintenance](REFERENCE.md#authentication-and-notification-maintenance)

<a id="production-verification"></a>

- [Production verification](REFERENCE.md#production-verification)

</details>
