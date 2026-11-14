# 🔌 FullStackTemplate plugins

This folder is the entry point for client-facing plugin documentation and
packages. Application tools, OAuth, and permissions live in the backend.

## 🧭 Current integration

The template provides an optional backend MCP framework and a sample tool.
A derived application supplies its own domain tools and client package.

- [Backend MCP integration](../backend/README.md#-mcp-integration).
- [Shared MCP framework](../backend/mcp_framework/README.md).

## 📦 Package layout

Application-specific packages use `plugins/<application-slug>/`. That folder
owns the client manifest, listing metadata, artwork, packaging helpers, and
connection instructions when a package is maintained. Backend deployment and
client listing updates are separate operations.

This repository currently has no checked-in client listing package.
