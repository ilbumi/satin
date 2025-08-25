<script lang="ts">
	import { Stage, Layer } from 'svelte-konva';
	import { onMount } from 'svelte';
	import ImageLayer from './ImageLayer.svelte';
	import AnnotationLayer from './AnnotationLayer.svelte';
	import DrawingLayer from './DrawingLayer.svelte';
	import { imageStore, imageTransform } from '$lib/stores/image';
	import { toolStore, ToolType, currentDrawingRect } from '$lib/stores/tool';
	import { annotationStore } from '$lib/stores/annotation';
	import type Konva from 'konva';

	interface Props {
		width?: number;
		height?: number;
		containerClass?: string;
	}

	let { width = 800, height = 600, containerClass = '' }: Props = $props();

	let stageContainer: HTMLDivElement;
	let stage: Konva.Stage | undefined;
	let isDragging = $state(false);
	let lastPointerPosition = $state({ x: 0, y: 0 });

	onMount(() => {
		if (stageContainer) {
			const resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const { width: w, height: h } = entry.contentRect;
					if (w > 0 && h > 0) {
						width = w;
						height = h;
					}
				}
			});

			resizeObserver.observe(stageContainer);

			return () => {
				resizeObserver.disconnect();
			};
		}
	});

	function handleWheel(e: WheelEvent) {
		e.preventDefault();

		const scaleBy = 1.1;
		const oldScale = $imageStore.scale;
		const pointer = stage?.getPointerPosition();

		if (!pointer) return;

		const mousePointTo = {
			x: (pointer.x - $imageStore.offsetX) / oldScale,
			y: (pointer.y - $imageStore.offsetY) / oldScale
		};

		const direction = e.deltaY > 0 ? -1 : 1;
		const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

		imageStore.setScale(newScale);

		const newPos = {
			x: pointer.x - mousePointTo.x * newScale,
			y: pointer.y - mousePointTo.y * newScale
		};

		imageStore.pan(newPos.x - $imageStore.offsetX, newPos.y - $imageStore.offsetY);
	}

	function handleMouseDown() {
		const pointer = stage?.getPointerPosition();
		if (!pointer) return;

		const transform = $imageTransform;
		const imageX = (pointer.x - transform.x) / transform.scaleX;
		const imageY = (pointer.y - transform.y) / transform.scaleY;

		if ($toolStore.currentTool === ToolType.PAN) {
			isDragging = true;
			lastPointerPosition = pointer;
			stageContainer.style.cursor = 'grabbing';
		} else if ($toolStore.currentTool === ToolType.BOUNDING_BOX) {
			if (
				imageX >= 0 &&
				imageX <= $imageStore.naturalWidth &&
				imageY >= 0 &&
				imageY <= $imageStore.naturalHeight
			) {
				toolStore.startDrawing(imageX, imageY);
			}
		}
	}

	function handleMouseMove() {
		const pointer = stage?.getPointerPosition();
		if (!pointer) return;

		if ($toolStore.currentTool === ToolType.PAN && isDragging) {
			const dx = pointer.x - lastPointerPosition.x;
			const dy = pointer.y - lastPointerPosition.y;
			imageStore.pan(dx, dy);
			lastPointerPosition = pointer;
		} else if ($toolStore.isDrawing) {
			const transform = $imageTransform;
			const imageX = (pointer.x - transform.x) / transform.scaleX;
			const imageY = (pointer.y - transform.y) / transform.scaleY;

			const clampedX = Math.max(0, Math.min($imageStore.naturalWidth, imageX));
			const clampedY = Math.max(0, Math.min($imageStore.naturalHeight, imageY));

			toolStore.updateDrawing(clampedX, clampedY);
		}
	}

	function handleMouseUp() {
		if ($toolStore.currentTool === ToolType.PAN) {
			isDragging = false;
			stageContainer.style.cursor = $toolStore.currentTool === ToolType.PAN ? 'grab' : 'default';
		} else if ($toolStore.isDrawing && $currentDrawingRect) {
			const rect = $currentDrawingRect;

			if (rect.width > 5 && rect.height > 5) {
				const tempId = `temp-${Date.now()}`;
				annotationStore.addAnnotation({
					id: tempId,
					x: rect.x,
					y: rect.y,
					width: rect.width,
					height: rect.height,
					imageId: $imageStore.id || '',
					source: 'manual',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					isTemporary: true,
					isDirty: true
				});

				annotationStore.selectAnnotation(tempId);
			}

			toolStore.endDrawing();
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if ($toolStore.isDrawing) {
				toolStore.cancelDrawing();
			} else {
				annotationStore.clearSelection();
			}
		} else if (e.key === 'Delete' && $annotationStore.selectedId) {
			annotationStore.deleteAnnotation($annotationStore.selectedId);
		} else if (e.ctrlKey || e.metaKey) {
			if (e.key === 'z' && !e.shiftKey) {
				e.preventDefault();
				annotationStore.undo();
			} else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
				e.preventDefault();
				annotationStore.redo();
			}
		}
	}

	$effect(() => {
		if (stageContainer) {
			stageContainer.style.cursor =
				$toolStore.currentTool === ToolType.PAN
					? 'grab'
					: $toolStore.currentTool === ToolType.BOUNDING_BOX
						? 'crosshair'
						: 'default';
		}
	});
</script>

<svelte:window on:keydown={handleKeyDown} />

<div
	bind:this={stageContainer}
	class="relative h-full w-full bg-gray-100 {containerClass}"
	onwheel={handleWheel}
>
	{#if width > 0 && height > 0}
		<Stage
			onmount={(e: CustomEvent<{ node: Konva.Stage }>) => {
				stage = e.detail.node;
			}}
			{width}
			{height}
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseleave={handleMouseUp}
		>
			<Layer>
				<ImageLayer />
				<AnnotationLayer />
				<DrawingLayer />
			</Layer>
		</Stage>
	{/if}

	{#if $imageStore.isLoading}
		<div class="absolute inset-0 flex items-center justify-center bg-white/80">
			<div class="text-center">
				<div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
				<p class="mt-2 text-gray-600">Loading image...</p>
			</div>
		</div>
	{/if}

	{#if $imageStore.error}
		<div class="absolute inset-0 flex items-center justify-center bg-white/80">
			<div class="text-center text-red-600">
				<svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<p class="mt-2">{$imageStore.error}</p>
			</div>
		</div>
	{/if}
</div>
