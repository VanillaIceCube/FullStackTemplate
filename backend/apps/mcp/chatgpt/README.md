# 🔌 FullStackTemplate ChatGPT starter

This is a starter package for a derived application. Its `app.example.com`
origin is an example, and the backend MCP profile is disabled by default.
The package builder refuses that unchanged example endpoint.

## 🚦 Prepare a derived application

1. Manually update the application name, slug, host, client ID, scopes, and artwork
   text in the starter configuration and package metadata.
2. Implement and review the application-owned tools and permissions. The sample
   `connection_status` tool reads no application data.
3. Configure the real HTTPS origin and enable the backend/frontend MCP profiles
   as described in the [MCP README](../framework/README.md).
4. Register the public OAuth client using the exact callback supplied by the
   client. Review the application branding and package metadata before building.

<a id="-files"></a>

## 🧭 Structure

- `plugin.json`: starter listing metadata and presentation.
- `mcp.json`: predefined public OAuth client and connection scope.
- `assets/`: copied starter artwork; replace with the application's own mark.
- `build_package.py`, `build_listing.py`: portable and existing-listing builders.


## 🧰 Build and validate packages

Run the offline regression suite from the repository root:

```powershell
python -m unittest discover -s backend/apps/mcp/framework/chatgpt -p "test_*.py" -v
```

To build a portable ZIP containing only `plugin.json`, `mcp.json`, and referenced
artwork, write the output outside the source directory:

```powershell
python backend/apps/mcp/chatgpt/build_package.py --output "$env:TEMP/application-chatgpt.zip"
```

The portable archive contains no account-specific `.app.json`, source code,
test files, or exported account credentials. Building it does not install,
register, publish, or deploy the integration.

For an existing personal listing, download that plugin's export first and run:

```powershell
python backend/apps/mcp/chatgpt/build_listing.py `
  --export "$env:USERPROFILE/Downloads/plugin.zip" `
  --output "$env:TEMP/application-listing.zip" `
  --version 1.0.1
```

Choose a version greater than the export's current version. The overlay verifies
the expected display name and preserves the exported plugin name, app mapping,
and other exported files. Upload through the existing plugin's update flow
when authorized. No registered app ID is stored or invented in this repository.

The listing builder rejects unsafe archive paths, symlinks and duplicate names
before writing output. Exports are limited to 1,000 members, 10 MiB per member,
and 50 MiB compressed or expanded. The original export remains unchanged.
