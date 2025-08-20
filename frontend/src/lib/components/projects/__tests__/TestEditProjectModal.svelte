<script lang="ts">
	import EditProjectModal from '../EditProjectModal.svelte';
	import type { UpdateProjectForm, ProjectSummary } from '$lib/features/projects/types';

	interface Props {
		open: boolean;
		project: ProjectSummary | null;
		loading?: boolean;
	}

	let { open, project, loading = false }: Props = $props();

	let closeCalled = $state(false);
	let submitCalled = $state(false);
	let submitData = $state<UpdateProjectForm | null>(null);
	let submitError = $state<Error | null>(null);

	function handleClose() {
		closeCalled = true;
	}

	async function handleSubmit(data: UpdateProjectForm) {
		submitCalled = true;
		submitData = data;

		// Simulate submission behavior
		if (data.name === 'FAIL') {
			submitError = new Error('Simulated submission error');
			throw submitError;
		}
	}

	// Expose test state
	export const testState = {
		get closeCalled() {
			return closeCalled;
		},
		get submitCalled() {
			return submitCalled;
		},
		get submitData() {
			return submitData;
		},
		get submitError() {
			return submitError;
		}
	};
</script>

<EditProjectModal {open} {project} {loading} onClose={handleClose} onSubmit={handleSubmit} />

<div data-testid="test-state" style="display: none;">
	<span data-testid="close-called">{closeCalled}</span>
	<span data-testid="submit-called">{submitCalled}</span>
	<span data-testid="submit-data">{JSON.stringify(submitData)}</span>
	<span data-testid="submit-error">{submitError?.message || ''}</span>
</div>
