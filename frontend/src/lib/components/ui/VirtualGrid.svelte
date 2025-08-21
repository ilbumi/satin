<script lang="ts" generics="T">
	import { onMount, onDestroy } from 'svelte';

	interface VirtualGridProps<T> {
		items: T[];
		itemHeight: number;
		itemWidth: number;
		containerHeight?: number;
		gap?: number;
		overscan?: number;
		keyExtractor: (item: T, index: number) => string;
		children: import('svelte').Snippet<[T, number]>;
	}

	let {
		items = [],
		itemHeight,
		itemWidth,
		containerHeight = 400,
		gap = 16,
		overscan = 1,
		keyExtractor,
		children
	}: VirtualGridProps<T> = $props();

	let scrollContainer: HTMLDivElement;
	let containerElement: HTMLDivElement;
	let scrollTop = $state(0);
	let containerWidth = $state(0);

	// Calculate columns based on container width
	const columnsCount = $derived(() => {
		if (containerWidth === 0) return 1;
		return Math.floor((containerWidth + gap) / (itemWidth + gap));
	});

	// Calculate rows
	const rowsCount = $derived(() => Math.ceil(items.length / columnsCount()));

	// Calculate visible row range
	const visibleRowRange = $derived(() => {
		const rowHeight = itemHeight + gap;
		const startRow = Math.floor(scrollTop / rowHeight);
		const endRow = Math.min(startRow + Math.ceil(containerHeight / rowHeight), rowsCount() - 1);

		// Add overscan
		const overscanStart = Math.max(0, startRow - overscan);
		const overscanEnd = Math.min(rowsCount() - 1, endRow + overscan);

		return {
			start: overscanStart,
			end: overscanEnd
		};
	});

	// Visible items with positions
	const visibleItems = $derived(() => {
		const range = visibleRowRange();
		const cols = columnsCount();
		const result = [];

		for (let row = range.start; row <= range.end; row++) {
			for (let col = 0; col < cols; col++) {
				const index = row * cols + col;
				if (index >= items.length) break;

				const x = col * (itemWidth + gap);
				const y = row * (itemHeight + gap);

				result.push({
					item: items[index],
					index,
					x,
					y,
					key: keyExtractor(items[index], index)
				});
			}
		}

		return result;
	});

	// Total height for scrollbar
	const totalHeight = $derived(rowsCount() * (itemHeight + gap) - gap);

	// Handle scroll events
	function handleScroll(event: Event) {
		const target = event.target as HTMLDivElement;
		scrollTop = target.scrollTop;
	}

	// Resize observer to track container width
	let resizeObserver: ResizeObserver | null = null;

	onMount(() => {
		if (scrollContainer) {
			scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
		}

		if (containerElement && window.ResizeObserver) {
			resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					containerWidth = entry.contentRect.width;
				}
			});
			resizeObserver.observe(containerElement);
		}
	});

	onDestroy(() => {
		if (scrollContainer) {
			scrollContainer.removeEventListener('scroll', handleScroll);
		}
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
	});
</script>

<div
	bind:this={containerElement}
	class="virtual-grid-container"
	style="height: {containerHeight}px;"
>
	<div
		bind:this={scrollContainer}
		class="virtual-grid-scroller"
		style="height: 100%; overflow-y: auto;"
	>
		<!-- Total height container for correct scrollbar -->
		<div style="height: {totalHeight}px; position: relative;">
			<!-- Visible items -->
			{#each visibleItems() as { item, index, x, y, key } (key)}
				<div
					class="virtual-grid-item"
					style="position: absolute; left: {x}px; top: {y}px; width: {itemWidth}px; height: {itemHeight}px;"
				>
					{@render children(item, index)}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.virtual-grid-container {
		position: relative;
		width: 100%;
	}

	.virtual-grid-scroller {
		width: 100%;
		height: 100%;
	}

	.virtual-grid-item {
		box-sizing: border-box;
	}
</style>
