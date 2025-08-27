<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { setContextClient } from '@urql/svelte';
	import { client } from '$lib/graphql/client';
	import BaseLayout from '$lib/components/BaseLayout.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import { setupNavigationShortcuts, cleanupNavigationShortcuts } from '$lib/utils/keyboard';
	import { onMount, onDestroy } from 'svelte';

	let { children } = $props();

	setContextClient(client);

	onMount(() => {
		setupNavigationShortcuts();
	});

	onDestroy(() => {
		cleanupNavigationShortcuts();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ErrorBoundary>
	<BaseLayout>
		{@render children?.()}
	</BaseLayout>
	<ToastContainer />
</ErrorBoundary>
