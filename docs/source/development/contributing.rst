Contributing Guidelines
=======================

Thank you for your interest in contributing to SATIn! This guide will help you understand how to contribute effectively to the project.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Python 3.13+ installed
- Node.js 18+ and pnpm
- Git for version control
- MongoDB 4.4+ (local or Docker)
- Basic understanding of FastAPI, GraphQL, and Svelte

### Development Environment Setup

1. **Fork and Clone**

   Fork the repository on GitHub and clone your fork:

   ```bash
   git clone https://github.com/your-username/satin.git
   cd satin
   ```

2. **Set Up Backend**

   ```bash
   # Install dependencies
   uv sync

   # Set up environment variables
   cp .env.example .env  # Edit with your settings

   # Start MongoDB (if using Docker)
   docker-compose up -d mongodb
   ```

3. **Set Up Frontend**

   ```bash
   cd frontend
   pnpm install
   ```

4. **Run Development Servers**

   ```bash
   # Terminal 1: Backend
   make launch_backend

   # Terminal 2: Frontend
   make launch_frontend
   ```

5. **Verify Setup**

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - GraphQL Playground: http://localhost:8000/graphql

## Development Workflow

### Branch Strategy

We use a **feature branch workflow**:

```
main                    # Production-ready code
├── feature/new-tool    # New annotation tool
├── bugfix/canvas-fix   # Bug fixes
├── docs/api-guide      # Documentation updates
└── refactor/repo-layer # Code refactoring
```

### Creating a New Feature

1. **Create Feature Branch**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**

   Follow the coding standards and write tests for new functionality.

3. **Test Your Changes**

   ```bash
   # Run all tests
   make test

   # Run linting
   make lint

   # Format code
   make format
   ```

4. **Commit Changes**

   Use [Conventional Commits](https://conventionalcommits.org/):

   ```bash
   git add .
   git commit -m "feat: add bounding box rotation tool"
   git commit -m "fix: resolve canvas rendering issue"
   git commit -m "docs: update API documentation"
   ```

5. **Push and Create PR**

   ```bash
   git push origin feature/your-feature-name
   ```

   Create a Pull Request on GitHub with a clear description.

## Code Style and Standards

### Python (Backend)

**Code Style**

- Use `ruff` for linting and formatting
- Follow PEP 8 with 120 character line length
- Use type hints for all functions and variables
- Prefer explicit over implicit code

**Example**:

```python
from typing import Optional
import strawberry

@strawberry.type
class Project:
    """Project represents an annotation project."""

    id: strawberry.ID
    name: str
    description: Optional[str] = None

    def __init__(self, name: str, description: Optional[str] = None) -> None:
        """Initialize a new project."""
        self.name = name
        self.description = description
```

**Architecture Patterns**

- Repository pattern for data access
- Dependency injection with factory pattern
- Async/await for all I/O operations
- GraphQL schema-first API design

### TypeScript/Svelte (Frontend)

**Code Style**

- Use ESLint and Prettier for formatting
- Strict TypeScript configuration
- Prefer composition over inheritance
- Use Svelte 5 runes for reactivity

**Example**:

```typescript
<script lang="ts">
import type { Annotation } from '$lib/types';

interface Props {
    annotations: Annotation[];
    onAnnotationSelect: (annotation: Annotation) => void;
}

const { annotations, onAnnotationSelect }: Props = $props();

let selectedAnnotation = $state<Annotation | null>(null);

function handleSelect(annotation: Annotation): void {
    selectedAnnotation = annotation;
    onAnnotationSelect(annotation);
}
</script>
```

**Component Guidelines**

- Single responsibility principle
- Props interface definitions
- Proper event handling
- Accessibility attributes

### Documentation

**Code Documentation**

- Docstrings for all public functions and classes
- Type hints serve as inline documentation
- Comments for complex business logic
- README updates for new features

**Example**:

```python
async def create_annotation(
    self,
    task_id: strawberry.ID,
    bbox_data: BBoxInput
) -> BBox:
    """Create a new bounding box annotation for a task.

    Args:
        task_id: The ID of the task to add annotation to
        bbox_data: Bounding box coordinates and label data

    Returns:
        The created bounding box annotation

    Raises:
        TaskNotFoundError: When the specified task doesn't exist
        ValidationError: When bbox_data is invalid
    """
```

## Testing Guidelines

### Test Strategy

**Test Pyramid**

```
                    ┌─────────────┐
                    │     E2E     │ ← Few, high-value tests
                    └─────────────┘
                ┌───────────────────┐
                │   Integration     │ ← API and database tests
                └───────────────────┘
        ┌───────────────────────────────┐
        │         Unit Tests            │ ← Many, fast, focused tests
        └───────────────────────────────┘
```

### Backend Testing

**Unit Tests**

Test individual functions and classes:

```python
import pytest
from satin.repositories.project import ProjectRepository

@pytest.mark.asyncio
async def test_create_project(mock_db):
    """Test project creation with valid data."""
    repo = ProjectRepository(mock_db)

    project_data = {
        "name": "Test Project",
        "description": "Test description"
    }

    result = await repo.create(project_data)

    assert result["name"] == "Test Project"
    assert result["description"] == "Test description"
    assert "id" in result
```

**Integration Tests**

Test API endpoints and database interactions:

```python
@pytest.mark.asyncio
async def test_graphql_create_project(test_client):
    """Test GraphQL project creation mutation."""
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
        "input": {
            "name": "Integration Test Project",
            "description": "Created via GraphQL"
        }
    }

    response = await test_client.post(
        "/graphql",
        json={"query": mutation, "variables": variables}
    )

    assert response.status_code == 200
    data = response.json()["data"]["createProject"]
    assert data["name"] == "Integration Test Project"
```

### Frontend Testing

**Component Tests**

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import AnnotationPanel from '$lib/components/AnnotationPanel.svelte';

test('should display annotations list', () => {
    const annotations = [
        { id: '1', text: 'Car', tags: ['vehicle'] },
        { id: '2', text: 'Person', tags: ['human'] }
    ];

    const { getByText } = render(AnnotationPanel, {
        props: { annotations }
    });

    expect(getByText('Car')).toBeInTheDocument();
    expect(getByText('Person')).toBeInTheDocument();
});
```

**E2E Tests**

```typescript
import { test, expect } from '@playwright/test';

test('annotation workflow', async ({ page }) => {
    await page.goto('/projects/1/annotate');

    // Select bounding box tool
    await page.click('[data-testid="bbox-tool"]');

    // Draw annotation
    await page.mouse.move(100, 100);
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();

    // Add label
    await page.fill('[data-testid="annotation-label"]', 'Test Object');

    // Verify annotation was created
    await expect(page.locator('[data-testid="annotation-item"]')).toContainText('Test Object');
});
```

### Test Requirements

**All Pull Requests Must**:

- Include tests for new functionality
- Maintain or improve test coverage
- Pass all existing tests
- Include integration tests for API changes

**Running Tests**:

```bash
# All tests
make test

# Backend only
uv run pytest -v

# Frontend only
cd frontend && pnpm test

# Coverage report
uv run pytest --cov=src --cov-report=html
```

## Code Review Process

### Pull Request Requirements

**Before Submitting**:

- [ ] Code follows style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Commit messages follow conventional format
- [ ] Branch is up to date with main

**PR Template**:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Screenshots
If applicable, add screenshots to help explain your changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review of code performed
- [ ] Tests pass locally
- [ ] Documentation updated
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: At least one maintainer reviews the code
3. **Testing**: Reviewer tests functionality if needed
4. **Approval**: Changes approved by maintainer
5. **Merge**: Pull request merged to main branch

### Review Criteria

**Code Quality**:
- Follows established patterns and conventions
- Proper error handling and edge cases
- Performance considerations
- Security implications

**Testing**:
- Adequate test coverage
- Tests are meaningful and maintainable
- Integration tests for API changes

**Documentation**:
- Code is self-documenting
- Complex logic is explained
- API changes are documented
- User-facing changes update user docs

## Issue Management

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. Ubuntu 20.04]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements or additions to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `question`: Further information is requested

## Development Guidelines

### Performance Considerations

**Backend Performance**:
- Use async/await for all I/O operations
- Implement proper database indexing
- Use aggregation pipelines for complex queries
- Consider caching for frequently accessed data

**Frontend Performance**:
- Lazy load components and routes
- Optimize image loading and rendering
- Use GraphQL query optimization
- Implement proper component lifecycle management

### Security Guidelines

**Input Validation**:
- Validate all user inputs
- Use Pydantic models for request validation
- Sanitize data before database operations
- Implement proper error handling

**API Security**:
- Use HTTPS in production
- Implement proper CORS policies
- Validate GraphQL queries
- Rate limiting for API endpoints

### Accessibility Guidelines

**Frontend Accessibility**:
- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Maintain proper color contrast

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- `MAJOR.MINOR.PATCH` (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Release Workflow

1. **Feature Complete**: All features for release are merged
2. **Testing**: Comprehensive testing of release candidate
3. **Documentation**: Update documentation for new features
4. **Version Bump**: Update version numbers in configuration
5. **Release Notes**: Document all changes and new features
6. **Tag Release**: Create Git tag for the release
7. **Deploy**: Deploy to production environment

## Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Pull Request Comments**: Code-specific discussions

### Documentation

- **Architecture Guide**: :doc:`architecture` - System design overview
- **Development Setup**: :doc:`setup` - Environment configuration
- **Testing Guide**: :doc:`testing` - Testing strategies and tools
- **API Reference**: :doc:`../api_reference/index` - Complete API documentation

### Maintainer Response Times

- **Bug Reports**: 48-72 hours
- **Feature Requests**: 1 week
- **Pull Request Reviews**: 3-5 days
- **Security Issues**: 24 hours

## Code of Conduct

### Our Standards

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome people of all backgrounds and experience levels
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Patient**: Understand that everyone is learning

### Unacceptable Behavior

- Harassment or discrimination of any kind
- Trolling, insulting, or derogatory comments
- Publishing others' private information
- Any conduct that would be inappropriate in a professional setting

### Enforcement

Project maintainers have the right to remove, edit, or reject comments, commits, code, and other contributions that are not aligned with this Code of Conduct.

Thank you for contributing to SATIn! Your efforts help make image annotation more accessible and efficient for everyone.
