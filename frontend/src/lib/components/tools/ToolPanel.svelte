<script lang="ts">
	import { toolStore, ToolType } from '$lib/stores/tool';
	import { imageStore } from '$lib/stores/image';

	const tools = [
		{ type: ToolType.SELECT, icon: '↖', label: 'Select (V)', shortcut: 'V' },
		{ type: ToolType.BOUNDING_BOX, icon: '□', label: 'Bounding Box (B)', shortcut: 'B' },
		{ type: ToolType.PAN, icon: '✋', label: 'Pan (H)', shortcut: 'H' }
	];

	function selectTool(type: ToolType) {
		toolStore.selectTool(type);
	}

	function handleKeyDown(e: KeyboardEvent) {
		const key = e.key.toLowerCase();
		if (key === 'v') {
			toolStore.selectTool(ToolType.SELECT);
		} else if (key === 'b') {
			toolStore.selectTool(ToolType.BOUNDING_BOX);
		} else if (key === 'h') {
			toolStore.selectTool(ToolType.PAN);
		}
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="rounded-lg bg-white p-4 shadow-md">
	<h3 class="mb-3 text-sm font-semibold text-gray-700">Tools</h3>

	<div class="flex flex-col space-y-2">
		{#each tools as tool (tool.type)}
			<button
				onclick={() => selectTool(tool.type)}
				class="flex items-center space-x-2 rounded px-3 py-2 transition-colors {$toolStore.currentTool ===
				tool.type
					? 'bg-blue-500 text-white'
					: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
				title={tool.label}
			>
				<span class="text-lg">{tool.icon}</span>
				<span class="flex-1 text-left text-sm">{tool.label.split(' ')[0]}</span>
				<span class="text-xs opacity-60">{tool.shortcut}</span>
			</button>
		{/each}
	</div>

	<div class="mt-4 border-t border-gray-200 pt-4">
		<h4 class="mb-2 text-xs font-semibold text-gray-600">View Options</h4>

		<label class="flex items-center space-x-2 text-sm">
			<input
				type="checkbox"
				checked={$toolStore.showAnnotations}
				onchange={() => toolStore.toggleAnnotations()}
				class="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
			/>
			<span>Show Annotations</span>
		</label>

		<label class="mt-2 flex items-center space-x-2 text-sm">
			<input
				type="checkbox"
				checked={$toolStore.showLabels}
				onchange={() => toolStore.toggleLabels()}
				class="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
			/>
			<span>Show Labels</span>
		</label>

		<label class="mt-2 flex items-center space-x-2 text-sm">
			<input
				type="checkbox"
				checked={$toolStore.showConfidenceScores}
				onchange={() => toolStore.toggleConfidenceScores()}
				class="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
			/>
			<span>Show Confidence</span>
		</label>
	</div>

	<div class="mt-4 border-t border-gray-200 pt-4">
		<h4 class="mb-2 text-xs font-semibold text-gray-600">Zoom</h4>

		<div class="flex items-center space-x-2">
			<button
				onclick={() => imageStore.zoomOut()}
				class="rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200"
				title="Zoom Out (-)"
			>
				−
			</button>

			<span class="flex-1 text-center text-sm text-gray-600">
				{Math.round($imageStore.scale * 100)}%
			</span>

			<button
				onclick={() => imageStore.zoomIn()}
				class="rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200"
				title="Zoom In (+)"
			>
				+
			</button>
		</div>

		<button
			onclick={() => imageStore.resetZoom()}
			class="mt-2 w-full rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200"
		>
			Reset Zoom
		</button>
	</div>
</div>
