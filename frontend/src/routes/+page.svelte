<script lang="ts">
	import AnnotationWorkspace from '$lib/components/AnnotationWorkspace.svelte';
	import Navigation from '$lib/components/Navigation.svelte';
</script>

<svelte:head>
	<title>SATIn - Image Annotation Tool</title>
	<meta
		name="description"
		content="Simple Annotation Tool for Images - Create bounding box annotations"
	/>
</svelte:head>

<Navigation />
<AnnotationWorkspace />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}

	:global(*) {
		box-sizing: border-box;
	}
</style>
