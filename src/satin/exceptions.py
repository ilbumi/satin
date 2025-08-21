"""Custom exception classes for the application."""

from satin.constants import ERROR_MESSAGES


class ValidationError(Exception):
    """Base exception for validation errors."""

    def __init__(self, message: str, field_name: str | None = None) -> None:
        """Initialize the validation error.

        Args:
            message: The error message
            field_name: Optional field name that caused the error

        """
        super().__init__(message)
        self.field_name = field_name


class InputSanitizationError(ValidationError):
    """Exception raised when input sanitization fails."""

    @classmethod
    def empty_string(cls) -> "InputSanitizationError":
        """Create error for empty string."""
        return cls(ERROR_MESSAGES["EMPTY_STRING"])

    @classmethod
    def string_too_long(cls, max_length: int) -> "InputSanitizationError":
        """Create error for string too long."""
        message = ERROR_MESSAGES["STRING_TOO_LONG"] + f" of {max_length}"
        return cls(message)

    @classmethod
    def expected_string(cls, type_name: str) -> "InputSanitizationError":
        """Create error for wrong type."""
        message = ERROR_MESSAGES["EXPECTED_STRING"].format(type_name=type_name)
        return cls(message)


class ObjectIdValidationError(ValidationError):
    """Exception raised when ObjectId validation fails."""

    @classmethod
    def empty_id(cls) -> "ObjectIdValidationError":
        """Create error for empty ID."""
        return cls(ERROR_MESSAGES["EMPTY_ID"])

    @classmethod
    def invalid_length(cls) -> "ObjectIdValidationError":
        """Create error for invalid ID length."""
        return cls(ERROR_MESSAGES["INVALID_ID_LENGTH"])

    @classmethod
    def invalid_format(cls) -> "ObjectIdValidationError":
        """Create error for invalid ID format."""
        return cls(ERROR_MESSAGES["INVALID_ID_FORMAT"])

    @classmethod
    def invalid_characters(cls) -> "ObjectIdValidationError":
        """Create error for invalid characters."""
        return cls(ERROR_MESSAGES["INVALID_ID_CHARACTERS"])

    @classmethod
    def invalid_object_id(cls, error: str) -> "ObjectIdValidationError":
        """Create error for invalid ObjectId."""
        message = ERROR_MESSAGES["INVALID_OBJECT_ID"].format(error=error)
        return cls(message)


class FieldNameValidationError(ValidationError):
    """Exception raised when field name validation fails."""

    @classmethod
    def empty_field_name(cls) -> "FieldNameValidationError":
        """Create error for empty field name."""
        return cls(ERROR_MESSAGES["EMPTY_FIELD_NAME"])

    @classmethod
    def field_name_too_long(cls) -> "FieldNameValidationError":
        """Create error for field name too long."""
        return cls(ERROR_MESSAGES["FIELD_NAME_TOO_LONG"])

    @classmethod
    def invalid_format(cls) -> "FieldNameValidationError":
        """Create error for invalid field format."""
        return cls(ERROR_MESSAGES["INVALID_FIELD_FORMAT"])

    @classmethod
    def field_not_allowed(cls, field: str) -> "FieldNameValidationError":
        """Create error for disallowed field."""
        message = ERROR_MESSAGES["FIELD_NOT_ALLOWED"].format(field=field)
        return cls(message)

    @classmethod
    def starts_with_dollar(cls) -> "FieldNameValidationError":
        """Create error for field starting with $."""
        return cls(ERROR_MESSAGES["FIELD_STARTS_WITH_DOLLAR"])


class ProjectValidationError(ValidationError):
    """Exception raised when project validation fails."""

    @classmethod
    def invalid_characters(cls) -> "ProjectValidationError":
        """Create error for invalid characters in project name."""
        return cls(ERROR_MESSAGES["PROJECT_NAME_INVALID_CHARS"])


class TagValidationError(ValidationError):
    """Exception raised when tag validation fails."""

    @classmethod
    def empty_or_whitespace(cls) -> "TagValidationError":
        """Create error for empty or whitespace tag."""
        return cls(ERROR_MESSAGES["TAG_EMPTY_OR_WHITESPACE"])

    @classmethod
    def too_many_tags(cls, max_count: int) -> "TagValidationError":
        """Create error for too many tags."""
        message = ERROR_MESSAGES["TOO_MANY_TAGS"].format(max_count=max_count)
        return cls(message)


class CoordinateValidationError(ValidationError):
    """Exception raised when coordinate validation fails."""

    @classmethod
    def negative_coordinate(cls, field_name: str) -> "CoordinateValidationError":
        """Create error for negative coordinate."""
        message = ERROR_MESSAGES["COORDINATE_NEGATIVE"].format(field_name=field_name)
        return cls(message, field_name=field_name)

    @classmethod
    def exceeds_maximum(cls, field_name: str, max_value: int) -> "CoordinateValidationError":
        """Create error for coordinate exceeding maximum."""
        message = ERROR_MESSAGES["COORDINATE_EXCEEDS_MAX"].format(field_name=field_name, max_value=max_value)
        return cls(message, field_name=field_name)


class FilterValidationError(ValidationError):
    """Exception raised when filter validation fails."""

    @classmethod
    def numeric_filter_invalid(cls, type_name: str) -> "FilterValidationError":
        """Create error for invalid numeric filter."""
        message = ERROR_MESSAGES["NUMERIC_FILTER_INVALID"].format(type_name=type_name)
        return cls(message)

    @classmethod
    def filter_list_too_large(cls, max_size: int) -> "FilterValidationError":
        """Create error for filter list too large."""
        message = ERROR_MESSAGES["FILTER_LIST_TOO_LARGE"].format(max_size=max_size)
        return cls(message)


class RegexValidationError(ValidationError):
    """Exception raised when regex validation fails."""

    @classmethod
    def pattern_too_long(cls, max_length: int) -> "RegexValidationError":
        """Create error for regex pattern too long."""
        message = ERROR_MESSAGES["REGEX_TOO_LONG"].format(max_length=max_length)
        return cls(message)

    @classmethod
    def dangerous_construct(cls) -> "RegexValidationError":
        """Create error for dangerous regex construct."""
        return cls(ERROR_MESSAGES["REGEX_DANGEROUS_CONSTRUCT"])

    @classmethod
    def invalid_syntax(cls, error: str) -> "RegexValidationError":
        """Create error for invalid regex syntax."""
        message = ERROR_MESSAGES["REGEX_INVALID_SYNTAX"].format(error=error)
        return cls(message)
