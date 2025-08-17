import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	mockProject,
	mockProjectPage,
	mockProjects,
	mockProjectSummary,
	resetMockCounter
} from './mocks';

// Mock the ProjectService
vi.mock('../service', () => ({
	ProjectService: vi.fn(),
	projectService: {
		getProjects: vi.fn(),
		createProject: vi.fn(),
		updateProject: vi.fn(),
		deleteProject: vi.fn(),
		mapProjectToSummary: vi.fn()
	}
}));

// Import after mocking
import { projectService } from '../service';

const mockProjectService = vi.mocked(projectService);

// Import the store creation function to create isolated instances
import { projectStore } from '../store.svelte';

describe('Project Store', () => {
	beforeEach(() => {
		resetMockCounter();
		vi.clearAllMocks();

		// Setup default mock for getProjects to handle store initialization
		const emptyPage = mockProjectPage([], {
			limit: 12,
			offset: 0,
			totalCount: 0,
			hasMore: false
		});
		mockProjectService.getProjects.mockResolvedValue(emptyPage);

		// Reset store state by creating a fresh instance
		// Note: In a real scenario, we'd need a way to reset the store
		// For now, we'll test the existing instance and ensure proper cleanup

		// Reset filters and pagination to initial state
		projectStore.setFilters({ search: '', status: 'all' });
		projectStore.clearError();
	});

	describe('initial state', () => {
		it('should have correct initial state', () => {
			expect(projectStore.projects).toEqual([]);
			expect(projectStore.loading).toBe(false);
			expect(projectStore.error).toBeNull();
			expect(projectStore.pagination.limit).toBe(12);
			expect(projectStore.pagination.offset).toBe(0);
			expect(projectStore.pagination.totalCount).toBe(0);
			expect(projectStore.pagination.hasMore).toBe(false);
			expect(projectStore.filters.search).toBe('');
			expect(projectStore.filters.status).toBe('all');
		});

		it('should have correct computed properties', () => {
			expect(projectStore.hasProjects).toBe(false);
			expect(projectStore.isEmpty).toBe(true);
		});
	});

	describe('fetchProjects', () => {
		it('should fetch projects successfully', async () => {
			const projects = mockProjects(3);
			const mappedProjects = projects.map((p) => mockProjectSummary(p));
			const projectPage = mockProjectPage(projects, {
				totalCount: 3,
				hasMore: false
			});

			mockProjectService.getProjects.mockResolvedValue(projectPage);
			mockProjectService.mapProjectToSummary
				.mockReturnValueOnce(mappedProjects[0])
				.mockReturnValueOnce(mappedProjects[1])
				.mockReturnValueOnce(mappedProjects[2]);

			await projectStore.fetchProjects();

			expect(mockProjectService.getProjects).toHaveBeenCalledWith(
				12, // limit
				0, // offset
				{ search: '', status: 'all' } // filters
			);
			expect(projectStore.projects).toHaveLength(3);
			expect(projectStore.loading).toBe(false);
			expect(projectStore.error).toBeNull();
			expect(projectStore.pagination.totalCount).toBe(3);
			expect(projectStore.pagination.hasMore).toBe(false);
		});

		it('should handle loading state', async () => {
			const projectPage = mockProjectPage([]);
			mockProjectService.getProjects.mockImplementation(() => {
				// Check loading state during the operation
				expect(projectStore.loading).toBe(true);
				return Promise.resolve(projectPage);
			});

			await projectStore.fetchProjects();

			expect(projectStore.loading).toBe(false);
		});

		it('should handle errors', async () => {
			const errorMessage = 'Failed to fetch projects';
			mockProjectService.getProjects.mockRejectedValue(new Error(errorMessage));

			await projectStore.fetchProjects();

			expect(projectStore.error).toBe(errorMessage);
			expect(projectStore.loading).toBe(false);
			expect(projectStore.projects).toEqual([]);
		});

		it('should clear previous error on successful fetch', async () => {
			const projectPage = mockProjectPage([]);
			mockProjectService.getProjects.mockResolvedValue(projectPage);

			// First, set an error by making a failed call
			mockProjectService.getProjects.mockRejectedValueOnce(new Error('Test error'));
			await projectStore.fetchProjects();
			expect(projectStore.error).toBe('Test error');

			// Then, make a successful call
			mockProjectService.getProjects.mockResolvedValue(projectPage);
			await projectStore.fetchProjects();

			expect(projectStore.error).toBeNull();
		});
	});

	describe('createProject', () => {
		it('should create project successfully', async () => {
			const newProject = mockProject();
			const projectSummary = mockProjectSummary(newProject);

			mockProjectService.createProject.mockResolvedValue(newProject);
			mockProjectService.mapProjectToSummary.mockReturnValue(projectSummary);

			const formData = {
				name: newProject.name,
				description: newProject.description
			};

			const result = await projectStore.createProject(formData);

			expect(result).toEqual(newProject);
			expect(mockProjectService.createProject).toHaveBeenCalledWith(formData);
			expect(projectStore.projects[0]).toEqual(projectSummary);
			expect(projectStore.pagination.totalCount).toBe(1);
			expect(projectStore.error).toBeNull();
		});

		it('should handle creation errors', async () => {
			const errorMessage = 'Creation failed';
			mockProjectService.createProject.mockRejectedValue(new Error(errorMessage));

			const formData = {
				name: 'Test Project',
				description: 'Test description'
			};

			const result = await projectStore.createProject(formData);

			expect(result).toBeNull();
			expect(projectStore.error).toBe(errorMessage);
		});
	});

	describe('updateProject', () => {
		it('should update project successfully', async () => {
			const originalProject = mockProject({ id: 'test-1', name: 'Original' });
			const updatedProject = mockProject({ id: 'test-1', name: 'Updated' });
			const originalSummary = mockProjectSummary(originalProject);
			const updatedSummary = mockProjectSummary(updatedProject);

			// Set up initial state by fetching projects first
			const projectPage = mockProjectPage([originalProject]);
			mockProjectService.getProjects.mockResolvedValue(projectPage);
			mockProjectService.mapProjectToSummary.mockReturnValue(originalSummary);

			await projectStore.fetchProjects();

			// Now mock the update operation
			mockProjectService.updateProject.mockResolvedValue(updatedProject);
			mockProjectService.mapProjectToSummary.mockReturnValue(updatedSummary);

			const updateData = {
				id: 'test-1',
				name: 'Updated'
			};

			const result = await projectStore.updateProject(updateData);

			expect(result).toEqual(updatedProject);
			expect(mockProjectService.updateProject).toHaveBeenCalledWith(updateData);
			expect(projectStore.projects[0]).toEqual(updatedSummary);
			expect(projectStore.error).toBeNull();
		});

		it('should handle update errors', async () => {
			const errorMessage = 'Update failed';
			mockProjectService.updateProject.mockRejectedValue(new Error(errorMessage));

			const updateData = {
				id: 'test-1',
				name: 'Updated'
			};

			const result = await projectStore.updateProject(updateData);

			expect(result).toBeNull();
			expect(projectStore.error).toBe(errorMessage);
		});
	});

	describe('deleteProject', () => {
		it('should delete project successfully', async () => {
			const originalProject = mockProject({ id: 'test-1' });
			const projectSummary = mockProjectSummary({ id: 'test-1' });

			// Set up initial state by fetching projects first
			const projectPage = mockProjectPage([originalProject]);
			mockProjectService.getProjects.mockResolvedValue(projectPage);
			mockProjectService.mapProjectToSummary.mockReturnValue(projectSummary);

			await projectStore.fetchProjects();

			mockProjectService.deleteProject.mockResolvedValue(true);

			const result = await projectStore.deleteProject('test-1');

			expect(result).toBe(true);
			expect(mockProjectService.deleteProject).toHaveBeenCalledWith('test-1');
			expect(projectStore.projects).toHaveLength(0);
			expect(projectStore.error).toBeNull();
		});

		it('should handle delete errors', async () => {
			const errorMessage = 'Delete failed';
			mockProjectService.deleteProject.mockRejectedValue(new Error(errorMessage));

			const result = await projectStore.deleteProject('test-1');

			expect(result).toBe(false);
			expect(projectStore.error).toBe(errorMessage);
		});
	});

	describe('filtering and pagination', () => {
		it('should set filters and reset offset', async () => {
			const projectPage = mockProjectPage([]);
			mockProjectService.getProjects.mockResolvedValue(projectPage);

			// First, set a non-zero offset
			projectStore.setPage(24);
			expect(projectStore.pagination.offset).toBe(24);

			// Then set filters, which should reset offset
			projectStore.setFilters({ search: 'medical' });

			expect(projectStore.filters.search).toBe('medical');
			expect(projectStore.pagination.offset).toBe(0);
			expect(mockProjectService.getProjects).toHaveBeenCalledWith(12, 0, {
				search: 'medical',
				status: 'all'
			});
		});

		it('should set page offset', async () => {
			const projectPage = mockProjectPage([]);
			mockProjectService.getProjects.mockResolvedValue(projectPage);

			projectStore.setPage(12);

			expect(projectStore.pagination.offset).toBe(12);
			expect(mockProjectService.getProjects).toHaveBeenCalledWith(12, 12, {
				search: '',
				status: 'all'
			});
		});

		it('should navigate to next page', async () => {
			const projectPage = mockProjectPage([], { hasMore: true });
			mockProjectService.getProjects.mockResolvedValue(projectPage);

			// Set up pagination state
			projectStore.pagination.hasMore = true;
			projectStore.pagination.offset = 0;

			projectStore.nextPage();

			expect(projectStore.pagination.offset).toBe(12);
		});

		it('should not navigate to next page when no more pages', async () => {
			// Set up pagination state
			projectStore.pagination.hasMore = false;
			projectStore.pagination.offset = 0;

			projectStore.nextPage();

			expect(projectStore.pagination.offset).toBe(0);
		});

		it('should navigate to previous page', async () => {
			const projectPage = mockProjectPage([]);
			mockProjectService.getProjects.mockResolvedValue(projectPage);

			// Set up pagination state
			projectStore.pagination.offset = 12;

			projectStore.prevPage();

			expect(projectStore.pagination.offset).toBe(0);
		});

		it('should not navigate below zero offset', async () => {
			// Set up pagination state
			projectStore.pagination.offset = 0;

			projectStore.prevPage();

			expect(projectStore.pagination.offset).toBe(0);
		});
	});

	describe('computed properties', () => {
		it('should update hasProjects when projects exist', () => {
			expect(projectStore.hasProjects).toBe(false);

			const project = mockProjectSummary();
			projectStore.projects.push(project);

			expect(projectStore.hasProjects).toBe(true);
		});

		it('should update isEmpty correctly', async () => {
			// Initially empty (not loading, no projects)
			expect(projectStore.isEmpty).toBe(true);

			// Setup mock for loading state
			const projectPage = mockProjectPage([mockProject()]);
			mockProjectService.getProjects.mockImplementation(() => {
				return new Promise((resolve) => {
					// This will keep the loading state active during the promise
					setTimeout(() => resolve(projectPage), 10);
				});
			});
			mockProjectService.mapProjectToSummary.mockReturnValue(mockProjectSummary());

			// Start fetch (this sets loading to true)
			const fetchPromise = projectStore.fetchProjects();

			// When loading, isEmpty should be false
			expect(projectStore.isEmpty).toBe(false);

			// Wait for fetch to complete
			await fetchPromise;

			// When has projects, isEmpty should be false
			expect(projectStore.isEmpty).toBe(false);
		});
	});

	describe('error handling', () => {
		it('should clear errors', async () => {
			// Simulate an error by causing a failed operation
			mockProjectService.getProjects.mockRejectedValue(new Error('Test error'));

			await projectStore.fetchProjects();
			expect(projectStore.error).toBe('Test error');

			projectStore.clearError();
			expect(projectStore.error).toBeNull();
		});
	});
});
