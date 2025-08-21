<script lang="ts" generics="T">
	import { onMount, onDestroy } from 'svelte';

	interface VirtualListProps<T> {
		items: T[];
		itemHeight: number;
		containerHeight?: number;
		overscan?: number;
		keyExtractor: (item: T, index: number) => string;
		children: import('svelte').Snippet<[T, number]>;
	}

	let {
		items = [],
		itemHeight,
		containerHeight = 400,
		overscan = 5,
		keyExtractor,
		children
	}: VirtualListProps<T> = $props();

	let scrollContainer: HTMLDivElement;
	let scrollTop = $state(0);
	let containerRef: HTMLDivElement;

	// Calculate visible range
	const visibleRange = $derived(() => {
		const startIndex = Math.floor(scrollTop / itemHeight);
		const endIndex = Math.min(
			startIndex + Math.ceil(containerHeight / itemHeight),
			items.length - 1
		);

		// Add overscan
		const overscanStart = Math.max(0, startIndex - overscan);
		const overscanEnd = Math.min(items.length - 1, endIndex + overscan);

		return {
			start: overscanStart,
			end: overscanEnd
		};
	});

	// Visible items with positions
	const visibleItems = $derived(() => {
		const range = visibleRange();
		const result = [];

		for (let i = range.start; i <= range.end; i++) {
			result.push({
				item: items[i],
				index: i,
				top: i * itemHeight,
				key: keyExtractor(items[i], i)
			});
		}

		return result;
	});

	// Total height for scrollbar
	const totalHeight = $derived(items.length * itemHeight);

	// Handle scroll events
	function handleScroll(event: Event) {
		const target = event.target as HTMLDivElement;
		scrollTop = target.scrollTop;
	}

	onMount(() => {
		if (scrollContainer) {
			scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
		}
	});

	onDestroy(() => {
		if (scrollContainer) {
			scrollContainer.removeEventListener('scroll', handleScroll);
		}
	});
</script>

<div bind:this={containerRef} class="virtual-list-container" style="height: {containerHeight}px;">
	<div
		bind:this={scrollContainer}
		class="virtual-list-scroller"
		style="height: 100%; overflow-y: auto;"
	>
		<!-- Total height container for correct scrollbar -->
		<div style="height: {totalHeight}px; position: relative;">
			<!-- Visible items -->
			{#each visibleItems() as { item, index, top, key } (key)}
				<div
					class="virtual-list-item"
					style="position: absolute; top: {top}px; height: {itemHeight}px; width: 100%;"
				>
					{@render children(item, index)}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.virtual-list-container {
		position: relative;
		width: 100%;
	}

	.virtual-list-scroller {
		width: 100%;
		height: 100%;
	}

	.virtual-list-item {
		box-sizing: border-box;
	}
</style>
