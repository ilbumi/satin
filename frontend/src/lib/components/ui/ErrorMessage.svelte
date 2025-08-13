<script lang="ts">
	interface Props {
		message: string;
		variant?: 'inline' | 'banner' | 'page';
		showIcon?: boolean;
		testId?: string;
	}

	let { message, variant = 'inline', showIcon = true, testId }: Props = $props();

	const variants = {
		inline: 'inline',
		banner: 'banner',
		page: 'page'
	};
</script>

{#if message}
	<div class="error-message {variants[variant]}" role="alert" data-testid={testId}>
		{#if showIcon}
			<div class="error-icon">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
					<path
						d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"
					/>
				</svg>
			</div>
		{/if}
		<div class="error-content">
			{message}
		</div>
	</div>
{/if}

<style>
	.error-message {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		background-color: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.error-icon {
		flex-shrink: 0;
		width: 16px;
		height: 16px;
	}

	.error-content {
		flex: 1;
	}

	/* Variant styles */
	.inline {
		padding: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.banner {
		padding: 1rem 1.5rem;
		margin-bottom: 1.5rem;
		border-left-width: 4px;
		border-radius: 0 6px 6px 0;
	}

	.page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		text-align: center;
		padding: 2rem;
		background-color: transparent;
		border: none;
		color: #64748b;
	}

	.page .error-icon {
		width: 48px;
		height: 48px;
		margin-bottom: 1rem;
		color: #dc2626;
	}

	.page .error-content {
		font-size: 1.125rem;
		font-weight: 500;
	}
</style>
