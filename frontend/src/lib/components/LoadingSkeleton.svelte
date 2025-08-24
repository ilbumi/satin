<script lang="ts">
	interface Props {
		variant?: 'text' | 'rect' | 'circle';
		width?: string;
		height?: string;
		lines?: number;
	}

	let { variant = 'text', width = '100%', height = '1rem', lines = 1 }: Props = $props();
</script>

{#if variant === 'text'}
	{#each Array.from({ length: lines }, (_, i) => i) as i (i)}
		<div
			class="animate-pulse rounded bg-gray-200 {i === lines - 1 && lines > 1 ? 'w-3/4' : ''}"
			style="width: {i === lines - 1 && lines > 1
				? '75%'
				: width}; height: {height}; margin-bottom: {i < lines - 1 ? '0.5rem' : '0'}"
		></div>
	{/each}
{:else if variant === 'circle'}
	<div
		class="animate-pulse rounded-full bg-gray-200"
		style="width: {width}; height: {height || width}"
	></div>
{:else if variant === 'rect'}
	<div class="animate-pulse rounded bg-gray-200" style="width: {width}; height: {height}"></div>
{/if}
