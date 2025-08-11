"""Input sanitization and validation utilities for security."""

import html
import re
from urllib.parse import urlparse

import strawberry
from bson import ObjectId
from bson.errors import InvalidId

from satin.constants import (
    ALLOWED_URL_SCHEMES,
    BIND_ALL_INTERFACES,
    FORBIDDEN_URL_HOSTS,
    MAX_CHAR_EXCLUDE,
    MAX_DESCRIPTION_LENGTH,
    MAX_FIELD_NAME_LENGTH,
    MAX_NAME_LENGTH,
    MAX_REGEX_PATTERN_LENGTH,
    MAX_STRING_LENGTH,
    MAX_TAG_LENGTH,
    MAX_TAGS_COUNT,
    MIN_PRINTABLE_CHAR,
    OBJECT_ID_LENGTH,
)
from satin.exceptions import (
    FieldNameValidationError,
    InputSanitizationError,
    ObjectIdValidationError,
    ProjectValidationError,
    RegexValidationError,
    TagValidationError,
    UrlValidationError,
)

# Regex patterns for validation
SAFE_STRING_PATTERN = re.compile(r"^[\w\s\-.,!?@#$%^&*()\[\]{}/\\:;'\"+=~`|]+$")
FIELD_NAME_PATTERN = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$")
SAFE_NAME_PATTERN = re.compile(r"^[\w\s\-.,()]+$")

# Dangerous regex patterns
DANGEROUS_PATTERNS = [
    r"\(\?\#",  # Comment groups can cause issues
    r"\(\?\<\!",  # Negative lookbehind
    r"\(\?\<\=",  # Positive lookbehind
    r"\(\?\!",  # Negative lookahead
    r"\(\?\=",  # Positive lookahead
    r"(?#",  # Simplified dangerous patterns
    r"(?<!",
    r"(?<=",
    r"(?!",
    r"(?=",
]


def sanitize_string(value: str, max_length: int = MAX_STRING_LENGTH, allow_html: bool = False) -> str:
    """Sanitize a string input to prevent injection attacks.

    Args:
        value: The string to sanitize
        max_length: Maximum allowed length
        allow_html: Whether to allow HTML entities (they will be escaped)

    Returns:
        Sanitized string

    Raises:
        InputSanitizationError: If the string is invalid

    """
    if not isinstance(value, str):
        raise InputSanitizationError.expected_string(type(value).__name__)

    # Strip leading/trailing whitespace
    value = value.strip()

    # Check length
    if len(value) == 0:
        raise InputSanitizationError.empty_string()
    if len(value) > max_length:
        raise InputSanitizationError.string_too_long(max_length)

    # Remove null bytes
    value = value.replace("\x00", "")

    # Escape HTML if needed
    if not allow_html:
        value = html.escape(value)

    # Remove control characters except newlines and tabs
    return "".join(
        char for char in value if char in "\n\t" or (ord(char) >= MIN_PRINTABLE_CHAR and ord(char) != MAX_CHAR_EXCLUDE)
    )


def sanitize_html(value: str, max_length: int = MAX_STRING_LENGTH) -> str:
    """Sanitize HTML content to prevent XSS attacks.

    Args:
        value: The HTML string to sanitize
        max_length: Maximum allowed length

    Returns:
        Sanitized HTML string with dangerous content removed

    """
    # First apply basic string sanitization
    value = sanitize_string(value, max_length, allow_html=True)

    # Remove script tags and their content
    value = re.sub(r"<script[^>]*>.*?</script>", "", value, flags=re.IGNORECASE | re.DOTALL)

    # Remove event handlers
    value = re.sub(r"\s*on\w+\s*=\s*[\"'][^\"']*[\"']", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\s*on\w+\s*=\s*[^\s>]+", "", value, flags=re.IGNORECASE)

    # Remove javascript: protocol
    value = re.sub(r"javascript\s*:", "", value, flags=re.IGNORECASE)

    # Remove data: protocol for potentially dangerous content
    return re.sub(r"data\s*:\s*text/html", "", value, flags=re.IGNORECASE)


def validate_and_convert_object_id(value: str | strawberry.ID) -> ObjectId:
    """Safely validate and convert a string to MongoDB ObjectId.

    Args:
        value: The ID string to convert

    Returns:
        Valid ObjectId

    Raises:
        ObjectIdValidationError: If the ID is invalid

    """
    if not value:
        raise ObjectIdValidationError.empty_id()

    # Convert strawberry.ID to string
    id_str = str(value)

    # Remove any whitespace
    id_str = id_str.strip()

    # Check for common injection patterns
    if any(char in id_str for char in ["$", "{", "}", "[", "]", "(", ")", ";", "'"]):
        raise ObjectIdValidationError.invalid_characters()

    # Validate length (ObjectId should be 24 hex characters)
    if len(id_str) != OBJECT_ID_LENGTH:
        raise ObjectIdValidationError.invalid_length()

    # Check if it's a valid hex string
    if not all(c in "0123456789abcdef" for c in id_str.lower()):
        raise ObjectIdValidationError.invalid_format()

    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError) as e:
        raise ObjectIdValidationError.invalid_object_id(str(e)) from e


def validate_field_name(field_name: str, allowed_fields: set[str] | None = None) -> str:
    """Validate a field name to prevent injection attacks.

    Args:
        field_name: The field name to validate
        allowed_fields: Optional set of allowed field names

    Returns:
        Validated field name

    Raises:
        FieldNameValidationError: If the field name is invalid

    """
    if not field_name:
        raise FieldNameValidationError.empty_field_name()

    # Check length
    if len(field_name) > MAX_FIELD_NAME_LENGTH:
        raise FieldNameValidationError.field_name_too_long()

    # Check format (alphanumeric with dots for nested fields)
    if not FIELD_NAME_PATTERN.match(field_name):
        raise FieldNameValidationError.invalid_format()

    # Check against allowed fields if provided
    if allowed_fields:
        # For nested fields, check the base field
        base_field = field_name.split(".")[0]
        if base_field not in allowed_fields:
            raise FieldNameValidationError.field_not_allowed(base_field)

    # Prevent MongoDB operator injection
    if field_name.startswith("$"):
        raise FieldNameValidationError.starts_with_dollar()

    return field_name


def validate_url(url: str, allow_local: bool = False) -> str:
    """Validate and sanitize a URL to prevent SSRF attacks.

    Args:
        url: The URL to validate
        allow_local: Whether to allow local URLs

    Returns:
        Validated URL

    Raises:
        UrlValidationError: If the URL is invalid or potentially dangerous

    """
    if not url:
        raise UrlValidationError.empty_url()

    # Basic string sanitization
    url = url.strip()

    # Parse the URL
    try:
        parsed = urlparse(url)
    except Exception as e:
        raise UrlValidationError.invalid_format(str(e)) from e

    # Check scheme
    if parsed.scheme not in ALLOWED_URL_SCHEMES:
        schemes = ", ".join(ALLOWED_URL_SCHEMES)
        raise UrlValidationError.invalid_scheme(schemes)

    # Check for local URLs if not allowed
    if not allow_local:
        hostname = parsed.hostname
        if hostname:
            # Check for localhost and local IPs
            if hostname.lower() in FORBIDDEN_URL_HOSTS:
                raise UrlValidationError.local_url_not_allowed()

            # Check for private IP ranges and bind all interfaces
            if hostname.startswith(("10.", "192.168.", "172.")) or hostname == BIND_ALL_INTERFACES:
                raise UrlValidationError.private_url_not_allowed()

            # Check for file:// protocol disguised as http
            if "file:" in url.lower():
                raise UrlValidationError.file_protocol_not_allowed()

    # Check for common SSRF patterns
    dangerous_patterns = ["@", "%40", "0x", "0177", "::1", "[::]"]
    if any(pattern in url.lower() for pattern in dangerous_patterns):
        raise UrlValidationError.dangerous_patterns()

    return url


def _validate_regex_pattern(pattern: str) -> None:
    """Validate regex pattern for security and performance."""
    if len(pattern) > MAX_REGEX_PATTERN_LENGTH:
        raise RegexValidationError.pattern_too_long(MAX_REGEX_PATTERN_LENGTH)

    for dangerous in DANGEROUS_PATTERNS:
        if dangerous in pattern:
            raise RegexValidationError.dangerous_construct()

    # Test compile to catch syntax errors
    try:
        re.compile(pattern)
    except re.error as e:
        raise RegexValidationError.invalid_syntax(str(e)) from e


def validate_project_name(name: str) -> str:
    """Validate project name."""
    name = sanitize_string(name, max_length=MAX_NAME_LENGTH)
    if not SAFE_NAME_PATTERN.match(name):
        raise ProjectValidationError.invalid_characters()
    return name


def validate_description(description: str) -> str:
    """Validate description field."""
    if not description:  # Allow empty descriptions
        return ""
    return sanitize_string(description, max_length=MAX_DESCRIPTION_LENGTH)


def validate_tag(tag: str) -> str:
    """Validate a single tag."""
    tag = sanitize_string(tag, max_length=MAX_TAG_LENGTH)
    if not tag or tag.isspace():
        raise TagValidationError.empty_or_whitespace()
    return tag


def validate_tags(tags: list[str] | None) -> list[str] | None:
    """Validate a list of tags."""
    if tags is None:
        return None

    if len(tags) > MAX_TAGS_COUNT:
        raise TagValidationError.too_many_tags(MAX_TAGS_COUNT)

    validated_tags = []
    seen_tags = set()

    for tag in tags:
        validated_tag = validate_tag(tag)
        # Prevent duplicate tags
        if validated_tag.lower() in seen_tags:
            continue
        seen_tags.add(validated_tag.lower())
        validated_tags.append(validated_tag)

    return validated_tags
