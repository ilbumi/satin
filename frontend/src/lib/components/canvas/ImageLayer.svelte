<script lang="ts">
	import { Image } from 'svelte-konva';
	import { imageStore, imageTransform } from '$lib/stores/image';
	import { onMount } from 'svelte';

	let imageElement = $state<HTMLImageElement | null>(null);

	onMount(() => {
		if ($imageStore.url) {
			const img = new window.Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				imageElement = img;
			};
			img.src = $imageStore.url;
		}
	});

	$effect(() => {
		if ($imageStore.url) {
			const img = new window.Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				imageElement = img;
			};
			img.src = $imageStore.url;
		}
	});
</script>

{#if imageElement && $imageStore.url}
	<Image
		image={imageElement}
		x={$imageTransform.x}
		y={$imageTransform.y}
		scaleX={$imageTransform.scaleX}
		scaleY={$imageTransform.scaleY}
		width={$imageStore.naturalWidth}
		height={$imageStore.naturalHeight}
	/>
{/if}
