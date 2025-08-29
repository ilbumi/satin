<script lang="ts">
	import '../../../app.css';
	import { setContextClient } from '@urql/svelte';
	import { client } from '$lib/graphql/client';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	let { children } = $props();

	setContextClient(client);
</script>

<svelte:head>
	<title>Satin - Annotation</title>
</svelte:head>

<ErrorBoundary>
	<!-- Fullscreen layout without BaseLayout wrapper -->
	<div class="fixed inset-0 overflow-hidden bg-gray-50">
		{@render children?.()}
	</div>
	<ToastContainer />
</ErrorBoundary>
