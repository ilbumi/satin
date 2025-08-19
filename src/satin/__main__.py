"""Main entry point for running the Satin application with Granian ASGI server."""

import click
from granian import Granian
from granian.constants import Interfaces


@click.command()
@click.option(
    "--host",
    default="127.0.0.1",
    show_default=True,
    help="Host address to bind.",
)
@click.option(
    "--port",
    default=8000,
    type=int,
    help="Port to bind.",
)
@click.option(
    "--reload/--no-reload",
    default=True,
    show_default=True,
    help="Enable auto-reload.",
)
@click.option(
    "--log-level",
    default="info",
    show_default=True,
    help="Logging level.",
)
def cli(host: str, port: int, reload: bool, log_level: str):
    """Run the Satin application using Granian ASGI server."""
    server = Granian(
        target="satin.main:app",
        address=host,
        port=port,
        interface=Interfaces.ASGI,
        reload=reload,
        log_level=log_level,
    )
    server.serve()


if __name__ == "__main__":
    cli()
