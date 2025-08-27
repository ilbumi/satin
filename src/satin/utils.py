from typing import Annotated

from pydantic import HttpUrl, PlainSerializer


def serialize_http_url(url: HttpUrl) -> str:
    """Serialize an HTTP URL to a string."""
    return str(url)


SerializableHttpUrl = Annotated[HttpUrl, PlainSerializer(func=serialize_http_url, return_type=str)]
