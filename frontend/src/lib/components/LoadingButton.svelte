<script lang="ts">
	import LoadingSpinner from './LoadingSpinner.svelte';

	interface Props {
		loading?: boolean;
		disabled?: boolean;
		variant?: 'primary' | 'secondary' | 'outline';
		size?: 'sm' | 'md' | 'lg';
		children?: import('svelte').Snippet;
		onclick?: () => void;
		type?: 'button' | 'submit';
	}

	let {
		loading = false,
		disabled = false,
		variant = 'primary',
		size = 'md',
		children,
		onclick,
		type = 'button'
	}: Props = $props();

	const baseClasses =
		'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

	const variantClasses = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
		secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
		outline:
			'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400'
	};

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-sm',
		lg: 'px-6 py-3 text-base'
	};

	const spinnerSizes = {
		sm: 'sm' as const,
		md: 'sm' as const,
		lg: 'md' as const
	};

	const isDisabled = loading || disabled;
</script>

<button
	{type}
	{onclick}
	disabled={isDisabled}
	class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]}"
>
	{#if loading}
		<LoadingSpinner size={spinnerSizes[size]} color="white" />
		<span class="ml-2">Loading...</span>
	{:else if children}
		{@render children()}
	{/if}
</button>
