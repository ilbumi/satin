<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect to images page since annotation requires an image ID
		goto('/images');
	});
</script>

<svelte:head>
	<title>Redirecting... - Satin</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<div
			class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
		></div>
		<p class="text-gray-600">Redirecting to image selection...</p>
	</div>
</div>
