<script lang="ts">
	import { page } from '$app/state';

	let {
		isOpen = true,
		onClose = () => {}
	}: {
		isOpen?: boolean;
		onClose?: () => void;
	} = $props();

	const navigationItems = [
		{ href: '/', label: 'Dashboard', icon: 'home' },
		{ href: '/projects', label: 'Projects', icon: 'folder' },
		{ href: '/tasks', label: 'Tasks', icon: 'check-circle' },
		{ href: '/annotations', label: 'Annotations', icon: 'pencil' },
		{ href: '/images', label: 'Images', icon: 'photo' },
		{ href: '/exports', label: 'Exports', icon: 'arrow-up-tray' }
	];

	function getIcon(iconName: string) {
		const icons: Record<string, string> = {
			home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
			folder:
				'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z',
			'check-circle': 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
			pencil:
				'm16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10',
			photo:
				'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
			'arrow-up-tray':
				'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5'
		};
		return icons[iconName] || '';
	}

	function handleLinkClick() {
		// Close sidebar on mobile when a link is clicked
		if (window.innerWidth < 1024) {
			onClose();
		}
	}
</script>

<!-- Desktop sidebar -->
<aside
	class="fixed inset-y-0 left-0 z-50 w-56 transform border-r border-gray-100 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 {isOpen
		? 'translate-x-0'
		: '-translate-x-full'}"
>
	<!-- Sidebar header -->
	<div class="flex h-14 items-center justify-between border-b border-gray-50 px-4">
		<div class="flex items-center">
			<svg
				class="h-6 w-6 text-gray-700"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.998 15.998 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
				/>
			</svg>
			<h1 class="ml-2 text-lg font-medium text-gray-900">Satin</h1>
		</div>
		<button
			onclick={onClose}
			class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 focus:outline-none lg:hidden"
		>
			<span class="sr-only">Close sidebar</span>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 overflow-y-auto px-3 py-6">
		<div class="space-y-1">
			{#each navigationItems as item, index (item.href)}
				{#if index === 2 || index === 5}
					<div class="my-4 border-t border-gray-100"></div>
				{/if}
				<a
					href={item.href}
					onclick={handleLinkClick}
					class="group relative flex items-center rounded px-3 py-2 text-sm font-normal transition-colors duration-150 {page
						.url.pathname === item.href
						? 'bg-gray-50 text-gray-900'
						: 'hover:bg-gray-25 text-gray-600 hover:text-gray-900'}"
				>
					{#if page.url.pathname === item.href}
						<div class="absolute top-0 bottom-0 left-0 w-0.5 rounded-r bg-gray-900"></div>
					{/if}
					<svg
						class="mr-3 h-4 w-4 flex-shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d={getIcon(item.icon)} />
					</svg>
					{item.label}
				</a>
			{/each}
		</div>
	</nav>
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
