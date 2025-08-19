"""Main entry point for running the Satin application with Granian ASGI server."""

from granian import Granian
from granian.constants import Interfaces


def main() -> None:
    """Run the Satin application using Granian ASGI server."""
    server = Granian(
        target="satin.main:app",
        address="0.0.0.0",  # noqa: S104
        port=8000,
        interface=Interfaces.ASGI,
        reload=True,
        log_level="info",
    )
    server.serve()


if __name__ == "__main__":
    main()
