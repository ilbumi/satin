<script lang="ts">
	import { Button, Spinner } from '$lib/components/ui';
	import ProjectCard from './ProjectCard.svelte';
	import type { ProjectSummary } from '$lib/features/projects/types';

	interface Props {
		projects: ProjectSummary[];
		loading?: boolean;
		error?: string | null;
		onCreateProject?: () => void;
		onEditProject?: (project: ProjectSummary) => void;
		onDeleteProject?: (project: ProjectSummary) => void;
		onRetry?: () => void;
	}

	let {
		projects,
		loading = false,
		error = null,
		onCreateProject,
		onEditProject,
		onDeleteProject,
		onRetry
	}: Props = $props();

	const isEmpty = $derived(projects.length === 0 && !loading);
</script>

{#if loading}
	<div class="flex items-center justify-center py-12">
		<Spinner size="lg" />
		<span class="ml-3 text-gray-600">Loading projects...</span>
	</div>
{:else if projects.length > 0}
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each projects as project (project.id)}
			<ProjectCard {project} onEdit={onEditProject} onDelete={onDeleteProject} />
		{/each}
	</div>
{:else if error}
	<div class="py-12 text-center">
		<div class="mb-4 text-6xl">⚠️</div>
		<h3 class="mb-2 text-lg font-medium text-gray-900">Error loading projects</h3>
		<p class="mb-6 text-gray-600">{error}</p>
		{#if onRetry}
			<Button variant="primary" onclick={onRetry}>Try Again</Button>
		{/if}
	</div>
{:else if isEmpty}
	<div class="py-12 text-center">
		<div class="mb-4 text-6xl">📁</div>
		<h3 class="mb-2 text-lg font-medium text-gray-900">No projects yet</h3>
		<p class="mb-6 text-gray-600">Create your first annotation project to get started</p>
		{#if onCreateProject}
			<Button variant="primary" onclick={onCreateProject}>
				<span class="mr-2">➕</span>
				Create Project
			</Button>
		{/if}
	</div>
{/if}
