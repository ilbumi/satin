<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		isCollapsed?: boolean;
		onToggle?: () => void;
		position?: 'left' | 'right';
		children?: import('svelte').Snippet;
	}

	let { isCollapsed = false, onToggle, position = 'right', children }: Props = $props();
	let isMobile = $state(false);

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});
</script>

<div class="relative">
	<!-- Mobile Overlay -->
	{#if isMobile && !isCollapsed}
		<div
			class="bg-opacity-50 fixed inset-0 z-40 bg-black md:hidden"
			onclick={onToggle}
			onkeydown={(e) => e.key === 'Escape' && onToggle?.()}
			role="button"
			tabindex="0"
			aria-label="Close sidebar"
		></div>
	{/if}

	<!-- Sidebar -->
	<div
		class="z-50 flex flex-col bg-white shadow-sm transition-all duration-300 ease-in-out
		       {isMobile
			? `fixed top-0 right-0 h-full ${isCollapsed ? 'w-0 overflow-hidden' : 'w-80'}`
			: `relative ${isCollapsed ? 'w-12' : 'w-80'} border-l border-gray-200`}
		       {position === 'left' ? 'border-r border-l-0' : ''}"
	>
		<!-- Collapse Toggle Button -->
		<button
			onclick={onToggle}
			class="absolute top-4 -left-3 z-10 rounded-full border border-gray-300 bg-white p-1
			       shadow-sm transition-colors hover:bg-gray-50"
			aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			<svg
				class="h-4 w-4 text-gray-600 transition-transform duration-300 {isCollapsed
					? 'rotate-180'
					: ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>

		<!-- Sidebar Content -->
		<div class="flex-1 overflow-y-auto {isCollapsed ? 'hidden' : 'block'}">
			{#if children}
				{@render children()}
			{/if}
		</div>

		<!-- Collapsed State Indicators -->
		{#if isCollapsed}
			<div class="flex flex-col items-center space-y-4 py-4">
				<div class="h-3 w-3 rounded-full bg-blue-500" title="Tools"></div>
				<div class="h-3 w-3 rounded-full bg-green-500" title="Labels"></div>
				<div class="h-3 w-3 rounded-full bg-purple-500" title="Annotations"></div>
			</div>
		{/if}
	</div>
</div>
