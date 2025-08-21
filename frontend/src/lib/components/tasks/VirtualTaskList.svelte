<script lang="ts">
	import { Button, VirtualList } from '$lib/components/ui';
	import TaskCard from './TaskCard.svelte';
	import type { TaskSummary } from '$lib/features/tasks/types';

	interface Props {
		tasks: TaskSummary[];
		loading?: boolean;
		error?: string | null;
		onCreateTask?: () => void;
		onEditTask?: (task: TaskSummary) => void;
		onDeleteTask?: (task: TaskSummary) => void;
		onRetry?: () => void;
		onLoadMore?: () => void;
		hasMore?: boolean;
		containerHeight?: number;
	}

	let {
		tasks,
		loading = false,
		error = null,
		onCreateTask,
		onEditTask,
		onDeleteTask,
		onRetry,
		onLoadMore,
		hasMore = false,
		containerHeight = 600
	}: Props = $props();

	// Item height estimate for TaskCard (includes margin)
	const ITEM_HEIGHT = 200;

	function handleCreateTask() {
		onCreateTask?.();
	}

	function handleEditTask(task: TaskSummary) {
		onEditTask?.(task);
	}

	function handleDeleteTask(task: TaskSummary) {
		onDeleteTask?.(task);
	}

	function handleRetry() {
		onRetry?.();
	}

	function handleLoadMore() {
		onLoadMore?.();
	}

	function keyExtractor(task: TaskSummary, _index: number): string {
		return task.id;
	}
</script>

<div class="space-y-6" data-testid="virtual-task-list">
	<!-- Loading State -->
	{#if loading && tasks.length === 0}
		<div class="flex items-center justify-center py-12" data-testid="loading-state">
			<div class="text-center">
				<div
					class="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-300 border-r-transparent"
				></div>
				<p class="text-gray-600">Loading tasks...</p>
			</div>
		</div>
	{/if}

	<!-- Error State -->
	{#if error && !loading && tasks.length === 0}
		<div class="py-12 text-center" data-testid="error-state">
			<div class="mb-4 text-6xl">⚠️</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">Failed to load tasks</h3>
			<p class="mb-6 text-gray-600">{error}</p>
			{#if onRetry}
				<Button variant="primary" onclick={handleRetry}>Try Again</Button>
			{/if}
		</div>
	{/if}

	<!-- Empty State -->
	{#if !loading && !error && tasks.length === 0}
		<div class="py-12 text-center" data-testid="empty-state">
			<div class="mb-4 text-6xl">✅</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">No tasks yet</h3>
			<p class="mb-6 text-gray-600">Create your first annotation task to get started</p>
			{#if onCreateTask}
				<Button variant="primary" onclick={handleCreateTask}>Create Task</Button>
			{/if}
		</div>
	{/if}

	<!-- Virtual Task List -->
	{#if tasks.length > 0}
		<div data-testid="virtual-tasks-container">
			<VirtualList
				items={tasks}
				itemHeight={ITEM_HEIGHT}
				{containerHeight}
				{keyExtractor}
				overscan={3}
			>
				{#snippet children(task: TaskSummary, _index: number)}
					<div class="px-4 py-2">
						<TaskCard
							{task}
							onEdit={onEditTask ? handleEditTask : undefined}
							onDelete={onDeleteTask ? handleDeleteTask : undefined}
						/>
					</div>
				{/snippet}
			</VirtualList>
		</div>

		<!-- Load More Button -->
		{#if hasMore && onLoadMore}
			<div class="flex justify-center pt-6">
				<Button
					variant="secondary"
					onclick={handleLoadMore}
					disabled={loading}
					data-testid="load-more-button"
				>
					{#if loading}
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"
						></div>
						Loading...
					{:else}
						Load More
					{/if}
				</Button>
			</div>
		{/if}

		<!-- Loading indicator for load more -->
		{#if loading && tasks.length > 0}
			<div class="flex justify-center py-4" data-testid="loading-more-state">
				<div class="text-center">
					<div
						class="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-gray-300 border-r-transparent"
					></div>
					<p class="text-sm text-gray-600">Loading more tasks...</p>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Error banner for failed load more -->
	{#if error && tasks.length > 0}
		<div class="rounded-md bg-red-50 p-4" data-testid="load-more-error">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg
						class="h-5 w-5 text-red-400"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Failed to load more tasks</h3>
					<div class="mt-2 text-sm text-red-700">
						<p>{error}</p>
					</div>
					{#if onRetry}
						<div class="mt-3">
							<Button variant="danger" size="sm" onclick={handleRetry}>Try Again</Button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
