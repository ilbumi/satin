<script lang="ts">
	export interface ToolbarProps {
		activeTool: 'select' | 'bbox';
		onToolChange: (tool: 'select' | 'bbox') => void;
		onImageUpload?: (file: File) => void;
		'data-testid'?: string;
	}

	const { activeTool, onToolChange, onImageUpload, 'data-testid': testId }: ToolbarProps = $props();

	let fileInput: HTMLInputElement;

	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file && onImageUpload) {
			onImageUpload(file);
		}
	}

	function triggerFileUpload() {
		fileInput?.click();
	}
</script>

<div class="toolbar" data-testid={testId}>
	<div class="tool-section">
		<h3>Tools</h3>
		<div class="tool-buttons">
			<button
				class="tool-button"
				class:active={activeTool === 'select'}
				onclick={() => onToolChange('select')}
				title="Select annotations"
				data-testid="select-tool"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M2 2h6v6H2V2zm0 8h6v6H2v-6zm0 8h6v6H2v-6zm8-16h6v6h-6V2zm0 8h6v6h-6v-6zm0 8h6v6h-6v-6zm8-16h6v6h-6V2zm0 8h6v6h-6v-6zm0 8h6v6h-6v-6z"
					/>
				</svg>
				Select
			</button>

			<button
				class="tool-button"
				class:active={activeTool === 'bbox'}
				onclick={() => onToolChange('bbox')}
				title="Draw bounding boxes"
				data-testid="bbox-tool"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
					<path d="M9 9h6v6H9z" />
				</svg>
				Bbox
			</button>
		</div>
	</div>

	<div class="tool-section">
		<h3>Image</h3>
		<button class="upload-button" onclick={triggerFileUpload}>
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="7,10 12,15 17,10" />
				<line x1="12" y1="15" x2="12" y2="3" />
			</svg>
			Upload Image
		</button>
		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			style="display: none"
			onchange={handleImageUpload}
		/>
	</div>

	<div class="tool-section">
		<h3>Zoom</h3>
		<div class="zoom-controls">
			<button class="zoom-button" data-testid="zoom-in-btn" title="Zoom in" aria-label="Zoom in">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.35-4.35"></path>
					<path d="M11 8v6"></path>
					<path d="M8 11h6"></path>
				</svg>
			</button>
			<div class="zoom-level" data-testid="zoom-level">100%</div>
			<button class="zoom-button" data-testid="zoom-out-btn" title="Zoom out" aria-label="Zoom out">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.35-4.35"></path>
					<path d="M8 11h6"></path>
				</svg>
			</button>
			<button
				class="zoom-button fit-button"
				data-testid="fit-to-screen-btn"
				title="Fit to screen"
				aria-label="Fit to screen"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
					></path>
				</svg>
			</button>
		</div>
	</div>

	<div class="tool-section">
		<h3>Instructions</h3>
		<div class="instructions">
			{#if activeTool === 'bbox'}
				<p>Click and drag to draw bounding boxes</p>
			{:else}
				<p>Click on annotations to select them</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.toolbar {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
		background-color: #f8f9fa;
		border: 1px solid #e1e8ed;
		border-radius: 8px;
		min-width: 200px;
		height: fit-content;
	}

	.tool-section h3 {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #333;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.tool-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tool-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 1px solid #d1d9e0;
		border-radius: 6px;
		background-color: white;
		color: #4a5568;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.tool-button:hover {
		background-color: #e2e8f0;
		border-color: #a0aec0;
	}

	.tool-button.active {
		background-color: #4ecdc4;
		border-color: #4ecdc4;
		color: white;
	}

	.upload-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 1px solid #d1d9e0;
		border-radius: 6px;
		background-color: white;
		color: #4a5568;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
	}

	.upload-button:hover {
		background-color: #e2e8f0;
		border-color: #a0aec0;
	}

	.instructions {
		font-size: 0.75rem;
		color: #666;
		line-height: 1.4;
	}

	.instructions p {
		margin: 0;
	}

	.zoom-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
	}

	.zoom-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: 1px solid #d1d9e0;
		border-radius: 6px;
		background-color: white;
		color: #4a5568;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.zoom-button:hover {
		background-color: #e2e8f0;
		border-color: #a0aec0;
	}

	.zoom-level {
		font-size: 0.75rem;
		font-weight: 600;
		color: #333;
		text-align: center;
		padding: 0.25rem;
		min-width: 50px;
	}

	.fit-button {
		width: 100%;
		height: 32px;
		font-size: 0.75rem;
	}
</style>
