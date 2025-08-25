<script lang="ts">
	import { Rect, Text, Group, Transformer } from 'svelte-konva';
	import { annotationStore } from '$lib/stores/annotation';
	import { toolStore, ToolType } from '$lib/stores/tool';
	import { imageTransform } from '$lib/stores/image';
	import type { AnnotationWithLocal } from '$lib/stores/annotation';
	import type Konva from 'konva';
	import type { Box } from 'konva/lib/shapes/Transformer';

	interface Props {
		annotation: AnnotationWithLocal;
	}

	let { annotation }: Props = $props();

	let rectNode: Konva.Rect | undefined;
	let transformerNode: Konva.Transformer | undefined;

	const isSelected = $derived(annotation.isSelected || false);
	const showLabels = $derived($toolStore.showLabels);
	const showConfidence = $derived($toolStore.showConfidenceScores);
	const currentTool = $derived($toolStore.currentTool);
	const transform = $derived($imageTransform);

	const strokeColor = $derived.by(() => {
		if (annotation.source === 'ml') {
			return annotation.confidence && annotation.confidence > 0.8 ? '#10B981' : '#F59E0B';
		}
		return isSelected ? '#EF4444' : '#3B82F6';
	});

	const fillColor = $derived.by(() => {
		if (annotation.source === 'ml') {
			return annotation.confidence && annotation.confidence > 0.8
				? 'rgba(16, 185, 129, 0.2)'
				: 'rgba(245, 158, 11, 0.2)';
		}
		return isSelected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)';
	});

	function handleClick(e: MouseEvent) {
		e.cancelBubble = true;

		if (currentTool === ToolType.SELECT) {
			if (e.shiftKey) {
				if (isSelected) {
					annotationStore.clearSelection();
				} else {
					annotationStore.selectAnnotation(annotation.id);
				}
			} else {
				annotationStore.selectAnnotation(annotation.id);
			}
		}
	}

	function handleTransformEnd(e: CustomEvent) {
		const node = e.detail.target as Konva.Rect;
		if (!node) return;
		const scaleX = node.scaleX();
		const scaleY = node.scaleY();

		node.scaleX(1);
		node.scaleY(1);

		annotationStore.updateAnnotation(annotation.id, {
			x: node.x(),
			y: node.y(),
			width: Math.max(5, node.width() * scaleX),
			height: Math.max(5, node.height() * scaleY)
		});
	}

	function handleDragEnd(e: CustomEvent) {
		const node = e.detail.target;
		annotationStore.updateAnnotation(annotation.id, {
			x: node.x(),
			y: node.y()
		});
	}

	function handleRectMount(e: CustomEvent) {
		rectNode = e.detail.node;
		updateTransformer();
	}

	function handleTransformerMount(e: CustomEvent) {
		transformerNode = e.detail.node;
		updateTransformer();
	}

	function updateTransformer() {
		if (transformerNode && rectNode && isSelected && currentTool === ToolType.SELECT) {
			transformerNode.nodes([rectNode]);
			transformerNode.getLayer()?.batchDraw();
		} else if (transformerNode) {
			transformerNode.nodes([]);
		}
	}

	$effect(() => {
		updateTransformer();
	});
</script>

<Group>
	<Rect
		onmount={handleRectMount}
		x={annotation.x}
		y={annotation.y}
		width={annotation.width}
		height={annotation.height}
		stroke={strokeColor}
		strokeWidth={2 / transform.scaleX}
		fill={fillColor}
		draggable={currentTool === ToolType.SELECT}
		cornerRadius={2}
		on:click={handleClick}
		on:dragend={handleDragEnd}
		on:transformend={handleTransformEnd}
	/>

	{#if showLabels && annotation.tags?.length}
		<Text
			x={annotation.x}
			y={annotation.y - 20 / transform.scaleX}
			text={annotation.tags.map((t) => t.name).join(', ')}
			fontSize={12 / transform.scaleX}
			fill={strokeColor}
			padding={2 / transform.scaleX}
		/>
	{/if}

	{#if showConfidence && annotation.confidence}
		<Text
			x={annotation.x + annotation.width - 30 / transform.scaleX}
			y={annotation.y - 20 / transform.scaleX}
			text={`${Math.round(annotation.confidence * 100)}%`}
			fontSize={10 / transform.scaleX}
			fill={strokeColor}
			padding={2 / transform.scaleX}
		/>
	{/if}

	{#if isSelected && currentTool === ToolType.SELECT}
		<Transformer
			onmount={handleTransformerMount}
			borderStroke={strokeColor}
			borderStrokeWidth={1 / transform.scaleX}
			anchorStroke={strokeColor}
			anchorFill="white"
			anchorSize={8 / transform.scaleX}
			anchorCornerRadius={2 / transform.scaleX}
			boundBoxFunc={(oldBox: Box, newBox: Box) => {
				if (newBox.width < 5 || newBox.height < 5) {
					return oldBox;
				}
				return newBox;
			}}
		/>
	{/if}
</Group>
