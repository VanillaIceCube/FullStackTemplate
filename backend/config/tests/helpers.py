from requests import Response

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
