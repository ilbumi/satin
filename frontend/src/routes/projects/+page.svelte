<script lang="ts">
	import { onMount } from 'svelte';
	import { client } from '$lib/graphql/client';
	import { GET_PROJECTS } from '$lib/graphql/queries';
	import type { Project } from '$lib/graphql/types';
	import Navigation from '$lib/components/Navigation.svelte';

	let projects: Project[] = $state([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const result = await client.query(GET_PROJECTS, { limit: 20, offset: 0 }).toPromise();
			if (result.data?.projects) {
				projects = result.data.projects.objects;
			}
			if (result.error) {
				error = result.error.message;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	});

	function createNewProject() {
		// TODO: Implement project creation
		alert('Create new project functionality coming soon!');
	}
</script>

<svelte:head>
	<title>Projects - SATIn</title>
	<meta name="description" content="Manage your annotation projects" />
</svelte:head>

<Navigation />

<div class="projects-page">
	<header class="page-header">
		<h1>Projects</h1>
		<button class="create-button" onclick={createNewProject}>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
				<path d="M8 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 1.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM8 5a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 8 5Z"/>
			</svg>
			New Project
		</button>
	</header>

	<main class="projects-content">
		{#if loading}
			<div class="loading-state">
				<div class="spinner"></div>
				<p>Loading projects...</p>
			</div>
		{:else if error}
			<div class="error-state">
				<svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
					<path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16ZM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646Z"/>
				</svg>
				<h2>Error Loading Projects</h2>
				<p>{error}</p>
				<button onclick={() => window.location.reload()}>Try Again</button>
			</div>
		{:else if projects.length === 0}
			<div class="empty-state">
				<svg width="64" height="64" viewBox="0 0 16 16" fill="currentColor">
					<path d="M14 1.5A1.5 1.5 0 0 0 12.5 0h-9A1.5 1.5 0 0 0 2 1.5V14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V1.5ZM4 2.5v11A.5.5 0 0 1 3.5 13h-.5a.5.5 0 0 1-.5-.5V3a1 1 0 0 1 1-1h.5a.5.5 0 0 1 .5.5Zm8 0A.5.5 0 0 1 11.5 2h-6A.5.5 0 0 1 5 2.5v10A.5.5 0 0 1 5.5 13h6a.5.5 0 0 1 .5-.5v-10Z"/>
				</svg>
				<h2>No Projects Yet</h2>
				<p>Create your first annotation project to get started.</p>
				<button class="primary-button" onclick={createNewProject}>Create First Project</button>
			</div>
		{:else}
			<div class="projects-grid">
				{#each projects as project (project.id)}
					<div class="project-card">
						<div class="project-header">
							<h3>{project.name}</h3>
							<button class="menu-button" aria-label="Project options">
								<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
									<path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/>
								</svg>
							</button>
						</div>
						<p class="project-description">{project.description}</p>
						<div class="project-stats">
							<span class="stat">
								<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
									<path d="M8 1.5A1.5 1.5 0 0 0 6.5 0h-3A1.5 1.5 0 0 0 2 1.5V14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V1.5A1.5 1.5 0 0 0 12.5 0h-3A1.5 1.5 0 0 0 8 1.5Z"/>
								</svg>
								0 images
							</span>
							<span class="stat">
								<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
									<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
								</svg>
								0 annotations
							</span>
						</div>
						<div class="project-actions">
							<button class="action-button secondary">
								<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
									<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
								</svg>
								View
							</button>
							<button class="action-button primary">
								<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
									<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
								</svg>
								Annotate
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	.projects-page {
		min-height: 100vh;
		background-color: #f8fafc;
		padding: 2rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		max-width: 1200px;
		margin-left: auto;
		margin-right: auto;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
	}

	.create-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.create-button:hover {
		background-color: #2563eb;
	}

	.projects-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		text-align: center;
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
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-state svg,
	.empty-state svg {
		margin-bottom: 1rem;
		color: #94a3b8;
	}

	.error-state h2,
	.empty-state h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 0.5rem 0;
	}

	.error-state p,
	.empty-state p {
		margin: 0 0 1.5rem 0;
		max-width: 400px;
	}

	.primary-button {
		padding: 0.75rem 1.5rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.primary-button:hover {
		background-color: #2563eb;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.project-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e2e8f0;
		transition: all 0.2s;
	}

	.project-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.project-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.project-header h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
		line-height: 1.3;
	}

	.menu-button {
		background: none;
		border: none;
		color: #64748b;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.menu-button:hover {
		background-color: #f1f5f9;
		color: #1e293b;
	}

	.project-description {
		color: #64748b;
		margin: 0 0 1rem 0;
		line-height: 1.5;
	}

	.project-stats {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: #64748b;
		font-size: 0.875rem;
	}

	.project-actions {
		display: flex;
		gap: 0.75rem;
	}

	.action-button {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		flex: 1;
		justify-content: center;
	}

	.action-button.secondary {
		background: white;
		color: #64748b;
	}

	.action-button.secondary:hover {
		background-color: #f8fafc;
		color: #1e293b;
		border-color: #cbd5e1;
	}

	.action-button.primary {
		background-color: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.action-button.primary:hover {
		background-color: #2563eb;
		border-color: #2563eb;
	}

	@media (max-width: 768px) {
		.projects-page {
			padding: 1rem;
		}

		.page-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.projects-grid {
			grid-template-columns: 1fr;
		}

		.project-actions {
			flex-direction: column;
		}
	}
</style>
