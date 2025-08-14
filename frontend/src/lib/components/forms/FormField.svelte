<script lang="ts">
	interface Props {
		label: string;
		id: string;
		type?: 'text' | 'email' | 'password' | 'textarea' | 'url';
		value: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		rows?: number;
		testId?: string;
		onValueChange: (value: string) => void;
	}

	let {
		label,
		id,
		type = 'text',
		value = $bindable(),
		placeholder = '',
		required = false,
		disabled = false,
		error = '',
		rows = 3,
		testId,
		onValueChange
	}: Props = $props();

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement | HTMLTextAreaElement;
		value = target.value;
		onValueChange?.(target.value);
	}
</script>

<div class="form-group">
	<label for={id}>{label}</label>

	{#if type === 'textarea'}
		<textarea
			{id}
			bind:value
			{placeholder}
			{required}
			{disabled}
			{rows}
			oninput={handleInput}
			data-testid={testId}
			class:error={!!error}
		></textarea>
	{:else}
		<input
			{id}
			{type}
			bind:value
			{placeholder}
			{required}
			{disabled}
			oninput={handleInput}
			data-testid={testId}
			class:error={!!error}
		/>
	{/if}

	{#if error}
		<div class="field-error">{error}</div>
	{/if}
</div>

<style>
	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	input,
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
		box-sizing: border-box;
		font-family: inherit;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	input:disabled,
	textarea:disabled {
		background-color: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
	}

	input.error,
	textarea.error {
		border-color: #dc2626;
	}

	input.error:focus,
	textarea.error:focus {
		border-color: #dc2626;
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
	}

	.field-error {
		color: #dc2626;
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}

	textarea {
		resize: vertical;
		min-height: 4rem;
	}
</style>
