"""Sample tools belonging to the template application."""

from django.conf import settings
from mcp.types import ToolAnnotations

from apps.mcp.framework.server import create_server as create_framework_server


def create_server():
    server = create_framework_server(
        instructions="This sample checks the authenticated connection only. It has no application data tools."
    )

    @server.tool(
        annotations=ToolAnnotations(
            readOnlyHint=True,
            destructiveHint=False,
            idempotentHint=True,
            openWorldHint=False,
        ),
        structured_output=True,
        meta={
            "securitySchemes": [
                {"type": "oauth2", "scopes": settings.MCP_REQUIRED_SCOPES}
            ]
        },
    )
    async def connection_status() -> dict[str, bool]:
        """Confirm this authenticated MCP connection without reading application data."""
        return {"connected": True}

    return server
