<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui';
	// Dynamic imports for heavy components
	let TaskList: typeof import('$lib/components/tasks/TaskList.svelte').default | null =
		$state(null);
	let VirtualTaskList:
		| typeof import('$lib/components/tasks/VirtualTaskList.svelte').default
		| null = $state(null);
	let TaskFilters: typeof import('$lib/components/tasks/TaskFilters.svelte').default | null =
		$state(null);
	let CreateTaskModal:
		| typeof import('$lib/components/tasks/CreateTaskModal.svelte').default
		| null = $state(null);
	let EditTaskModal: typeof import('$lib/components/tasks/EditTaskModal.svelte').default | null =
		$state(null);
	import { taskStore } from '$lib/features/tasks/store.svelte';
	import type {
		TaskSummary,
		CreateTaskForm,
		UpdateTaskForm,
		TaskFilters as TaskFiltersType
	} from '$lib/features/tasks/types';

	// Modal states
	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let taskToEdit: TaskSummary | null = $state(null);

	// Import stores for projects and images data
	import { projectStore } from '$lib/features/projects/store.svelte';
	import { imageStore } from '$lib/features/images/store.svelte';
	import { storeCoordinator } from '$lib/core/stores/coordinator';
	import { errorStore } from '$lib/core/errors';

	// Get data from actual stores instead of hardcoded arrays
	let projects = $derived(projectStore.projects.map((p) => ({ id: p.id, name: p.name })));
	let images = $derived(
		imageStore.allImages.map((img) => ({
			id: img.id,
			url: img.url,
			name: img.filename
		}))
	);

	// Load data and components when component mounts
	onMount(async () => {
		// Load core components first
		try {
			const [taskListModule, virtualTaskListModule, taskFiltersModule] = await Promise.all([
				import('$lib/components/tasks/TaskList.svelte'),
				import('$lib/components/tasks/VirtualTaskList.svelte'),
				import('$lib/components/tasks/TaskFilters.svelte')
			]);
			TaskList = taskListModule.default;
			VirtualTaskList = virtualTaskListModule.default;
			TaskFilters = taskFiltersModule.default;
		} catch (error) {
			console.error('Failed to load task components:', error);
			errorStore.addSystemError('Failed to load task components', 'Tasks Page');
		}

		// Load data using the coordinator to prevent race conditions
		try {
			const result = await storeCoordinator.loadInitialData();
			if (!result.success && result.errors.length > 0) {
				console.warn('Some data failed to load:', result.errors);
				// Errors are already handled by the coordinator and stores
			}
		} catch (error) {
			console.error('Failed to load initial data:', error);
			errorStore.addSystemError('Failed to load page data', 'Tasks Page');
		}
	});

	onDestroy(() => {
		// Clean up all stores using the coordinator
		storeCoordinator.cleanup();
	});

	// Event handlers
	async function handleCreateTask() {
		if (!CreateTaskModal) {
			try {
				const module = await import('$lib/components/tasks/CreateTaskModal.svelte');
				CreateTaskModal = module.default;
			} catch (error) {
				console.error('Failed to load CreateTaskModal:', error);
				errorStore.addSystemError('Failed to load create task modal', 'Tasks Page');
				return;
			}
		}
		showCreateModal = true;
	}

	async function handleEditTask(task: TaskSummary) {
		if (!EditTaskModal) {
			try {
				const module = await import('$lib/components/tasks/EditTaskModal.svelte');
				EditTaskModal = module.default;
			} catch (error) {
				console.error('Failed to load EditTaskModal:', error);
				errorStore.addSystemError('Failed to load edit task modal', 'Tasks Page');
				return;
			}
		}
		taskToEdit = task;
		showEditModal = true;
	}

	async function handleDeleteTask(task: TaskSummary) {
		if (confirm(`Are you sure you want to delete the task "${task.title}"?`)) {
			try {
				await taskStore.deleteTask(task.id);
			} catch (error) {
				console.error('Failed to delete task:', error);
				// Error is already handled in the store
			}
		}
	}

	async function handleRetry() {
		try {
			await storeCoordinator.refreshAllData();
		} catch (error) {
			console.error('Failed to retry data load:', error);
			// Error is already handled by coordinator
		}
	}

	function handleLoadMore() {
		taskStore.loadMoreTasks();
	}

	async function handleFiltersChange(filters: TaskFiltersType) {
		try {
			await taskStore.updateFilters(filters);
		} catch (error) {
			console.error('Failed to update filters:', error);
			// Error is already handled in the store and global error system
		}
	}

	async function handleCreateSubmit(data: CreateTaskForm) {
		try {
			await taskStore.createTask(data);
			showCreateModal = false;
		} catch (error) {
			console.error('Failed to create task:', error);
			// Error is already handled in the store and global error system
			// Keep modal open so user can retry
		}
	}

	async function handleEditSubmit(data: UpdateTaskForm) {
		try {
			await taskStore.updateTask(data);
			showEditModal = false;
			taskToEdit = null;
		} catch (error) {
			console.error('Failed to update task:', error);
			// Error is already handled in the store and global error system
			// Keep modal open so user can retry
		}
	}

	function handleCreateModalClose() {
		showCreateModal = false;
	}

	function handleEditModalClose() {
		showEditModal = false;
		taskToEdit = null;
	}

	// Computed values from store
	let tasks = $derived(taskStore.state.list.tasks);
	let loading = $derived(taskStore.state.list.loading);
	let error = $derived(taskStore.state.list.error);
	let hasMore = $derived(taskStore.state.list.hasMore);
	let filters = $derived(taskStore.state.filters);
	let statistics = $derived(taskStore.statistics);

	// Use virtualization for large datasets (> 50 items)
	const useVirtualization = $derived(tasks.length > 50);
</script>

<svelte:head>
	<title>Tasks - Satin</title>
</svelte:head>

<div class="p-6">
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Tasks</h1>
			<p class="mt-2 text-gray-600">Manage annotation tasks and assignments</p>
		</div>
		<Button variant="primary" onclick={handleCreateTask}>
			<span class="mr-2">➕</span>
			New Task
		</Button>
	</div>

	<!-- Task Statistics Tabs -->
	<div class="mb-6 border-b border-gray-200">
		<nav class="flex space-x-8">
			<button
				class="border-b-2 px-1 py-2 text-sm font-medium {filters.status === 'all' || !filters.status
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700'}"
				onclick={() => handleFiltersChange({ status: 'all' })}
			>
				All Tasks ({statistics.total})
			</button>
			<button
				class="border-b-2 px-1 py-2 text-sm font-medium {filters.status === 'DRAFT'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700'}"
				onclick={() => handleFiltersChange({ status: 'DRAFT' })}
			>
				Draft ({statistics.draft})
			</button>
			<button
				class="border-b-2 px-1 py-2 text-sm font-medium {filters.status === 'FINISHED'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700'}"
				onclick={() => handleFiltersChange({ status: 'FINISHED' })}
			>
				Finished ({statistics.finished})
			</button>
			<button
				class="border-b-2 px-1 py-2 text-sm font-medium {filters.status === 'REVIEWED'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700'}"
				onclick={() => handleFiltersChange({ status: 'REVIEWED' })}
			>
				Reviewed ({statistics.reviewed})
			</button>
		</nav>
	</div>

	<!-- Filters -->
	{#if TaskFilters}
		<div class="mb-6">
			<TaskFilters {filters} {projects} {loading} onFiltersChange={handleFiltersChange} />
		</div>
	{/if}

	<!-- Task List -->
	{#if useVirtualization && VirtualTaskList}
		<VirtualTaskList
			{tasks}
			{loading}
			{error}
			{hasMore}
			onCreateTask={handleCreateTask}
			onEditTask={handleEditTask}
			onDeleteTask={handleDeleteTask}
			onRetry={handleRetry}
			onLoadMore={handleLoadMore}
			containerHeight={800}
		/>
	{:else if TaskList}
		<TaskList
			{tasks}
			{loading}
			{error}
			{hasMore}
			onCreateTask={handleCreateTask}
			onEditTask={handleEditTask}
			onDeleteTask={handleDeleteTask}
			onRetry={handleRetry}
			onLoadMore={handleLoadMore}
		/>
	{:else}
		<div class="flex items-center justify-center py-12">
			<div class="animate-pulse text-gray-600">Loading tasks...</div>
		</div>
	{/if}

	<!-- Create Task Modal -->
	{#if CreateTaskModal && showCreateModal}
		<CreateTaskModal
			open={showCreateModal}
			{projects}
			{images}
			onClose={handleCreateModalClose}
			onSubmit={handleCreateSubmit}
		/>
	{/if}

	<!-- Edit Task Modal -->
	{#if EditTaskModal && showEditModal}
		<EditTaskModal
			open={showEditModal}
			task={taskToEdit}
			{projects}
			{images}
			onClose={handleEditModalClose}
			onSubmit={handleEditSubmit}
		/>
	{/if}
</div>
