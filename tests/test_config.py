import os
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from satin.config import get_settings
from satin.config.settings import AppSettings


class TestAppSettings:
    def test_default_values(self):
        with patch.dict(os.environ, {"SATIN_MONGO_DSN": "mongodb://localhost:27017/test"}):
            settings = get_settings()
            assert settings.backend_host == "localhost"
            assert settings.backend_port == 8000
            assert settings.reload
            assert settings.cors == ["http://localhost:5173"]

    def test_environment_variable_override(self):
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

    def test_invalid_mongo_dsn(self):
        with patch.dict(os.environ, {"SATIN_MONGO_DSN": "invalid-dsn"}):
            with pytest.raises(ValidationError) as exc_info:
                AppSettings()
            assert "mongo_dsn" in str(exc_info.value)

    def test_invalid_port(self):
        env_vars = {"SATIN_MONGO_DSN": "mongodb://localhost:27017/test", "SATIN_BACKEND_PORT": "not-a-number"}

        with patch.dict(os.environ, env_vars):
            with pytest.raises(ValidationError) as exc_info:
                AppSettings()
            assert "backend_port" in str(exc_info.value)

    def test_negative_port(self):
        env_vars = {"SATIN_MONGO_DSN": "mongodb://localhost:27017/test", "SATIN_BACKEND_PORT": "-1"}

        with patch.dict(os.environ, env_vars):
            settings = AppSettings()
            assert settings.backend_port == -1

    def test_cors_empty_list(self):
        env_vars = {"SATIN_MONGO_DSN": "mongodb://localhost:27017/test", "SATIN_CORS": "[]"}

        with patch.dict(os.environ, env_vars):
            settings = AppSettings()
            assert settings.cors == []

    def test_cors_single_item(self):
        env_vars = {"SATIN_MONGO_DSN": "mongodb://localhost:27017/test", "SATIN_CORS": '["http://single.com"]'}

        with patch.dict(os.environ, env_vars):
            settings = AppSettings()
            assert settings.cors == ["http://single.com"]

    def test_reload_boolean_values(self):
        test_cases = [("true", True), ("True", True), ("1", True), ("false", False), ("False", False), ("0", False)]

        for env_value, expected in test_cases:
            env_vars = {"SATIN_MONGO_DSN": "mongodb://localhost:27017/test", "SATIN_RELOAD": env_value}

            with patch.dict(os.environ, env_vars):
                settings = AppSettings()
                assert settings.reload is expected
