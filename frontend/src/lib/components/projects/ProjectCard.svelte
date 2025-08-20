<script lang="ts">
	import { Card, Button } from '$lib/components/ui';
	import { cn, statusColors } from '$lib/core/styles';
	import type { ProjectSummary } from '$lib/features/projects/types';

	interface Props {
		project: ProjectSummary;
		onEdit?: (project: ProjectSummary) => void;
		onDelete?: (project: ProjectSummary) => void;
	}

	let { project, onEdit, onDelete }: Props = $props();

	function handleEdit() {
		onEdit?.(project);
	}

	function handleDelete() {
		onDelete?.(project);
	}

	function getStatusColor(status?: string) {
		switch (status) {
			case 'active':
				return cn(statusColors.success.bg, statusColors.success.text);
			case 'completed':
				return cn(statusColors.info.bg, statusColors.info.text);
			case 'draft':
				return cn(statusColors.neutral.bg, statusColors.neutral.text);
			default:
				return cn(statusColors.neutral.bg, statusColors.neutral.text);
		}
	}

	// Computed classes for consistent styling
	const badgeClasses = $derived(() =>
		cn('rounded-full px-2 py-1 text-xs font-medium', getStatusColor(project.status))
	);

	const titleClasses = 'truncate text-lg font-semibold text-gray-900';
	const descriptionClasses = 'line-clamp-3 text-sm text-gray-600';
</script>

<Card class="transition-shadow hover:shadow-md" data-testid="project-card">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h3 class={titleClasses} title={project.name}>
				{project.name}
			</h3>
			{#if project.status}
				<span class={badgeClasses}>
					{project.status}
				</span>
			{/if}
		</div>
	{/snippet}

	<div class="space-y-3">
		<p class={descriptionClasses} title={project.description}>
			{project.description}
		</p>

		<div class="flex items-center justify-between text-sm text-gray-500">
			<div class="flex items-center space-x-4">
				{#if project.imageCount !== undefined}
					<span class="flex items-center">
						<span class="mr-1">📷</span>
						{project.imageCount} images
					</span>
				{/if}
				{#if project.taskCount !== undefined}
					<span class="flex items-center">
						<span class="mr-1">📝</span>
						{project.taskCount} tasks
					</span>
				{/if}
			</div>

			<a href="/projects/{project.id}" class="font-medium text-blue-600 hover:text-blue-800">
				View →
			</a>
		</div>

		{#if project.createdAt}
			<div class="text-xs text-gray-400">
				Created {new Date(project.createdAt).toLocaleDateString()}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex items-center justify-end space-x-2">
			{#if onEdit}
				<Button variant="secondary" size="sm" onclick={handleEdit}>Edit</Button>
			{/if}
			{#if onDelete}
				<Button variant="danger" size="sm" onclick={handleDelete}>Delete</Button>
			{/if}
		</div>
	{/snippet}
</Card>

<style>
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
