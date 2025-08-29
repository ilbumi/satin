<script lang="ts">
	import AnnotationCanvas from '$lib/components/AnnotationCanvas.svelte';
	import AnnotationEditForm from '$lib/components/AnnotationEditForm.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { queryStore, getContextClient } from '@urql/svelte';
	import { GET_IMAGE, type GetImageQuery } from '$lib/graphql/operations/images';
	import {
		GET_ANNOTATIONS_BY_IMAGE,
		type GetAnnotationsByImageQuery
	} from '$lib/graphql/operations/annotations';
	import { goto } from '$app/navigation';

	interface BoundingBox {
		id: string;
		x: number;
		y: number;
		width: number;
		height: number;
		description?: string;
		tags: string[];
		confidence?: number;
		createdAt: string;
		updatedAt: string;
	}

	let annotations = $state<BoundingBox[]>([]);
	let selectedAnnotationId = $state<string | null>(null);
	let editingAnnotationId = $state<string | null>(null);
	let canvasRef: AnnotationCanvas | undefined = $state();
	let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');

	// Get image ID from route parameters
	let imageId = $derived(page.params.imageId);

	// GraphQL client and queries
	const client = getContextClient();

	// Create reactive queries that update when imageId changes
	let imageQuery = $state<ReturnType<typeof queryStore<GetImageQuery>>>();
	let annotationsQuery = $state<ReturnType<typeof queryStore<GetAnnotationsByImageQuery>>>();

	$effect(() => {
		imageQuery = queryStore<GetImageQuery>({
			query: GET_IMAGE,
			variables: { id: imageId },
			client
		});

		annotationsQuery = queryStore<GetAnnotationsByImageQuery>({
			query: GET_ANNOTATIONS_BY_IMAGE,
			variables: { imageId: imageId },
			client
		});
	});

	// Reactive data from GraphQL
	let image = $derived(imageQuery ? $imageQuery!.data?.image || null : null);
	let backendAnnotations = $derived(
		annotationsQuery ? $annotationsQuery!.data?.annotationsByImage || [] : []
	);
	let loading = $derived(
		(imageQuery ? $imageQuery!.fetching : false) ||
			(annotationsQuery ? $annotationsQuery!.fetching : false)
	);
	let error = $derived(
		(imageQuery ? $imageQuery!.error : null) || (annotationsQuery ? $annotationsQuery!.error : null)
	);

	// Sync backend annotations to local annotations array for sidebar display
	$effect(() => {
		if (backendAnnotations && backendAnnotations.length > 0 && annotations.length === 0) {
			annotations = backendAnnotations.map((ann) => ({
				id: ann.id,
				x: ann.boundingBox.x,
				y: ann.boundingBox.y,
				width: ann.boundingBox.width,
				height: ann.boundingBox.height,
				description: ann.description,
				tags: ann.tags,
				confidence: ann.confidence,
				createdAt: ann.createdAt,
				updatedAt: ann.updatedAt
			}));
		}
	});

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	function handleAnnotationsChange(newAnnotations: BoundingBox[]) {
		annotations = newAnnotations;
	}

	function selectAnnotation(annotationId: string) {
		selectedAnnotationId = annotationId;
		canvasRef?.selectAnnotationById(annotationId);
	}

	function handleSaveStatusChange(status: 'idle' | 'saving' | 'saved' | 'error') {
		saveStatus = status;
	}

	function deleteAnnotation(annotationId: string) {
		canvasRef?.deleteAnnotationById(annotationId);
		// Close edit mode if we're deleting the annotation being edited
		if (editingAnnotationId === annotationId) {
			editingAnnotationId = null;
		}
		// Annotations will be updated via the change callback
	}

	function startEditingAnnotation(annotationId: string) {
		editingAnnotationId = annotationId;
		selectedAnnotationId = annotationId;
		canvasRef?.selectAnnotationById(annotationId);
	}

	function stopEditingAnnotation() {
		editingAnnotationId = null;
	}

	function handleAnnotationSave(updatedAnnotation: BoundingBox) {
		// Update the local annotations array with the saved data
		annotations = annotations.map((ann) =>
			ann.id === updatedAnnotation.id ? updatedAnnotation : ann
		);
		editingAnnotationId = null;
	}

	function handleDoubleClickAnnotation(annotationId: string) {
		startEditingAnnotation(annotationId);
	}

	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		// Don't trigger shortcuts when typing in inputs
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			return;
		}

		switch (event.key.toLowerCase()) {
			case 'e':
				if (selectedAnnotationId && editingAnnotationId !== selectedAnnotationId) {
					event.preventDefault();
					startEditingAnnotation(selectedAnnotationId);
				}
				break;
			case 'escape':
				if (editingAnnotationId) {
					stopEditingAnnotation();
				} else if (selectedAnnotationId) {
					selectedAnnotationId = null;
					canvasRef?.selectAnnotationById(''); // Clear selection
				}
				break;
			case 'tab':
				event.preventDefault();
				if (annotations.length > 0) {
					const currentIndex = selectedAnnotationId
						? annotations.findIndex((ann) => ann.id === selectedAnnotationId)
						: -1;
					const nextIndex = (currentIndex + 1) % annotations.length;
					selectAnnotation(annotations[nextIndex].id);
				}
				break;
		}
	}
</script>

<svelte:head>
	<title
		>{image ? `Annotate ${new URL(image.url).pathname.split('/').pop()}` : 'Loading...'} - Satin</title
	>
</svelte:head>

<!-- Fullscreen container with flex layout -->
<div class="flex h-full w-full flex-col">
	<!-- Slim toolbar at the top -->
	<div
		class="flex h-12 w-full items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm"
	>
		<div class="flex items-center gap-3">
			<!-- Back button -->
			<button
				onclick={() => goto('/images')}
				class="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
				title="Back to Images (Alt+←)"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
				<span class="hidden sm:inline">Back</span>
			</button>

			<!-- Image name -->
			{#if image}
				<div class="flex items-center gap-2">
					<span class="text-sm font-medium text-gray-700">
						{new URL(image.url).pathname.split('/').pop()}
					</span>
					<span class="text-xs text-gray-500">•</span>
					<span class="text-xs text-gray-500">{image.status}</span>
				</div>
			{/if}
		</div>

		<!-- Center space -->
		<div class="flex-1"></div>

		<!-- Right side tools -->
		<div class="flex items-center gap-3">
			<!-- Mode Toggle -->
			<div class="flex rounded-md border border-gray-200">
				<button
					onclick={() => canvasRef?.setMode && canvasRef.setMode('select')}
					class="rounded-l-md px-3 py-1 text-sm font-medium transition-colors"
					class:bg-blue-600={canvasRef?.getMode && canvasRef.getMode() === 'select'}
					class:text-white={canvasRef?.getMode && canvasRef.getMode() === 'select'}
					class:text-gray-700={!canvasRef?.getMode || canvasRef.getMode() !== 'select'}
					class:hover:bg-gray-100={!canvasRef?.getMode || canvasRef.getMode() !== 'select'}
					title="Select Mode (S)"
				>
					Select
				</button>
				<button
					onclick={() => canvasRef?.setMode && canvasRef.setMode('draw')}
					class="rounded-r-md px-3 py-1 text-sm font-medium transition-colors"
					class:bg-blue-600={canvasRef?.getMode && canvasRef.getMode() === 'draw'}
					class:text-white={canvasRef?.getMode && canvasRef.getMode() === 'draw'}
					class:text-gray-700={!canvasRef?.getMode || canvasRef.getMode() !== 'draw'}
					class:hover:bg-gray-100={!canvasRef?.getMode || canvasRef.getMode() !== 'draw'}
					title="Draw Mode (D)"
				>
					Draw
				</button>
			</div>

			<!-- Save Status -->
			<div class="flex items-center gap-2">
				{#if saveStatus === 'saving'}
					<div
						class="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
					></div>
					<span class="text-xs text-gray-600">Saving...</span>
				{:else if saveStatus === 'saved'}
					<svg class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span class="text-xs text-green-600">Saved</span>
				{:else if saveStatus === 'error'}
					<svg class="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
					<span class="text-xs text-red-600">Error</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Main content area -->
	<div class="relative flex w-full flex-1 overflow-hidden">
		{#if error}
			<!-- Error State -->
			<div class="flex flex-1 items-center justify-center bg-gray-50">
				<div class="text-center">
					<svg
						class="mx-auto mb-4 h-16 w-16 text-red-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
						/>
					</svg>
					<h3 class="mb-2 text-lg font-semibold text-red-800">Failed to load image</h3>
					<p class="mb-4 text-red-600">{error.message}</p>
					<div class="space-x-4">
						<button
							onclick={() => imageQuery?.reexecute({ requestPolicy: 'network-only' })}
							class="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
						>
							Try Again
						</button>
						<button
							onclick={() => goto('/images')}
							class="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
						>
							Back to Images
						</button>
					</div>
				</div>
			</div>
		{:else if loading}
			<!-- Loading State -->
			<div class="flex flex-1 items-center justify-center bg-gray-50">
				<div class="flex items-center space-x-4">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
					></div>
					<span class="text-lg text-gray-600">Loading image...</span>
				</div>
			</div>
		{:else if !image}
			<!-- Image not found -->
			<div class="flex flex-1 items-center justify-center bg-gray-50">
				<div class="text-center">
					<svg
						class="mx-auto mb-4 h-16 w-16 text-yellow-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0012 15c-2.34 0-4.47-.881-6.08-2.33l-.147-.15A7.969 7.969 0 005 10.5C5 5.813 8.813 2 13.5 2S22 5.813 22 10.5c0 1.537-.43 2.976-1.177 4.201l-1.653 2.713a1 1 0 01-1.708-1.04l1.654-2.714A5.972 5.972 0 0020 10.5C20 6.916 17.084 4 13.5 4S7 6.916 7 10.5c0 1.537.43 2.976 1.177 4.201l1.653 2.713a1 1 0 001.708-1.04l-1.654-2.714A5.972 5.972 0 0112 15c-2.34 0-4.47-.881-6.08-2.33l-.147-.15A7.969 7.969 0 005 10.5C5 5.813 8.813 2 13.5 2S22 5.813 22 10.5c0 1.537-.43 2.976-1.177 4.201l-1.653 2.713a1 1 0 01-1.708-1.04l1.654-2.714A5.972 5.972 0 0020 10.5C20 6.916 17.084 4 13.5 4S7 6.916 7 10.5"
						/>
					</svg>
					<h3 class="mb-2 text-lg font-semibold text-yellow-800">Image not found</h3>
					<p class="mb-4 text-yellow-600">
						The image you're looking for doesn't exist or has been deleted.
					</p>
					<button
						onclick={() => goto('/images')}
						class="rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
					>
						Back to Images
					</button>
				</div>
			</div>
		{:else}
			<!-- Main Canvas Area (full width minus sidebar) -->
			<div class="flex-1 bg-gray-100 p-2">
				<AnnotationCanvas
					bind:this={canvasRef}
					imageUrl={image.url}
					imageId={image.id}
					initialAnnotations={backendAnnotations}
					onAnnotationsChange={handleAnnotationsChange}
					onSaveStatusChange={handleSaveStatusChange}
					onDoubleClickAnnotation={handleDoubleClickAnnotation}
					responsive={true}
				/>
			</div>

			<!-- Fixed Sidebar -->
			<div class="w-64 overflow-y-auto border-l border-gray-200 bg-white">
				<div class="space-y-4 p-4">
					<!-- Annotations header -->
					<div>
						<h3 class="text-lg font-semibold text-gray-800">Annotations ({annotations.length})</h3>
					</div>

					<!-- Annotations List -->
					<div>
						{#if annotations.length === 0}
							<div class="py-8 text-center text-sm text-gray-500">
								No annotations yet.<br />Draw boxes on the image to annotate.
							</div>
						{:else}
							<div class="max-h-[calc(100vh-200px)] space-y-2 overflow-y-auto">
								{#each annotations as annotation (annotation.id)}
									{#if editingAnnotationId === annotation.id}
										<!-- Edit Form -->
										<AnnotationEditForm
											{annotation}
											onSave={handleAnnotationSave}
											onCancel={stopEditingAnnotation}
										/>
									{:else}
										<!-- Normal Annotation Display -->
										<div
											class="cursor-pointer rounded border p-2 transition-colors {selectedAnnotationId ===
											annotation.id
												? 'border-blue-500 bg-blue-50'
												: 'border-gray-200 hover:border-gray-300'}"
											onclick={() => selectAnnotation(annotation.id)}
											onkeydown={(e) => e.key === 'Enter' && selectAnnotation(annotation.id)}
											role="button"
											tabindex="0"
										>
											<div class="mb-1 flex items-center justify-between">
												<span class="truncate text-xs font-medium">
													{annotation.description || 'Unnamed'}
												</span>
												<div class="flex gap-0.5">
													<button
														onclick={(e) => {
															e.stopPropagation();
															startEditingAnnotation(annotation.id);
														}}
														class="p-0.5 text-blue-500 hover:text-blue-700"
														title="Edit (E)"
														aria-label="Edit annotation"
													>
														<svg
															class="h-3 w-3"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
															/>
														</svg>
													</button>
													<button
														onclick={(e) => {
															e.stopPropagation();
															deleteAnnotation(annotation.id);
														}}
														class="p-0.5 text-red-500 hover:text-red-700"
														title="Delete (Del)"
														aria-label="Delete annotation"
													>
														<svg
															class="h-3 w-3"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
															/>
														</svg>
													</button>
												</div>
											</div>

											{#if annotation.tags && annotation.tags.length > 0}
												<div class="mb-1 flex flex-wrap gap-1">
													{#each annotation.tags as tag (tag)}
														<span
															class="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600"
														>
															{tag}
														</span>
													{/each}
												</div>
											{/if}

											<div class="text-xs text-gray-500">
												{Math.round(annotation.width)}×{Math.round(annotation.height)}
												{#if annotation.confidence}
													• {Math.round(annotation.confidence * 100)}%
												{/if}
											</div>
										</div>
									{/if}
								{/each}
							</div>
						{/if}
					</div>

					<!-- Quick help (collapsed by default) -->
					<details class="mt-4 border-t border-gray-200 pt-4">
						<summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-800"
							>Keyboard Shortcuts</summary
						>
						<div class="mt-2 space-y-1 text-xs text-gray-500">
							<div>
								<kbd class="rounded bg-gray-100 px-1">S</kbd> /
								<kbd class="rounded bg-gray-100 px-1">D</kbd> - Select/Draw
							</div>
							<div><kbd class="rounded bg-gray-100 px-1">E</kbd> - Edit selected</div>
							<div><kbd class="rounded bg-gray-100 px-1">Del</kbd> - Delete selected</div>
							<div><kbd class="rounded bg-gray-100 px-1">Esc</kbd> - Clear selection</div>
						</div>
					</details>
				</div>
			</div>
		{/if}
	</div>
</div>
