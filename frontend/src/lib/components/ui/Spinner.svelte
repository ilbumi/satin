<script lang="ts">
	export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

	export interface SpinnerProps {
		size?: SpinnerSize;
		color?: string;
		class?: string;
		ariaLabel?: string;
	}

	let {
		size = 'md',
		color = 'text-blue-600',
		class: className = '',
		ariaLabel = 'Loading'
	}: SpinnerProps = $props();

	// Size classes
	const sizeClasses = {
		xs: 'h-3 w-3',
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8',
		xl: 'h-12 w-12'
	};

	// Compute final classes
	const computedClasses = `${sizeClasses[size]} ${color} ${className}`;
</script>

<svg
	class="animate-spin {computedClasses}"
	fill="none"
	viewBox="0 0 24 24"
	aria-label={ariaLabel}
	role="status"
>
	<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
	<path
		class="opacity-75"
		fill="currentColor"
		d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
	></path>
</svg>
