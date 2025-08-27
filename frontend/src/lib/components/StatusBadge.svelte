<script lang="ts">
	interface Props {
		status: 'NEW' | 'ANNOTATED' | 'NEEDS_REANNOTATION';
		size?: 'sm' | 'md' | 'lg';
	}

	let { status, size = 'md' }: Props = $props();

	const statusConfig = {
		NEW: {
			label: 'New',
			icon: '🆕',
			bgColor: 'bg-blue-50',
			textColor: 'text-blue-700',
			borderColor: 'border-blue-200'
		},
		ANNOTATED: {
			label: 'Annotated',
			icon: '✅',
			bgColor: 'bg-green-50',
			textColor: 'text-green-700',
			borderColor: 'border-green-200'
		},
		NEEDS_REANNOTATION: {
			label: 'Re-annotate',
			icon: '⚠️',
			bgColor: 'bg-orange-50',
			textColor: 'text-orange-700',
			borderColor: 'border-orange-200'
		}
	};

	const sizeClasses = {
		sm: 'px-2 py-1 text-xs',
		md: 'px-2.5 py-1.5 text-sm',
		lg: 'px-3 py-2 text-base'
	};

	const config = statusConfig[status];
</script>

<span
	class="inline-flex items-center rounded-full border font-medium
		   {config.bgColor} {config.textColor} {config.borderColor} {sizeClasses[size]}"
	title={config.label}
>
	<span class="mr-1" aria-hidden="true">{config.icon}</span>
	{#if size !== 'sm'}
		{config.label}
	{/if}
</span>
