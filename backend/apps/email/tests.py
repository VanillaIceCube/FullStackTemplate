import json
from io import BytesIO
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError, URLError

from django.core.mail import EmailMessage, EmailMultiAlternatives, get_connection
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APITestCase

PRIVATE = "recipient@example.test reset?token=private-token sk-private-key private-body"


def accepted_response():
    response = MagicMock()
    response.__enter__.return_value = response
    response.getcode.return_value = 200
    return response


@override_settings(
    EMAIL_BACKEND="apps.email.backends.ResendApiEmailBackend",
    EMAIL_HOST_PASSWORD="sk-private-key",
    EMAIL_TIMEOUT=7,
)
class EmailReliabilityTests(SimpleTestCase):
    def message(self):
        return EmailMessage(
            "private-subject",
            PRIVATE,
            "sender@example.test",
            ["recipient@example.test"],
        )

    def assert_safe_logs(self, records):
        for record in records:
            self.assertIsNone(record.exc_info)
            text = record.getMessage()
            for secret in [
                PRIVATE,
                "private-token",
                "sk-private-key",
                "private-body",
                "recipient@example.test",
                "private-subject",
            ]:
                self.assertNotIn(secret, text)

    @patch("apps.email.backends.request.urlopen")
    def test_success_and_empty_batch(self, urlopen):
        urlopen.return_value = accepted_response()
        self.assertEqual(get_connection().send_messages([]), 0)
        urlopen.assert_not_called()
        self.assertEqual(get_connection().send_messages([self.message()]), 1)
        self.assertEqual(urlopen.call_args.kwargs["timeout"], 7)
        urlopen.assert_called_once()

    @patch("apps.email.backends.request.urlopen")
    def test_missing_credentials_both_silent_modes_are_observable(self, urlopen):
        for silent in [True, False]:
            with (
                self.subTest(silent=silent),
                override_settings(EMAIL_HOST_PASSWORD=""),
                self.assertLogs("apps.email.backends", level="ERROR") as logs,
            ):
                connection = get_connection(fail_silently=silent)
                if silent:
                    self.assertEqual(connection.send_messages([self.message()]), 0)
                else:
                    with self.assertRaisesRegex(ValueError, "DJANGO_EMAIL_HOST_KEY"):
                        connection.send_messages([self.message()])
            self.assertEqual(logs.records[0].delivery_category, "configuration")
            self.assert_safe_logs(logs.records)
        urlopen.assert_not_called()

    @patch("apps.email.backends.request.urlopen")
    def test_provider_network_timeout_and_unexpected_failures_preserve_original_exception(
        self, urlopen
    ):
        factories = [
            (
                lambda code=code: HTTPError(
                    "https://api.resend.com/emails",
                    code,
                    PRIVATE,
                    {},
                    BytesIO(PRIVATE.encode()),
                ),
                "rate_limit"
                if code == 429
                else "provider"
                if code >= 500
                else "request",
                code,
            )
            for code in [400, 401, 403, 422, 429, 500, 503]
        ] + [
            (lambda: TimeoutError(PRIVATE), "timeout", None),
            (lambda: URLError(TimeoutError(PRIVATE)), "timeout", None),
            (lambda: URLError(PRIVATE), "network", None),
            (lambda: OSError(PRIVATE), "network", None),
            (lambda: ValueError(PRIVATE), "unexpected", None),
        ]
        for factory, category, code in factories:
            for silent in [True, False]:
                with self.subTest(category=category, code=code, silent=silent):
                    exc = factory()
                    urlopen.reset_mock()
                    urlopen.side_effect = exc
                    with self.assertLogs("apps.email.backends", level="ERROR") as logs:
                        if silent:
                            self.assertEqual(
                                get_connection(fail_silently=True).send_messages(
                                    [self.message()]
                                ),
                                0,
                            )
                        else:
                            with self.assertRaises(type(exc)) as raised:
                                get_connection(fail_silently=False).send_messages(
                                    [self.message()]
                                )
                            self.assertIs(raised.exception, exc)
                    urlopen.assert_called_once()  # No blind retry of an ambiguously accepted send.
                    self.assertEqual(logs.records[0].delivery_category, category)
                    self.assertEqual(logs.records[0].delivery_status, code)
                    self.assert_safe_logs(logs.records)

    @patch("apps.email.backends.request.urlopen")
    def test_nonfinite_unbounded_and_invalid_timeouts_use_documented_finite_default(
        self, urlopen
    ):
        urlopen.return_value = accepted_response()
        for value in [
            None,
            0,
            -1,
            float("inf"),
            float("nan"),
            True,
            "private-token",
            31,
            10**1000,
        ]:
            with (
                self.subTest(timeout=value),
                override_settings(EMAIL_TIMEOUT=value),
                self.assertLogs("apps.email.backends", level="WARNING") as logs,
            ):
                self.assertEqual(get_connection().send_messages([self.message()]), 1)
            self.assertEqual(urlopen.call_args.kwargs["timeout"], 10)
            self.assert_safe_logs(logs.records)

    @patch("apps.email.backends.request.urlopen")
    def test_returned_non_2xx_does_not_read_provider_body(self, urlopen):
        response = accepted_response()
        response.getcode.return_value = 503
        response.read.side_effect = AssertionError("Provider body must not be read")
        urlopen.return_value = response
        with self.assertLogs("apps.email.backends", level="ERROR") as logs:
            self.assertEqual(
                get_connection(fail_silently=True).send_messages([self.message()]), 0
            )
        response.read.assert_not_called()
        self.assertEqual(logs.records[0].delivery_category, "provider")
        self.assert_safe_logs(logs.records)

    @patch("apps.email.backends.request.urlopen")
    def test_partial_batch_count_and_stop_policy(self, urlopen):
        for silent in [True, False]:
            urlopen.reset_mock()
            urlopen.side_effect = [URLError(PRIVATE), accepted_response()]
            with self.assertLogs("apps.email.backends", level="ERROR"):
                if silent:
                    self.assertEqual(
                        get_connection(fail_silently=True).send_messages(
                            [self.message(), self.message()]
                        ),
                        1,
                    )
                    self.assertEqual(urlopen.call_count, 2)
                else:
                    with self.assertRaises(URLError):
                        get_connection(fail_silently=False).send_messages(
                            [self.message(), self.message()]
                        )
                    self.assertEqual(urlopen.call_count, 1)


class ResendApiEmailBackendTests(APITestCase):
    @override_settings(
        EMAIL_BACKEND="apps.email.backends.ResendApiEmailBackend",
        EMAIL_HOST_PASSWORD="resend-api-key",
        EMAIL_TIMEOUT=7,
        DEFAULT_FROM_EMAIL="fullstacktemplate@example.com",
    )
    @patch("apps.email.backends.request.urlopen")
    def test_send_messages_posts_to_resend_api(self, mock_urlopen):
        response = MagicMock()
        response.__enter__.return_value = response
        response.getcode.return_value = 200
        mock_urlopen.return_value = response

        sent_count = get_connection().send_messages(
            [
                EmailMessage(
                    "Reset your FullStackTemplate password",
                    "Use this link.",
                    None,
                    ["mapper@example.com"],
                )
            ]
        )

        self.assertEqual(sent_count, 1)
        request_arg = mock_urlopen.call_args.args[0]
        self.assertEqual(request_arg.full_url, "https://api.resend.com/emails")
        self.assertEqual(
            request_arg.get_header("Authorization"), "Bearer resend-api-key"
        )
        self.assertEqual(
            request_arg.get_header("User-agent"),
            "FullStackTemplate/1.0 (+https://app.example.com)",
        )
        payload = json.loads(request_arg.data.decode("utf-8"))
        self.assertEqual(payload["from"], "fullstacktemplate@example.com")
        self.assertEqual(payload["to"], ["mapper@example.com"])

    @override_settings(
        EMAIL_BACKEND="apps.email.backends.ResendApiEmailBackend",
        EMAIL_HOST_PASSWORD="resend-api-key",
        DEFAULT_FROM_EMAIL="fullstacktemplate@example.com",
    )
    @patch("apps.email.backends.request.urlopen")
    def test_send_messages_includes_reply_to_and_html_body(self, mock_urlopen):
        response = MagicMock()
        response.__enter__.return_value = response
        response.getcode.return_value = 200
        mock_urlopen.return_value = response

        html_msg = EmailMessage(
            "HTML Subject",
            "<p>HTML Content</p>",
            "from@example.com",
            ["to@example.com"],
            reply_to=["reply@example.com"],
        )
        html_msg.content_subtype = "html"

        multi_msg = EmailMultiAlternatives(
            "Multi Subject",
            "Plain text",
            "from@example.com",
            ["to@example.com"],
            cc=["cc@example.com"],
            bcc=["bcc@example.com"],
        )
        multi_msg.attach_alternative("<p>Rich text</p>", "text/html")

        connection = get_connection()
        sent_count = connection.send_messages([html_msg, multi_msg])

        self.assertEqual(sent_count, 2)
        self.assertEqual(mock_urlopen.call_count, 2)

        # First email checks
        req1 = mock_urlopen.call_args_list[0].args[0]
        payload1 = json.loads(req1.data.decode("utf-8"))
        self.assertEqual(payload1["reply_to"], ["reply@example.com"])
        self.assertEqual(payload1["html"], "<p>HTML Content</p>")
        self.assertNotIn("text", payload1)

        # Second email checks
        req2 = mock_urlopen.call_args_list[1].args[0]
        payload2 = json.loads(req2.data.decode("utf-8"))
        self.assertEqual(payload2["cc"], ["cc@example.com"])
        self.assertEqual(payload2["bcc"], ["bcc@example.com"])
        self.assertEqual(payload2["text"], "Plain text")
        self.assertEqual(payload2["html"], "<p>Rich text</p>")

    @override_settings(
        EMAIL_BACKEND="apps.email.backends.ResendApiEmailBackend",
        EMAIL_HOST_PASSWORD="resend-api-key",
    )
    @patch("apps.email.backends.request.urlopen")
    def test_send_messages_handles_http_errors_and_fail_silently(self, mock_urlopen):
        error_body = json.dumps(
            {"statusCode": 422, "message": "Invalid sender address"}
        ).encode("utf-8")
        http_err = HTTPError(
            "https://api.resend.com/emails",
            422,
            "Unprocessable Entity",
            {},
            BytesIO(error_body),
        )
        mock_urlopen.side_effect = http_err

        msg = EmailMessage("Subject", "Body", "invalid@example.com", ["to@example.com"])

        # fail_silently = False (default)
        connection = get_connection(fail_silently=False)
        with self.assertRaises(HTTPError) as cm:
            connection.send_messages([msg])
        self.assertEqual(cm.exception.code, 422)

        # fail_silently = True
        silent_connection = get_connection(fail_silently=True)
        sent_count = silent_connection.send_messages([msg])
        self.assertEqual(sent_count, 0)

    @override_settings(
        EMAIL_BACKEND="apps.email.backends.ResendApiEmailBackend",
        EMAIL_HOST_PASSWORD="",
    )
    def test_send_messages_requires_api_key(self):
        with self.assertRaises(ValueError):
            get_connection().send_messages(
                [
                    EmailMessage(
                        "Subject",
                        "Body",
                        "fullstacktemplate@example.com",
                        ["mapper@example.com"],
                    )
                ]
            )
