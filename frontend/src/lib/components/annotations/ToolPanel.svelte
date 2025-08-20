<script lang="ts">
	import { Button } from '$lib/components/ui';
	import { annotationStore } from '$lib/features/annotations/store.svelte';
	import { TOOL_CONFIGS } from '$lib/features/annotations/types';
	import type { AnnotationTool } from '$lib/features/annotations/types';

	interface ToolPanelProps {
		vertical?: boolean;
		compact?: boolean;
		showLabels?: boolean;
		onToolChange?: (tool: AnnotationTool) => void;
	}

	let {
		vertical = false,
		compact = false,
		showLabels = true,
		onToolChange
	}: ToolPanelProps = $props();

	// Get available tools (only enabled ones)
	const availableTools = Object.values(TOOL_CONFIGS).filter((tool) => tool.enabled);

	// Reactive active tool getter for proper state tracking
	let activeTool = $derived(() => annotationStore.canvas.activeTool);

	function selectTool(toolId: AnnotationTool) {
		annotationStore.setActiveTool(toolId);
		onToolChange?.(toolId);
	}

	function handleKeyboard(event: KeyboardEvent) {
		// Handle tool shortcuts
		for (const tool of availableTools) {
			if (tool.shortcut && event.key.toLowerCase() === tool.shortcut.toLowerCase()) {
				event.preventDefault();
				selectTool(tool.id);
				break;
			}
		}

		// Handle undo/redo
		if (event.ctrlKey || event.metaKey) {
			if (event.key === 'z' && !event.shiftKey) {
				event.preventDefault();
				annotationStore.undo();
			} else if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
				event.preventDefault();
				annotationStore.redo();
			}
		}

		// Handle delete
		if (event.key === 'Delete' || event.key === 'Backspace') {
			if (annotationStore.selectedAnnotation()) {
				event.preventDefault();
				annotationStore.deleteAnnotation(annotationStore.selectedAnnotation()!.id);
			}
		}
	}

	// Keyboard handling is done via svelte:window
</script>

<svelte:window onkeydown={handleKeyboard} />

<div
	class="tool-panel {vertical ? 'vertical' : 'horizontal'} {compact ? 'compact' : ''}"
	data-testid="tool-panel"
>
	<!-- Tool Selection -->
	<div class="tool-section">
		{#if showLabels && !compact}
			<h3 class="section-title">Tools</h3>
		{/if}

		<div class="tool-grid {vertical ? 'vertical' : 'horizontal'}">
			{#each availableTools as tool (tool.id)}
				<Button
					variant={activeTool() === tool.id ? 'primary' : 'secondary'}
					size={compact ? 'sm' : 'md'}
					class="tool-button {activeTool() === tool.id ? 'active' : ''}"
					data-testid="tool-{tool.id}"
					onclick={() => selectTool(tool.id)}
					title="{tool.description} ({tool.shortcut ? `Shortcut: ${tool.shortcut}` : ''})"
					aria-label={tool.name}
				>
					<span class="tool-icon">{tool.icon}</span>
					{#if showLabels && !compact}
						<span class="tool-label">{tool.name}</span>
					{/if}
					{#if tool.shortcut && !compact}
						<span class="tool-shortcut">{tool.shortcut}</span>
					{/if}
				</Button>
			{/each}
		</div>
	</div>

	<!-- Actions -->
	<div class="action-section">
		{#if showLabels && !compact}
			<h3 class="section-title">Actions</h3>
		{/if}

		<div class="action-grid {vertical ? 'vertical' : 'horizontal'}">
			<!-- Undo -->
			<Button
				variant="secondary"
				size={compact ? 'sm' : 'md'}
				class="action-button"
				data-testid="undo-button"
				onclick={() => annotationStore.undo()}
				disabled={!annotationStore.canUndo}
				title="Undo (Ctrl+Z)"
				aria-label="Undo"
			>
				<span class="action-icon">↶</span>
				{#if showLabels && !compact}
					<span class="action-label">Undo</span>
				{/if}
			</Button>

			<!-- Redo -->
			<Button
				variant="secondary"
				size={compact ? 'sm' : 'md'}
				class="action-button"
				data-testid="redo-button"
				onclick={() => annotationStore.redo()}
				disabled={!annotationStore.canRedo}
				title="Redo (Ctrl+Y)"
				aria-label="Redo"
			>
				<span class="action-icon">↷</span>
				{#if showLabels && !compact}
					<span class="action-label">Redo</span>
				{/if}
			</Button>

			<!-- Delete -->
			<Button
				variant="danger"
				size={compact ? 'sm' : 'md'}
				class="action-button"
				onclick={() =>
					annotationStore.selectedAnnotation() &&
					annotationStore.deleteAnnotation(annotationStore.selectedAnnotation()!.id)}
				disabled={!annotationStore.selectedAnnotation()}
				title="Delete selected annotation (Delete)"
				aria-label="Delete annotation"
			>
				<span class="action-icon">🗑️</span>
				{#if showLabels && !compact}
					<span class="action-label">Delete</span>
				{/if}
			</Button>

			<!-- Clear All -->
			<Button
				variant="danger"
				size={compact ? 'sm' : 'md'}
				class="action-button"
				data-testid="clear-button"
				onclick={() => {
					if (confirm('Delete all annotations? This cannot be undone.')) {
						annotationStore.clearAnnotations();
					}
				}}
				disabled={annotationStore.annotations.length === 0}
				title="Clear all annotations"
				aria-label="Clear all annotations"
			>
				<span class="action-icon">🧹</span>
				{#if showLabels && !compact}
					<span class="action-label">Clear All</span>
				{/if}
			</Button>
		</div>
	</div>

	<!-- Stats -->
	{#if !compact}
		<div class="stats-section">
			{#if showLabels}
				<h3 class="section-title">Statistics</h3>
			{/if}

			{#if true}
				{@const stats = annotationStore.getStats()}
				<div class="stats-grid">
					<div class="stat-item">
						<span class="stat-label">Total:</span>
						<span class="stat-value">{stats.total}</span>
					</div>

					{#if stats.selected > 0}
						<div class="stat-item">
							<span class="stat-label">Selected:</span>
							<span class="stat-value">{stats.selected}</span>
						</div>
					{/if}

					<div class="stat-item">
						<span class="stat-label">With Text:</span>
						<span class="stat-value">{stats.withText}</span>
					</div>

					<div class="stat-item">
						<span class="stat-label">With Tags:</span>
						<span class="stat-value">{stats.withTags}</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Keyboard Shortcuts Help -->
	{#if !compact && showLabels}
		<div class="help-section">
			<details class="shortcuts-details">
				<summary class="shortcuts-summary">Keyboard Shortcuts</summary>
				<div class="shortcuts-list">
					{#each availableTools as tool (tool.id)}
						{#if tool.shortcut}
							<div class="shortcut-item">
								<span class="shortcut-key">{tool.shortcut}</span>
								<span class="shortcut-desc">{tool.name}</span>
							</div>
						{/if}
					{/each}

					<div class="shortcut-item">
						<span class="shortcut-key">Ctrl+Z</span>
						<span class="shortcut-desc">Undo</span>
					</div>

					<div class="shortcut-item">
						<span class="shortcut-key">Ctrl+Y</span>
						<span class="shortcut-desc">Redo</span>
					</div>

					<div class="shortcut-item">
						<span class="shortcut-key">Delete</span>
						<span class="shortcut-desc">Delete selected</span>
					</div>
				</div>
			</details>
		</div>
	{/if}
</div>

<style>
	.tool-panel {
		display: flex;
		border-right: 1px solid #6b7280;
		background-color: white;
		padding: 1rem;
		gap: 1.5rem;
		min-width: 200px;
	}

	.tool-panel.vertical {
		flex-direction: column;
		min-width: 60px;
	}

	.tool-panel.horizontal {
		flex-direction: row;
		min-height: 60px;
	}

	.tool-panel.compact {
		padding: 0.5rem;
		gap: 0.5rem;
		min-width: 50px;
	}

	.tool-panel.compact.vertical {
		min-width: 40px;
	}

	.section-title {
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.tool-section,
	.action-section,
	.stats-section,
	.help-section {
		flex-shrink: 0;
	}

	.tool-grid,
	.action-grid {
		display: flex;
		gap: 0.5rem;
	}

	.tool-grid.vertical,
	.action-grid.vertical {
		flex-direction: column;
	}

	.tool-grid.horizontal,
	.action-grid.horizontal {
		flex-direction: row flex-wrap;
	}

	:global(.tool-button),
	:global(.action-button) {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 0.5rem;
		min-width: 40px;
	}

	.tool-panel.vertical :global(.tool-button),
	.tool-panel.vertical :global(.action-button) {
		justify-content: center;
	}

	.tool-icon,
	.action-icon {
		font-size: 1rem;
	}

	.tool-label,
	.action-label {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.tool-shortcut {
		margin-left: auto;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.stats-section {
		border-top: 1px solid #6b7280;
		padding-top: 1rem;
	}

	.tool-panel.vertical .stats-section {
		border-top: 0;
		border-left: 1px solid #6b7280;
		padding-top: 0;
		padding-left: 1rem;
	}

	.stats-grid {
		gap: 0.25rem;
		display: flex;
		flex-direction: column;
	}

	.stat-item {
		display: flex justify-between text-xs;
	}

	.stat-label {
		color: #4b5563;
	}

	.stat-value {
		font-weight: 500;
		color: #111827;
	}

	.help-section {
		border-top: 1px solid #6b7280;
		padding-top: 1rem;
	}

	.tool-panel.vertical .help-section {
		border-top: 0;
		border-left: 1px solid #6b7280;
		padding-top: 0;
		padding-left: 1rem;
	}

	.shortcuts-details {
		font-size: 0.75rem;
	}

	.shortcuts-summary {
		margin-bottom: 0.5rem;
		cursor: pointer;
		font-weight: 500;
		color: #4b5563;
	}

	.shortcuts-list {
		gap: 0.25rem;
		display: flex;
		flex-direction: column;
	}

	.shortcut-item {
		display: flex justify-between;
	}

	.shortcut-key {
		border-radius: 0.25rem;
		background-color: #f3f4f6;
		padding-left: 0.25rem;
		padding-right: 0.25rem;
		padding-top: 0.125rem;
		padding-bottom: 0.125rem;
		font-family: monospace;
		font-size: 0.75rem;
	}

	.shortcut-desc {
		color: #4b5563;
	}
</style>
