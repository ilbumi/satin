<script lang="ts">
	import LoadingButton from '$lib/components/LoadingButton.svelte';

	let exporting = $state(false);

	function handleExport() {
		exporting = true;
		setTimeout(() => {
			exporting = false;
		}, 3000);
	}
</script>

<svelte:head>
	<title>Export - Satin</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<h1 class="mb-8 text-3xl font-bold text-gray-800">Export Annotations</h1>

	<div class="space-y-6">
		<!-- Export Settings -->
		<div class="rounded-lg bg-white p-6 shadow">
			<h2 class="mb-4 text-xl font-semibold">Export Settings</h2>
			<div class="space-y-4">
				<div>
					<div class="block text-sm font-medium text-gray-700">Export Format</div>
					<div class="mt-2">
						<div class="text-sm text-gray-900">Custom JSON</div>
						<div class="text-xs text-gray-500">Optimized format for ML training data</div>
					</div>
				</div>
				<div>
					<label class="flex items-center">
						<input type="checkbox" class="mr-2" checked />
						Include image metadata
					</label>
				</div>
				<div>
					<label class="flex items-center">
						<input type="checkbox" class="mr-2" />
						Include empty images
					</label>
				</div>
				<div>
					<label for="tag-filter" class="block text-sm font-medium text-gray-700"
						>Filter by Tags</label
					>
					<input
						id="tag-filter"
						type="text"
						placeholder="Enter tag names separated by commas"
						class="mt-1 block w-full rounded-md border-gray-300"
					/>
				</div>
			</div>
		</div>

		<!-- Export Status -->
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="text-center">
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
						d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				<h3 class="mb-2 text-lg font-semibold text-gray-700">Ready to Export</h3>
				<p class="mb-4 text-gray-500">No annotations available to export yet</p>
				<LoadingButton loading={exporting} disabled={true} onclick={handleExport}>
					Export Annotations
				</LoadingButton>
			</div>
		</div>
	</div>
</div>
