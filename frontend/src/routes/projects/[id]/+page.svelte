<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { Button, Card, Spinner, Toast } from '$lib/components/ui';
	import { EditProjectModal } from '$lib/components/projects';
	import { projectService } from '$lib/features/projects/service';
	import type { Project } from '$lib/graphql/generated/graphql';
	import type { UpdateProjectForm, ProjectSummary } from '$lib/features/projects/types';

	// Get project ID from the route parameters
	const projectId = page.params.id;

	let project = $state<Project | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showEditModal = $state(false);
	let showToast = $state(false);
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error'>('success');

	function showSuccessToast(message: string) {
		toastMessage = message;
		toastType = 'success';
		showToast = true;
	}

	function showErrorToast(message: string) {
		toastMessage = message;
		toastType = 'error';
		showToast = true;
	}

	async function loadProject() {
		try {
			loading = true;
			error = null;

			if (!projectId) {
				error = 'Project ID is required';
				return;
			}

			project = await projectService.getProject(projectId);

			if (!project) {
				error = 'Project not found';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load project';
			console.error('Failed to load project:', err);
		} finally {
			loading = false;
		}
	}

	function handleEditProject() {
		showEditModal = true;
	}

	async function handleEditSubmit(data: UpdateProjectForm) {
		try {
			const updatedProject = await projectService.updateProject(data);
			if (updatedProject) {
				project = updatedProject;
				showSuccessToast('Project updated successfully');
			} else {
				showErrorToast('Failed to update project');
			}
		} catch (error) {
			showErrorToast(error instanceof Error ? error.message : 'Failed to update project');
			throw error; // Re-throw to keep modal open
		}
	}

	function handleCloseEditModal() {
		showEditModal = false;
	}

	async function handleDeleteProject() {
		if (!project) return;

		if (
			!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)
		) {
			return;
		}

		try {
			const success = await projectService.deleteProject(project.id);
			if (success) {
				showSuccessToast('Project deleted successfully');
				// Redirect to projects list after a delay
				setTimeout(() => {
					window.location.href = '/projects';
				}, 2000);
			} else {
				showErrorToast('Failed to delete project');
			}
		} catch (error) {
			showErrorToast(error instanceof Error ? error.message : 'Failed to delete project');
		}
	}

	// Load project on mount
	onMount(() => {
		loadProject();
	});

	// Reactive project summary for the edit modal
	const projectSummary = $derived<ProjectSummary | null>(
		project
			? {
					id: project.id,
					name: project.name,
					description: project.description,
					status: 'active' // Default since it's not in the backend model yet
				}
			: null
	);
</script>

<svelte:head>
	<title>{project?.name || 'Project'} - Projects - Satin</title>
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center py-12">
		<Spinner size="lg" />
		<span class="ml-3 text-gray-600">Loading project...</span>
	</div>
{:else if error}
	<div class="p-6">
		<div class="rounded-md border border-red-200 bg-red-50 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<span class="text-red-400">⚠️</span>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Error loading project</h3>
					<div class="mt-2 text-sm text-red-700">{error}</div>
					<div class="mt-4">
						<Button variant="secondary" size="sm" onclick={loadProject}>Try Again</Button>
						<Button variant="secondary" size="sm" onclick={() => window.history.back()}>
							Go Back
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else if project}
	<div class="p-6">
		<div class="mb-8 flex items-center justify-between">
			<div>
				<nav class="mb-4 flex items-center space-x-2 text-sm text-gray-500">
					<a href="/projects" class="hover:text-gray-700">Projects</a>
					<span>→</span>
					<span class="font-medium text-gray-900">{project.name}</span>
				</nav>
				<h1 class="text-3xl font-bold text-gray-900">{project.name}</h1>
				<p class="mt-2 text-gray-600">{project.description}</p>
			</div>
			<div class="flex space-x-3">
				<Button variant="secondary" onclick={handleEditProject}>Edit Project</Button>
				<Button variant="danger" onclick={handleDeleteProject}>Delete Project</Button>
				<Button variant="primary">
					<span class="mr-2">📷</span>
					Add Images
				</Button>
			</div>
		</div>

		<!-- Project Stats -->
		<div class="mb-8 grid gap-6 md:grid-cols-4">
			<Card>
				<div class="text-center">
					<div class="text-2xl font-bold text-gray-900">0</div>
					<div class="text-sm text-gray-600">Total Images</div>
				</div>
			</Card>
			<Card>
				<div class="text-center">
					<div class="text-2xl font-bold text-green-600">0</div>
					<div class="text-sm text-gray-600">Annotated</div>
				</div>
			</Card>
			<Card>
				<div class="text-center">
					<div class="text-2xl font-bold text-yellow-600">0</div>
					<div class="text-sm text-gray-600">In Progress</div>
				</div>
			</Card>
			<Card>
				<div class="text-center">
					<div class="text-2xl font-bold text-gray-400">0</div>
					<div class="text-sm text-gray-600">Pending</div>
				</div>
			</Card>
		</div>

		<!-- Images Section -->
		<Card>
			{#snippet header()}
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900">Images</h2>
					<a href="/images?project={projectId}" class="text-blue-600 hover:text-blue-800">
						View all →
					</a>
				</div>
			{/snippet}

			<div class="py-12 text-center">
				<div class="mb-4 text-6xl">🖼️</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">No images yet</h3>
				<p class="mb-6 text-gray-600">Upload images to start annotating</p>
				<Button variant="primary">
					<span class="mr-2">📷</span>
					Upload Images
				</Button>
			</div>
		</Card>

		<!-- Project Details -->
		<div class="mt-8">
			<Card>
				{#snippet header()}
					<h2 class="text-xl font-semibold text-gray-900">Project Details</h2>
				{/snippet}

				<dl class="grid gap-4 md:grid-cols-2">
					<div>
						<dt class="text-sm font-medium text-gray-500">Project ID</dt>
						<dd class="font-mono text-sm text-gray-900">{project.id}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-gray-500">Status</dt>
						<dd class="text-sm">
							<span class="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
								Active
							</span>
						</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-gray-500">Project Name</dt>
						<dd class="text-sm text-gray-900">{project.name}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-gray-500">Description</dt>
						<dd class="text-sm text-gray-900">{project.description}</dd>
					</div>
				</dl>
			</Card>
		</div>
	</div>
{/if}

<!-- Edit Modal -->
<EditProjectModal
	open={showEditModal}
	project={projectSummary}
	onClose={handleCloseEditModal}
	onSubmit={handleEditSubmit}
/>

<!-- Toast Notifications -->
{#if showToast}
	<Toast
		type={toastType}
		title={toastType === 'success' ? 'Success' : 'Error'}
		message={toastMessage}
		onClose={() => (showToast = false)}
		persistent={false}
		duration={4000}
	/>
{/if}
