<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui';
	import TaskList from '$lib/components/tasks/TaskList.svelte';
	import TaskFilters from '$lib/components/tasks/TaskFilters.svelte';
	import CreateTaskModal from '$lib/components/tasks/CreateTaskModal.svelte';
	import EditTaskModal from '$lib/components/tasks/EditTaskModal.svelte';
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

	// Mock data for projects and images (in real app, these would come from separate stores)
	let projects = $state([
		{ id: '1', name: 'Medical Images Dataset' },
		{ id: '2', name: 'Vehicle Detection' },
		{ id: '3', name: 'Plant Disease Classification' }
	]);

	let images = $state([
		{ id: '1', url: '/images/chest-xray-001.jpg', name: 'chest-xray-001.jpg' },
		{ id: '2', url: '/images/vehicle-001.jpg', name: 'vehicle-001.jpg' },
		{ id: '3', url: '/images/plant-leaf-001.jpg', name: 'plant-leaf-001.jpg' }
	]);

	// Load tasks when component mounts
	onMount(() => {
		taskStore.loadTasks();
	});

	// Event handlers
	function handleCreateTask() {
		showCreateModal = true;
	}

	function handleEditTask(task: TaskSummary) {
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

	function handleRetry() {
		taskStore.refreshTasks();
	}

	function handleLoadMore() {
		taskStore.loadMoreTasks();
	}

	async function handleFiltersChange(filters: TaskFiltersType) {
		await taskStore.updateFilters(filters);
	}

	async function handleCreateSubmit(data: CreateTaskForm) {
		await taskStore.createTask(data);
		showCreateModal = false;
	}

	async function handleEditSubmit(data: UpdateTaskForm) {
		await taskStore.updateTask(data);
		showEditModal = false;
		taskToEdit = null;
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
	<div class="mb-6">
		<TaskFilters {filters} {projects} {loading} onFiltersChange={handleFiltersChange} />
	</div>

	<!-- Task List -->
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

	<!-- Create Task Modal -->
	<CreateTaskModal
		open={showCreateModal}
		{projects}
		{images}
		onClose={handleCreateModalClose}
		onSubmit={handleCreateSubmit}
	/>

	<!-- Edit Task Modal -->
	<EditTaskModal
		open={showEditModal}
		task={taskToEdit}
		{projects}
		{images}
		onClose={handleEditModalClose}
		onSubmit={handleEditSubmit}
	/>
</div>
