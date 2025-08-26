<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import AnnotationCanvas from '$lib/components/AnnotationCanvas.svelte';
	import AnnotationEditForm from '$lib/components/AnnotationEditForm.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
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

	let sidebarCollapsed = $state(false);
	let isMobile = $state(false);
	let annotations = $state<BoundingBox[]>([]);
	let selectedAnnotationId = $state<string | null>(null);
	let editingAnnotationId = $state<string | null>(null);
	let canvasRef: AnnotationCanvas | undefined = $state();
	let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');

	// Get image ID from route parameters
	let imageId = $derived($page.params.imageId);

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
		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('resize', checkMobile);
			window.removeEventListener('keydown', handleKeydown);
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

<div class="max-w-full">
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<!-- Back button -->
			<button
				onclick={() => goto('/images')}
				class="flex items-center space-x-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200"
				title="Back to Images"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
				<span class="hidden sm:block">Back</span>
			</button>

			<div>
				<h1 class="text-3xl font-bold text-gray-800">Image Annotation</h1>
				{#if image}
					<p class="mt-1 text-sm text-gray-600">
						{new URL(image.url).pathname.split('/').pop()} • {image.status}
					</p>
				{/if}
			</div>

			<!-- Save Status and Controls -->
			<div class="flex items-center space-x-3">
				<!-- Save Status -->
				{#if saveStatus === 'saving'}
					<div class="flex items-center space-x-2 text-sm text-gray-600">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
						></div>
						<span>Saving...</span>
					</div>
				{:else if saveStatus === 'saved'}
					<div class="flex items-center space-x-2 text-sm text-green-600">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<span>Saved</span>
					</div>
				{:else if saveStatus === 'error'}
					<div class="flex items-center space-x-2 text-sm text-red-600">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
						<span>Error saving</span>
					</div>
				{/if}
			</div>
		</div>

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

	<!-- Error State -->
	{#if error}
		<div class="rounded-lg bg-red-50 p-8 text-center">
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
	{:else if loading}
		<!-- Loading State -->
		<div class="flex items-center justify-center p-8">
			<div class="flex items-center space-x-4">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
				></div>
				<span class="text-lg text-gray-600">Loading image...</span>
			</div>
		</div>
	{:else if !image}
		<!-- Image not found -->
		<div class="rounded-lg bg-yellow-50 p-8 text-center">
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
					d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0012 15c-2.34 0-4.47-.881-6.08-2.33l-.147-.15A7.969 7.969 0 005 10.5C5 5.813 8.813 2 13.5 2S22 5.813 22 10.5c0 1.537-.43 2.976-1.177 4.201l-1.653 2.713a1 1 0 01-1.708-1.04l1.654-2.714A5.972 5.972 0 0020 10.5C20 6.916 17.084 4 13.5 4S7 6.916 7 10.5c0 1.537.43 2.976 1.177 4.201l1.653 2.713a1 1 0 001.708-1.04l-1.654-2.714A5.972 5.972 0 0112 15c-2.34 0-4.47-.881-6.08-2.33l-.147-.15A7.969 7.969 0 015 10.5C5 5.813 8.813 2 13.5 2S22 5.813 22 10.5c0 1.537-.43 2.976-1.177 4.201l-1.653 2.713a1 1 0 01-1.708-1.04l1.654-2.714A5.972 5.972 0 0020 10.5C20 6.916 17.084 4 13.5 4S7 6.916 7 10.5"
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
	{:else}
		<!-- Main Content -->
		<div class="flex gap-6">
			<!-- Main Canvas Area -->
			<div class="flex-1">
				<AnnotationCanvas
					bind:this={canvasRef}
					imageUrl={image.url}
					imageId={image.id}
					initialAnnotations={backendAnnotations}
					onAnnotationsChange={handleAnnotationsChange}
					onSaveStatusChange={handleSaveStatusChange}
					onDoubleClickAnnotation={handleDoubleClickAnnotation}
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
													{annotation.description || 'No description'}
												</span>
												<div class="flex gap-1">
													<button
														onclick={(e) => {
															e.stopPropagation();
															startEditingAnnotation(annotation.id);
														}}
														class="text-xs text-blue-500 hover:text-blue-700"
														title="Edit annotation (E)"
													>
														✏️
													</button>
													<button
														onclick={(e) => {
															e.stopPropagation();
															deleteAnnotation(annotation.id);
														}}
														class="text-xs text-red-500 hover:text-red-700"
														title="Delete annotation (Delete)"
													>
														🗑️
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

											<div class="text-xs text-gray-600">
												{Math.round(annotation.width)}×{Math.round(annotation.height)}
												at ({Math.round(annotation.x)}, {Math.round(annotation.y)})
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

					<!-- Keyboard Shortcuts -->
					<div>
						<h3 class="mb-4 text-lg font-semibold">Keyboard Shortcuts</h3>
						<div class="space-y-1 text-xs text-gray-600">
							<div>
								<kbd class="rounded bg-gray-100 px-1">S</kbd> /
								<kbd class="rounded bg-gray-100 px-1">D</kbd> - Select / Draw mode
							</div>
							<div><kbd class="rounded bg-gray-100 px-1">E</kbd> - Edit selected annotation</div>
							<div><kbd class="rounded bg-gray-100 px-1">Tab</kbd> - Navigate annotations</div>
							<div>
								<kbd class="rounded bg-gray-100 px-1">Esc</kbd> - Cancel edit / Clear selection
							</div>
							<div>
								<kbd class="rounded bg-gray-100 px-1">Del</kbd> - Delete selected annotation
							</div>
						</div>
					</div>
				</div>
			</Sidebar>
		</div>
	{/if}
</div>
