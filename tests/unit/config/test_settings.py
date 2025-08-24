"""Tests for application settings."""

import os
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from satin.config import get_settings
from satin.config.settings import AppSettings


@pytest.mark.usefixtures("clean_env")
class TestAppSettings:
    def test_default_values(self):
        settings = get_settings()
        assert settings.backend_host == "localhost"
        assert settings.backend_port == 8000
        assert settings.reload
        assert settings.cors == ["http://localhost:5173"]

    def test_environment_overrides(self):
        env_vars = {
            "SATIN_MONGO_DSN": "mongodb://test:27017/satin",
            "SATIN_BACKEND_HOST": "192.168.1.1",
            "SATIN_BACKEND_PORT": "9000",
            "SATIN_RELOAD": "true",
            "SATIN_CORS": '["http://example.com", "https://app.example.com"]',
        }

        with patch.dict(os.environ, env_vars):
            settings = AppSettings()
            assert str(settings.mongo_dsn) == "mongodb://test:27017/satin"
            assert settings.backend_host == "192.168.1.1"
            assert settings.backend_port == 9000
            assert settings.reload is True
            assert settings.cors == ["http://example.com", "https://app.example.com"]

    @pytest.mark.parametrize("invalid_dsn", ["invalid-dsn", "http://localhost:27017", "not-a-url"])
    def test_invalid_mongo_dsn(self, invalid_dsn):
        with patch.dict(os.environ, {"SATIN_MONGO_DSN": invalid_dsn}):
            with pytest.raises(ValidationError) as exc_info:
                AppSettings()
            assert "mongo_dsn" in str(exc_info.value)

    @pytest.mark.parametrize(
        ("port_value", "should_raise"),
        [
            ("not-a-number", True),
            ("-1", False),  # Negative ports are allowed
            ("65536", False),  # Large ports are allowed
            ("0", False),
        ],
    )
    def test_port_validation(self, port_value, should_raise):
        env_vars = {"SATIN_MONGO_DSN": "mongodb://localhost:27017/test", "SATIN_BACKEND_PORT": port_value}

        with patch.dict(os.environ, env_vars):
            if should_raise:
                with pytest.raises(ValidationError) as exc_info:
                    AppSettings()
                assert "backend_port" in str(exc_info.value)
            else:
                settings = AppSettings()
                assert settings.backend_port == int(port_value)

    @pytest.mark.parametrize(
        ("cors_value", "expected"),
        [
            ("[]", []),
            ('["http://single.com"]', ["http://single.com"]),
            ('["http://a.com", "https://b.com"]', ["http://a.com", "https://b.com"]),
        ],
    )
    def test_cors_parsing(self, cors_value, expected):
        env_vars = {"SATIN_MONGO_DSN": "mongodb://localhost:27017/test", "SATIN_CORS": cors_value}

        with patch.dict(os.environ, env_vars):
            settings = AppSettings()
            assert settings.cors == expected

    @pytest.mark.parametrize(
        ("reload_value", "expected"),
        [
            ("true", True),
            ("True", True),
            ("1", True),
            ("false", False),
            ("False", False),
            ("0", False),
        ],
    )
    def test_reload_boolean_values(self, reload_value, expected):
        env_vars = {"SATIN_MONGO_DSN": "mongodb://localhost:27017/test", "SATIN_RELOAD": reload_value}

        with patch.dict(os.environ, env_vars):
            settings = AppSettings()
            assert settings.reload is expected
