<script lang="ts">
	import BaseModal from './BaseModal.svelte';

	interface Props {
		show: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		isLoading?: boolean;
		error?: string | null;
		confirmButtonClass?: string;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		show,
		title,
		message,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		isLoading = false,
		error = null,
		confirmButtonClass = 'delete-confirm-button',
		onConfirm,
		onCancel
	}: Props = $props();
</script>

<BaseModal {show} {title} onClose={onCancel}>
	<div class="confirm-modal-content">
		<div class="warning-icon">
			<svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
				<path
					d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"
				/>
			</svg>
		</div>

		<h3>Are you sure?</h3>
		<p>{message}</p>

		{#if error}
			<div class="error-message">
				{error}
			</div>
		{/if}

		<div class="modal-actions">
			<button type="button" class="cancel-button" onclick={onCancel} disabled={isLoading}>
				{cancelText}
			</button>
			<button type="button" class={confirmButtonClass} onclick={onConfirm} disabled={isLoading}>
				{#if isLoading}
					<div class="button-spinner"></div>
					Loading...
				{:else}
					{confirmText}
				{/if}
			</button>
		</div>
	</div>
</BaseModal>

<style>
	.confirm-modal-content {
		text-align: center;
	}

	.warning-icon {
		color: #f59e0b;
		margin: 0 auto 1rem;
		width: fit-content;
	}

	h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 1rem 0;
	}

	p {
		color: #64748b;
		line-height: 1.6;
		margin: 0 0 1.5rem 0;
	}

	.error-message {
		background-color: #fee2e2;
		border: 1px solid #fecaca;
		border-radius: 6px;
		padding: 0.75rem 1rem;
		color: #dc2626;
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
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

	.delete-confirm-button {
		background-color: #dc2626;
		color: white;
		border-color: #dc2626;
	}

	.delete-confirm-button:hover:not(:disabled) {
		background-color: #b91c1c;
		border-color: #b91c1c;
	}

	.button-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
