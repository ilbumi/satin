/**
 * Utility functions for generating test images as data URLs
 */

export interface ImageGeneratorOptions {
	width?: number;
	height?: number;
	format?: 'svg' | 'png';
	color?: string;
	pattern?: 'solid' | 'gradient' | 'grid' | 'random';
	text?: string;
}

/**
 * Generate a test image as a data URL
 */
export function generateTestImage(options: ImageGeneratorOptions = {}): string {
	const {
		width = 400,
		height = 300,
		format = 'svg',
		color = '#3b82f6',
		pattern = 'gradient',
		text
	} = options;

	if (format === 'svg') {
		return generateSVGDataUrl(width, height, color, pattern, text);
	} else {
		// For PNG, we'll generate an SVG and note that conversion to PNG would require canvas
		console.warn('PNG generation requires canvas API - falling back to SVG');
		return generateSVGDataUrl(width, height, color, pattern, text);
	}
}

/**
 * Generate an SVG data URL with various patterns
 */
function generateSVGDataUrl(
	width: number,
	height: number,
	color: string,
	pattern: string,
	text?: string
): string {
	let svgContent = '';

	switch (pattern) {
		case 'solid':
			svgContent = `<rect width="100%" height="100%" fill="${color}"/>`;
			break;
		case 'gradient':
			svgContent = `
				<defs>
					<linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" style="stop-color:${color};stop-opacity:1" />
						<stop offset="100%" style="stop-color:${adjustColor(color, -30)};stop-opacity:1" />
					</linearGradient>
				</defs>
				<rect width="100%" height="100%" fill="url(#grad)"/>
			`;
			break;
		case 'grid': {
			const gridSize = Math.min(width, height) / 10;
			svgContent = `
				<rect width="100%" height="100%" fill="${adjustColor(color, 20)}"/>
				<defs>
					<pattern id="grid" width="${gridSize}" height="${gridSize}" patternUnits="userSpaceOnUse">
						<path d="M ${gridSize} 0 L 0 0 0 ${gridSize}" fill="none" stroke="${color}" stroke-width="1"/>
					</pattern>
				</defs>
				<rect width="100%" height="100%" fill="url(#grid)" />
			`;
			break;
		}
		case 'random': {
			const circles = Array.from({ length: 5 }, () => {
				const cx = Math.random() * width;
				const cy = Math.random() * height;
				const r = Math.random() * Math.min(width, height) * 0.1 + 10;
				const circleColor = adjustColor(color, (Math.random() - 0.5) * 60);
				return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${circleColor}" opacity="0.7"/>`;
			}).join('');
			svgContent = `
				<rect width="100%" height="100%" fill="${adjustColor(color, 40)}"/>
				${circles}
			`;
			break;
		}
		default:
			svgContent = `<rect width="100%" height="100%" fill="${color}"/>`;
	}

	// Add text if specified
	if (text) {
		const fontSize = Math.min(width, height) / 15;
		svgContent += `
			<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
			      font-family="Arial, sans-serif" font-size="${fontSize}" 
			      fill="white" stroke="black" stroke-width="1">
				${text}
			</text>
		`;
	}

	const svg = `
		<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
			${svgContent}
		</svg>
	`;

	// Convert to base64 data URL
	return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Adjust color brightness
 */
function adjustColor(color: string, amount: number): string {
	// Simple color adjustment - assumes hex colors
	if (!color.startsWith('#')) return color;

	const hex = color.slice(1);
	const num = parseInt(hex, 16);
	const r = Math.max(0, Math.min(255, (num >> 16) + amount));
	const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
	const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));

	return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Generate a sample image for testing
 */
export function generateSampleImage(
	type: 'medical' | 'vehicle' | 'object' | 'nature' = 'object',
	id?: string
): string {
	const colors = {
		medical: '#10b981', // green
		vehicle: '#f59e0b', // orange
		object: '#3b82f6', // blue
		nature: '#059669' // emerald
	};

	const texts = {
		medical: '🏥 Medical Image',
		vehicle: '🚗 Vehicle Image',
		object: '📦 Object Image',
		nature: '🌲 Nature Image'
	};

	return generateTestImage({
		width: 600,
		height: 400,
		color: colors[type],
		pattern: 'gradient',
		text: id ? `${texts[type]} ${id}` : texts[type]
	});
}

/**
 * Generate multiple test images for development
 */
export function generateTestImageSet(count: number = 10): Array<{
	id: string;
	url: string;
	filename: string;
	type: string;
}> {
	const types = ['medical', 'vehicle', 'object', 'nature'] as const;
	const images = [];

	for (let i = 0; i < count; i++) {
		const type = types[i % types.length];
		const id = `${i + 1}`.padStart(3, '0');
		const url = generateSampleImage(type, id);

		images.push({
			id: `test-image-${id}`,
			url,
			filename: `${type}-sample-${id}.svg`,
			type
		});
	}

	return images;
}

/**
 * Validate if a string is a valid data URL
 */
export function isValidDataUrl(url: string): boolean {
	try {
		const dataUrlPattern = /^data:image\/(svg\+xml|png|jpeg|jpg|gif|webp);base64,/i;
		if (!dataUrlPattern.test(url)) return false;

		// Try to decode base64 to verify it's valid
		const base64Data = url.split(',')[1];
		if (!base64Data) return false;

		// Basic base64 validation
		try {
			atob(base64Data);
			return true;
		} catch {
			return false;
		}
	} catch {
		return false;
	}
}

/**
 * Create a minimal 1x1 pixel image for testing
 */
export function createMinimalTestImage(): string {
	// 1x1 red pixel PNG in base64
	return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
}
