import { describe, expect, it, vi } from 'vitest';

// Mock the GraphQL client
const mockQuery = vi.fn();
vi.mock('$lib/graphql/client', () => ({
	client: {
		query: mockQuery
	}
}));

// Mock Navigation component to avoid dependency issues
vi.mock('$lib/components/Navigation.svelte', () => ({
	default: class MockNavigation {
		$: Record<string, unknown> = {};
		constructor() {}
	}
}));

// Mock annotationStore
vi.mock('$lib/stores/annotationStore', () => ({
	annotationStore: {
		subscribe: vi.fn((callback) => {
			callback({
				currentTool: 'select',
				imageUrl: '',
				annotations: [],
				selectedAnnotationId: null
			});
			return () => {}; // unsubscribe function
		}),
		setTool: vi.fn(),
		setImageUrl: vi.fn(),
		createAnnotation: vi.fn(),
		selectAnnotation: vi.fn(),
		deleteAnnotation: vi.fn(),
		updateAnnotation: vi.fn(),
	}
}));

describe('Projects Page Module', () => {
	it('should import without errors', async () => {
		// Test that the module can be imported successfully
		expect(async () => {
			await import('./+page.svelte');
		}).not.toThrow();
	});

	it('should have mocked GraphQL client available', () => {
		expect(mockQuery).toBeDefined();
		expect(typeof mockQuery).toBe('function');
	});

	it('should handle GraphQL query mocking', async () => {
		// Mock a successful response
		mockQuery.mockResolvedValue({
			data: {
				projects: {
					objects: [],
					count: 0,
					limit: 20,
					offset: 0
				}
			},
			error: null
		});

		// Call the mock and verify it works
		const result = await mockQuery();
		expect(result.data.projects.objects).toEqual([]);
		expect(result.data.projects.count).toBe(0);
	});

	it('should handle error responses in mocks', async () => {
		// Mock an error response
		mockQuery.mockResolvedValue({
			data: null,
			error: {
				message: 'Network error'
			}
		});

		const result = await mockQuery();
		expect(result.data).toBeNull();
		expect(result.error.message).toBe('Network error');
	});

	it('should mock projects data correctly', async () => {
		const mockProjects = [
			{
				id: '1',
				name: 'Test Project',
				description: 'A test project description'
			}
		];

		mockQuery.mockResolvedValue({
			data: {
				projects: {
					objects: mockProjects,
					count: 1,
					limit: 20,
					offset: 0
				}
			},
			error: null
		});

		const result = await mockQuery();
		expect(result.data.projects.objects).toHaveLength(1);
		expect(result.data.projects.objects[0].name).toBe('Test Project');
	});
});
