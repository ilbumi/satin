<script lang="ts">
	import { Rect, Group } from 'svelte-konva';
	import { toolStore, currentDrawingRect } from '$lib/stores/tool';
	import { imageTransform } from '$lib/stores/image';

	const transform = $derived($imageTransform);
	const drawingRect = $derived($currentDrawingRect);
	const isDrawing = $derived($toolStore.isDrawing);
</script>

{#if isDrawing && drawingRect}
	<Group x={transform.x} y={transform.y} scaleX={transform.scaleX} scaleY={transform.scaleY}>
		<Rect
			x={drawingRect.x}
			y={drawingRect.y}
			width={drawingRect.width}
			height={drawingRect.height}
			stroke={$toolStore.strokeColor}
			strokeWidth={$toolStore.strokeWidth / transform.scaleX}
			fill={$toolStore.fillColor}
			dash={[5 / transform.scaleX, 5 / transform.scaleX]}
		/>
	</Group>
{/if}
