<script lang="ts">
	import Counter from './Counter.svelte';
</script>

<svelte:head>
	<title>Satin App</title>
	<meta name="description" content="Satin application with counter" />
</svelte:head>

<main>
	<h1>Welcome to Satin</h1>
	<p>A simple SvelteKit application with interactive counter</p>
	
	<Counter />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		min-height: 100vh;
		justify-content: center;
		gap: 2rem;
	}

	h1 {
		color: #333;
		font-size: 2.5rem;
		margin: 0;
		text-align: center;
	}

	p {
		color: #666;
		font-size: 1.1rem;
		text-align: center;
		margin: 0;
	}
</style>
