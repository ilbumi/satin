"""Tests for database connection and health checks."""

from unittest.mock import AsyncMock, Mock, patch

import pytest
from pymongo import AsyncMongoClient
from pymongo.errors import ServerSelectionTimeoutError

from satin.database import check_database_health, get_database_client


class TestGetDatabaseClient:
    def test_returns_async_mongo_client(self):
        dsn = "mongodb://localhost:27017/test"
        client = get_database_client(dsn)
        assert isinstance(client, AsyncMongoClient)

    def test_sets_server_selection_timeout(self):
        dsn = "mongodb://localhost:27017/test"
        client = get_database_client(dsn)
        assert client.options.server_selection_timeout == 5.0

    def test_uses_provided_dsn(self):
        dsn = "mongodb://testhost:27018/testdb"
        client = get_database_client(dsn)
        assert any("testhost" in str(server) for server in client.topology_description.server_descriptions())


class TestCheckDatabaseHealth:
    async def test_successful_health_check(self):
        mock_client = AsyncMock()
        mock_client.admin.command = AsyncMock(return_value={"ok": 1})

        result = await check_database_health(mock_client)

        assert result is True
        mock_client.admin.command.assert_called_once_with("ping")

    async def test_multiple_health_checks(self):
        mock_client = AsyncMock()
        mock_client.admin.command = AsyncMock(return_value={"ok": 1})

        results = []
        for _ in range(3):
            result = await check_database_health(mock_client)
            results.append(result)

        assert all(result is True for result in results)
        assert mock_client.admin.command.call_count == 3

    async def test_health_check_with_real_client_mock(self):
        mock_client = Mock(spec=AsyncMongoClient)
        mock_admin = Mock()
        mock_admin.command = AsyncMock(return_value={"ok": 1})
        mock_client.admin = mock_admin

        result = await check_database_health(mock_client)

        assert result is True
        mock_admin.command.assert_called_once_with("ping")

    @pytest.mark.parametrize(
        ("exception_type", "expected_log_message"),
        [
            (ServerSelectionTimeoutError("timeout"), "Database connection failed: Server selection timeout"),
            (ConnectionError("connection failed"), "Unexpected error checking database health"),
            (ValueError("invalid value"), "Unexpected error checking database health"),
            (RuntimeError("runtime error"), "Unexpected error checking database health"),
        ],
    )
    async def test_various_exceptions(self, exception_type, expected_log_message):
        mock_client = AsyncMock()
        mock_client.admin.command = AsyncMock(side_effect=exception_type)

        with patch("satin.database.logger") as mock_logger:
            result = await check_database_health(mock_client)

            assert result is False
            mock_logger.exception.assert_called_once_with(expected_log_message)
