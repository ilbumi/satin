import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProjectService } from '../service';
import { graphqlClient } from '$lib/core/api/client';
import type {
	OperationResultSource,
	OperationResult,
	AnyVariables,
	CombinedError,
	Operation,
	OperationContext
} from '@urql/core';
import { Kind } from 'graphql';
import {
	mockProject,
	mockProjectPage,
	mockProjects,
	mockCreateProjectResponse,
	mockUpdateProjectResponse,
	mockDeleteProjectResponse,
	mockGraphQLError,
	resetMockCounter
} from './mocks';

// Helper function to create properly typed URQL operation results
function createMockOperationResult<T = unknown>(result: {
	data?: T;
	error?: unknown;
}): OperationResultSource<OperationResult<T, AnyVariables>> {
	const mockOperation: Operation = {
		kind: 'query',
		query: { kind: Kind.DOCUMENT, definitions: [] },
		variables: {},
		key: Math.random(),
		context: {
			url: 'http://localhost:8000/graphql',
			requestPolicy: 'cache-first'
		} as OperationContext
	};

	const mockResult: OperationResult<T, AnyVariables> = {
		data: result.data,
		error: result.error as CombinedError | undefined,
		operation: mockOperation,
		stale: false,
		hasNext: false
	};

	return {
		toPromise: () => Promise.resolve(mockResult)
	} as unknown as OperationResultSource<OperationResult<T, AnyVariables>>;
}

// Mock the GraphQL client
vi.mock('$lib/core/api/client', () => ({
	graphqlClient: {
		query: vi.fn(),
		mutation: vi.fn()
	}
}));

const mockGraphQLClient = vi.mocked(graphqlClient);

describe('ProjectService', () => {
	let service: ProjectService;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Mock console.error to suppress error logs during tests
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		service = new ProjectService();
		resetMockCounter();
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Restore console.error
		consoleErrorSpy.mockRestore();
	});

	describe('getProject', () => {
		it('should return project when found', async () => {
			const mockProjectData = mockProject({ id: 'test-1' });
			mockGraphQLClient.query.mockReturnValue(
				createMockOperationResult({
					data: { project: mockProjectData },
					error: null
				})
			);

			const result = await service.getProject('test-1');

			expect(result).toEqual(mockProjectData);
			expect(mockGraphQLClient.query).toHaveBeenCalledWith(expect.stringContaining('GetProject'), {
				id: 'test-1'
			});
		});

		it('should return null when project not found', async () => {
			mockGraphQLClient.query.mockReturnValue(
				createMockOperationResult({
					data: { project: null },
					error: null
				})
			);

			const result = await service.getProject('non-existent');

			expect(result).toBeNull();
		});

		it('should throw error when GraphQL error occurs', async () => {
			const error = mockGraphQLError('Project not found');
			mockGraphQLClient.query.mockReturnValue(createMockOperationResult(error));

			await expect(service.getProject('test-1')).rejects.toThrow('Project not found');
		});

		it('should handle network errors', async () => {
			const errorResult = {
				toPromise: () => Promise.reject(new Error('Network error'))
			} as unknown as OperationResultSource<OperationResult<unknown, AnyVariables>>;

			mockGraphQLClient.query.mockReturnValue(errorResult);

			await expect(service.getProject('test-1')).rejects.toThrow('Network error');
		});
	});

	describe('getProjects', () => {
		it('should return paginated projects', async () => {
			const projects = mockProjects(3);
			const projectPage = mockProjectPage(projects, {
				limit: 10,
				offset: 0,
				totalCount: 3
			});

			mockGraphQLClient.query.mockReturnValue(
				createMockOperationResult({
					data: { projects: projectPage },
					error: null
				})
			);

			const result = await service.getProjects(10, 0);

			expect(result).toEqual(projectPage);
			expect(mockGraphQLClient.query).toHaveBeenCalledWith(expect.stringContaining('GetProjects'), {
				limit: 10,
				offset: 0,
				query: undefined
			});
		});

		it('should apply search filters', async () => {
			const projects = mockProjects(1);
			const projectPage = mockProjectPage(projects);

			mockGraphQLClient.query.mockReturnValue(
				createMockOperationResult({
					data: { projects: projectPage },
					error: null
				})
			);

			await service.getProjects(10, 0, { search: 'medical' });

			expect(mockGraphQLClient.query).toHaveBeenCalledWith(expect.stringContaining('GetProjects'), {
				limit: 10,
				offset: 0,
				query: {
					stringFilters: [
						{
							field: 'name',
							operator: 'CONTAINS',
							value: 'medical'
						}
					]
				}
			});
		});

		it('should return empty page when no projects', async () => {
			const emptyPage = mockProjectPage([], {
				limit: 10,
				offset: 0,
				totalCount: 0,
				hasMore: false
			});

			mockGraphQLClient.query.mockReturnValue(
				createMockOperationResult({
					data: { projects: emptyPage },
					error: null
				})
			);

			const result = await service.getProjects();

			expect(result.objects).toHaveLength(0);
			expect(result.totalCount).toBe(0);
			expect(result.hasMore).toBe(false);
		});

		it('should handle GraphQL errors', async () => {
			const error = mockGraphQLError('Failed to fetch projects');
			mockGraphQLClient.query.mockReturnValue(createMockOperationResult(error));

			await expect(service.getProjects()).rejects.toThrow('Failed to fetch projects');
		});
	});

	describe('createProject', () => {
		it('should create and return new project', async () => {
			const newProject = mockProject();
			const response = mockCreateProjectResponse(newProject);

			mockGraphQLClient.mutation.mockReturnValue(createMockOperationResult(response));

			const formData = {
				name: newProject.name,
				description: newProject.description
			};

			const result = await service.createProject(formData);

			expect(result).toEqual(newProject);
			expect(mockGraphQLClient.mutation).toHaveBeenCalledWith(
				expect.stringContaining('CreateProject'),
				formData
			);
		});

		it('should throw error when creation fails', async () => {
			mockGraphQLClient.mutation.mockReturnValue(
				createMockOperationResult({
					data: null,
					error: null
				})
			);

			const formData = {
				name: 'Test Project',
				description: 'Test description'
			};

			await expect(service.createProject(formData)).rejects.toThrow(
				'Failed to create project: No data returned'
			);
		});

		it('should handle GraphQL errors', async () => {
			const error = mockGraphQLError('Validation failed');
			mockGraphQLClient.mutation.mockReturnValue(createMockOperationResult(error));

			const formData = {
				name: 'Test Project',
				description: 'Test description'
			};

			await expect(service.createProject(formData)).rejects.toThrow('Validation failed');
		});
	});

	describe('updateProject', () => {
		it('should update and return project', async () => {
			const updatedProject = mockProject({ id: 'test-1' });
			const response = mockUpdateProjectResponse(updatedProject);

			mockGraphQLClient.mutation.mockReturnValue(createMockOperationResult(response));

			const updateData = {
				id: 'test-1',
				name: 'Updated Name',
				description: 'Updated description'
			};

			const result = await service.updateProject(updateData);

			expect(result).toEqual(updatedProject);
			expect(mockGraphQLClient.mutation).toHaveBeenCalledWith(
				expect.stringContaining('UpdateProject'),
				updateData
			);
		});

		it('should return null when update fails', async () => {
			mockGraphQLClient.mutation.mockReturnValue(
				createMockOperationResult({
					data: { updateProject: null },
					error: null
				})
			);

			const updateData = {
				id: 'non-existent',
				name: 'Updated Name'
			};

			const result = await service.updateProject(updateData);

			expect(result).toBeNull();
		});

		it('should handle partial updates', async () => {
			const updatedProject = mockProject();
			const response = mockUpdateProjectResponse(updatedProject);

			mockGraphQLClient.mutation.mockReturnValue(createMockOperationResult(response));

			const updateData = {
				id: 'test-1',
				name: 'Only Name Updated'
				// No description update
			};

			await service.updateProject(updateData);

			expect(mockGraphQLClient.mutation).toHaveBeenCalledWith(
				expect.stringContaining('UpdateProject'),
				updateData
			);
		});
	});

	describe('deleteProject', () => {
		it('should delete project and return true', async () => {
			const response = mockDeleteProjectResponse(true);

			mockGraphQLClient.mutation.mockReturnValue(createMockOperationResult(response));

			const result = await service.deleteProject('test-1');

			expect(result).toBe(true);
			expect(mockGraphQLClient.mutation).toHaveBeenCalledWith(
				expect.stringContaining('DeleteProject'),
				{ id: 'test-1' }
			);
		});

		it('should return false when delete fails', async () => {
			const response = mockDeleteProjectResponse(false);

			mockGraphQLClient.mutation.mockReturnValue(createMockOperationResult(response));

			const result = await service.deleteProject('non-existent');

			expect(result).toBe(false);
		});

		it('should handle GraphQL errors', async () => {
			const error = mockGraphQLError('Delete failed');
			mockGraphQLClient.mutation.mockReturnValue(createMockOperationResult(error));

			await expect(service.deleteProject('test-1')).rejects.toThrow('Delete failed');
		});
	});

	describe('mapProjectToSummary', () => {
		it('should map project to summary correctly', () => {
			const project = mockProject({
				id: 'test-1',
				name: 'Test Project',
				description: 'Test description'
			});

			const summary = service.mapProjectToSummary(project);

			expect(summary).toEqual({
				id: 'test-1',
				name: 'Test Project',
				description: 'Test description',
				status: 'active'
			});
		});

		it('should always set status to active', () => {
			const project = mockProject();
			const summary = service.mapProjectToSummary(project);

			expect(summary.status).toBe('active');
		});
	});
});
