<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/projects');
	});
</script>

<svelte:head>
	<title>SATIn - Image Annotation Tool</title>
	<meta
		name="description"
		content="Simple Annotation Tool for Images - Create bounding box annotations"
	/>
</svelte:head>

<div class="loading-redirect">
	<div class="spinner"></div>
	<p>Redirecting to projects...</p>
</div>

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

	.loading-redirect {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background-color: #f8fafc;
		color: #64748b;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e2e8f0;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
