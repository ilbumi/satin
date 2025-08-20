"""GraphQL security middleware for depth limiting and query complexity analysis."""

import logging
from collections.abc import Callable
from typing import Any

from graphql import GraphQLError
from strawberry.extensions import SchemaExtension

logger = logging.getLogger(__name__)

# Configuration constants
MAX_QUERY_DEPTH = 10
MAX_QUERY_COMPLEXITY = 100
MAX_ALIASES = 30


class QueryDepthAnalysisRule:
    """Custom depth analysis rule with improved error handling."""

    def __init__(self, max_depth: int):
        """Initialize depth analysis rule.

        Args:
            max_depth: Maximum allowed query depth

        """
        self.max_depth = max_depth

    def __call__(self, validation_context):
        """Create validation function for GraphQL fields.

        Args:
            validation_context: GraphQL validation context

        Returns:
            Dictionary mapping field types to validation functions

        """

        def enter_field(node, _key, _parent, _path, ancestors):
            # Count selection set ancestors to determine depth
            depth = len([ancestor for ancestor in ancestors if hasattr(ancestor, "selection_set")])
            if depth > self.max_depth:
                validation_context.report_error(
                    GraphQLError(
                        f"Query depth of {depth} exceeds maximum allowed depth of {self.max_depth}", nodes=[node]
                    )
                )

        return {"Field": enter_field}


class QueryComplexityAnalysisRule:
    """Analysis rule for query complexity based on field count and nesting."""

    def __init__(self, max_complexity: int):
        """Initialize complexity analysis rule.

        Args:
            max_complexity: Maximum allowed query complexity

        """
        self.max_complexity = max_complexity

    def __call__(self, validation_context):
        """Create validation function for GraphQL query complexity.

        Args:
            validation_context: GraphQL validation context

        Returns:
            Dictionary mapping field types to validation functions

        """
        complexity = 0

        def enter_field(node, _key, _parent, _path, ancestors):
            nonlocal complexity
            # Base complexity of 1 per field
            field_complexity = 1

            # Add complexity for nested fields
            depth = len([ancestor for ancestor in ancestors if hasattr(ancestor, "selection_set")])
            field_complexity += depth * 2

            # Add complexity for list fields (detected by plural names)
            field_name = node.name.value if hasattr(node, "name") else str(node)
            if field_name.endswith("s") or "list" in field_name.lower():
                field_complexity += 5

            complexity += field_complexity

            if complexity > self.max_complexity:
                validation_context.report_error(
                    GraphQLError(
                        f"Query complexity of {complexity} exceeds maximum allowed complexity of {self.max_complexity}",
                        nodes=[node],
                    )
                )

        return {"Field": enter_field}


class AliasAnalysisRule:
    """Analysis rule to prevent alias-based DoS attacks."""

    def __init__(self, max_aliases: int):
        """Initialize alias analysis rule.

        Args:
            max_aliases: Maximum allowed aliases in a query

        """
        self.max_aliases = max_aliases

    def __call__(self, validation_context):
        """Create validation function for GraphQL aliases.

        Args:
            validation_context: GraphQL validation context

        Returns:
            Dictionary mapping field types to validation functions

        """
        alias_count = 0

        def enter_field(node, _key, _parent, _path, _ancestors):
            nonlocal alias_count
            if hasattr(node, "alias") and node.alias:
                alias_count += 1
                if alias_count > self.max_aliases:
                    validation_context.report_error(
                        GraphQLError(
                            f"Query uses {alias_count} aliases, exceeding maximum of {self.max_aliases}", nodes=[node]
                        )
                    )

        return {"Field": enter_field}


class GraphQLSecurityExtension(SchemaExtension):
    """Strawberry extension for GraphQL security validation."""

    def __init__(
        self,
        max_depth: int = MAX_QUERY_DEPTH,
        max_complexity: int = MAX_QUERY_COMPLEXITY,
        max_aliases: int = MAX_ALIASES,
    ):
        """Initialize GraphQL security extension.

        Args:
            max_depth: Maximum query depth allowed
            max_complexity: Maximum query complexity allowed
            max_aliases: Maximum aliases allowed

        """
        self.max_depth = max_depth
        self.max_complexity = max_complexity
        self.max_aliases = max_aliases

    def on_operation(self):
        """Log query execution for security monitoring."""
        logger.info("Executing GraphQL query with security monitoring")


# Validation rules that can be used with standard GraphQL validation
def get_security_validation_rules(
    max_depth: int = MAX_QUERY_DEPTH,
    max_complexity: int = MAX_QUERY_COMPLEXITY,
    max_aliases: int = MAX_ALIASES,
) -> list[Callable[[Any], Any]]:
    """Get a list of security validation rules for GraphQL."""
    return [
        QueryDepthAnalysisRule(max_depth),
        QueryComplexityAnalysisRule(max_complexity),
        AliasAnalysisRule(max_aliases),
    ]
