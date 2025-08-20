<script lang="ts">
	import CreateProjectModal from '../CreateProjectModal.svelte';
	import type { CreateProjectForm } from '$lib/features/projects/types';

	interface Props {
		open: boolean;
		loading?: boolean;
	}

	let { open, loading = false }: Props = $props();

	let closeCalled = $state(false);
	let submitCalled = $state(false);
	let submitData = $state<CreateProjectForm | null>(null);
	let submitError = $state<Error | null>(null);

	function handleClose() {
		closeCalled = true;
	}

	async function handleSubmit(data: CreateProjectForm) {
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

<CreateProjectModal {open} {loading} onClose={handleClose} onSubmit={handleSubmit} />

<div data-testid="test-state" style="display: none;">
	<span data-testid="close-called">{closeCalled}</span>
	<span data-testid="submit-called">{submitCalled}</span>
	<span data-testid="submit-data">{JSON.stringify(submitData)}</span>
	<span data-testid="submit-error">{submitError?.message || ''}</span>
</div>
