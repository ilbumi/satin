<script lang="ts">
	import { Card, Button } from '$lib/components/ui';
	import TaskStatusBadge from './TaskStatusBadge.svelte';
	import type { TaskSummary } from '$lib/features/tasks/types';
	import { TASK_PRIORITY_COLORS } from '$lib/features/tasks/types';

	interface Props {
		task: TaskSummary;
		onEdit?: (task: TaskSummary) => void;
		onDelete?: (task: TaskSummary) => void;
	}

	let { task, onEdit, onDelete }: Props = $props();

	function handleEdit() {
		onEdit?.(task);
	}

	function handleDelete() {
		onDelete?.(task);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString();
	}

	function getPriorityColor(priority?: string) {
		if (!priority || priority === 'all') return '';
		return TASK_PRIORITY_COLORS[priority as keyof typeof TASK_PRIORITY_COLORS] || '';
	}
</script>

{#snippet header()}
	<div class="flex items-start justify-between">
		<h3 class="line-clamp-2 text-lg font-semibold text-gray-900" title={task.title}>
			{task.title || `Task in ${task.projectName}`}
		</h3>
		<div class="flex items-center space-x-2">
			{#if task.priority}
				<span class="rounded-full px-2 py-1 text-xs font-medium {getPriorityColor(task.priority)}">
					{task.priority}
				</span>
			{/if}
			<TaskStatusBadge status={task.status} size="sm" />
		</div>
	</div>
{/snippet}

{#snippet footer()}
	{#if onEdit || onDelete}
		<div class="flex items-center justify-end space-x-2">
			{#if onEdit}
				<Button variant="secondary" size="sm" onclick={handleEdit} data-testid="edit-task-button">
					Edit
				</Button>
			{/if}
			{#if onDelete}
				<Button variant="danger" size="sm" onclick={handleDelete} data-testid="delete-task-button">
					Delete
				</Button>
			{/if}
		</div>
	{/if}
{/snippet}

<Card class="transition-shadow hover:shadow-md" data-testid="task-card" {header} {footer}>
	<div class="space-y-3">
		<!-- Project and Image Info -->
		<div class="space-y-1">
			<p class="flex items-center text-sm text-gray-600">
				<span class="mr-2">📁</span>
				<span class="truncate" title={task.projectName}>{task.projectName}</span>
			</p>
			<p class="flex items-center text-sm text-gray-600">
				<span class="mr-2">📷</span>
				<span class="truncate">Image</span>
			</p>
			{#if task.assignee}
				<p class="flex items-center text-sm text-gray-600">
					<span class="mr-2">👤</span>
					<span class="truncate">{task.assignee}</span>
				</p>
			{/if}
			{#if task.dueDate}
				<p class="flex items-center text-sm text-gray-600">
					<span class="mr-2">📅</span>
					<span>Due: {formatDate(task.dueDate)}</span>
				</p>
			{/if}
		</div>

		<!-- Task Metrics -->
		<div class="flex items-center justify-between text-sm text-gray-500">
			<div class="flex items-center space-x-4">
				<span class="flex items-center">
					<span class="mr-1">📦</span>
					{task.bboxCount} annotations
				</span>
			</div>
			<span class="text-xs">
				Created {formatDate(task.createdAt)}
			</span>
		</div>

		<!-- Progress Bar (if progress is available) -->
		{#if task.progress !== undefined}
			<div>
				<div class="mb-1 flex items-center justify-between">
					<span class="text-sm font-medium text-gray-700">Progress</span>
					<span class="text-sm text-gray-600">{task.progress}%</span>
				</div>
				<div class="h-2 w-full rounded-full bg-gray-200">
					<div
						class="h-2 rounded-full bg-blue-600 transition-all duration-300"
						style="width: {task.progress}%"
						role="progressbar"
						aria-valuenow={task.progress}
						aria-valuemin="0"
						aria-valuemax="100"
					></div>
				</div>
			</div>
		{/if}

		<!-- Action Links -->
		<div class="flex items-center justify-between">
			<a
				href="/tasks/{task.id}"
				class="text-sm font-medium text-blue-600 hover:text-blue-800"
				data-testid="view-task-link"
			>
				View Task →
			</a>
			{#if task.imageUrl}
				<a
					href="/images/{task.imageId}"
					class="text-sm text-gray-500 hover:text-gray-700"
					data-testid="view-image-link"
				>
					View Image
				</a>
			{/if}
		</div>
	</div>
</Card>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
