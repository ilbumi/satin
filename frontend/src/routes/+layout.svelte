<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { setContextClient } from '@urql/svelte';
	import { graphqlClient } from '$lib/core/api/client';

	let { children } = $props();

	// Set up the GraphQL client for all child components
	setContextClient(graphqlClient);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
