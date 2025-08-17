<script lang="ts">
	import { Input, Select, Button } from '$lib/components/ui';
	import type { ProjectFilters } from '$lib/features/projects/types';

	interface Props {
		filters: ProjectFilters;
		onFiltersChange: (filters: Partial<ProjectFilters>) => void;
		onClear?: () => void;
	}

	let { filters, onFiltersChange, onClear }: Props = $props();

	let searchValue = $state(filters.search || '');
	let statusValue = $state(filters.status || 'all');

	function handleSearchChange(event: Event) {
		const target = event.target as HTMLInputElement;
		searchValue = target.value;

		// Debounce search
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			onFiltersChange({ search: searchValue });
		}, 300);
	}

	function handleStatusChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const value = target.value as 'active' | 'completed' | 'draft' | 'all';
		statusValue = value;
		onFiltersChange({ status: value });
	}

	function handleClear() {
		searchValue = '';
		statusValue = 'all';
		onFiltersChange({ search: '', status: 'all' });
		onClear?.();
	}

	let searchTimeout: ReturnType<typeof setTimeout>;

	const statusOptions = [
		{ value: 'all', label: 'All Projects' },
		{ value: 'active', label: 'Active' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'draft', label: 'Draft' }
	];

	const hasActiveFilters = $derived(
		(filters.search && filters.search.length > 0) || (filters.status && filters.status !== 'all')
	);

	// Sync internal state with props when filters change externally
	$effect(() => {
		searchValue = filters.search || '';
		statusValue = filters.status || 'all';
	});
</script>

<div class="mb-6 rounded-lg border border-gray-200 bg-white p-4">
	<div class="flex flex-col items-end gap-4 sm:flex-row">
		<div class="flex-1">
			<label for="search-projects" class="mb-2 block text-sm font-medium text-gray-700">
				Search Projects
			</label>
			<Input
				id="search-projects"
				type="text"
				value={searchValue}
				oninput={handleSearchChange}
				placeholder="Search by project name..."
				class="w-full"
			/>
		</div>

		<div class="w-full sm:w-48">
			<label for="filter-status" class="mb-2 block text-sm font-medium text-gray-700">
				Status
			</label>
			<Select
				id="filter-status"
				value={statusValue}
				onchange={handleStatusChange}
				options={statusOptions}
				class="w-full"
			/>
		</div>

		{#if hasActiveFilters}
			<div class="w-full sm:w-auto">
				<Button variant="secondary" onclick={handleClear} size="sm">Clear Filters</Button>
			</div>
		{/if}
	</div>

	{#if hasActiveFilters}
		<div class="mt-3 border-t border-gray-100 pt-3">
			<div class="flex flex-wrap gap-2 text-xs">
				{#if filters.search}
					<span
						class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-800"
					>
						Search: "{filters.search}"
					</span>
				{/if}
				{#if filters.status && filters.status !== 'all'}
					<span
						class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-green-800"
					>
						Status: {filters.status}
					</span>
				{/if}
			</div>
		</div>
	{/if}
</div>
