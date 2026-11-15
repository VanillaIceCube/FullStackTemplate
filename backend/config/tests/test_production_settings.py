"""Signing keys, cookie policy and production configuration."""

import importlib.util
import os
from pathlib import Path
from unittest.mock import patch

from django.test import RequestFactory, SimpleTestCase, override_settings


class ProductionSecretContractTests(SimpleTestCase):
    def settings_values(self, secret):
        import os
        import runpy
        from pathlib import Path
        from unittest.mock import patch

        environment = {
            "DJANGO_DEBUG": "0",
            "DJANGO_ALLOWED_HOSTS": "app.example.com",
        }
        if secret is not None:
            environment["DJANGO_SECRET_KEY"] = secret
        with (
            patch.dict(os.environ, environment, clear=True),
            patch("dotenv.load_dotenv"),
        ):
            return runpy.run_path(
                str(Path(__file__).resolve().parents[1] / "settings.py")
            )

    def test_production_rejects_missing_empty_and_whitespace_secrets(self):
        from django.core.exceptions import ImproperlyConfigured

        for secret in (None, "", "   "):
            with self.subTest(secret=secret):
                with self.assertRaisesMessage(
                    ImproperlyConfigured, "DJANGO_SECRET_KEY is required"
                ):
                    self.settings_values(secret)

    def test_production_accepts_an_explicit_secret(self):
        value = "isolated-production-settings-contract-key"
        settings = self.settings_values(value)
        self.assertEqual(settings["SECRET_KEY"], value)
        self.assertFalse(settings["DEBUG"])


class GatewayHostTests(SimpleTestCase):
    @override_settings(
        ALLOWED_HOSTS=["app.example.com"],
        SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO", "https"),
    )
    def test_canonical_host_wins_over_a_forwarded_host(self):
        request = RequestFactory().get(
            "/api/notifications/",
            HTTP_HOST="app.example.com",
            HTTP_X_FORWARDED_HOST="attacker.invalid",
            HTTP_X_FORWARDED_PROTO="https",
        )
        self.assertEqual(request.get_host(), "app.example.com")
        self.assertTrue(request.is_secure())


class ProductionCookieTests(SimpleTestCase):
    def test_cookie_security_follows_debug_for_both_mcp_profiles(self):
        for debug in ("0", "1"):
            for mcp_enabled in ("0", "1"):
                with self.subTest(debug=debug, mcp_enabled=mcp_enabled):
                    environment = {
                        "DJANGO_DEBUG": debug,
                        "DJANGO_MCP_ENABLED": mcp_enabled,
                        "DJANGO_SECRET_KEY": "disposable-settings-test-key",
                        "DJANGO_ALLOWED_HOSTS": "app.example.com",
                    }
                    spec = importlib.util.spec_from_file_location(
                        "cookie_test_settings",
                        Path(__file__).resolve().parents[1] / "settings.py",
                    )
                    module = importlib.util.module_from_spec(spec)
                    with (
                        patch.dict(os.environ, environment),
                        patch("dotenv.load_dotenv"),
                    ):
                        spec.loader.exec_module(module)
                    self.assertEqual(module.SESSION_COOKIE_SECURE, debug == "0")
                    self.assertEqual(module.CSRF_COOKIE_SECURE, debug == "0")
