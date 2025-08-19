import type {
	ClientAnnotation,
	AnnotationAction,
	CanvasState,
	AnnotationTool,
	CanvasMode
} from './types';

/**
 * Annotation store with Svelte 5 runes
 * Manages annotation state, undo/redo, and UI state
 */
class AnnotationStore {
	// Core data
	annotations = $state<ClientAnnotation[]>([]);
	taskId = $state<string | null>(null);
	imageId = $state<string | null>(null);

	// Canvas state
	canvas = $state<CanvasState>({
		zoom: 1,
		panX: 0,
		panY: 0,
		imageWidth: 0,
		imageHeight: 0,
		canvasWidth: 0,
		canvasHeight: 0,
		mode: 'view' as CanvasMode,
		activeTool: 'select' as AnnotationTool,
		isDragging: false,
		lastPointerPos: null,
		selectedAnnotationId: null,
		hoveredAnnotationId: null,
		isDrawing: false,
		drawingStartPos: null,
		drawingCurrentPos: null
	});

	// Undo/redo state
	history = $state<AnnotationAction[]>([]);
	historyIndex = $state<number>(-1);
	maxHistorySize = $state<number>(50);

	// Loading states
	loading = $state<boolean>(false);
	saving = $state<boolean>(false);
	error = $state<string | null>(null);

	// UI state
	toolPanelOpen = $state<boolean>(true);
	propertiesPanelOpen = $state<boolean>(true);

	// Derived state
	canUndo = $derived(() => this.historyIndex >= 0);
	canRedo = $derived(() => this.historyIndex < this.history.length - 1);
	selectedAnnotation = $derived(
		() => this.annotations.find((a) => a.id === this.canvas.selectedAnnotationId) || null
	);
	hoveredAnnotation = $derived(
		() => this.annotations.find((a) => a.id === this.canvas.hoveredAnnotationId) || null
	);
	hasUnsavedChanges = $derived(() => this.history.length > 0);

	// Method version for external access
	getHasUnsavedChanges() {
		return this.history.length > 0;
	}

	/**
	 * Initialize the store with task and image data
	 */
	initialize(taskId: string, imageId: string, imageWidth: number, imageHeight: number) {
		this.taskId = taskId;
		this.imageId = imageId;
		this.canvas.imageWidth = imageWidth;
		this.canvas.imageHeight = imageHeight;
		this.clearHistory();
		this.error = null;
	}

	/**
	 * Load annotations from server
	 */
	async loadAnnotations(annotations: ClientAnnotation[]) {
		this.loading = true;
		try {
			this.annotations = [...annotations];
			this.clearHistory();
			this.error = null;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to load annotations';
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Add a new annotation
	 */
	addAnnotation(annotation: ClientAnnotation) {
		const action: AnnotationAction = {
			type: 'ADD_ANNOTATION',
			annotation
		};

		this.executeAction(action);
		this.addToHistory(action);
	}

	/**
	 * Update an existing annotation
	 */
	updateAnnotation(id: string, updates: Partial<ClientAnnotation>) {
		const annotation = this.annotations.find((a) => a.id === id);
		if (!annotation) return;

		const action: AnnotationAction = {
			type: 'UPDATE_ANNOTATION',
			id,
			annotation: updates
		};

		this.executeAction(action);
		this.addToHistory(action);
	}

	/**
	 * Delete an annotation
	 */
	deleteAnnotation(id: string) {
		const annotation = this.annotations.find((a) => a.id === id);
		if (!annotation) return;

		const action: AnnotationAction = {
			type: 'DELETE_ANNOTATION',
			id,
			annotation
		};

		this.executeAction(action);
		this.addToHistory(action);

		// Clear selection if deleted annotation was selected
		if (this.canvas.selectedAnnotationId === id) {
			this.canvas.selectedAnnotationId = null;
		}
	}

	/**
	 * Move an annotation
	 */
	moveAnnotation(
		id: string,
		oldPosition: { x: number; y: number },
		newPosition: { x: number; y: number }
	) {
		const action: AnnotationAction = {
			type: 'MOVE_ANNOTATION',
			id,
			oldPosition,
			newPosition
		};

		this.executeAction(action);
		this.addToHistory(action);
	}

	/**
	 * Resize an annotation
	 */
	resizeAnnotation(
		id: string,
		oldBounds: ClientAnnotation['bounds'],
		newBounds: ClientAnnotation['bounds']
	) {
		const action: AnnotationAction = {
			type: 'RESIZE_ANNOTATION',
			id,
			oldBounds,
			newBounds
		};

		this.executeAction(action);
		this.addToHistory(action);
	}

	/**
	 * Undo the last action
	 */
	undo() {
		if (!this.canUndo()) return;

		const action = this.history[this.historyIndex];
		this.undoAction(action);
		this.historyIndex--;
	}

	/**
	 * Redo the next action
	 */
	redo() {
		if (!this.canRedo()) return;

		this.historyIndex++;
		const action = this.history[this.historyIndex];
		this.executeAction(action);
	}

	/**
	 * Select an annotation
	 */
	selectAnnotation(id: string | null) {
		// Deselect previous
		if (this.canvas.selectedAnnotationId) {
			const prevAnnotation = this.annotations.find(
				(a) => a.id === this.canvas.selectedAnnotationId
			);
			if (prevAnnotation) {
				prevAnnotation.isSelected = false;
			}
		}

		// Select new
		this.canvas.selectedAnnotationId = id;
		if (id) {
			const annotation = this.annotations.find((a) => a.id === id);
			if (annotation) {
				annotation.isSelected = true;
			}
		}
	}

	/**
	 * Set hovered annotation
	 */
	setHoveredAnnotation(id: string | null) {
		this.canvas.hoveredAnnotationId = id;
	}

	/**
	 * Set active tool
	 */
	setActiveTool(tool: AnnotationTool) {
		this.canvas.activeTool = tool;
		this.canvas.mode = tool === 'select' ? 'view' : 'draw';
	}

	/**
	 * Update canvas state
	 */
	updateCanvasState(updates: Partial<CanvasState>) {
		Object.assign(this.canvas, updates);
	}

	/**
	 * Clear all annotations
	 */
	clearAnnotations() {
		if (this.annotations.length === 0) return;

		// Capture state before any modifications
		const annotationsToDelete = [...this.annotations];

		// For each annotation, create and execute delete actions directly
		// This avoids potential reactivity issues with multiple method calls
		annotationsToDelete.forEach((annotation) => {
			const action: AnnotationAction = {
				type: 'DELETE_ANNOTATION',
				id: annotation.id,
				annotation
			};

			// Execute the action (remove from annotations array)
			this.annotations = this.annotations.filter((a) => a.id !== annotation.id);

			// Add to history
			this.addToHistory(action);

			// Clear selection if this annotation was selected
			if (this.canvas.selectedAnnotationId === annotation.id) {
				this.canvas.selectedAnnotationId = null;
			}
		});

		// Ensure canvas state is clean
		this.canvas.hoveredAnnotationId = null;
	}

	/**
	 * Get annotation statistics
	 */
	getStats() {
		return {
			total: this.annotations.length,
			selected: this.selectedAnnotation() ? 1 : 0,
			withText: this.annotations.filter((a) => a.annotation.text && a.annotation.text.length > 0)
				.length,
			withTags: this.annotations.filter((a) => a.annotation.tags && a.annotation.tags.length > 0)
				.length
		};
	}

	/**
	 * Export annotations for saving
	 */
	exportAnnotations() {
		return this.annotations.map((annotation) => ({
			type: annotation.type,
			bounds: annotation.bounds,
			annotation: annotation.annotation
		}));
	}

	/**
	 * Reset the store to initial state
	 */
	reset() {
		this.annotations = [];
		this.taskId = null;
		this.imageId = null;
		this.canvas = {
			zoom: 1,
			panX: 0,
			panY: 0,
			imageWidth: 0,
			imageHeight: 0,
			canvasWidth: 0,
			canvasHeight: 0,
			mode: 'view',
			activeTool: 'select',
			isDragging: false,
			lastPointerPos: null,
			selectedAnnotationId: null,
			hoveredAnnotationId: null,
			isDrawing: false,
			drawingStartPos: null,
			drawingCurrentPos: null
		};
		this.clearHistory();
		this.loading = false;
		this.saving = false;
		this.error = null;
		this.toolPanelOpen = true;
		this.propertiesPanelOpen = true;
	}

	// Private methods

	private executeAction(action: AnnotationAction) {
		switch (action.type) {
			case 'ADD_ANNOTATION':
				this.annotations.push(action.annotation);
				break;

			case 'UPDATE_ANNOTATION': {
				const annotation = this.annotations.find((a) => a.id === action.id);
				if (annotation) {
					Object.assign(annotation, action.annotation);
				}
				break;
			}

			case 'DELETE_ANNOTATION':
				this.annotations = this.annotations.filter((a) => a.id !== action.id);
				break;

			case 'MOVE_ANNOTATION': {
				const moveAnnotation = this.annotations.find((a) => a.id === action.id);
				if (moveAnnotation) {
					moveAnnotation.bounds.x = action.newPosition.x;
					moveAnnotation.bounds.y = action.newPosition.y;
					moveAnnotation.updatedAt = new Date();
				}
				break;
			}

			case 'RESIZE_ANNOTATION': {
				const resizeAnnotation = this.annotations.find((a) => a.id === action.id);
				if (resizeAnnotation) {
					resizeAnnotation.bounds = action.newBounds;
					resizeAnnotation.updatedAt = new Date();
				}
				break;
			}
		}
	}

	private undoAction(action: AnnotationAction) {
		switch (action.type) {
			case 'ADD_ANNOTATION':
				this.annotations = this.annotations.filter((a) => a.id !== action.annotation.id);
				break;

			case 'UPDATE_ANNOTATION': {
				// Note: This is simplified - a full implementation would store the previous state
				// For now, we'll just remove the annotation to keep it simple
				const annotation = this.annotations.find((a) => a.id === action.id);
				if (annotation) {
					// Revert to previous state - this would need to be stored in the action
					// For simplicity, we'll just mark it as needing a full undo system
					console.warn('Update undo not fully implemented - consider storing previous state');
				}
				break;
			}

			case 'DELETE_ANNOTATION':
				this.annotations.push(action.annotation);
				break;

			case 'MOVE_ANNOTATION': {
				const moveAnnotation = this.annotations.find((a) => a.id === action.id);
				if (moveAnnotation) {
					moveAnnotation.bounds.x = action.oldPosition.x;
					moveAnnotation.bounds.y = action.oldPosition.y;
					moveAnnotation.updatedAt = new Date();
				}
				break;
			}

			case 'RESIZE_ANNOTATION': {
				const resizeAnnotation = this.annotations.find((a) => a.id === action.id);
				if (resizeAnnotation) {
					resizeAnnotation.bounds = action.oldBounds;
					resizeAnnotation.updatedAt = new Date();
				}
				break;
			}
		}
	}

	private addToHistory(action: AnnotationAction) {
		// Remove any actions after the current index (for when we undo then do something new)
		this.history = this.history.slice(0, this.historyIndex + 1);

		// Add the new action
		this.history.push(action);
		this.historyIndex++;

		// Limit history size
		if (this.history.length > this.maxHistorySize) {
			this.history.shift();
			this.historyIndex--;
		}
	}

	clearHistory() {
		this.history = [];
		this.historyIndex = -1;
	}
}

// Create and export the store instance
export const annotationStore = new AnnotationStore();
