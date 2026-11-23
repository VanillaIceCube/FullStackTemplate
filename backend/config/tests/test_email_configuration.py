"""Project email selection, credentials and bounded timeouts."""

import importlib.util
import os
from pathlib import Path
from unittest.mock import patch

from django.test import SimpleTestCase

from .helpers import BACKEND


class EmailConfigurationTests(SimpleTestCase):
    def configured_settings(self, **environment):
        values = {
            "DJANGO_EMAIL_BACKEND": "",
            "DJANGO_EMAIL_HOST_KEY": "fixture-key",
            "DJANGO_EMAIL_TIMEOUT": "10",
            **environment,
        }
        spec = importlib.util.spec_from_file_location(
            "email_settings_fixture",
            Path(__file__).resolve().parents[1] / "settings.py",
        )
        module = importlib.util.module_from_spec(spec)
        with patch.dict(os.environ, values), patch("dotenv.load_dotenv"):
            spec.loader.exec_module(module)
        return module

    def test_existing_key_mapping_and_local_backend_selection(self):
        module = self.configured_settings()
        self.assertEqual(
            module.EMAIL_BACKEND, "django.core.mail.backends.console.EmailBackend"
        )
        self.assertEqual(module.ANYMAIL["RESEND_API_KEY"], "fixture-key")
        self.assertFalse(module.ANYMAIL["DEBUG_API_REQUESTS"])
        for selected in [
            "django.core.mail.backends.smtp.EmailBackend",
            "custom.backend.EmailBackend",
            BACKEND,
        ]:
            with self.subTest(backend=selected):
                self.assertEqual(
                    self.configured_settings(
                        DJANGO_EMAIL_BACKEND=selected
                    ).EMAIL_BACKEND,
                    selected,
                )

    def test_known_legacy_selectors_are_not_rewritten(self):
        for selected in [
            "authentication.email_backends.ResendApiEmailBackend",
            "apps.authentication.email_backends.ResendApiEmailBackend",
            "apps.email.backends.ResendApiEmailBackend",
        ]:
            with self.subTest(backend=selected):
                self.assertEqual(
                    self.configured_settings(
                        DJANGO_EMAIL_BACKEND=selected
                    ).EMAIL_BACKEND,
                    selected,
                )

    def test_timeout_is_bounded_with_existing_safe_fallback(self):
        for supplied, expected in [
            ("", 10),
            ("0", 10),
            ("-1", 10),
            ("31", 10),
            ("1", 1),
            ("7", 7),
            ("30", 30),
        ]:
            with self.subTest(timeout=supplied):
                self.assertEqual(
                    self.configured_settings(DJANGO_EMAIL_TIMEOUT=supplied).ANYMAIL[
                        "REQUESTS_TIMEOUT"
                    ],
                    expected,
                )
        with self.assertRaises(ValueError):
            self.configured_settings(DJANGO_EMAIL_TIMEOUT="not-a-number")

    def test_blank_key_is_not_configured_for_an_outbound_request(self):
        for supplied in ["", "   "]:
            with self.subTest(key=supplied):
                self.assertNotIn(
                    "RESEND_API_KEY",
                    self.configured_settings(DJANGO_EMAIL_HOST_KEY=supplied).ANYMAIL,
                )
