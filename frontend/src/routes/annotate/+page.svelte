<script lang="ts">
	import AnnotationCanvas from '$lib/components/canvas/AnnotationCanvas.svelte';
	import ToolPanel from '$lib/components/tools/ToolPanel.svelte';
	import AnnotationList from '$lib/components/annotations/AnnotationList.svelte';
	import ImageUrlInput from '$lib/components/ImageUrlInput.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { imageStore, isImageLoaded } from '$lib/stores/image';
	import { annotationStore } from '$lib/stores/annotation';
	import { toolStore } from '$lib/stores/tool';
	import { AutoSaveManager } from '$lib/utils/autosave';
	import { addToast } from '$lib/stores/toast';

	let sidebarCollapsed = $state(false);
	let leftSidebarCollapsed = $state(false);
	let isMobile = $state(false);
	let autoSaveManager: AutoSaveManager;

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
			if (isMobile && !sidebarCollapsed) {
				sidebarCollapsed = true;
				leftSidebarCollapsed = true;
			}
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		// Initialize auto-save
		autoSaveManager = new AutoSaveManager(async (annotations) => {
			// TODO: Implement GraphQL mutation for batch save
			console.log('Would save annotations:', annotations);
			addToast({
				type: 'info',
				title: 'Auto-save',
				message: `${annotations.length} annotations saved`
			});
		}, 30000);

		autoSaveManager.start();

		return () => {
			window.removeEventListener('resize', checkMobile);
			autoSaveManager.stop();
		};
	});

	onDestroy(() => {
		// Clean up stores
		imageStore.clear();
		annotationStore.clearAll();
		toolStore.reset();
	});

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
	}

	function toggleLeftSidebar() {
		leftSidebarCollapsed = !leftSidebarCollapsed;
	}

	async function handleSaveAnnotations() {
		try {
			await autoSaveManager.forceSave();
			addToast({
				type: 'success',
				title: 'Saved',
				message: 'All annotations saved successfully'
			});
		} catch {
			addToast({
				type: 'error',
				title: 'Save Failed',
				message: 'Failed to save annotations'
			});
		}
	}
</script>

<svelte:head>
	<title>Annotate - Satin</title>
</svelte:head>

<div class="flex h-screen flex-col">
	<!-- Header -->
	<div class="flex items-center justify-between border-b bg-white px-4 py-3">
		<div class="flex items-center space-x-4">
			<button
				onclick={toggleLeftSidebar}
				class="rounded-lg p-2 transition-colors hover:bg-gray-100"
				aria-label="Toggle left sidebar"
			>
				<svg class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>
			<h1 class="text-xl font-bold text-gray-800">Image Annotation</h1>
		</div>

		<div class="flex items-center space-x-2">
			{#if $annotationStore.dirtyAnnotations.size > 0}
				<button
					onclick={handleSaveAnnotations}
					class="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2"
						/>
					</svg>
					<span>Save ({$annotationStore.dirtyAnnotations.size})</span>
				</button>
			{/if}

			{#if $annotationStore.lastSavedAt}
				<span class="text-xs text-gray-500">
					Last saved: {new Date($annotationStore.lastSavedAt).toLocaleTimeString()}
				</span>
			{/if}

			<button
				onclick={toggleSidebar}
				class="rounded-lg p-2 transition-colors hover:bg-gray-100"
				aria-label="Toggle right sidebar"
			>
				<svg class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Left Sidebar -->
		<div
			class="transition-all duration-300 {leftSidebarCollapsed ? 'w-0' : 'w-72'} overflow-hidden"
		>
			<div class="h-full w-72 space-y-4 overflow-y-auto border-r bg-gray-50 p-4">
				<ToolPanel />
				{#if !$isImageLoaded}
					<ImageUrlInput />
				{/if}
			</div>
		</div>

		<!-- Canvas Area -->
		<div class="flex-1 bg-gray-100">
			{#if $isImageLoaded}
				<AnnotationCanvas containerClass="h-full" />
			{:else}
				<div class="flex h-full items-center justify-center">
					<div class="text-center">
						<svg
							class="mx-auto mb-4 h-24 w-24 text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						<h3 class="mb-2 text-xl font-semibold text-gray-700">No Image Loaded</h3>
						<p class="mb-4 text-gray-500">Load an image URL to start annotating</p>

						{#if leftSidebarCollapsed}
							<button
								onclick={toggleLeftSidebar}
								class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
							>
								Open Image Loader
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Right Sidebar -->
		<div class="transition-all duration-300 {sidebarCollapsed ? 'w-0' : 'w-80'} overflow-hidden">
			<div class="h-full w-80 space-y-4 overflow-y-auto border-l bg-gray-50 p-4">
				<AnnotationList />

				<div class="rounded-lg bg-white p-4 shadow-md">
					<h3 class="mb-2 text-sm font-semibold text-gray-700">Keyboard Shortcuts</h3>
					<div class="space-y-1 text-xs text-gray-600">
						<div><kbd class="rounded bg-gray-100 px-1">V</kbd> Select tool</div>
						<div><kbd class="rounded bg-gray-100 px-1">B</kbd> Bounding box tool</div>
						<div><kbd class="rounded bg-gray-100 px-1">H</kbd> Pan tool</div>
						<div><kbd class="rounded bg-gray-100 px-1">Delete</kbd> Delete selected</div>
						<div><kbd class="rounded bg-gray-100 px-1">Ctrl+Z</kbd> Undo</div>
						<div><kbd class="rounded bg-gray-100 px-1">Ctrl+Y</kbd> Redo</div>
						<div><kbd class="rounded bg-gray-100 px-1">Esc</kbd> Cancel/Deselect</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
