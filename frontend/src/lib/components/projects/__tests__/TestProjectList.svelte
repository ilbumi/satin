<script lang="ts">
	import ProjectList from '../ProjectList.svelte';
	import type { ProjectSummary } from '$lib/features/projects/types';

	interface Props {
		projects: ProjectSummary[];
		loading?: boolean;
		error?: string | null;
		onCreateProject?: boolean;
		onEditProject?: boolean;
		onDeleteProject?: boolean;
		onRetry?: boolean;
	}

	let {
		projects,
		loading = false,
		error = null,
		onCreateProject = false,
		onEditProject = false,
		onDeleteProject = false,
		onRetry = false
	}: Props = $props();

	let createCalled = $state(false);
	let editCalled = $state(false);
	let deleteCalled = $state(false);
	let retryCalled = $state(false);
	let editProject = $state<ProjectSummary | null>(null);
	let deleteProject = $state<ProjectSummary | null>(null);

	function handleCreate() {
		createCalled = true;
	}

	function handleEdit(project: ProjectSummary) {
		editCalled = true;
		editProject = project;
	}

	function handleDelete(project: ProjectSummary) {
		deleteCalled = true;
		deleteProject = project;
	}

	function handleRetry() {
		retryCalled = true;
	}

	// Expose test state
	export const testState = {
		get createCalled() {
			return createCalled;
		},
		get editCalled() {
			return editCalled;
		},
		get deleteCalled() {
			return deleteCalled;
		},
		get retryCalled() {
			return retryCalled;
		},
		get editProject() {
			return editProject;
		},
		get deleteProject() {
			return deleteProject;
		}
	};
</script>

<ProjectList
	{projects}
	{loading}
	{error}
	onCreateProject={onCreateProject ? handleCreate : undefined}
	onEditProject={onEditProject ? handleEdit : undefined}
	onDeleteProject={onDeleteProject ? handleDelete : undefined}
	onRetry={onRetry ? handleRetry : undefined}
/>

<div data-testid="test-state" style="display: none;">
	<span data-testid="create-called">{createCalled}</span>
	<span data-testid="edit-called">{editCalled}</span>
	<span data-testid="delete-called">{deleteCalled}</span>
	<span data-testid="retry-called">{retryCalled}</span>
	<span data-testid="edit-project">{editProject?.id || ''}</span>
	<span data-testid="delete-project">{deleteProject?.id || ''}</span>
</div>
