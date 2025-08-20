"""Constants for the application."""

# String and input limits
MAX_STRING_LENGTH = 10000
MAX_NAME_LENGTH = 255
MAX_DESCRIPTION_LENGTH = 5000
MAX_TAG_LENGTH = 100
MAX_TAGS_COUNT = 50
MAX_FIELD_NAME_LENGTH = 100

# Coordinate and bounding box limits
MAX_BBOX_COORDINATE = 10000
MIN_BBOX_COORDINATE = 0

# Character limits for sanitization
MIN_PRINTABLE_CHAR = 32
MAX_CHAR_EXCLUDE = 127

# ObjectId constants
OBJECT_ID_LENGTH = 24

# Query and filter limits
MAX_QUERY_LIMIT = 1000
MAX_FILTERS_PER_TYPE = 20
MAX_FILTER_LIST_SIZE = 100

# Task and annotation limits
MAX_BBOXES_PER_TASK = 1000
MAX_REGEX_PATTERN_LENGTH = 1000

# URL validation
ALLOWED_URL_SCHEMES = {"http", "https", "data"}
FORBIDDEN_URL_HOSTS = {"localhost", "127.0.0.1", "::1"}
TRUSTED_TEST_DOMAINS = {"picsum.photos", "httpbin.org", "jsonplaceholder.typicode.com"}
BIND_ALL_INTERFACES = "0.0.0.0"  # nosec  # noqa: S104

# Error messages
ERROR_MESSAGES = {
    # General validation errors
    "EMPTY_STRING": "String cannot be empty",
    "STRING_TOO_LONG": "String exceeds maximum length",
    "EXPECTED_STRING": "Expected string, got {type_name}",
    "INVALID_CHARACTERS": "Contains invalid characters",
    # ID validation errors
    "EMPTY_ID": "ID cannot be empty",
    "INVALID_ID_LENGTH": "Invalid ID length",
    "INVALID_ID_FORMAT": "ID must be a valid hexadecimal string",
    "INVALID_ID_CHARACTERS": "ID contains invalid characters",
    "INVALID_OBJECT_ID": "Invalid ObjectId: {error}",
    # Field name errors
    "EMPTY_FIELD_NAME": "Field name cannot be empty",
    "FIELD_NAME_TOO_LONG": "Field name too long",
    "INVALID_FIELD_FORMAT": "Invalid field name format",
    "FIELD_NOT_ALLOWED": "Field '{field}' is not allowed",
    "FIELD_STARTS_WITH_DOLLAR": "Field name cannot start with $",
    # URL validation errors
    "EMPTY_URL": "URL cannot be empty",
    "INVALID_URL_FORMAT": "Invalid URL format: {error}",
    "INVALID_URL_SCHEME": "URL scheme must be one of: {schemes}",
    "LOCAL_URL_NOT_ALLOWED": "Local URLs are not allowed",
    "PRIVATE_URL_NOT_ALLOWED": "Private network URLs are not allowed",
    "FILE_PROTOCOL_NOT_ALLOWED": "File protocol is not allowed",
    "DANGEROUS_URL_PATTERNS": "URL contains potentially dangerous patterns",
    # Project validation errors
    "PROJECT_NAME_INVALID_CHARS": "Project name contains invalid characters",
    # Tag validation errors
    "TAG_EMPTY_OR_WHITESPACE": "Tag cannot be empty or whitespace",
    "TOO_MANY_TAGS": "Too many tags (maximum {max_count})",
    # Coordinate validation errors
    "COORDINATE_NEGATIVE": "{field_name} must be non-negative",
    "COORDINATE_EXCEEDS_MAX": "{field_name} exceeds maximum value of {max_value}",
    # Filter validation errors
    "NUMERIC_FILTER_INVALID": "Numeric filter value must be a number, got {type_name}",
    "FILTER_LIST_TOO_LARGE": "Filter list value cannot exceed {max_size} items",
    # Regex validation errors
    "REGEX_TOO_LONG": "Regex pattern too long (max {max_length} characters)",
    "REGEX_DANGEROUS_CONSTRUCT": "Regex pattern contains potentially dangerous constructs",
    "REGEX_INVALID_SYNTAX": "Invalid regex pattern: {error}",
}
