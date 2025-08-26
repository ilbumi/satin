<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import AnnotationCanvas from '$lib/components/AnnotationCanvas.svelte';
	import { onMount } from 'svelte';

	interface BoundingBox {
		id: string;
		x: number;
		y: number;
		width: number;
		height: number;
		label?: string;
		createdAt: string;
		updatedAt: string;
	}

	let sidebarCollapsed = $state(false);
	let isMobile = $state(false);
	let annotations = $state<BoundingBox[]>([]);
	let selectedAnnotationId = $state<string | null>(null);
	let canvasRef: AnnotationCanvas | undefined = $state();

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
			// Auto-collapse sidebar on mobile by default
			if (isMobile && !sidebarCollapsed) {
				sidebarCollapsed = true;
			}
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
	}

	function handleAnnotationsChange(newAnnotations: BoundingBox[]) {
		annotations = newAnnotations;
	}

	function selectAnnotation(annotationId: string) {
		selectedAnnotationId = annotationId;
		canvasRef?.selectAnnotationById(annotationId);
	}

	function deleteAnnotation(annotationId: string) {
		canvasRef?.deleteAnnotationById(annotationId);
		// Annotations will be updated via the change callback
	}
</script>

<svelte:head>
	<title>Annotate - Satin</title>
</svelte:head>

<div class="max-w-full">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-800">Image Annotation</h1>

		<!-- Mobile Sidebar Toggle -->
		<button
			onclick={toggleSidebar}
			class="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 md:hidden"
			aria-label="Toggle sidebar"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16"
				/>
			</svg>
		</button>
	</div>

	<div class="flex gap-6">
		<!-- Main Canvas Area -->
		<div class="flex-1">
			<AnnotationCanvas
				bind:this={canvasRef}
				imageUrl="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
				onAnnotationsChange={handleAnnotationsChange}
			/>
		</div>

		<!-- Sidebar -->
		<Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar}>
			<div class="space-y-6 p-6">
				<!-- Annotation Tools -->
				<div>
					<h3 class="mb-4 text-lg font-semibold">Annotation Tools</h3>
					<div class="space-y-2">
						<button
							class="w-full rounded border border-blue-200 bg-blue-50 p-2 text-left hover:bg-blue-100"
						>
							🔲 Bounding Box
						</button>
					</div>
				</div>

				<!-- Labels -->
				<div>
					<h3 class="mb-4 text-lg font-semibold">Labels</h3>
					<div class="space-y-2">
						<div class="text-sm text-gray-500">No labels defined</div>
						<button class="text-sm text-blue-600 hover:underline"> + Add Label </button>
					</div>
				</div>

				<!-- Annotations List -->
				<div>
					<h3 class="mb-4 text-lg font-semibold">Annotations ({annotations.length})</h3>
					{#if annotations.length === 0}
						<div class="text-sm text-gray-500">No annotations yet</div>
					{:else}
						<div class="space-y-2">
							{#each annotations as annotation (annotation.id)}
								<div
									class="cursor-pointer rounded border p-3 transition-colors {selectedAnnotationId ===
									annotation.id
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-200 hover:border-gray-300'}"
									onclick={() => selectAnnotation(annotation.id)}
									onkeydown={(e) => e.key === 'Enter' && selectAnnotation(annotation.id)}
									role="button"
									tabindex="0"
								>
									<div class="mb-2 flex items-center justify-between">
										<span class="text-sm font-medium">
											{annotation.label || 'Unlabeled'}
										</span>
										<button
											onclick={(e) => {
												e.stopPropagation();
												deleteAnnotation(annotation.id);
											}}
											class="text-xs text-red-500 hover:text-red-700"
											title="Delete annotation"
										>
											🗑️
										</button>
									</div>
									<div class="text-xs text-gray-600">
										{Math.round(annotation.width)}×{Math.round(annotation.height)}
										at ({Math.round(annotation.x)}, {Math.round(annotation.y)})
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</Sidebar>
	</div>
</div>
