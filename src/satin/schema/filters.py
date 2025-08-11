from enum import StrEnum

import strawberry
from strawberry.scalars import JSON

from satin.models.filters import (
    ListFilterModel,
    ListFilterOperator,
    NumberFilterModel,
    NumberFilterOperator,
    QueryModel,
    SortDirection,
    SortModel,
    StringFilterModel,
    StringFilterOperator,
)


# Convert Pydantic enums to Strawberry enums
@strawberry.enum
class SortDirectionEnum(StrEnum):
    ASC = "asc"
    DESC = "desc"


@strawberry.enum
class NumberFilterOperatorEnum(StrEnum):
    EQ = "eq"
    NE = "ne"
    GT = "gt"
    LT = "lt"
    GTE = "gte"
    LTE = "lte"
    IN = "in"
    NIN = "nin"


@strawberry.enum
class StringFilterOperatorEnum(StrEnum):
    EQ = "eq"
    NE = "ne"
    CONTAINS = "contains"
    STARTS_WITH = "starts_with"
    ENDS_WITH = "ends_with"
    REGEX = "regex"
    IN = "in"
    NIN = "nin"


@strawberry.enum
class ListFilterOperatorEnum(StrEnum):
    CONTAINS = "contains"
    CONTAINS_ALL = "contains_all"
    CONTAINS_ANY = "contains_any"
    SIZE_EQ = "size_eq"
    SIZE_GT = "size_gt"
    SIZE_LT = "size_lt"


# Convert Pydantic models to Strawberry inputs using experimental.pydantic.input
@strawberry.input
class SortInput:
    field: str
    direction: SortDirectionEnum = SortDirectionEnum.ASC

    def to_pydantic(self) -> SortModel:
        """Convert to Pydantic model."""
        return SortModel(field=self.field, direction=SortDirection(self.direction))


@strawberry.input
class NumberFilterInput:
    field: str
    operator: NumberFilterOperatorEnum
    value: JSON  # type: ignore[valid-type]


@strawberry.input
class StringFilterInput:
    field: str
    operator: StringFilterOperatorEnum
    value: JSON  # type: ignore[valid-type]


@strawberry.input
class ListFilterInput:
    field: str
    operator: ListFilterOperatorEnum
    value: JSON  # type: ignore[valid-type]


@strawberry.input
class QueryInput:
    number_filters: list[NumberFilterInput] = strawberry.field(default_factory=list)
    string_filters: list[StringFilterInput] = strawberry.field(default_factory=list)
    list_filters: list[ListFilterInput] = strawberry.field(default_factory=list)
    sorts: list[SortInput] = strawberry.field(default_factory=list)
    limit: int = 10
    offset: int = 0

    def to_pydantic(self) -> QueryModel:
        """Convert to Pydantic model."""
        # Convert filters
        number_filters_pydantic = [
            NumberFilterModel(field=f.field, operator=NumberFilterOperator(f.operator.value), value=f.value)
            for f in self.number_filters
        ]

        string_filters_pydantic = [
            StringFilterModel(field=f.field, operator=StringFilterOperator(f.operator.value), value=f.value)
            for f in self.string_filters
        ]

        list_filters_pydantic = [
            ListFilterModel(field=f.field, operator=ListFilterOperator(f.operator.value), value=f.value)
            for f in self.list_filters
        ]

        sorts_pydantic = [s.to_pydantic() for s in self.sorts]

        return QueryModel(
            number_filters=number_filters_pydantic,
            string_filters=string_filters_pydantic,
            list_filters=list_filters_pydantic,
            sorts=sorts_pydantic,
            limit=self.limit,
            offset=self.offset,
        )
