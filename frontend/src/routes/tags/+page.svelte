<script lang="ts">
	import TagHierarchy from '$lib/components/TagHierarchy.svelte';
</script>

<svelte:head>
	<title>Tags - Satin</title>
</svelte:head>

<div class="mx-auto max-w-7xl">
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">Tags</h1>
			<p class="mt-2 text-gray-600">Manage your tag hierarchy for annotations</p>
		</div>
	</div>

	<!-- Tag Hierarchy -->
	<div class="mb-6">
		<TagHierarchy />
	</div>
</div>
