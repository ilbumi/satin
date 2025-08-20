import type { Task, TaskPage, TaskStatus } from '$lib/graphql/generated/graphql';
import type { TaskSummary, CreateTaskForm, UpdateTaskForm } from '../types';

/**
 * Mock data factory for task tests
 */

let mockIdCounter = 1;

export function mockTask(overrides?: Partial<Task>): Task {
	const id = `task-${mockIdCounter++}`;
	return {
		id,
		status: 'DRAFT' as TaskStatus,
		createdAt: new Date().toISOString(),
		image: {
			id: `image-${id}`,
			url: `/images/test-image-${id}.jpg`
		},
		project: {
			id: `project-${id}`,
			name: `Test Project ${id}`,
			description: `Test project description for ${id}`
		},
		bboxes: [
			{
				x: 10,
				y: 20,
				width: 100,
				height: 80,
				annotation: {
					text: `Test annotation ${id}`,
					tags: ['test', 'mock']
				}
			}
		],
		...overrides
	};
}

export function mockTaskSummary(overrides?: Partial<TaskSummary>): TaskSummary {
	const task = mockTask(overrides);
	const base: TaskSummary = {
		id: task.id,
		title: `Annotate ${task.image.url.split('/').pop()} in ${task.project.name}`,
		status: task.status,
		createdAt: task.createdAt,
		projectName: task.project.name,
		projectId: task.project.id,
		imageUrl: task.image.url,
		imageId: task.image.id,
		bboxCount: task.bboxes.length,
		progress: task.status === 'DRAFT' ? 25 : task.status === 'FINISHED' ? 100 : 100
	};

	// Apply overrides, preserving undefined values
	return { ...base, ...overrides };
}

export function mockTaskPage(tasks: Task[] = [], overrides?: Partial<TaskPage>): TaskPage {
	const limit = overrides?.limit || 10;
	const offset = overrides?.offset || 0;
	const totalCount = overrides?.totalCount || tasks.length;

	return {
		objects: tasks,
		count: tasks.length,
		limit,
		offset,
		totalCount,
		hasMore: offset + tasks.length < totalCount,
		...overrides
	};
}

export function mockCreateTaskForm(overrides?: Partial<CreateTaskForm>): CreateTaskForm {
	return {
		imageId: 'test-image-1',
		projectId: 'test-project-1',
		bboxes: [],
		status: 'DRAFT' as TaskStatus,
		...overrides
	};
}

export function mockUpdateTaskForm(overrides?: Partial<UpdateTaskForm>): UpdateTaskForm {
	return {
		id: 'test-task-1',
		status: 'FINISHED' as TaskStatus,
		...overrides
	};
}

export function mockCreateTaskResponse(task?: Task) {
	return {
		data: {
			createTask: task || mockTask()
		}
	};
}

export function mockUpdateTaskResponse(task?: Task) {
	return {
		data: {
			updateTask: task || mockTask()
		}
	};
}

export function mockDeleteTaskResponse(success: boolean = true) {
	return {
		data: {
			deleteTask: success
		}
	};
}

export function mockGetTaskResponse(task?: Task | null) {
	return {
		data: {
			task: task === undefined ? mockTask() : task
		}
	};
}

export function mockGetTasksResponse(tasks: Task[] = []) {
	return {
		data: {
			tasks: mockTaskPage(tasks)
		}
	};
}

export function mockGetTaskByImageAndProjectResponse(task?: Task | null) {
	return {
		data: {
			taskByImageAndProject: task === undefined ? mockTask() : task
		}
	};
}

export function mockGraphQLError(message: string = 'Test error') {
	return {
		error: {
			message,
			networkError: null,
			graphQLErrors: [
				{
					message,
					locations: [],
					path: [],
					extensions: {}
				}
			]
		}
	};
}

export function mockProjects() {
	return [
		{ id: 'project-1', name: 'Medical Images Dataset' },
		{ id: 'project-2', name: 'Vehicle Detection' },
		{ id: 'project-3', name: 'Plant Disease Classification' }
	];
}

export function mockImages() {
	return [
		{ id: 'image-1', url: '/images/chest-xray-001.jpg', name: 'chest-xray-001.jpg' },
		{ id: 'image-2', url: '/images/vehicle-001.jpg', name: 'vehicle-001.jpg' },
		{ id: 'image-3', url: '/images/plant-leaf-001.jpg', name: 'plant-leaf-001.jpg' }
	];
}

export function resetMockCounter() {
	mockIdCounter = 1;
}
