<script lang="ts">
	interface BoundingBox {
		id: string;
		x: number;
		y: number;
		width: number;
		height: number;
		label: string;
		isSelected: boolean;
	}

	interface Props {
		annotations: BoundingBox[];
		onAnnotationSelect?: (id: string) => void;
		onAnnotationDelete?: (id: string) => void;
		onAnnotationUpdate?: (id: string, updates: Partial<BoundingBox>) => void;
		'data-testid'?: string;
	}

	const {
		annotations,
		onAnnotationSelect,
		onAnnotationDelete,
		onAnnotationUpdate,
		'data-testid': testId
	}: Props = $props();

	let editingId = $state<string | null>(null);
	let editingLabel = $state('');

	function startEditing(annotation: BoundingBox) {
		editingId = annotation.id;
		editingLabel = annotation.label;
	}

	function saveEdit() {
		if (editingId && onAnnotationUpdate) {
			onAnnotationUpdate(editingId, { label: editingLabel });
		}
		editingId = null;
		editingLabel = '';
	}

	function cancelEdit() {
		editingId = null;
		editingLabel = '';
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveEdit();
		} else if (event.key === 'Escape') {
			cancelEdit();
		}
	}

	function formatCoordinate(value: number): string {
		return (value * 100).toFixed(1) + '%';
	}
</script>

<div class="annotation-panel" data-testid={testId}>
	<div class="panel-header">
		<h3>Annotations ({annotations?.length || 0})</h3>
	</div>

	<div class="annotation-list" data-testid="annotation-list">
		{#each annotations || [] as annotation (annotation.id)}
			<div
				class="annotation-item"
				class:selected={annotation.isSelected}
				onclick={() => onAnnotationSelect?.(annotation.id)}
				onkeydown={(e) => e.key === 'Enter' && onAnnotationSelect?.(annotation.id)}
				role="button"
				tabindex="0"
				data-testid="annotation-{annotation.id}"
			>
				<div class="annotation-header">
					{#if editingId === annotation.id}
						<input
							bind:value={editingLabel}
							class="label-input"
							onkeydown={handleKeyDown}
							onblur={saveEdit}
						/>
					{:else}
						<span class="annotation-label">{annotation.label}</span>
						<div class="annotation-actions">
							<button
								class="action-button edit"
								onclick={(e) => {
									e.stopPropagation();
									startEditing(annotation);
								}}
								aria-label="Edit label"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
									<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
								</svg>
							</button>
							<button
								class="action-button delete"
								onclick={(e) => {
									e.stopPropagation();
									onAnnotationDelete?.(annotation.id);
								}}
								aria-label="Delete annotation"
								data-testid="delete-annotation-btn"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<polyline points="3,6 5,6 21,6" />
									<path
										d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"
									/>
									<line x1="10" y1="11" x2="10" y2="17" />
									<line x1="14" y1="11" x2="14" y2="17" />
								</svg>
							</button>
						</div>
					{/if}
				</div>

				<div class="annotation-details">
					<div class="coordinate-grid">
						<div class="coordinate-item">
							<span class="coordinate-label">X:</span>
							<span class="coordinate-value">{formatCoordinate(annotation.x)}</span>
						</div>
						<div class="coordinate-item">
							<span class="coordinate-label">Y:</span>
							<span class="coordinate-value">{formatCoordinate(annotation.y)}</span>
						</div>
						<div class="coordinate-item">
							<span class="coordinate-label">W:</span>
							<span class="coordinate-value">{formatCoordinate(annotation.width)}</span>
						</div>
						<div class="coordinate-item">
							<span class="coordinate-label">H:</span>
							<span class="coordinate-value">{formatCoordinate(annotation.height)}</span>
						</div>
					</div>
				</div>
			</div>
		{/each}

		{#if annotations.length === 0}
			<div class="empty-state">
				<p>No annotations yet</p>
				<p class="empty-hint">Select the bbox tool and draw on the image to create annotations</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.annotation-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: white;
		border: 1px solid #e1e8ed;
		border-radius: 8px;
		overflow: hidden;
	}

	.panel-header {
		padding: 1rem;
		border-bottom: 1px solid #e1e8ed;
		background-color: #f8f9fa;
	}

	.panel-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #333;
	}

	.annotation-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.annotation-item {
		padding: 0.75rem;
		margin-bottom: 0.5rem;
		border: 1px solid #e1e8ed;
		border-radius: 6px;
		background-color: white;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.annotation-item:hover {
		border-color: #4ecdc4;
		box-shadow: 0 2px 4px rgba(78, 205, 196, 0.1);
	}

	.annotation-item.selected {
		border-color: #ff6b6b;
		background-color: rgba(255, 107, 107, 0.05);
		box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);
	}

	.annotation-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.annotation-label {
		font-weight: 500;
		color: #333;
		flex: 1;
	}

	.label-input {
		flex: 1;
		padding: 0.25rem 0.5rem;
		border: 1px solid #4ecdc4;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		outline: none;
	}

	.annotation-actions {
		display: flex;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.annotation-item:hover .annotation-actions {
		opacity: 1;
	}

	.action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		border-radius: 4px;
		background-color: transparent;
		color: #666;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-button:hover {
		background-color: #f1f1f1;
	}

	.action-button.edit:hover {
		background-color: #e3f2fd;
		color: #1976d2;
	}

	.action-button.delete:hover {
		background-color: #ffebee;
		color: #d32f2f;
	}

	.annotation-details {
		font-size: 0.75rem;
		color: #666;
	}

	.coordinate-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.25rem;
	}

	.coordinate-item {
		display: flex;
		justify-content: space-between;
	}

	.coordinate-label {
		font-weight: 500;
	}

	.coordinate-value {
		font-family: monospace;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: #666;
	}

	.empty-state p {
		margin: 0;
	}

	.empty-hint {
		font-size: 0.875rem;
		margin-top: 0.5rem;
		opacity: 0.8;
	}
</style>
