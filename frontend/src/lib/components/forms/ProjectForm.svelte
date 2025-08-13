<script lang="ts">
	import FormField from './FormField.svelte';
	import ErrorMessage from '../ui/ErrorMessage.svelte';
	import LoadingSpinner from '../ui/LoadingSpinner.svelte';

	interface Props {
		mode: 'create' | 'edit';
		initialName?: string;
		initialDescription?: string;
		isLoading?: boolean;
		error?: string | null;
		onSubmit: (data: { name: string; description: string }) => void;
		onCancel: () => void;
	}

	let {
		mode,
		initialName = '',
		initialDescription = '',
		isLoading = false,
		error = null,
		onSubmit,
		onCancel
	}: Props = $props();

	let name = $state(initialName);
	let description = $state(initialDescription);
	let nameError = $state('');

	// Update form when initial values change
	$effect(() => {
		name = initialName;
		description = initialDescription;
	});

	function handleSubmit() {
		// Basic validation
		if (!name.trim()) {
			nameError = 'Project name is required';
			return;
		}
		nameError = '';

		onSubmit({
			name: name.trim(),
			description: description.trim()
		});
	}

	function handleNameChange(value: string) {
		name = value;
		if (nameError && value.trim()) {
			nameError = '';
		}
	}

	function handleDescriptionChange(value: string) {
		description = value;
	}

	const submitText = mode === 'create' ? 'Create Project' : 'Update Project';
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
>
	<FormField
		id="project-name"
		label="Project Name"
		value={name}
		placeholder="Enter project name"
		required={true}
		disabled={isLoading}
		error={nameError}
		testId="project-name-input"
		onValueChange={handleNameChange}
	/>

	<FormField
		id="project-description"
		label="Description"
		type="textarea"
		value={description}
		placeholder="Enter project description (optional)"
		disabled={isLoading}
		testId="project-description-input"
		onValueChange={handleDescriptionChange}
	/>

	{#if error}
		<ErrorMessage message={error} testId="error-message" />
	{/if}

	<div class="form-actions">
		<button type="button" class="cancel-button" onclick={onCancel} disabled={isLoading}>
			Cancel
		</button>
		<button type="submit" class="submit-button" disabled={isLoading || !name.trim()}>
			{#if isLoading}
				<LoadingSpinner size="small" color="white" />
				{mode === 'create' ? 'Creating...' : 'Updating...'}
			{:else}
				{submitText}
			{/if}
		</button>
	</div>
</form>

<style>
	.form-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.cancel-button {
		background: white;
		color: #6b7280;
		border-color: #d1d5db;
	}

	.cancel-button:hover:not(:disabled) {
		background-color: #f9fafb;
		color: #374151;
	}

	.submit-button {
		background-color: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.submit-button:hover:not(:disabled) {
		background-color: #2563eb;
		border-color: #2563eb;
	}
</style>
