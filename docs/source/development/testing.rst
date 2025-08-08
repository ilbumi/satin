Testing Guidelines
==================

SATIn follows a comprehensive testing strategy to ensure code quality, reliability, and maintainability. This guide covers our testing philosophy, tools, and best practices.

## Testing Philosophy

### Test Pyramid

SATIn implements the classic test pyramid strategy:

```
                    ┌─────────────┐
                    │   E2E Tests │ ← Few, comprehensive user flows
                    │   (Slow)    │
                    └─────────────┘
                ┌───────────────────┐
                │ Integration Tests │ ← API endpoints, database operations
                │    (Medium)       │
                └───────────────────┘
        ┌───────────────────────────────┐
        │        Unit Tests             │ ← Many, fast, focused tests
        │        (Fast)                 │ ← Functions, classes, components
        └───────────────────────────────┘
```

**Test Distribution**:
- **70%** Unit Tests - Fast, isolated, focused
- **20%** Integration Tests - API and database interactions
- **10%** E2E Tests - Complete user workflows

### Testing Principles

1. **Fast Feedback**: Tests should run quickly for rapid development
2. **Reliable**: Tests should be deterministic and not flaky
3. **Maintainable**: Tests should be easy to understand and modify
4. **Comprehensive**: Critical paths must be thoroughly tested
5. **Isolated**: Tests should not depend on external services

## Backend Testing

### Test Structure

```
tests/
├── conftest.py                  # Pytest configuration and fixtures
├── test_graphql_queries.py      # GraphQL query endpoint tests
├── test_graphql_mutations.py    # GraphQL mutation endpoint tests
├── test_graphql_schema.py       # Schema validation tests
├── test_project.py              # Project repository tests
├── test_image.py                # Image repository tests
├── test_task.py                 # Task repository tests
└── test_annotation.py           # Annotation logic tests
```

### Test Configuration

**pytest.ini Configuration**:

```ini
[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "session"
```

**Test Fixtures**:

The `conftest.py` file provides essential testing infrastructure:

- **DatabaseFactory**: Creates isolated test databases
- **GraphQLTestClient**: Helper for GraphQL testing
- **TestDataFactory**: Generates test data
- **Event Loop Management**: Handles async test execution

### Unit Testing

**Repository Layer Tests**

Test individual repository methods with mocked database:

```python
import pytest
from satin.repositories.project import ProjectRepository
from tests.conftest import DatabaseFactory, TestDataFactory

@pytest.mark.asyncio
async def test_project_repository_create():
    """Test project creation in repository layer."""
    db, client = await DatabaseFactory.create_test_db()

    try:
        repo = ProjectRepository(db)
        project_data = TestDataFactory.create_project_input(
            name="Test Project",
            description="Test Description"
        )

        # Test creation
        result = await repo.create(project_data)

        # Assertions
        assert result["name"] == "Test Project"
        assert result["description"] == "Test Description"
        assert "id" in result

        # Test retrieval
        retrieved = await repo.find_by_id(result["id"])
        assert retrieved is not None
        assert retrieved["name"] == "Test Project"

    finally:
        await DatabaseFactory.cleanup_test_db(db, client)
```

**Schema and Business Logic Tests**:

```python
from satin.schema.annotation import BBox, Annotation

def test_bbox_validation():
    """Test bounding box validation logic."""
    # Valid bounding box
    annotation = Annotation(text="car", tags=["vehicle"])
    bbox = BBox(x=10, y=20, width=100, height=200, annotation=annotation)

    assert bbox.x == 10
    assert bbox.y == 20
    assert bbox.width == 100
    assert bbox.height == 200
    assert bbox.annotation.text == "car"

def test_bbox_area_calculation():
    """Test bounding box area calculation."""
    annotation = Annotation(text="object")
    bbox = BBox(x=0, y=0, width=50, height=40, annotation=annotation)

    # If there's an area calculation method
    assert bbox.area() == 2000  # width * height
```

### Integration Testing

**GraphQL API Tests**

Test complete API workflows with database interactions:

```python
import pytest
from tests.conftest import DatabaseFactory, TestDataFactory

@pytest.mark.asyncio
async def test_create_project_mutation(monkeypatch):
    """Test project creation via GraphQL mutation."""
    db, client = await DatabaseFactory.create_test_db()

    try:
        graphql_client = DatabaseFactory.create_graphql_client(db, monkeypatch)

        mutation = """
            mutation CreateProject($input: ProjectInput!) {
                createProject(input: $input) {
                    id
                    name
                    description
                }
            }
        """

        variables = {
            "input": TestDataFactory.create_project_input(
                name="GraphQL Test Project",
                description="Created via GraphQL API"
            )
        }

        # Execute mutation
        result = graphql_client.mutate(mutation, variables)

        # Verify response
        project = result["createProject"]
        assert project["name"] == "GraphQL Test Project"
        assert project["description"] == "Created via GraphQL API"
        assert "id" in project

        # Verify database state
        repo = ProjectRepository(db)
        stored_project = await repo.find_by_id(project["id"])
        assert stored_project is not None
        assert stored_project["name"] == "GraphQL Test Project"

    finally:
        await DatabaseFactory.cleanup_test_db(db, client)

@pytest.mark.asyncio
async def test_projects_query_with_pagination(monkeypatch):
    """Test projects query with pagination and filtering."""
    db, client = await DatabaseFactory.create_test_db()

    try:
        # Setup test data
        repo = ProjectRepository(db)
        for i in range(5):
            await repo.create(TestDataFactory.create_project_input(
                name=f"Project {i}",
                description=f"Description {i}"
            ))

        graphql_client = DatabaseFactory.create_graphql_client(db, monkeypatch)

        query = """
            query GetProjects($limit: Int, $offset: Int) {
                projects(limit: $limit, offset: $offset) {
                    id
                    name
                    description
                }
            }
        """

        # Test pagination
        result = graphql_client.query(query, {"limit": 3, "offset": 0})
        projects = result["projects"]

        assert len(projects) == 3
        assert all("id" in project for project in projects)

        # Test next page
        result2 = graphql_client.query(query, {"limit": 3, "offset": 3})
        projects2 = result2["projects"]

        assert len(projects2) == 2  # Remaining projects

        # Ensure no duplicates between pages
        page1_ids = {p["id"] for p in projects}
        page2_ids = {p["id"] for p in projects2}
        assert page1_ids.isdisjoint(page2_ids)

    finally:
        await DatabaseFactory.cleanup_test_db(db, client)
```

**Error Handling Tests**:

```python
@pytest.mark.asyncio
async def test_graphql_error_handling(monkeypatch):
    """Test GraphQL error responses."""
    db, client = await DatabaseFactory.create_test_db()

    try:
        graphql_client = DatabaseFactory.create_graphql_client(db, monkeypatch)

        # Test invalid input
        mutation = """
            mutation CreateProject($input: ProjectInput!) {
                createProject(input: $input) {
                    id
                    name
                }
            }
        """

        variables = {
            "input": {
                "name": "",  # Invalid: empty name
                "description": "Valid description"
            }
        }

        # Execute and expect errors
        data, errors = graphql_client.query_with_errors(mutation, variables)

        assert errors is not None
        assert len(errors) > 0
        assert "validation" in str(errors[0]).lower()

    finally:
        await DatabaseFactory.cleanup_test_db(db, client)
```

### Database Testing

**Complex Query Tests**:

```python
@pytest.mark.asyncio
async def test_complex_task_queries():
    """Test complex task queries with filtering and aggregation."""
    db, client = await DatabaseFactory.create_test_db()

    try:
        # Setup test data with multiple projects and tasks
        project_repo = ProjectRepository(db)
        task_repo = TaskRepository(db)

        # Create projects
        project1 = await project_repo.create(
            TestDataFactory.create_project_input(name="Project A")
        )
        project2 = await project_repo.create(
            TestDataFactory.create_project_input(name="Project B")
        )

        # Create tasks with different statuses
        for status in ["DRAFT", "FINISHED", "REVIEWED"]:
            await task_repo.create({
                "project_id": project1["id"],
                "image_id": "img1",
                "status": status,
                "bboxes": []
            })

        # Test filtering by status
        draft_tasks = await task_repo.find_all(
            query_input={
                "string_filters": [
                    {"field": "status", "operator": "EQ", "value": "DRAFT"}
                ]
            }
        )

        assert len(draft_tasks) == 1
        assert draft_tasks[0]["status"] == "DRAFT"

        # Test filtering by project
        project_a_tasks = await task_repo.find_all(
            query_input={
                "string_filters": [
                    {"field": "project_id", "operator": "EQ", "value": project1["id"]}
                ]
            }
        )

        assert len(project_a_tasks) == 3  # All tasks belong to Project A

    finally:
        await DatabaseFactory.cleanup_test_db(db, client)
```

## Frontend Testing

### Test Structure

```
frontend/
├── src/
│   ├── lib/
│   │   └── components/
│   │       ├── AnnotationPanel.svelte.test.ts
│   │       ├── AnnotationToolbar.svelte.test.ts
│   │       ├── ImageCanvas.svelte.test.ts
│   │       └── __screenshots__/          # Visual regression tests
│   └── routes/
│       └── page.svelte.test.ts
└── vitest.config.ts                      # Vitest configuration
```

### Component Testing

**Svelte Component Tests**:

```typescript
import { render, fireEvent, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import AnnotationPanel from './AnnotationPanel.svelte';
import type { Annotation } from '$lib/types';

test('should display annotations in list format', () => {
    const annotations: Annotation[] = [
        {
            id: '1',
            bbox: { x: 10, y: 20, width: 100, height: 200 },
            text: 'Car',
            tags: ['vehicle', 'sedan']
        },
        {
            id: '2',
            bbox: { x: 50, y: 60, width: 80, height: 120 },
            text: 'Person',
            tags: ['human']
        }
    ];

    render(AnnotationPanel, {
        props: {
            annotations,
            onAnnotationSelect: vi.fn(),
            onAnnotationDelete: vi.fn()
        }
    });

    // Verify annotations are displayed
    expect(screen.getByText('Car')).toBeInTheDocument();
    expect(screen.getByText('Person')).toBeInTheDocument();
    expect(screen.getByText('vehicle, sedan')).toBeInTheDocument();
});

test('should handle annotation selection', async () => {
    const mockOnSelect = vi.fn();
    const annotations: Annotation[] = [
        {
            id: '1',
            bbox: { x: 10, y: 20, width: 100, height: 200 },
            text: 'Car',
            tags: ['vehicle']
        }
    ];

    render(AnnotationPanel, {
        props: {
            annotations,
            onAnnotationSelect: mockOnSelect,
            onAnnotationDelete: vi.fn()
        }
    });

    // Click on annotation
    const annotationItem = screen.getByTestId('annotation-item-1');
    await fireEvent.click(annotationItem);

    // Verify callback was called
    expect(mockOnSelect).toHaveBeenCalledWith(annotations[0]);
});
```

**Canvas Interaction Tests**:

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import ImageCanvas from './ImageCanvas.svelte';

test('should create bounding box annotation on mouse drag', async () => {
    const mockOnAnnotationCreate = vi.fn();

    const { container } = render(ImageCanvas, {
        props: {
            imageUrl: 'test-image.jpg',
            annotations: [],
            isDrawing: true,
            activeTool: 'bbox',
            onAnnotationCreate: mockOnAnnotationCreate
        }
    });

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Simulate mouse drag for bounding box creation
    await fireEvent.mouseDown(canvas!, {
        clientX: 100,
        clientY: 200,
        buttons: 1
    });

    await fireEvent.mouseMove(canvas!, {
        clientX: 200,
        clientY: 300,
        buttons: 1
    });

    await fireEvent.mouseUp(canvas!, {
        clientX: 200,
        clientY: 300
    });

    // Verify annotation creation callback
    expect(mockOnAnnotationCreate).toHaveBeenCalledWith({
        x: 100,
        y: 200,
        width: 100,
        height: 100
    });
});
```

### Browser Testing

**E2E Tests with Playwright**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Annotation Workflow', () => {
    test('complete annotation workflow', async ({ page }) => {
        // Navigate to annotation interface
        await page.goto('/projects/1/annotate');

        // Wait for page to load
        await expect(page.locator('[data-testid="image-canvas"]')).toBeVisible();

        // Select bounding box tool
        await page.click('[data-testid="bbox-tool"]');

        // Verify tool is active
        await expect(page.locator('[data-testid="bbox-tool"]')).toHaveClass(/active/);

        // Draw bounding box
        const canvas = page.locator('[data-testid="image-canvas"]');
        await canvas.click({ position: { x: 100, y: 100 } });
        await page.mouse.down();
        await page.mouse.move(200, 200);
        await page.mouse.up();

        // Add label to annotation
        await page.fill('[data-testid="annotation-label"]', 'Test Object');
        await page.press('[data-testid="annotation-label"]', 'Enter');

        // Verify annotation appears in panel
        await expect(page.locator('[data-testid="annotation-item"]')).toContainText('Test Object');

        // Test annotation selection
        await page.click('[data-testid="annotation-item"]');
        await expect(page.locator('[data-testid="annotation-item"]')).toHaveClass(/selected/);

        // Test annotation deletion
        await page.click('[data-testid="delete-annotation"]');
        await expect(page.locator('[data-testid="annotation-item"]')).not.toBeVisible();
    });

    test('should handle multiple annotations', async ({ page }) => {
        await page.goto('/projects/1/annotate');

        // Create multiple annotations
        for (let i = 0; i < 3; i++) {
            await page.click('[data-testid="bbox-tool"]');

            const canvas = page.locator('[data-testid="image-canvas"]');
            await canvas.click({ position: { x: 50 + i * 100, y: 50 + i * 50 } });
            await page.mouse.down();
            await page.mouse.move(150 + i * 100, 150 + i * 50);
            await page.mouse.up();

            await page.fill('[data-testid="annotation-label"]', `Object ${i + 1}`);
            await page.press('[data-testid="annotation-label"]', 'Enter');
        }

        // Verify all annotations are present
        const annotationItems = page.locator('[data-testid="annotation-item"]');
        await expect(annotationItems).toHaveCount(3);

        // Verify labels
        await expect(annotationItems.nth(0)).toContainText('Object 1');
        await expect(annotationItems.nth(1)).toContainText('Object 2');
        await expect(annotationItems.nth(2)).toContainText('Object 3');
    });
});

test.describe('Project Management', () => {
    test('should create new project', async ({ page }) => {
        await page.goto('/projects');

        // Click create project button
        await page.click('[data-testid="create-project"]');

        // Fill project details
        await page.fill('[data-testid="project-name"]', 'E2E Test Project');
        await page.fill('[data-testid="project-description"]', 'Created by E2E test');

        // Submit form
        await page.click('[data-testid="submit-project"]');

        // Verify project appears in list
        await expect(page.locator('[data-testid="project-item"]')).toContainText('E2E Test Project');

        // Navigate to project
        await page.click('[data-testid="project-item"]');
        await expect(page).toHaveURL(/\/projects\/\w+/);

        // Verify project details page
        await expect(page.locator('h1')).toContainText('E2E Test Project');
        await expect(page.locator('[data-testid="project-description"]')).toContainText('Created by E2E test');
    });
});
```

### Visual Regression Testing

**Screenshot Testing**:

The frontend uses Vitest's browser mode for visual regression testing:

```typescript
import { test, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import AnnotationPanel from './AnnotationPanel.svelte';

test('AnnotationPanel visual regression', async () => {
    const annotations = [
        {
            id: '1',
            bbox: { x: 10, y: 20, width: 100, height: 200 },
            text: 'Car',
            tags: ['vehicle', 'red']
        }
    ];

    const { container } = render(AnnotationPanel, {
        props: {
            annotations,
            onAnnotationSelect: () => {},
            onAnnotationDelete: () => {}
        }
    });

    // Take screenshot for visual comparison
    await expect(container).toMatchSnapshot('annotation-panel.png');
});
```

## Test Data Management

### Test Data Factory

The `TestDataFactory` provides consistent test data generation:

```python
class TestDataFactory:
    """Factory for creating test data."""

    @staticmethod
    def create_project_input(
        name: str = "Test Project",
        description: str = "Test Description"
    ) -> dict[str, Any]:
        return {"name": name, "description": description}

    @staticmethod
    def create_bbox_input(
        x: float = 10.0,
        y: float = 20.0,
        width: float = 100.0,
        height: float = 200.0,
        annotation: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        if annotation is None:
            annotation = TestDataFactory.create_annotation_input()
        return {
            "x": x, "y": y,
            "width": width, "height": height,
            "annotation": annotation
        }
```

### Database Fixtures

Isolated database instances for each test:

```python
@pytest.fixture
async def test_db():
    """Provide isolated test database."""
    db, client = await DatabaseFactory.create_test_db()
    try:
        yield db
    finally:
        await DatabaseFactory.cleanup_test_db(db, client)

@pytest.fixture
async def repositories(test_db):
    """Provide repository instances."""
    return await DatabaseFactory.create_repositories(test_db)
```

## Running Tests

### Development Commands

```bash
# Run all tests
make test

# Backend tests only
uv run pytest

# Frontend tests only
cd frontend && pnpm test

# Run with coverage
uv run pytest --cov=src --cov-report=html

# Run specific test file
uv run pytest tests/test_project.py

# Run tests matching pattern
uv run pytest -k "test_create"

# Run tests in verbose mode
uv run pytest -v

# Run frontend tests in watch mode
cd frontend && pnpm test --watch
```

### CI/CD Integration

**GitHub Actions Workflow**:

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'

      - name: Install dependencies
        run: |
          pip install uv
          uv sync

      - name: Run tests
        run: uv run pytest --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2

      - name: Install dependencies
        run: |
          cd frontend
          pnpm install

      - name: Run tests
        run: |
          cd frontend
          pnpm test --browser.headless
```

## Test Quality Guidelines

### Writing Good Tests

**Arrange-Act-Assert Pattern**:

```python
async def test_project_creation():
    # Arrange
    db, client = await DatabaseFactory.create_test_db()
    repo = ProjectRepository(db)
    project_data = TestDataFactory.create_project_input()

    try:
        # Act
        result = await repo.create(project_data)

        # Assert
        assert result["name"] == project_data["name"]
        assert "id" in result
    finally:
        await DatabaseFactory.cleanup_test_db(db, client)
```

**Test Naming Conventions**:

- `test_should_create_project_when_valid_data_provided`
- `test_should_raise_error_when_duplicate_name`
- `test_should_return_empty_list_when_no_projects_exist`

### Test Coverage Goals

- **Minimum Coverage**: 80% overall
- **Critical Paths**: 95% coverage
- **New Features**: 90% coverage
- **Bug Fixes**: Include regression tests

### Performance Testing

**Load Testing** (future implementation):

```python
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor

async def test_concurrent_project_creation():
    """Test system under concurrent load."""
    db, client = await DatabaseFactory.create_test_db()

    try:
        repo = ProjectRepository(db)

        async def create_project(i):
            data = TestDataFactory.create_project_input(name=f"Project {i}")
            return await repo.create(data)

        # Create 100 projects concurrently
        start_time = time.time()
        tasks = [create_project(i) for i in range(100)]
        results = await asyncio.gather(*tasks)
        end_time = time.time()

        # Verify all projects created
        assert len(results) == 100
        assert all("id" in result for result in results)

        # Performance assertion
        duration = end_time - start_time
        assert duration < 5.0  # Should complete within 5 seconds

    finally:
        await DatabaseFactory.cleanup_test_db(db, client)
```

## Debugging Tests

### Common Issues

**Async Test Issues**:
- Use `@pytest.mark.asyncio` for async tests
- Ensure proper event loop management
- Clean up async resources in finally blocks

**Database Isolation**:
- Each test gets isolated database instance
- Clean up connections after tests
- Use proper fixtures for setup/teardown

**Frontend Testing Issues**:
- Mock external API calls
- Use proper test selectors (`data-testid`)
- Handle async component updates

### Debugging Tools

```bash
# Run single test with debugging
uv run pytest tests/test_project.py::test_create_project -v -s

# Run with Python debugger
uv run pytest --pdb

# Run with coverage debugging
uv run pytest --cov=src --cov-report=term-missing

# Frontend debugging
cd frontend && pnpm test --ui  # Opens Vitest UI
```

## Related Documentation

- :doc:`setup` - Development environment setup for testing
- :doc:`contributing` - Contribution workflow including testing requirements
- :doc:`architecture` - System architecture and testing strategy
- :doc:`../api_reference/index` - API documentation with testing examples
