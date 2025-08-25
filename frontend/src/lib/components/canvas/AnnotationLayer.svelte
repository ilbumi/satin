<script lang="ts">
	import { Group } from 'svelte-konva';
	import BoundingBox from './BoundingBox.svelte';
	import { annotationStore } from '$lib/stores/annotation';
	import { imageTransform } from '$lib/stores/image';
	import { toolStore } from '$lib/stores/tool';

	const transform = $derived($imageTransform);
	const annotations = $derived($annotationStore.annotations);
	const showAnnotations = $derived($toolStore.showAnnotations);
</script>

{#if showAnnotations}
	<Group x={transform.x} y={transform.y} scaleX={transform.scaleX} scaleY={transform.scaleY}>
		{#each annotations as annotation (annotation.id)}
			<BoundingBox {annotation} />
		{/each}
	</Group>
{/if}
