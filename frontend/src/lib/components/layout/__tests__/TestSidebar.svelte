<script lang="ts">
	let {
		isOpen = true,
		onClose = () => {}
	}: {
		isOpen?: boolean;
		onClose?: () => void;
	} = $props();

	const navigationItems = [
		{
			section: 'Main',
			items: [
				{ href: '/', label: 'Dashboard', icon: '🏠' },
				{ href: '/projects', label: 'Projects', icon: '📁' }
			]
		},
		{
			section: 'Work',
			items: [
				{ href: '/tasks', label: 'Tasks', icon: '✅' },
				{ href: '/annotations', label: 'Annotations', icon: '✏️' },
				{ href: '/images', label: 'Images', icon: '🖼️' }
			]
		},
		{
			section: 'Tools',
			items: [{ href: '/exports', label: 'Exports', icon: '📤' }]
		}
	];

	// Mock current path for testing
	const currentPath = '/';

	function handleLinkClick() {
		// Close sidebar on mobile when a link is clicked
		if (window.innerWidth < 1024) {
			onClose();
		}
	}
</script>

<!-- Desktop sidebar -->
<aside
	class="fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:inset-0 lg:translate-x-0 {isOpen
		? 'translate-x-0'
		: '-translate-x-full'}"
>
	<!-- Sidebar header -->
	<div class="flex h-16 items-center justify-between border-b border-gray-200 px-4">
		<h2 class="text-lg font-semibold text-gray-900">Navigation</h2>
		<button
			onclick={onClose}
			class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset lg:hidden"
		>
			<span class="sr-only">Close sidebar</span>
			×
		</button>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 space-y-8 overflow-y-auto px-4 py-4">
		{#each navigationItems as section (section.section)}
			<div>
				<h3 class="px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
					{section.section}
				</h3>
				<div class="mt-2 space-y-1">
					{#each section.items as item (item.href)}
						<a
							href={item.href}
							onclick={handleLinkClick}
							class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 {currentPath ===
							item.href
								? 'border-r-2 border-blue-700 bg-blue-100 text-blue-700'
								: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
						>
							<span class="mr-3 text-lg">{item.icon}</span>
							{item.label}
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</nav>

	<!-- Sidebar footer -->
	<div class="flex-shrink-0 border-t border-gray-200 p-4">
		<div class="flex items-center">
			<div class="flex-shrink-0">
				<span
					class="flex inline-block h-8 w-8 items-center justify-center rounded-full bg-gray-300"
				>
					👤
				</span>
			</div>
			<div class="ml-3">
				<p class="text-sm font-medium text-gray-900">User</p>
				<p class="text-xs text-gray-500">user@example.com</p>
			</div>
		</div>
	</div>
</aside>

<!-- Mobile sidebar overlay -->
{#if isOpen}
	<div
		class="bg-opacity-75 fixed inset-0 z-40 bg-gray-600 lg:hidden"
		onclick={onClose}
		onkeydown={(e) => {
			if (e.key === 'Escape') onClose();
		}}
		role="button"
		tabindex="0"
		aria-label="Close sidebar"
	></div>
{/if}
