<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Button, Toast } from '$lib/components/ui';

	// Type definitions for dynamic imports
	type ProjectListComponent = typeof import('$lib/components/projects/ProjectList.svelte').default;
	type ProjectFiltersComponent =
		typeof import('$lib/components/projects/ProjectFilters.svelte').default;
	type ProjectPaginationComponent =
		typeof import('$lib/components/projects/ProjectPagination.svelte').default;
	type CreateProjectModalComponent =
		typeof import('$lib/components/projects/CreateProjectModal.svelte').default;
	type EditProjectModalComponent =
		typeof import('$lib/components/projects/EditProjectModal.svelte').default;

	// Dynamic imports for heavy components
	let ProjectList: ProjectListComponent | null = $state(null);
	let ProjectFilters: ProjectFiltersComponent | null = $state(null);
	let ProjectPagination: ProjectPaginationComponent | null = $state(null);
	let CreateProjectModal: CreateProjectModalComponent | null = $state(null);
	let EditProjectModal: EditProjectModalComponent | null = $state(null);
	import { projectStore } from '$lib/features/projects/store.svelte';
	import type {
		ProjectSummary,
		CreateProjectForm,
		UpdateProjectForm
	} from '$lib/features/projects/types';
	// Remove the coordinator import and use project store directly
	import { errorStore } from '$lib/core/errors';

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let editingProject = $state<ProjectSummary | null>(null);
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

	async function handleCreateProject() {
		if (!CreateProjectModal) {
			try {
				const module = await import('$lib/components/projects/CreateProjectModal.svelte');
				CreateProjectModal = module.default;
			} catch (error) {
				console.error('Failed to load CreateProjectModal:', error);
				errorStore.addSystemError('Failed to load create project modal', 'Projects Page');
				return;
			}
		}
		showCreateModal = true;
	}

	async function handleEditProject(project: ProjectSummary) {
		if (!EditProjectModal) {
			try {
				const module = await import('$lib/components/projects/EditProjectModal.svelte');
				EditProjectModal = module.default;
			} catch (error) {
				console.error('Failed to load EditProjectModal:', error);
				errorStore.addSystemError('Failed to load edit project modal', 'Projects Page');
				return;
			}
		}
		editingProject = project;
		showEditModal = true;
	}

	async function handleDeleteProject(project: ProjectSummary) {
		if (
			!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)
		) {
			return;
		}

		try {
			const success = await projectStore.deleteProject(project.id);
			if (success) {
				showSuccessToast('Project deleted successfully');
			} else {
				showErrorToast('Failed to delete project');
			}
		} catch (error) {
			showErrorToast(error instanceof Error ? error.message : 'Failed to delete project');
		}
	}

	async function handleCreateSubmit(data: CreateProjectForm) {
		try {
			const project = await projectStore.createProject(data);
			if (project) {
				showSuccessToast('Project created successfully');
			} else {
				// Error is already shown by the store and displayed in the UI
				showErrorToast('Failed to create project');
				// Don't re-throw here - let the modal close so user can try again
			}
		} catch (error) {
			// Error is already handled by the store
			showErrorToast(error instanceof Error ? error.message : 'Failed to create project');
			// Don't re-throw here - let the modal close so user can try again
		}
	}

	async function handleEditSubmit(data: UpdateProjectForm) {
		try {
			const project = await projectStore.updateProject(data);
			if (project) {
				showSuccessToast('Project updated successfully');
				editingProject = null;
			} else {
				showErrorToast('Failed to update project');
			}
		} catch (error) {
			showErrorToast(error instanceof Error ? error.message : 'Failed to update project');
			throw error; // Re-throw to keep modal open
		}
	}

	function handleCloseCreateModal() {
		showCreateModal = false;
	}

	function handleCloseEditModal() {
		showEditModal = false;
		editingProject = null;
	}

	function handleRetry() {
		projectStore.refetch();
	}

	// Load projects and components on mount
	onMount(async () => {
		// Load core components first
		try {
			const [projectListModule, projectFiltersModule, paginationModule] = await Promise.all([
				import('$lib/components/projects/ProjectList.svelte'),
				import('$lib/components/projects/ProjectFilters.svelte'),
				import('$lib/components/projects/ProjectPagination.svelte')
			]);
			ProjectList = projectListModule.default;
			ProjectFilters = projectFiltersModule.default;
			ProjectPagination = paginationModule.default;
		} catch (error) {
			console.error('Failed to load project components:', error);
			errorStore.addSystemError('Failed to load project components', 'Projects Page');
		}

		// Load projects data directly
		try {
			await projectStore.fetchProjects();
		} catch (error) {
			console.error('Failed to load projects:', error);
			errorStore.addSystemError('Failed to load projects', 'Projects Page');
		}
	});

	onDestroy(() => {
		// Clean up project store only
		projectStore.cleanup();
	});
</script>

<svelte:head>
	<title>Projects - Satin</title>
</svelte:head>

<div class="p-6">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Projects</h1>
			<p class="mt-2 text-gray-600">Manage your annotation projects</p>
		</div>
		<Button variant="primary" onclick={handleCreateProject}>
			<span class="mr-2">➕</span>
			New Project
		</Button>
	</div>

	<!-- Filters -->
	{#if ProjectFilters}
		<ProjectFilters
			filters={projectStore.filters}
			onFiltersChange={projectStore.setFilters}
			onClear={() => projectStore.setFilters({ search: '', status: 'all' })}
		/>
	{/if}

	<!-- Error display -->
	{#if projectStore.error}
		<div class="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<span class="text-red-400">⚠️</span>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Error</h3>
					<div class="mt-2 text-sm text-red-700">
						{projectStore.error}
					</div>
					<div class="mt-4">
						<Button variant="secondary" size="sm" onclick={() => projectStore.clearError()}>
							Dismiss
						</Button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Project List -->
	{#if ProjectList}
		<ProjectList
			projects={projectStore.projects}
			loading={projectStore.loading}
			error={projectStore.error}
			onCreateProject={handleCreateProject}
			onEditProject={handleEditProject}
			onDeleteProject={handleDeleteProject}
			onRetry={handleRetry}
		/>
	{:else}
		<div class="flex items-center justify-center py-12">
			<div class="animate-pulse text-gray-600">Loading projects...</div>
		</div>
	{/if}

	<!-- Pagination -->
	{#if ProjectPagination && projectStore.hasProjects}
		<ProjectPagination
			limit={projectStore.pagination.limit}
			offset={projectStore.pagination.offset}
			totalCount={projectStore.pagination.totalCount}
			hasMore={projectStore.pagination.hasMore}
			loading={projectStore.loading}
			onNext={projectStore.nextPage}
			onPrev={projectStore.prevPage}
		/>
	{/if}
</div>

<!-- Modals -->
{#if CreateProjectModal && showCreateModal}
	<CreateProjectModal
		open={showCreateModal}
		onClose={handleCloseCreateModal}
		onSubmit={handleCreateSubmit}
	/>
{/if}

{#if EditProjectModal && showEditModal}
	<EditProjectModal
		open={showEditModal}
		project={editingProject}
		onClose={handleCloseEditModal}
		onSubmit={handleEditSubmit}
	/>
{/if}

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
