<script lang="ts">
	import ProjectCard from '../ProjectCard.svelte';
	import type { ProjectSummary } from '$lib/features/projects/types';

	interface Props {
		project: ProjectSummary;
		onEdit?: boolean;
		onDelete?: boolean;
	}

	let { project, onEdit = false, onDelete = false }: Props = $props();

	let editCalled = $state(false);
	let deleteCalled = $state(false);
	let editProject = $state<ProjectSummary | null>(null);
	let deleteProject = $state<ProjectSummary | null>(null);

	function handleEdit(p: ProjectSummary) {
		editCalled = true;
		editProject = p;
	}

	function handleDelete(p: ProjectSummary) {
		deleteCalled = true;
		deleteProject = p;
	}

	// Expose test state
	export const testState = {
		get editCalled() {
			return editCalled;
		},
		get deleteCalled() {
			return deleteCalled;
		},
		get editProject() {
			return editProject;
		},
		get deleteProject() {
			return deleteProject;
		}
	};
</script>

<ProjectCard
	{project}
	onEdit={onEdit ? handleEdit : undefined}
	onDelete={onDelete ? handleDelete : undefined}
/>

<div data-testid="test-state" style="display: none;">
	<span data-testid="edit-called">{editCalled}</span>
	<span data-testid="delete-called">{deleteCalled}</span>
	<span data-testid="edit-project">{editProject?.id || ''}</span>
	<span data-testid="delete-project">{deleteProject?.id || ''}</span>
</div>
