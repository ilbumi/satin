<script lang="ts">
	import ProjectPagination from '../ProjectPagination.svelte';

	interface Props {
		limit: number;
		offset: number;
		totalCount: number;
		hasMore: boolean;
		loading?: boolean;
	}

	let { limit, offset, totalCount, hasMore, loading = false }: Props = $props();

	let nextCalled = $state(false);
	let prevCalled = $state(false);
	let nextCallCount = $state(0);
	let prevCallCount = $state(0);

	function handleNext() {
		nextCalled = true;
		nextCallCount++;
	}

	function handlePrev() {
		prevCalled = true;
		prevCallCount++;
	}

	// Expose test state
	export const testState = {
		get nextCalled() {
			return nextCalled;
		},
		get prevCalled() {
			return prevCalled;
		},
		get nextCallCount() {
			return nextCallCount;
		},
		get prevCallCount() {
			return prevCallCount;
		}
	};
</script>

<ProjectPagination
	{limit}
	{offset}
	{totalCount}
	{hasMore}
	{loading}
	onNext={handleNext}
	onPrev={handlePrev}
/>

<div data-testid="test-state" style="display: none;">
	<span data-testid="next-called">{nextCalled}</span>
	<span data-testid="prev-called">{prevCalled}</span>
	<span data-testid="next-call-count">{nextCallCount}</span>
	<span data-testid="prev-call-count">{prevCallCount}</span>
</div>
