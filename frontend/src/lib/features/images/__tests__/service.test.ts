import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageService } from '../service';

describe('ImageService', () => {
	let imageService: ImageService;

	beforeEach(() => {
		imageService = new ImageService();
		vi.clearAllMocks();

		// Mock global fetch for upload tests
		global.fetch = vi.fn();
	});

	describe('validateImageFile', () => {
		it('should validate valid image file', () => {
			const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
			Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

			const result = imageService.validateImageFile(file);

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should reject invalid file type', () => {
			const file = new File(['dummy'], 'test.txt', { type: 'text/plain' });

			const result = imageService.validateImageFile(file);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('File type not supported');
		});

		it('should reject oversized file', () => {
			const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
			Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 }); // 20MB

			const result = imageService.validateImageFile(file);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('File size too large');
		});
	});

	describe('formatFileSize', () => {
		it('should format file sizes correctly', () => {
			expect(imageService.formatFileSize(0)).toBe('0 Bytes');
			expect(imageService.formatFileSize(1024)).toBe('1 KB');
			expect(imageService.formatFileSize(1024 * 1024)).toBe('1 MB');
			expect(imageService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
		});

		it('should handle decimal values', () => {
			expect(imageService.formatFileSize(1536)).toBe('1.5 KB');
			expect(imageService.formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
		});
	});

	describe('generateThumbnailUrl', () => {
		it('should generate thumbnail URL with default dimensions', () => {
			const url = 'https://example.com/image.jpg';
			const result = imageService.generateThumbnailUrl(url);

			expect(result).toBe('https://example.com/image.jpg?w=200&h=200&fit=crop');
		});

		it('should generate thumbnail URL with custom dimensions', () => {
			const url = 'https://example.com/image.jpg';
			const result = imageService.generateThumbnailUrl(url, 300, 400);

			expect(result).toBe('https://example.com/image.jpg?w=300&h=400&fit=crop');
		});
	});

	describe('generatePreviewUrl', () => {
		it('should generate preview URL with default width', () => {
			const url = 'https://example.com/image.jpg';
			const result = imageService.generatePreviewUrl(url);

			expect(result).toBe('https://example.com/image.jpg?w=800&fit=scale');
		});

		it('should generate preview URL with custom width', () => {
			const url = 'https://example.com/image.jpg';
			const result = imageService.generatePreviewUrl(url, 1200);

			expect(result).toBe('https://example.com/image.jpg?w=1200&fit=scale');
		});
	});

	describe('mapImageToDetail', () => {
		it('should map GraphQL image to ImageDetail', () => {
			const image = {
				id: '1',
				url: 'https://example.com/uploads/image.jpg'
			};

			const result = imageService.mapImageToDetail(image);

			expect(result.id).toBe('1');
			expect(result.url).toBe('https://example.com/uploads/image.jpg');
			expect(result.filename).toBe('image.jpg');
			expect(result.thumbnailUrl).toBeTruthy();
			expect(result.previewUrl).toBeTruthy();
		});

		it('should handle URL without filename', () => {
			const image = {
				id: '1',
				url: 'https://example.com/uploads/'
			};

			const result = imageService.mapImageToDetail(image);

			expect(result.filename).toBe('unknown');
		});
	});

	describe('mapImageToSummary', () => {
		it('should map ImageDetail to ImageSummary', () => {
			const imageDetail = {
				id: '1',
				url: 'https://example.com/image.jpg',
				filename: 'test.jpg',
				fileSize: 1024 * 1024,
				mimeType: 'image/jpeg',
				thumbnailUrl: 'https://example.com/thumb.jpg',
				dimensions: { width: 800, height: 600 },
				metadata: {
					status: 'ready' as const,
					uploadedAt: '2024-01-01T00:00:00Z',
					projectName: 'Test Project'
				}
			};

			const result = imageService.mapImageToSummary(imageDetail);

			expect(result.id).toBe('1');
			expect(result.filename).toBe('test.jpg');
			expect(result.status).toBe('ready');
			expect(result.dimensions).toBe('800x600');
			expect(result.projectName).toBe('Test Project');
		});
	});

	describe('uploadImage error handling', () => {
		it('should handle upload failure from fetch', async () => {
			// Mock failed fetch
			const uploadResponse = new Response(null, {
				status: 400,
				statusText: 'Upload failed'
			});

			vi.mocked(global.fetch).mockResolvedValue(uploadResponse);

			const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });

			await expect(imageService.uploadImage(file)).rejects.toThrow('Upload failed');
		});
	});
});
