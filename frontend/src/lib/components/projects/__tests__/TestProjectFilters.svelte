<script lang="ts">
	import ProjectFilters from '../ProjectFilters.svelte';
	import type { ProjectFilters as ProjectFiltersType } from '$lib/features/projects/types';

	interface Props {
		filters: ProjectFiltersType;
		onClear?: boolean;
	}

	let { filters: initialFilters, onClear = false }: Props = $props();

	let filtersChangeCalled = $state(false);
	let clearCalled = $state(false);
	let lastFiltersChange = $state<Partial<ProjectFiltersType> | null>(null);
	// eslint-disable-next-line svelte/prefer-writable-derived
	let currentFilters = $state<ProjectFiltersType>({ ...initialFilters });

	// Update current filters when initial filters change
	$effect(() => {
		currentFilters = { ...initialFilters };
	});

	function handleFiltersChange(newFilters: Partial<ProjectFiltersType>) {
		filtersChangeCalled = true;
		lastFiltersChange = newFilters;
		// Simulate parent updating filters
		currentFilters = { ...currentFilters, ...newFilters };
	}

	function handleClear() {
		clearCalled = true;
	}

	// Expose test state
	export const testState = {
		get filtersChangeCalled() {
			return filtersChangeCalled;
		},
		get clearCalled() {
			return clearCalled;
		},
		get lastFiltersChange() {
			return lastFiltersChange;
		}
	};
</script>

<ProjectFilters
	filters={currentFilters}
	onFiltersChange={handleFiltersChange}
	onClear={onClear ? handleClear : undefined}
/>

<div data-testid="test-state" style="display: none;">
	<span data-testid="filters-change-called">{filtersChangeCalled}</span>
	<span data-testid="clear-called">{clearCalled}</span>
	<span data-testid="last-filters-change">{JSON.stringify(lastFiltersChange)}</span>
</div>
