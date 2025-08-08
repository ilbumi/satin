/**
 * Validate that a bounding box has valid coordinates
 * @param bbox - Bounding box with normalized coordinates (0-1)
 * @returns True if valid, false otherwise
 */
export function isValidBoundingBox(bbox: {
	x: number;
	y: number;
	width: number;
	height: number;
}): boolean {
	const { x, y, width, height } = bbox;

	// Check that all values are numbers and not NaN
	if (
		typeof x !== 'number' ||
		typeof y !== 'number' ||
		typeof width !== 'number' ||
		typeof height !== 'number' ||
		Number.isNaN(x) ||
		Number.isNaN(y) ||
		Number.isNaN(width) ||
		Number.isNaN(height)
	) {
		return false;
	}

	// Check that coordinates are within bounds
	if (x < 0 || x > 1 || y < 0 || y > 1) {
		return false;
	}

	// Check that width and height are positive
	if (width <= 0 || height <= 0) {
		return false;
	}

	// Check that bounding box doesn't exceed image bounds
	if (x + width > 1 || y + height > 1) {
		return false;
	}

	return true;
}

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validate that a string is not empty or just whitespace
 * @param value - String to validate
 * @returns True if string has content
 */
export function isNonEmptyString(value: string): boolean {
	return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate file type for images
 * @param file - File to validate
 * @returns True if file is a valid image type
 */
export function isValidImageFile(file: File): boolean {
	const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
	return validTypes.includes(file.type);
}

/**
 * Validate file size is within limit
 * @param file - File to validate
 * @param maxSizeInMB - Maximum file size in megabytes
 * @returns True if file size is within limit
 */
export function isValidFileSize(file: File, maxSizeInMB: number): boolean {
	const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
	return file.size <= maxSizeInBytes;
}

/**
 * Validate project name meets requirements
 * @param name - Project name to validate
 * @returns True if valid project name
 */
export function isValidProjectName(name: string): boolean {
	if (!isNonEmptyString(name)) {
		return false;
	}

	// Check length (between 3 and 50 characters)
	const trimmed = name.trim();
	if (trimmed.length < 3 || trimmed.length > 50) {
		return false;
	}

	// Check for valid characters (alphanumeric, spaces, hyphens, underscores)
	const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
	return validNameRegex.test(trimmed);
}

/**
 * Validate annotation label
 * @param label - Label text to validate
 * @returns True if valid label
 */
export function isValidAnnotationLabel(label: string): boolean {
	if (!isNonEmptyString(label)) {
		return false;
	}

	// Check length (between 1 and 100 characters)
	const trimmed = label.trim();
	if (trimmed.length < 1 || trimmed.length > 100) {
		return false;
	}

	return true;
}
