<script lang="ts">
	export type CardVariant = 'default' | 'bordered' | 'elevated';

	export interface CardProps {
		variant?: CardVariant;
		class?: string;
		'data-testid'?: string;
		header?: import('svelte').Snippet;
		footer?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let {
		variant = 'default',
		class: className = '',
		'data-testid': dataTestId,
		header,
		footer,
		children
	}: CardProps = $props();

	// Variant classes
	const variantClasses = {
		default: 'bg-white shadow-sm ring-1 ring-gray-200',
		bordered: 'bg-white border border-gray-200',
		elevated: 'bg-white shadow-lg ring-1 ring-black ring-opacity-5'
	};

	// Base card classes
	const baseClasses = 'rounded-lg overflow-hidden';

	// Compute final classes
	const computedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;
</script>

<div class={computedClasses} data-testid={dataTestId}>
	{#if header}
		<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
			{@render header()}
		</div>
	{/if}

	<div class="px-6 py-4">
		{@render children?.()}
	</div>

	{#if footer}
		<div class="border-t border-gray-200 bg-gray-50 px-6 py-3">
			{@render footer()}
		</div>
	{/if}
</div>
