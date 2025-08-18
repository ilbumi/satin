<script lang="ts">
	import { Button, Input, Select } from '$lib/components/ui';
	import type { TaskFilters } from '$lib/features/tasks/types';
	import type { TaskStatus } from '$lib/graphql/generated/graphql';

	interface Props {
		filters: TaskFilters;
		onFiltersChange: (filters: TaskFilters) => void;
		projects?: Array<{ id: string; name: string }>;
		loading?: boolean;
	}

	let { filters, onFiltersChange, projects = [], loading = false }: Props = $props();

	// Local state for debounced search
	// Using $state + $effect instead of writable $derived because we need debouncing
	let localFilters: TaskFilters = $state({ ...filters });
	let searchTimeout: NodeJS.Timeout | null = null;
	let lastExternalFilters = $state({ ...filters });

	// Local state for input binding
	let searchValue = $state(filters.search || '');

	// Watch for external filter changes - only update if they actually changed
	$effect(() => {
		// Check if external filters have actually changed
		if (JSON.stringify(filters) !== JSON.stringify(lastExternalFilters)) {
			localFilters = { ...filters };
			searchValue = filters.search || '';
			lastExternalFilters = { ...filters };
		}
	});

	// Debounced search handler
	function handleSearchChange(event: Event) {
		const value = (event.currentTarget as HTMLInputElement)?.value || '';
		searchValue = value;
		localFilters.search = value;

		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		// Set new timeout for debounced search
		searchTimeout = setTimeout(() => {
			onFiltersChange({ ...localFilters });
		}, 300);
	}

	// Immediate filter handlers for non-search fields
	function handleStatusChange(event: Event) {
		const status = (event.currentTarget as HTMLSelectElement).value;
		localFilters.status = status === 'all' ? 'all' : (status as TaskStatus);
		onFiltersChange({ ...localFilters });
	}

	function handleProjectChange(event: Event) {
		const projectId = (event.currentTarget as HTMLSelectElement).value;
		localFilters.projectId = projectId || undefined;
		onFiltersChange({ ...localFilters });
	}

	function clearAllFilters() {
		const clearedFilters: TaskFilters = {
			search: '',
			status: 'all',
			projectId: undefined,
			priority: 'all'
		};
		localFilters = clearedFilters;
		searchValue = '';
		onFiltersChange(clearedFilters);
		// Update tracking to prevent reactive override
		lastExternalFilters = { ...clearedFilters };
	}

	// Check if any filters are active
	let hasActiveFilters = $derived(
		Boolean(
			localFilters.search ||
				(localFilters.status && localFilters.status !== 'all') ||
				localFilters.projectId ||
				(localFilters.priority && localFilters.priority !== 'all')
		)
	);

	// Status options
	const statusOptions = [
		{ value: 'all', label: 'All Statuses' },
		{ value: 'DRAFT', label: 'Draft' },
		{ value: 'FINISHED', label: 'Finished' },
		{ value: 'REVIEWED', label: 'Reviewed' }
	];

	// Priority options (for future use)
	const priorityOptions = [
		{ value: 'all', label: 'All Priorities' },
		{ value: 'high', label: 'High' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'low', label: 'Low' }
	];
</script>

<div class="space-y-4" data-testid="task-filters">
	<!-- Filter Controls -->
	<div class="flex flex-wrap items-center gap-4">
		<!-- Search Input -->
		<div class="min-w-64 flex-1">
			<Input
				type="text"
				placeholder="Search tasks..."
				bind:value={searchValue}
				oninput={handleSearchChange}
				disabled={loading}
				class="w-full"
				data-testid="search-input"
			/>
		</div>

		<!-- Status Filter -->
		<div class="min-w-48">
			<Select
				value={localFilters.status || 'all'}
				onchange={handleStatusChange}
				disabled={loading}
				data-testid="status-filter"
			>
				{#each statusOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</Select>
		</div>

		<!-- Project Filter -->
		{#if projects.length > 0}
			<div class="min-w-48">
				<Select
					value={localFilters.projectId || ''}
					onchange={handleProjectChange}
					disabled={loading}
					data-testid="project-filter"
				>
					<option value="">All Projects</option>
					{#each projects as project (project.id)}
						<option value={project.id}>{project.name}</option>
					{/each}
				</Select>
			</div>
		{/if}

		<!-- Priority Filter (hidden for now since it's not implemented in backend) -->
		<!--
		<div class="min-w-48">
			<Select
				value={localFilters.priority || 'all'}
				onchange={handlePriorityChange}
				disabled={loading}
				data-testid="priority-filter"
			>
				{#each priorityOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</Select>
		</div>
		-->

		<!-- Clear Filters Button -->
		{#if hasActiveFilters}
			<Button
				variant="secondary"
				onclick={clearAllFilters}
				disabled={loading}
				data-testid="clear-filters-button"
			>
				Clear Filters
			</Button>
		{/if}
	</div>

	<!-- Active Filter Badges -->
	{#if hasActiveFilters}
		<div class="flex flex-wrap items-center gap-2" data-testid="active-filters">
			<span class="text-sm font-medium text-gray-700">Active filters:</span>

			{#if localFilters.search}
				<span
					class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
				>
					Search: "{localFilters.search}"
				</span>
			{/if}

			{#if localFilters.status && localFilters.status !== 'all'}
				<span
					class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
				>
					Status: {statusOptions.find((opt) => opt.value === localFilters.status)?.label}
				</span>
			{/if}

			{#if localFilters.projectId}
				<span
					class="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800"
				>
					Project: {projects.find((proj) => proj.id === localFilters.projectId)?.name || 'Unknown'}
				</span>
			{/if}

			{#if localFilters.priority && localFilters.priority !== 'all'}
				<span
					class="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800"
				>
					Priority: {priorityOptions.find((opt) => opt.value === localFilters.priority)?.label}
				</span>
			{/if}
		</div>
	{/if}

	<!-- Filter Stats (optional) -->
	{#if !hasActiveFilters}
		<div class="text-sm text-gray-500" data-testid="filter-help">
			Use the filters above to find specific tasks by search terms, status, or project.
		</div>
	{/if}
</div>
