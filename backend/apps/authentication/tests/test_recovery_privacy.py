"""Provider failures never disclose account or email details."""

from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APITestCase


@override_settings(
    EMAIL_BACKEND="anymail.backends.resend.EmailBackend",
    ANYMAIL={
        "RESEND_API_KEY": "fixture-key",
        "REQUESTS_TIMEOUT": 7,
        "DEBUG_API_REQUESTS": False,
    },
)
class PasswordResetFailurePrivacyTests(APITestCase):
    def setUp(self):
        get_user_model().objects.create_user(
            username="fixture",
            email="fixture@example.test",
            password="fixture-password-123",
        )

    @patch("requests.sessions.Session.request")
    def test_real_reset_caller_keeps_failure_and_unknown_account_responses_equal(
        self, request
    ):
        from requests import Response
        from requests.exceptions import ConnectionError, Timeout

        private = "private-body recipient@example.test private-token fixture-key"
        failures = [Timeout(private), ConnectionError(private)]
        for status_code in (422, 429, 503):
            response = Response()
            response.status_code = status_code
            response._content = private.encode()
            failures.append(response)
        for failure in failures:
            with self.subTest(failure=type(failure).__name__):
                request.reset_mock()
                request.side_effect = (
                    failure if isinstance(failure, Exception) else None
                )
                request.return_value = (
                    failure if not isinstance(failure, Exception) else None
                )
                with self.assertLogs("apps.authentication", level="ERROR") as logs:
                    known = self.client.post(
                        "/auth/forgot-password/",
                        {"email": "fixture@example.test"},
                        format="json",
                    )
                unknown = self.client.post(
                    "/auth/forgot-password/",
                    {"email": "missing@example.test"},
                    format="json",
                )
                self.assertEqual(known.status_code, 200)
                self.assertEqual(known.data, unknown.data)
                request.assert_called_once()
                for record in logs.records:
                    self.assertIsNone(record.exc_info)
                    for value in [
                        private,
                        "private-token",
                        "fixture-key",
                        "fixture@example.test",
                        "user_id",
                    ]:
                        self.assertNotIn(value, record.getMessage())

    @patch("requests.sessions.Session.request")
    @override_settings(ANYMAIL={"REQUESTS_TIMEOUT": 10, "DEBUG_API_REQUESTS": False})
    def test_missing_provider_key_keeps_public_response_generic_without_http(
        self, request
    ):
        with self.assertLogs("apps.authentication", level="ERROR"):
            known = self.client.post(
                "/auth/forgot-password/",
                {"email": "fixture@example.test"},
                format="json",
            )
        unknown = self.client.post(
            "/auth/forgot-password/", {"email": "missing@example.test"}, format="json"
        )
        self.assertEqual(known.status_code, 200)
        self.assertEqual(known.data, unknown.data)
        request.assert_not_called()
