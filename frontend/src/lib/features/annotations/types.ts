import type { Annotation } from '$lib/graphql/generated/graphql';

/**
 * Annotation tool types
 */
export type AnnotationTool = 'select' | 'bbox' | 'polygon' | 'point';

/**
 * Canvas interaction modes
 */
export type CanvasMode = 'view' | 'draw' | 'edit' | 'select';

/**
 * Annotation action types for undo/redo
 */
export type AnnotationAction =
	| { type: 'ADD_ANNOTATION'; annotation: ClientAnnotation }
	| { type: 'UPDATE_ANNOTATION'; id: string; annotation: Partial<ClientAnnotation> }
	| { type: 'DELETE_ANNOTATION'; id: string; annotation: ClientAnnotation }
	| { type: 'MOVE_ANNOTATION'; id: string; oldPosition: Point; newPosition: Point }
	| { type: 'RESIZE_ANNOTATION'; id: string; oldBounds: Rectangle; newBounds: Rectangle };

/**
 * Point coordinate
 */
export interface Point {
	x: number;
	y: number;
}

/**
 * Rectangle bounds
 */
export interface Rectangle {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Client-side annotation with additional metadata
 */
export interface ClientAnnotation {
	id: string; // Temporary ID for client-side management
	type: 'bbox' | 'polygon' | 'point';
	bounds: Rectangle;
	annotation: Annotation;
	isSelected?: boolean;
	isEditing?: boolean;
	isDragging?: boolean;
	resizeHandle?: ResizeHandle | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Resize handle positions for bounding boxes
 */
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

/**
 * Canvas state interface
 */
export interface CanvasState {
	// View state
	zoom: number;
	panX: number;
	panY: number;

	// Image dimensions
	imageWidth: number;
	imageHeight: number;

	// Canvas dimensions
	canvasWidth: number;
	canvasHeight: number;

	// Interaction state
	mode: CanvasMode;
	activeTool: AnnotationTool;
	isDragging: boolean;
	lastPointerPos: Point | null;

	// Selection state
	selectedAnnotationId: string | null;
	hoveredAnnotationId: string | null;

	// Drawing state
	isDrawing: boolean;
	drawingStartPos: Point | null;
	drawingCurrentPos: Point | null;
}

/**
 * Annotation store state
 */
export interface AnnotationStoreState {
	// Core data
	annotations: ClientAnnotation[];
	taskId: string | null;
	imageId: string | null;

	// Canvas state
	canvas: CanvasState;

	// Undo/redo
	history: AnnotationAction[];
	historyIndex: number;
	maxHistorySize: number;

	// Loading states
	loading: boolean;
	saving: boolean;
	error: string | null;

	// UI state
	toolPanelOpen: boolean;
	propertiesPanelOpen: boolean;
}

/**
 * Tool configuration
 */
export interface ToolConfig {
	id: AnnotationTool;
	name: string;
	icon: string;
	description: string;
	shortcut?: string;
	enabled: boolean;
}

/**
 * Annotation validation result
 */
export interface AnnotationValidation {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Mouse event data for annotations
 */
export interface AnnotationPointerEvent {
	point: Point;
	originalEvent: PointerEvent;
	target?: ClientAnnotation;
	handle?: ResizeHandle;
}

/**
 * Coordinate transformation utilities interface
 */
export interface CoordinateTransform {
	screenToCanvas: (point: Point) => Point;
	canvasToScreen: (point: Point) => Point;
	screenToImage: (point: Point) => Point;
	imageToScreen: (point: Point) => Point;
	canvasToImage: (point: Point) => Point;
	imageToCanvas: (point: Point) => Point;
}

/**
 * Export format for annotations
 */
export interface AnnotationExport {
	taskId: string;
	imageId: string;
	imageWidth: number;
	imageHeight: number;
	annotations: ClientAnnotation[];
	metadata: {
		exportedAt: string;
		tool: string;
		version: string;
	};
}

/**
 * Annotation creation form data
 */
export interface CreateAnnotationForm {
	type: 'bbox' | 'polygon' | 'point';
	bounds: Rectangle;
	annotation: {
		text?: string;
		tags?: string[];
	};
}

/**
 * Annotation update form data
 */
export interface UpdateAnnotationForm {
	id: string;
	bounds?: Rectangle;
	annotation?: {
		text?: string;
		tags?: string[];
	};
}

/**
 * Performance optimization settings
 */
export interface PerformanceSettings {
	viewportCulling: boolean;
	levelOfDetail: boolean;
	maxVisibleAnnotations: number;
	batchSize: number;
	lodThreshold: number;
	cullingPadding: number;
}

/**
 * Canvas configuration
 */
export interface CanvasConfig {
	minZoom: number;
	maxZoom: number;
	zoomStep: number;
	gridEnabled: boolean;
	gridSize: number;
	snapToGrid: boolean;
	snapTolerance: number;
	performance: PerformanceSettings;
}

/**
 * Default performance settings
 */
export const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings = {
	viewportCulling: true,
	levelOfDetail: true,
	maxVisibleAnnotations: 500,
	batchSize: 50,
	lodThreshold: 0.5,
	cullingPadding: 100
};

/**
 * Default canvas configuration
 */
export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
	minZoom: 0.1,
	maxZoom: 10,
	zoomStep: 1.2,
	gridEnabled: false,
	gridSize: 20,
	snapToGrid: false,
	snapTolerance: 5,
	performance: DEFAULT_PERFORMANCE_SETTINGS
};

/**
 * Tool configurations
 */
export const TOOL_CONFIGS: Record<AnnotationTool, ToolConfig> = {
	select: {
		id: 'select',
		name: 'Select',
		icon: '👆',
		description: 'Select and move annotations',
		shortcut: 'V',
		enabled: true
	},
	bbox: {
		id: 'bbox',
		name: 'Bounding Box',
		icon: '⬜',
		description: 'Draw rectangular bounding boxes',
		shortcut: 'B',
		enabled: true
	},
	polygon: {
		id: 'polygon',
		name: 'Polygon',
		icon: '⬟',
		description: 'Draw polygon annotations',
		shortcut: 'P',
		enabled: false // Will be implemented in Block 8
	},
	point: {
		id: 'point',
		name: 'Point',
		icon: '📍',
		description: 'Mark specific points',
		shortcut: 'O',
		enabled: false // Will be implemented in Block 8
	}
};

/**
 * Annotation display styles
 */
export const ANNOTATION_STYLES = {
	bbox: {
		fill: 'rgba(59, 130, 246, 0.1)', // blue-500 with opacity
		stroke: 'rgb(59, 130, 246)', // blue-500
		strokeWidth: 2,
		cornerRadius: 0
	},
	polygon: {
		fill: 'rgba(16, 185, 129, 0.1)', // emerald-500 with opacity
		stroke: 'rgb(16, 185, 129)', // emerald-500
		strokeWidth: 2
	},
	point: {
		fill: 'rgb(239, 68, 68)', // red-500
		stroke: 'rgb(220, 38, 38)', // red-600
		strokeWidth: 2,
		radius: 4
	},
	selected: {
		stroke: 'rgb(234, 179, 8)', // yellow-500
		strokeWidth: 3
	},
	hover: {
		stroke: 'rgb(168, 85, 247)', // purple-500
		strokeWidth: 2
	},
	handle: {
		fill: 'white',
		stroke: 'rgb(59, 130, 246)',
		strokeWidth: 2,
		radius: 6
	}
};

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
	DELETE: 'Delete',
	BACKSPACE: 'Backspace',
	ESCAPE: 'Escape',
	ENTER: 'Enter',
	UNDO: 'ctrl+z',
	REDO: 'ctrl+y',
	SELECT_ALL: 'ctrl+a',
	COPY: 'ctrl+c',
	PASTE: 'ctrl+v',
	SAVE: 'ctrl+s'
} as const;
