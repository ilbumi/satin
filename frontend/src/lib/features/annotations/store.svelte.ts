import type {
	ClientAnnotation,
	AnnotationAction,
	CanvasState,
	AnnotationTool,
	CanvasMode
} from './types';
import { createPersistenceManager } from '$lib/core/persistence';
import { localStorageAdapter } from '$lib/core/persistence/adapters/localStorage';

/**
 * Persistable annotation state structure
 */
interface PersistedAnnotationState {
	taskId: string | null;
	imageId: string | null;
	annotations: ClientAnnotation[];
	history: AnnotationAction[];
	historyIndex: number;
	canvas: Partial<CanvasState>; // Only persist non-volatile canvas state
	toolPanelOpen: boolean;
	propertiesPanelOpen: boolean;
}

/**
 * Annotation store with Svelte 5 runes and persistence
 * Manages annotation state, undo/redo, UI state, and auto-saves work
 */
class AnnotationStore {
	// Persistence manager
	private persistenceManager = createPersistenceManager<PersistedAnnotationState>(
		'annotation-store',
		localStorageAdapter,
		{
			version: 1,
			debounceMs: 500, // Auto-save every 500ms after changes
			ttl: 24 * 60 * 60 * 1000 // Keep for 24 hours
		}
	);
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
	 * Auto-save current state to persistence
	 */
	private async autoSave() {
		if (!this.taskId || !this.imageId) return;

		try {
			const state: PersistedAnnotationState = {
				taskId: this.taskId,
				imageId: this.imageId,
				annotations: this.annotations,
				history: this.history,
				historyIndex: this.historyIndex,
				canvas: {
					zoom: this.canvas.zoom,
					panX: this.canvas.panX,
					panY: this.canvas.panY,
					activeTool: this.canvas.activeTool,
					mode: this.canvas.mode
				},
				toolPanelOpen: this.toolPanelOpen,
				propertiesPanelOpen: this.propertiesPanelOpen
			};

			await this.persistenceManager.save(state);
		} catch (error) {
			console.warn('Failed to auto-save annotation state:', error);
		}
	}

	/**
	 * Load persisted state for current task/image
	 */
	async loadPersistedState(taskId: string, imageId: string): Promise<boolean> {
		try {
			const persistedState = await this.persistenceManager.load();

			if (
				persistedState &&
				persistedState.taskId === taskId &&
				persistedState.imageId === imageId
			) {
				// Restore persisted data
				this.annotations = persistedState.annotations;
				this.history = persistedState.history;
				this.historyIndex = persistedState.historyIndex;

				// Restore canvas state (only non-volatile parts)
				if (persistedState.canvas) {
					this.canvas.zoom = persistedState.canvas.zoom || 1;
					this.canvas.panX = persistedState.canvas.panX || 0;
					this.canvas.panY = persistedState.canvas.panY || 0;
					this.canvas.activeTool = persistedState.canvas.activeTool || 'select';
					this.canvas.mode = persistedState.canvas.mode || 'view';
				}

				// Restore UI state
				this.toolPanelOpen = persistedState.toolPanelOpen ?? true;
				this.propertiesPanelOpen = persistedState.propertiesPanelOpen ?? true;

				return true;
			}

			return false;
		} catch (error) {
			console.warn('Failed to load persisted annotation state:', error);
			return false;
		}
	}

	/**
	 * Clear persisted state for current task
	 */
	async clearPersistedState(): Promise<void> {
		try {
			await this.persistenceManager.clear();
		} catch (error) {
			console.warn('Failed to clear persisted annotation state:', error);
		}
	}

	/**
	 * Initialize the store with task and image data
	 */
	async initialize(taskId: string, imageId: string, imageWidth: number, imageHeight: number) {
		this.taskId = taskId;
		this.imageId = imageId;
		this.canvas.imageWidth = imageWidth;
		this.canvas.imageHeight = imageHeight;
		this.error = null;

		// Try to load persisted state for this task/image
		const restored = await this.loadPersistedState(taskId, imageId);
		if (!restored) {
			this.clearHistory();
		}

		// Start auto-saving after initialization
		this.autoSave();
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
		this.autoSave();
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
		this.autoSave();
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

		this.autoSave();
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
		this.autoSave();
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
		this.autoSave();
	}

	/**
	 * Undo the last action
	 */
	undo() {
		if (!this.canUndo()) return;

		const action = this.history[this.historyIndex];
		this.undoAction(action);
		this.historyIndex--;
		this.autoSave();
	}

	/**
	 * Redo the next action
	 */
	redo() {
		if (!this.canRedo()) return;

		this.historyIndex++;
		const action = this.history[this.historyIndex];
		this.executeAction(action);
		this.autoSave();
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
		this.autoSave();
	}

	/**
	 * Update canvas state
	 */
	updateCanvasState(updates: Partial<CanvasState>) {
		Object.assign(this.canvas, updates);
		// Only auto-save if we're updating persistent canvas state
		if (
			'zoom' in updates ||
			'panX' in updates ||
			'panY' in updates ||
			'activeTool' in updates ||
			'mode' in updates
		) {
			this.autoSave();
		}
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

		this.autoSave();
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

	/**
	 * Cleanup method for store - can be called when component unmounts
	 * Cancels any pending operations and cleans up state
	 */
	cleanup() {
		// Reset all state
		this.reset();

		// Clear any persisted state to prevent memory leaks
		this.clearPersistedState().catch((error) => {
			console.warn('Failed to clear persisted state during cleanup:', error);
		});
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
