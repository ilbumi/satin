"""Tests for GraphQL schema introspection and validation."""

import pytest

from tests.conftest import DatabaseFactory, TestDataFactory


class TestSchemaIntrospection:
    """Test GraphQL schema introspection queries."""

    async def test_schema_query_types(self, monkeypatch: pytest.MonkeyPatch):
        """Test that all expected query types are available."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        query = """
        query IntrospectQuery {
            __schema {
                queryType {
                    fields {
                        name
                        type {
                            name
                            kind
                        }
                    }
                }
            }
        }
        """

        result = gql.query(query)
        query_fields = {field["name"] for field in result["__schema"]["queryType"]["fields"]}

        # Verify all expected query fields exist
        expected_queries = {"project", "projects", "image", "images", "task", "tasks"}
        assert expected_queries.issubset(query_fields)

    async def test_schema_mutation_types(self, monkeypatch: pytest.MonkeyPatch):
        """Test that all expected mutation types are available."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        query = """
        query IntrospectMutation {
            __schema {
                mutationType {
                    fields {
                        name
                        type {
                            name
                            kind
                        }
                    }
                }
            }
        }
        """

        result = gql.query(query)
        mutation_fields = {field["name"] for field in result["__schema"]["mutationType"]["fields"]}

        # Verify all expected mutation fields exist
        expected_mutations = {
            "createProject",
            "updateProject",
            "deleteProject",
            "createImage",
            "updateImage",
            "deleteImage",
            "createTask",
            "updateTask",
            "deleteTask",
        }
        assert expected_mutations.issubset(mutation_fields)

    async def test_task_status_enum(self, monkeypatch: pytest.MonkeyPatch):
        """Test TaskStatus enum definition."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        query = """
        query IntrospectTaskStatus {
            __type(name: "TaskStatus") {
                name
                kind
                enumValues {
                    name
                    description
                }
            }
        }
        """

        result = gql.query(query)
        task_status_type = result["__type"]

        assert task_status_type["name"] == "TaskStatus"
        assert task_status_type["kind"] == "ENUM"

        enum_values = {value["name"] for value in task_status_type["enumValues"]}
        expected_values = {"DRAFT", "FINISHED", "REVIEWED"}
        assert enum_values == expected_values

    async def test_page_type_structure(self, monkeypatch: pytest.MonkeyPatch):
        """Test Page type structure for pagination."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        # First get all types to find the correct Page type name
        query = """
        query IntrospectAllTypes {
            __schema {
                types {
                    name
                    kind
                    fields {
                        name
                    }
                }
            }
        }
        """

        result = gql.query(query)
        types = result["__schema"]["types"]

        # Find a Page type (could be named differently by Strawberry)
        page_type = None
        for type_def in types:
            if type_def["kind"] == "OBJECT" and type_def["fields"]:
                field_names = {field["name"] for field in type_def["fields"]}
                if {"objects", "count", "limit", "offset"}.issubset(field_names):
                    page_type = type_def
                    break

        assert page_type is not None, "Page type not found in schema"
        assert page_type["kind"] == "OBJECT"

        field_names = {field["name"] for field in page_type["fields"]}
        expected_fields = {"objects", "count", "limit", "offset"}
        assert expected_fields.issubset(field_names)

    async def test_bbox_input_type(self, monkeypatch: pytest.MonkeyPatch):
        """Test BBoxInput input type structure."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        query = """
        query IntrospectBBoxInput {
            __type(name: "BBoxInput") {
                name
                kind
                inputFields {
                    name
                    type {
                        name
                        kind
                        ofType {
                            name
                            kind
                        }
                    }
                }
            }
        }
        """

        result = gql.query(query)
        bbox_input_type = result["__type"]

        assert bbox_input_type["name"] == "BBoxInput"
        assert bbox_input_type["kind"] == "INPUT_OBJECT"

        field_names = {field["name"] for field in bbox_input_type["inputFields"]}
        expected_fields = {"x", "y", "width", "height", "annotation"}
        assert expected_fields == field_names

    async def test_annotation_input_type(self, monkeypatch: pytest.MonkeyPatch):
        """Test AnnotationInput input type structure."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        query = """
        query IntrospectAnnotationInput {
            __type(name: "AnnotationInput") {
                name
                kind
                inputFields {
                    name
                    type {
                        name
                        kind
                        ofType {
                            name
                            kind
                        }
                    }
                }
            }
        }
        """

        result = gql.query(query)
        annotation_input_type = result["__type"]

        assert annotation_input_type["name"] == "AnnotationInput"
        assert annotation_input_type["kind"] == "INPUT_OBJECT"

        field_names = {field["name"] for field in annotation_input_type["inputFields"]}
        expected_fields = {"text", "tags"}
        assert expected_fields == field_names

    async def test_task_type_fields(self, monkeypatch: pytest.MonkeyPatch):
        """Test Task type field definitions."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        query = """
        query IntrospectTask {
            __type(name: "Task") {
                name
                kind
                fields {
                    name
                    type {
                        name
                        kind
                        ofType {
                            name
                            kind
                        }
                    }
                }
            }
        }
        """

        result = gql.query(query)
        task_type = result["__type"]

        assert task_type["name"] == "Task"
        assert task_type["kind"] == "OBJECT"

        field_names = {field["name"] for field in task_type["fields"]}
        expected_fields = {"id", "image", "project", "bboxes", "status", "createdAt"}
        assert expected_fields.issubset(field_names)

    async def test_query_field_arguments(self, monkeypatch: pytest.MonkeyPatch):
        """Test that query fields have correct arguments."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        query = """
        query IntrospectProjectsQuery {
            __schema {
                queryType {
                    fields {
                        name
                        args {
                            name
                            type {
                                name
                                kind
                            }
                            defaultValue
                        }
                    }
                }
            }
        }
        """

        result = gql.query(query)
        query_fields = {field["name"]: field for field in result["__schema"]["queryType"]["fields"]}

        # Check projects field has pagination arguments
        projects_field = query_fields["projects"]
        arg_names = {arg["name"] for arg in projects_field["args"]}
        expected_args = {"limit", "offset"}
        assert expected_args.issubset(arg_names)

        # Check that limit has default value
        limit_arg = next(arg for arg in projects_field["args"] if arg["name"] == "limit")
        assert limit_arg["defaultValue"] == "10"

        offset_arg = next(arg for arg in projects_field["args"] if arg["name"] == "offset")
        assert offset_arg["defaultValue"] == "0"

    async def test_mutation_field_arguments(self, monkeypatch: pytest.MonkeyPatch):
        """Test that mutation fields have correct arguments."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        query = """
        query IntrospectCreateTaskMutation {
            __schema {
                mutationType {
                    fields {
                        name
                        args {
                            name
                            type {
                                name
                                kind
                                ofType {
                                    name
                                    kind
                                }
                            }
                        }
                    }
                }
            }
        }
        """

        result = gql.query(query)
        mutation_fields = {field["name"]: field for field in result["__schema"]["mutationType"]["fields"]}

        # Check createTask mutation arguments
        create_task_field = mutation_fields["createTask"]
        arg_names = {arg["name"] for arg in create_task_field["args"]}
        expected_args = {"imageId", "projectId", "bboxes", "status"}
        assert expected_args.issubset(arg_names)

    async def test_scalar_types(self, monkeypatch: pytest.MonkeyPatch):
        """Test that custom scalar types are properly defined."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        query = """
        query IntrospectScalars {
            __schema {
                types {
                    name
                    kind
                }
            }
        }
        """

        result = gql.query(query)
        type_names = {type_def["name"] for type_def in result["__schema"]["types"]}

        # Verify standard GraphQL scalars are available
        expected_scalars = {"String", "Int", "Float", "Boolean", "ID"}
        assert expected_scalars.issubset(type_names)


class TestSchemaValidation:
    """Test schema validation and error handling."""

    async def test_invalid_query_field(self, monkeypatch: pytest.MonkeyPatch):
        """Test querying a non-existent field."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        query = """
        query InvalidField {
            nonExistentField {
                id
            }
        }
        """

        data, errors = gql.query_with_errors(query)

        assert data is None
        assert errors is not None
        assert len(errors) > 0
        assert "nonExistentField" in str(errors[0])

    async def test_invalid_mutation_field(self, monkeypatch: pytest.MonkeyPatch):
        """Test calling a non-existent mutation."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        mutation = """
        mutation InvalidMutation {
            nonExistentMutation(id: "123") {
                id
            }
        }
        """

        data, errors = gql.query_with_errors(mutation)

        assert data is None
        assert errors is not None
        assert "nonExistentMutation" in str(errors[0])

    async def test_invalid_enum_value(self, monkeypatch: pytest.MonkeyPatch):
        """Test using invalid enum value."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)
        test_data = TestDataFactory()

        # First create dependencies
        create_project_mutation = """
        mutation CreateProject($name: String!, $description: String!) {
            createProject(name: $name, description: $description) { id }
        }
        """

        create_image_mutation = """
        mutation CreateImage($url: String!) {
            createImage(url: $url) { id }
        }
        """

        project_result = gql.mutate(create_project_mutation, test_data.create_project_input())
        project_id = project_result["createProject"]["id"]

        image_result = gql.mutate(create_image_mutation, test_data.create_image_input())
        image_id = image_result["createImage"]["id"]

        # Try to create task with invalid status
        mutation = """
        mutation CreateTask($imageId: ID!, $projectId: ID!, $status: TaskStatus!) {
            createTask(imageId: $imageId, projectId: $projectId, status: $status) {
                id
                status
            }
        }
        """

        data, errors = gql.query_with_errors(
            mutation, {"imageId": image_id, "projectId": project_id, "status": "INVALID_STATUS"}
        )

        assert data is None
        assert errors is not None
        assert "INVALID_STATUS" in str(errors[0])

    async def test_missing_required_arguments(self, monkeypatch: pytest.MonkeyPatch):
        """Test mutation with missing required arguments."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        mutation = """
        mutation CreateProjectMissingArgs {
            createProject(name: "Test") {
                id
                name
            }
        }
        """

        data, errors = gql.query_with_errors(mutation)

        assert data is None
        assert errors is not None
        assert "description" in str(errors[0]).lower()

    async def test_type_coercion_errors(self, monkeypatch: pytest.MonkeyPatch):
        """Test invalid type coercion."""
        db, client = await DatabaseFactory.create_test_db()
        gql = DatabaseFactory.create_graphql_client(db, monkeypatch)

        mutation = """
        mutation CreateImageInvalidType($url: Int!) {
            createImage(url: $url) {
                id
            }
        }
        """

        data, errors = gql.query_with_errors(mutation, {"url": 123})

        assert data is None
        assert errors is not None
