from django.test import RequestFactory, SimpleTestCase, override_settings


class GatewayHostTests(SimpleTestCase):
    @override_settings(ALLOWED_HOSTS=["app.example.com"])
    def test_canonical_host_wins_over_a_forwarded_host(self):
        request = RequestFactory().get(
            "/api/notifications/",
            HTTP_HOST="app.example.com",
            HTTP_X_FORWARDED_HOST="attacker.invalid",
            HTTP_X_FORWARDED_PROTO="https",
        )
        self.assertEqual(request.get_host(), "app.example.com")
        self.assertTrue(request.is_secure())
