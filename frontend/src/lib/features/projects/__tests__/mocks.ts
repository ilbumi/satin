import type { Project, ProjectPage } from '$lib/graphql/generated/graphql';
import type { ProjectSummary } from '../types';

/**
 * Mock data factory for project tests
 */

let mockIdCounter = 1;

export function mockProject(overrides?: Partial<Project>): Project {
	const id = `project-${mockIdCounter++}`;
	return {
		id,
		name: `Test Project ${id}`,
		description: `This is a test project description for ${id}`,
		...overrides
	};
}

export function mockProjectSummary(overrides?: Partial<ProjectSummary>): ProjectSummary {
	const project = mockProject(overrides);
	const base: ProjectSummary = {
		id: project.id,
		name: project.name,
		description: project.description,
		status: 'active' as const,
		imageCount: 0,
		taskCount: 0
	};

	// Apply overrides, preserving undefined values
	return { ...base, ...overrides };
}

export function mockProjectPage(
	projects: Project[] = [],
	overrides?: Partial<ProjectPage>
): ProjectPage {
	const limit = overrides?.limit || 10;
	const offset = overrides?.offset || 0;
	const totalCount = overrides?.totalCount || projects.length;

	return {
		objects: projects,
		count: projects.length,
		limit,
		offset,
		totalCount,
		hasMore: offset + projects.length < totalCount,
		...overrides
	};
}

export function mockCreateProjectResponse(project?: Project) {
	return {
		data: {
			createProject: project || mockProject()
		}
	};
}

export function mockUpdateProjectResponse(project?: Project) {
	return {
		data: {
			updateProject: project || mockProject()
		}
	};
}

export function mockDeleteProjectResponse(success: boolean = true) {
	return {
		data: {
			deleteProject: success
		}
	};
}

export function mockGraphQLError(message: string = 'Test error') {
	return {
		error: {
			message,
			graphQLErrors: [],
			networkError: null
		}
	};
}

export function mockNetworkError() {
	return {
		error: {
			message: '[Network] Failed to fetch',
			graphQLErrors: [],
			networkError: new Error('Failed to fetch')
		}
	};
}

/**
 * Create multiple mock projects for testing lists
 */
export function mockProjects(count: number = 3): Project[] {
	return Array.from({ length: count }, (_, i) =>
		mockProject({
			name: `Project ${i + 1}`,
			description: `Description for project ${i + 1}`
		})
	);
}

/**
 * Reset the mock ID counter for consistent test results
 */
export function resetMockCounter() {
	mockIdCounter = 1;
}

/**
 * Mock project with specific test scenarios
 */
export const mockProjectScenarios = {
	longName: () =>
		mockProject({
			name: 'This is a very long project name that should test how the UI handles overflow and truncation'
		}),

	longDescription: () =>
		mockProject({
			description:
				'This is a very long description that should test how the UI handles long text content and line wrapping in various components. It contains multiple sentences to simulate real-world content that users might enter.'
		}),

	emptyDescription: () =>
		mockProject({
			description: ''
		}),

	withCounts: () =>
		mockProjectSummary({
			imageCount: 42,
			taskCount: 15
		}),

	completed: () =>
		mockProjectSummary({
			status: 'completed'
		}),

	draft: () =>
		mockProjectSummary({
			status: 'draft'
		})
};

/**
 * Mock form data for testing
 */
export const mockFormData = {
	create: {
		valid: {
			name: 'New Test Project',
			description:
				'This is a valid test project description that meets the minimum length requirements.'
		},
		invalidName: {
			name: 'A', // Too short
			description: 'Valid description for testing name validation errors.'
		},
		invalidDescription: {
			name: 'Valid Project Name',
			description: 'Too short' // Too short
		},
		empty: {
			name: '',
			description: ''
		}
	},

	update: {
		valid: {
			id: 'project-1',
			name: 'Updated Project Name',
			description: 'This is an updated description that meets all validation requirements.'
		},
		partial: {
			id: 'project-1',
			name: 'Only Name Updated'
			// description not provided
		}
	}
};
