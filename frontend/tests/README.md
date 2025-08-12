# Satin Frontend Testing Suite

This comprehensive testing suite provides extensive coverage for the Satin image annotation platform using multiple testing approaches.

## Test Structure

### 1. Unit Tests (Vitest)

- **Location**: `src/**/*.{test,spec}.{js,ts}`
- **Framework**: Vitest with @testing-library/svelte
- **Purpose**: Component logic, utility functions, stores
- **Run**: `pnpm test:unit`

### 2. E2E Tests (Playwright)

- **Location**: `tests/e2e/`
- **Framework**: Playwright
- **Purpose**: Full application workflows, cross-browser testing
- **Run**: `pnpm test:e2e`

## E2E Test Categories

### Project Management Tests (`project-management.spec.ts`)

- Home page rendering
- Project list display and filtering
- Project CRUD operations
- Form validation
- Search and sorting functionality
- Navigation between pages

### Image Annotation Tests (`image-annotation.spec.ts`)

- Annotation workspace initialization
- Image loading and display
- Bounding box creation, editing, deletion
- Tool switching (bbox, select, polygon)
- Zoom and pan operations
- Keyboard shortcuts
- Export functionality
- Validation error handling

### API Testing (`api-testing.spec.ts`)

- GraphQL endpoint testing
- Health check verification
- Query and mutation validation
- Pagination testing
- Error handling
- Schema introspection
- Concurrent request handling

### Cross-Browser Testing (`cross-browser.spec.ts`)

- Chromium, Firefox, WebKit compatibility
- Mobile responsiveness
- Touch gesture support
- Different screen sizes
- Accessibility features (reduced motion, color schemes)
- Keyboard navigation
- High DPI display support

### Performance Testing (`performance.spec.ts`)

- Page load performance
- Large dataset handling
- Memory efficiency
- Network failure recovery
- Extended usage scenarios
- Operation throttling

## Test Configuration

### Playwright Configuration (`playwright.config.ts`)

- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Servers**: Automatic backend/frontend startup
- **Reporting**: HTML reports, JSON output
- **Screenshots**: On failure
- **Videos**: Retained on failure
- **Tracing**: On retry

### Test Fixtures (`fixtures/`)

- **setup.ts**: Extended test fixtures with utilities
- **test-data.ts**: Mock data and API endpoints
- Automatic GraphQL mocking
- Test data setup/cleanup
- Navigation helpers

## Running Tests

### All Tests

```bash
# Run unit + E2E tests
pnpm test:all

# Using make
make test-all
```

### E2E Tests Only

```bash
# Headless mode
pnpm test:e2e

# Headed mode (with browser UI)
pnpm test:e2e:headed

# Interactive mode
pnpm test:e2e:ui

# Debug mode
pnpm test:e2e:debug

# Show HTML report
pnpm test:e2e:report
```

### Specific Test Categories

```bash
# Project management only
npx playwright test project-management.spec.ts

# Single browser
npx playwright test --project=chromium

# Specific test
npx playwright test -g "should create new project"
```

## Test Data Management

### Mocked APIs

- GraphQL queries and mutations are automatically mocked
- Consistent test data across all test runs
- Isolated test execution
- No external dependencies required

### Test Data Fixtures

- **Projects**: Sample projects with varying complexity
- **Tasks**: Different task states and assignments
- **Images**: Mock images with annotations
- **Annotations**: Various annotation types and coordinates

## Development Workflow

### Adding New Tests

1. Create test file in appropriate category
2. Import fixtures: `import { test, expect } from './fixtures/setup'`
3. Use beforeEach/afterEach for setup/cleanup
4. Follow existing naming conventions

### Test Structure

```typescript
test.describe('Feature Name', () => {
	test.beforeEach(async ({ page, mockGraphQLResponses, setupTestData }) => {
		await setupTestData();
		await mockGraphQLResponses(page);
	});

	test('should perform specific action', async ({ page }) => {
		// Test implementation
	});
});
```

### Best Practices

- Use data-testid attributes for reliable selectors
- Mock external dependencies
- Test user workflows, not implementation details
- Include error scenarios
- Verify accessibility features
- Test across different screen sizes

## CI/CD Integration

### GitHub Actions

The test suite integrates with GitHub Actions for:

- Automated test execution on PRs
- Cross-browser testing
- Performance regression detection
- Test result reporting

### Local Development

- Tests run automatically on file changes
- Fast feedback loop with mocked APIs
- Debug mode for troubleshooting failures
- HTML reports for detailed analysis

## Performance Considerations

### Test Optimization

- Parallel test execution
- Efficient mocking strategies
- Selective test running
- Automatic server management

### Resource Usage

- Configurable worker counts
- Memory-efficient test data
- Cleanup between tests
- Background process management

## Troubleshooting

### Common Issues

1. **Server startup timeouts**: Increase timeout in playwright.config.ts
2. **Flaky tests**: Add proper wait conditions
3. **Mock data issues**: Check fixture data consistency
4. **Browser installation**: Run `npx playwright install`

### Debug Tools

- Playwright Inspector: `pnpm test:e2e:debug`
- HTML reports: `pnpm test:e2e:report`
- Screenshots and videos in test-results/
- Browser developer tools in headed mode

### Environment Variables

- `BASE_URL`: Override default application URL
- `CI`: Enables CI-specific optimizations
- `DEBUG`: Enhanced logging output

## Maintenance

### Regular Tasks

- Update browser versions
- Review and update test data
- Performance baseline updates
- Documentation updates

### Monitoring

- Test execution time tracking
- Flaky test identification
- Coverage reporting
- Performance regression alerts

## Contributing

When adding new features:

1. Add corresponding E2E tests
2. Update mock data as needed
3. Consider cross-browser implications
4. Include performance considerations
5. Update documentation

For test failures:

1. Check HTML report for details
2. Review screenshots/videos
3. Use debug mode for investigation
4. Update tests for changed requirements
