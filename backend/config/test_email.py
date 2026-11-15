"""Project-owned Anymail configuration and mocked Resend API boundaries."""

import importlib.util
import io
import json
import os
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

from anymail.exceptions import AnymailConfigurationError, AnymailError
from django.core.mail import EmailMessage, EmailMultiAlternatives, get_connection
from django.test import SimpleTestCase, override_settings
from requests import Response
from requests.exceptions import ConnectionError, Timeout

BACKEND = "anymail.backends.resend.EmailBackend"
ANYMAIL_SETTINGS = {
    "RESEND_API_KEY": "fixture-key",
    "REQUESTS_TIMEOUT": 7,
    "DEBUG_API_REQUESTS": False,
}


def api_response(status_code=200):
    response = Response()
    response.status_code = status_code
    response._content = b'{"id":"fixture-message-id"}'
    response.encoding = "utf-8"
    return response


class EmailConfigurationTests(SimpleTestCase):
    def configured_settings(self, **environment):
        values = {
            "DJANGO_EMAIL_BACKEND": "",
            "DJANGO_EMAIL_HOST_KEY": "fixture-key",
            "DJANGO_EMAIL_TIMEOUT": "10",
            **environment,
        }
        spec = importlib.util.spec_from_file_location(
            "email_settings_fixture", Path(__file__).with_name("settings.py")
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

    def test_known_legacy_selectors_use_the_maintained_backend(self):
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
                    BACKEND,
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


@override_settings(EMAIL_BACKEND=BACKEND, ANYMAIL=ANYMAIL_SETTINGS)
class AnymailDeliveryBoundaryTests(SimpleTestCase):
    def message(self):
        return EmailMessage(
            "fixture-subject",
            "fixture-body",
            "sender@example.test",
            ["recipient@example.test"],
        )

    @patch("requests.sessions.Session.request")
    def test_delivery_uses_existing_key_timeout_and_resend_endpoint(self, request):
        request.return_value = api_response()
        output = io.StringIO()
        with redirect_stdout(output):
            self.assertEqual(get_connection().send_messages([self.message()]), 1)
        request.assert_called_once()
        params = request.call_args.kwargs
        self.assertEqual(params["url"], "https://api.resend.com/emails")
        self.assertEqual(params["headers"]["Authorization"], "Bearer fixture-key")
        self.assertEqual(params["timeout"], 7)
        self.assertEqual(json.loads(params["data"])["to"], ["recipient@example.test"])
        self.assertEqual(output.getvalue(), "")

    @patch("requests.sessions.Session.request")
    def test_standard_html_and_reply_to_are_preserved(self, request):
        request.return_value = api_response()
        message = EmailMultiAlternatives(
            "fixture",
            "plain-body",
            "sender@example.test",
            ["recipient@example.test"],
            reply_to=["reply@example.test"],
        )
        message.attach_alternative("<p>html-body</p>", "text/html")
        self.assertEqual(get_connection().send_messages([message]), 1)
        payload = json.loads(request.call_args.kwargs["data"])
        self.assertEqual(payload["text"], "plain-body")
        self.assertEqual(payload["html"], "<p>html-body</p>")
        self.assertEqual(payload["reply_to"], ["reply@example.test"])

    def test_default_session_does_not_add_retries_or_api_debug_hooks(self):
        connection = get_connection()
        session = connection.create_session()
        try:
            self.assertFalse(connection.debug_api_requests)
            self.assertEqual(session.adapters["https://"].max_retries.total, 0)
            self.assertEqual(session.hooks["response"], [])
        finally:
            session.close()

    @patch("requests.sessions.Session.request")
    def test_operational_errors_honor_fail_silently_without_retrying(self, request):
        for failure in [
            Timeout("private-provider-body"),
            ConnectionError("private-provider-body"),
            api_response(422),
            api_response(429),
            api_response(503),
        ]:
            for silent in [False, True]:
                with self.subTest(error=type(failure).__name__, silent=silent):
                    request.reset_mock()
                    request.side_effect = (
                        failure if isinstance(failure, Exception) else None
                    )
                    request.return_value = (
                        failure if not isinstance(failure, Exception) else None
                    )
                    connection = get_connection(fail_silently=silent)
                    if silent:
                        self.assertEqual(connection.send_messages([self.message()]), 0)
                    else:
                        with self.assertRaises(AnymailError):
                            connection.send_messages([self.message()])
                    request.assert_called_once()

    @patch("requests.sessions.Session.request")
    @override_settings(ANYMAIL={"REQUESTS_TIMEOUT": 10, "DEBUG_API_REQUESTS": False})
    def test_configuration_errors_fail_before_http_even_in_silent_mode(self, request):
        for silent in [False, True]:
            with (
                self.subTest(silent=silent),
                self.assertRaises(AnymailConfigurationError),
            ):
                get_connection(fail_silently=silent)
        request.assert_not_called()
