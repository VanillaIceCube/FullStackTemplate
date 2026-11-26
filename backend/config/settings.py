import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

from apps.mcp.framework.config import oauth_settings

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
if not SECRET_KEY.strip():
    if not DEBUG:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY is required when DJANGO_DEBUG=0.")
    SECRET_KEY = "fullstacktemplate-local-development-key-change-before-production-2026"
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "fullstacktemplate.localhost"]

extra_hosts = os.getenv("DJANGO_ALLOWED_HOSTS")
if extra_hosts:
    ALLOWED_HOSTS.extend(extra_hosts.split(","))

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = False

FRONTEND_BASE_URL = os.getenv(
    "DJANGO_FRONTEND_BASE_URL", "http://fullstacktemplate.localhost:3000"
).rstrip("/")


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "anymail",
    "apps.authentication",
    "apps.notifications",
]


MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
]


local_origins = [
    "http://localhost:3000",
    "http://fullstacktemplate.localhost:3000",
    "http://fullstacktemplate.localhost:3001",
    "https://fullstacktemplate.localhost",
    "https://fullstacktemplate.localhost:8443",
]
CORS_ALLOWED_ORIGINS = local_origins.copy()

extra_origins = os.getenv("DJANGO_CORS_ALLOWED_ORIGINS")
if extra_origins:
    CORS_ALLOWED_ORIGINS.extend(extra_origins.split(","))

CSRF_TRUSTED_ORIGINS = local_origins.copy()

extra_csrf_origins = os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS")
if extra_csrf_origins:
    CSRF_TRUSTED_ORIGINS.extend(extra_csrf_origins.split(","))


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
}


ROOT_URLCONF = "config.urls"


TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "config.wsgi.application"


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.environ.get("DJANGO_SQLITE_PATH") or BASE_DIR / "db.sqlite3",
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


AUTH_USER_MODEL = "authentication.User"


# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Email
EMAIL_BACKEND = (
    os.getenv("DJANGO_EMAIL_BACKEND")
    or "django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = os.getenv("DJANGO_EMAIL_HOST") or "smtp.resend.com"
EMAIL_PORT = int(os.getenv("DJANGO_EMAIL_PORT") or "587")
EMAIL_USE_TLS = os.getenv("DJANGO_EMAIL_USE_TLS", "1") == "1"
EMAIL_HOST_USER = os.getenv("DJANGO_EMAIL_HOST_USER") or "resend"
EMAIL_HOST_PASSWORD = os.getenv("DJANGO_EMAIL_HOST_KEY", "")
EMAIL_TIMEOUT = int(os.getenv("DJANGO_EMAIL_TIMEOUT") or "10")
ANYMAIL = {
    "REQUESTS_TIMEOUT": EMAIL_TIMEOUT if 0 < EMAIL_TIMEOUT <= 30 else 10,
    "DEBUG_API_REQUESTS": False,
}
if EMAIL_HOST_PASSWORD.strip():
    ANYMAIL["RESEND_API_KEY"] = EMAIL_HOST_PASSWORD
DEFAULT_FROM_EMAIL = (
    os.getenv("DJANGO_DEFAULT_FROM_EMAIL") or "fullstacktemplate@example.com"
)


# Optional MCP has no routes, OAuth tables or application tools unless explicitly enabled.
MCP_ENABLED = os.getenv("DJANGO_MCP_ENABLED", "0") == "1"
MCP_NAME = "FullStackTemplate"
MCP_BASE_URL = os.getenv("DJANGO_MCP_BASE_URL", "http://localhost:8000").rstrip("/")
MCP_RESOURCE_URL = f"{MCP_BASE_URL}/mcp"
MCP_SERVER_FACTORY = (
    os.getenv("DJANGO_MCP_SERVER_FACTORY") or "apps.mcp.tools.server.create_server"
)
TRUSTED_PROXY_IPS = [
    address.strip()
    for address in os.getenv("DJANGO_TRUSTED_PROXY_IPS", "").split(",")
    if address.strip()
]
MCP_CONSENT_SALT = "fullstacktemplate.mcp.consent"
MCP_REQUIRED_SCOPES = ["fullstacktemplate:connect"]
OAUTH2_PROVIDER = oauth_settings(
    base_url=MCP_BASE_URL,
    scopes={
        "fullstacktemplate:connect": "Check this connection; no application data access"
    },
    required_scopes=MCP_REQUIRED_SCOPES,
)

INSTALLED_APPS += ["apps.mcp.framework"]
if MCP_ENABLED:
    INSTALLED_APPS += ["oauth2_provider"]
    SECURE_PROXY_SSL_HEADER = None
ASGI_APPLICATION = "config.asgi.application"
