<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import LoadingButton from '$lib/components/LoadingButton.svelte';
	import { onMount } from 'svelte';

	let sidebarCollapsed = $state(false);
	let isMobile = $state(false);
	let imageUploading = $state(false);

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

	function handleUploadImage() {
		imageUploading = true;
		// Simulate upload delay
		setTimeout(() => {
			imageUploading = false;
		}, 2000);
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
			<div class="aspect-video rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
				<div class="flex h-full items-center justify-center text-center">
					<div>
						<svg
							class="mx-auto mb-4 h-16 w-16 text-gray-400"
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
						<h3 class="mb-2 text-lg font-semibold text-gray-700">No Image Loaded</h3>
						<p class="text-gray-500">Upload an image to start annotating</p>
						<div class="mt-4">
							<LoadingButton loading={imageUploading} onclick={handleUploadImage}>
								Upload Image
							</LoadingButton>
						</div>
					</div>
				</div>
			</div>
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
						<div class="mt-2 text-xs text-gray-400">
							Additional tools (points, polygons) coming in future updates
						</div>
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
					<h3 class="mb-4 text-lg font-semibold">Annotations</h3>
					<div class="text-sm text-gray-500">No annotations yet</div>
				</div>
			</div>
		</Sidebar>
	</div>
</div>
