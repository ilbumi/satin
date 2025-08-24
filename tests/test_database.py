"""Tests for database module."""

from unittest.mock import AsyncMock, Mock, patch

import pytest
from pymongo import AsyncMongoClient
from pymongo.errors import ServerSelectionTimeoutError

from satin.database import check_database_health, get_database_client


class TestGetDatabaseClient:
    """Test get_database_client function."""

    def test_returns_async_mongo_client(self):
        """Test that function returns AsyncMongoClient instance."""
        dsn = "mongodb://localhost:27017/test"

        client = get_database_client(dsn)

        assert isinstance(client, AsyncMongoClient)

    def test_sets_server_selection_timeout(self):
        """Test that serverSelectionTimeoutMS is set correctly."""
        dsn = "mongodb://localhost:27017/test"

        client = get_database_client(dsn)

        # Check that the timeout is set in the client options
        assert client.options.server_selection_timeout == 5.0

    def test_uses_provided_dsn(self):
        """Test that the provided DSN is used for client creation."""
        dsn = "mongodb://testhost:27018/testdb"

        client = get_database_client(dsn)

        # Verify the host and port are correctly parsed
        assert any("testhost" in str(server) for server in client.topology_description.server_descriptions())


class TestCheckDatabaseHealth:
    """Test check_database_health function."""

    async def test_successful_health_check(self):
        """Test successful database health check."""
        mock_client = AsyncMock()
        mock_client.admin.command = AsyncMock(return_value={"ok": 1})

        result = await check_database_health(mock_client)

        assert result is True
        mock_client.admin.command.assert_called_once_with("ping")

    async def test_server_selection_timeout_error(self):
        """Test health check with ServerSelectionTimeoutError."""
        mock_client = AsyncMock()
        mock_client.admin.command = AsyncMock(side_effect=ServerSelectionTimeoutError("Timeout"))

        with patch("satin.database.logger") as mock_logger:
            result = await check_database_health(mock_client)

            assert result is False
            mock_client.admin.command.assert_called_once_with("ping")
            mock_logger.exception.assert_called_once_with("Database connection failed: Server selection timeout")

    async def test_unexpected_exception(self):
        """Test health check with unexpected exception."""
        mock_client = AsyncMock()
        mock_client.admin.command = AsyncMock(side_effect=ConnectionError("Network error"))

        with patch("satin.database.logger") as mock_logger:
            result = await check_database_health(mock_client)

            assert result is False
            mock_client.admin.command.assert_called_once_with("ping")
            mock_logger.exception.assert_called_once_with("Unexpected error checking database health")

    async def test_multiple_health_checks(self):
        """Test multiple consecutive health checks."""
        mock_client = AsyncMock()
        mock_client.admin.command = AsyncMock(return_value={"ok": 1})

        # Run multiple health checks
        results = []
        for _ in range(3):
            result = await check_database_health(mock_client)
            results.append(result)

        assert all(result is True for result in results)
        assert mock_client.admin.command.call_count == 3

    async def test_health_check_with_real_client_mock(self):
        """Test health check behavior with a more realistic client mock."""
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
        """Test health check with various exception types."""
        mock_client = AsyncMock()
        mock_client.admin.command = AsyncMock(side_effect=exception_type)

        with patch("satin.database.logger") as mock_logger:
            result = await check_database_health(mock_client)

            assert result is False
            mock_logger.exception.assert_called_once_with(expected_log_message)
