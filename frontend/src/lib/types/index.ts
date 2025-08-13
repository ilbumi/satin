// Re-export all types from modules
export * from './domain';
export * from './ui';
export * from './api';

// Type guards and utilities
export function isProject(obj: unknown): obj is import('./domain').Project {
	return (
		obj !== null &&
		typeof obj === 'object' &&
		'id' in obj &&
		'name' in obj &&
		typeof (obj as { id: unknown }).id === 'string' &&
		typeof (obj as { name: unknown }).name === 'string'
	);
}

export function isImage(obj: unknown): obj is import('./domain').Image {
	return (
		obj !== null &&
		typeof obj === 'object' &&
		'id' in obj &&
		'url' in obj &&
		typeof (obj as { id: unknown }).id === 'string' &&
		typeof (obj as { url: unknown }).url === 'string'
	);
}

export function isTask(obj: unknown): obj is import('./domain').Task {
	return (
		obj !== null &&
		typeof obj === 'object' &&
		'id' in obj &&
		'image' in obj &&
		'project' in obj &&
		typeof (obj as { id: unknown }).id === 'string'
	);
}

export function isBBox(obj: unknown): obj is import('./domain').BBox {
	return (
		obj !== null &&
		typeof obj === 'object' &&
		'x' in obj &&
		'y' in obj &&
		'width' in obj &&
		'height' in obj &&
		'annotation' in obj &&
		typeof (obj as { x: unknown }).x === 'number' &&
		typeof (obj as { y: unknown }).y === 'number' &&
		typeof (obj as { width: unknown }).width === 'number' &&
		typeof (obj as { height: unknown }).height === 'number'
	);
}
