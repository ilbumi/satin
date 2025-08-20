<script lang="ts">
	import type { TaskStatus } from '$lib/graphql/generated/graphql';
	import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '$lib/features/tasks/types';

	interface Props {
		status: TaskStatus;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { status, size = 'md', class: className = '' }: Props = $props();

	// Get color classes for the status
	const colorClasses = TASK_STATUS_COLORS[status];
	const label = TASK_STATUS_LABELS[status];

	// Size-specific classes
	const sizeClasses = {
		sm: 'px-2 py-0.5 text-xs',
		md: 'px-2 py-1 text-xs',
		lg: 'px-3 py-1 text-sm'
	};
</script>

<span
	class="inline-flex items-center rounded-full font-medium {colorClasses} {sizeClasses[
		size
	]} {className}"
	data-testid="task-status-badge"
	data-status={status}
	title="Task status: {label}"
>
	{label}
</span>

<style>
	/* Ensure consistent badge appearance */
	span {
		white-space: nowrap;
	}
</style>
