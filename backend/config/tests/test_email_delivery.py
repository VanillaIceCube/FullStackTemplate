"""Mocked Resend transport and standard Anymail behavior."""

import io
import json
from contextlib import redirect_stdout
from unittest.mock import patch

from anymail.exceptions import AnymailConfigurationError, AnymailError
from django.core.mail import EmailMessage, EmailMultiAlternatives, get_connection
from django.test import SimpleTestCase, override_settings
from requests.exceptions import ConnectionError, Timeout

from .helpers import ANYMAIL_SETTINGS, BACKEND, api_response


@override_settings(EMAIL_BACKEND=BACKEND, ANYMAIL=ANYMAIL_SETTINGS)
class EmailDeliveryTests(SimpleTestCase):
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
