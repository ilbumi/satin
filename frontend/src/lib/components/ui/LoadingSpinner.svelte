<script lang="ts">
	interface Props {
		size?: 'small' | 'medium' | 'large';
		color?: 'primary' | 'white' | 'current';
		className?: string;
	}

	let { size = 'medium', color = 'primary', className = '' }: Props = $props();

	const sizeClasses = {
		small: 'small',
		medium: 'medium',
		large: 'large'
	};

	const colorClasses = {
		primary: 'primary',
		white: 'white',
		current: 'current'
	};
</script>

<div
	class="spinner {sizeClasses[size]} {colorClasses[color]} {className}"
	role="status"
	aria-label="Loading"
>
	<span class="sr-only">Loading...</span>
</div>

<style>
	.spinner {
		border-radius: 50%;
		animation: spin 1s linear infinite;
		display: inline-block;
	}

	/* Size variants */
	.small {
		width: 16px;
		height: 16px;
		border-width: 2px;
	}

	.medium {
		width: 40px;
		height: 40px;
		border-width: 4px;
	}

	.large {
		width: 64px;
		height: 64px;
		border-width: 6px;
	}

	/* Color variants */
	.primary {
		border: inherit;
		border-color: #e2e8f0;
		border-top-color: #3b82f6;
	}

	.white {
		border: inherit;
		border-color: rgba(255, 255, 255, 0.3);
		border-top-color: white;
	}

	.current {
		border: inherit;
		border-color: transparent;
		border-top-color: currentColor;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
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
