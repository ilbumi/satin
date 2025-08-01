import { describe, expect, it } from 'vitest';
import {
	isValidBoundingBox,
	isValidEmail,
	isNonEmptyString,
	isValidImageFile,
	isValidFileSize,
	isValidProjectName,
	isValidAnnotationLabel
} from './validation';

describe('isValidBoundingBox', () => {
	it('should validate correct bounding boxes', () => {
		expect(isValidBoundingBox({ x: 0, y: 0, width: 1, height: 1 })).toBe(true);
		expect(isValidBoundingBox({ x: 0.1, y: 0.2, width: 0.3, height: 0.4 })).toBe(true);
		expect(isValidBoundingBox({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 })).toBe(true);
	});

	it('should reject bounding boxes with invalid coordinates', () => {
		expect(isValidBoundingBox({ x: -0.1, y: 0.2, width: 0.3, height: 0.4 })).toBe(false);
		expect(isValidBoundingBox({ x: 0.1, y: -0.2, width: 0.3, height: 0.4 })).toBe(false);
		expect(isValidBoundingBox({ x: 1.1, y: 0.2, width: 0.3, height: 0.4 })).toBe(false);
		expect(isValidBoundingBox({ x: 0.1, y: 1.2, width: 0.3, height: 0.4 })).toBe(false);
	});

	it('should reject bounding boxes with non-positive dimensions', () => {
		expect(isValidBoundingBox({ x: 0.1, y: 0.2, width: 0, height: 0.4 })).toBe(false);
		expect(isValidBoundingBox({ x: 0.1, y: 0.2, width: 0.3, height: 0 })).toBe(false);
		expect(isValidBoundingBox({ x: 0.1, y: 0.2, width: -0.1, height: 0.4 })).toBe(false);
		expect(isValidBoundingBox({ x: 0.1, y: 0.2, width: 0.3, height: -0.1 })).toBe(false);
	});

	it('should reject bounding boxes that exceed image bounds', () => {
		expect(isValidBoundingBox({ x: 0.8, y: 0.2, width: 0.3, height: 0.4 })).toBe(false);
		expect(isValidBoundingBox({ x: 0.1, y: 0.8, width: 0.3, height: 0.4 })).toBe(false);
		expect(isValidBoundingBox({ x: 0.9, y: 0.9, width: 0.2, height: 0.2 })).toBe(false);
	});

	it('should reject bounding boxes with non-numeric values', () => {
		expect(
			isValidBoundingBox({ x: 'invalid' as unknown as number, y: 0.2, width: 0.3, height: 0.4 })
		).toBe(false);
		expect(
			isValidBoundingBox({ x: 0.1, y: null as unknown as number, width: 0.3, height: 0.4 })
		).toBe(false);
		expect(
			isValidBoundingBox({ x: 0.1, y: 0.2, width: undefined as unknown as number, height: 0.4 })
		).toBe(false);
		expect(isValidBoundingBox({ x: 0.1, y: 0.2, width: 0.3, height: NaN })).toBe(false);
	});
});

describe('isValidEmail', () => {
	it('should validate correct email formats', () => {
		expect(isValidEmail('test@example.com')).toBe(true);
		expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
		expect(isValidEmail('test+tag@example.org')).toBe(true);
		expect(isValidEmail('123@456.com')).toBe(true);
	});

	it('should reject invalid email formats', () => {
		expect(isValidEmail('invalid-email')).toBe(false);
		expect(isValidEmail('@example.com')).toBe(false);
		expect(isValidEmail('test@')).toBe(false);
		expect(isValidEmail('test@.com')).toBe(false);
		expect(isValidEmail('test @example.com')).toBe(false);
		expect(isValidEmail('')).toBe(false);
	});
});

describe('isNonEmptyString', () => {
	it('should validate non-empty strings', () => {
		expect(isNonEmptyString('hello')).toBe(true);
		expect(isNonEmptyString('test string')).toBe(true);
		expect(isNonEmptyString('a')).toBe(true);
	});

	it('should reject empty or whitespace-only strings', () => {
		expect(isNonEmptyString('')).toBe(false);
		expect(isNonEmptyString('   ')).toBe(false);
		expect(isNonEmptyString('\t\n')).toBe(false);
	});

	it('should reject non-string values', () => {
		expect(isNonEmptyString(null as unknown as string)).toBe(false);
		expect(isNonEmptyString(undefined as unknown as string)).toBe(false);
		expect(isNonEmptyString(123 as unknown as string)).toBe(false);
		expect(isNonEmptyString({} as unknown as string)).toBe(false);
	});
});

describe('isValidImageFile', () => {
	it('should validate image file types', () => {
		expect(isValidImageFile(new File([''], 'test.jpg', { type: 'image/jpeg' }))).toBe(true);
		expect(isValidImageFile(new File([''], 'test.jpeg', { type: 'image/jpeg' }))).toBe(true);
		expect(isValidImageFile(new File([''], 'test.png', { type: 'image/png' }))).toBe(true);
		expect(isValidImageFile(new File([''], 'test.gif', { type: 'image/gif' }))).toBe(true);
		expect(isValidImageFile(new File([''], 'test.webp', { type: 'image/webp' }))).toBe(true);
	});

	it('should reject non-image file types', () => {
		expect(isValidImageFile(new File([''], 'test.txt', { type: 'text/plain' }))).toBe(false);
		expect(isValidImageFile(new File([''], 'test.pdf', { type: 'application/pdf' }))).toBe(false);
		expect(isValidImageFile(new File([''], 'test.doc', { type: 'application/msword' }))).toBe(
			false
		);
		expect(isValidImageFile(new File([''], 'test.zip', { type: 'application/zip' }))).toBe(false);
	});
});

describe('isValidFileSize', () => {
	it('should validate files within size limit', () => {
		const smallFile = new File(['x'.repeat(1024)], 'small.txt'); // 1KB
		expect(isValidFileSize(smallFile, 1)).toBe(true); // 1MB limit

		const mediumFile = new File(['x'.repeat(1024 * 512)], 'medium.txt'); // 512KB
		expect(isValidFileSize(mediumFile, 1)).toBe(true); // 1MB limit
	});

	it('should reject files exceeding size limit', () => {
		const largeFile = new File(['x'.repeat(1024 * 1024 * 2)], 'large.txt'); // 2MB
		expect(isValidFileSize(largeFile, 1)).toBe(false); // 1MB limit
	});

	it('should handle exact size limit', () => {
		const exactFile = new File(['x'.repeat(1024 * 1024)], 'exact.txt'); // 1MB
		expect(isValidFileSize(exactFile, 1)).toBe(true); // 1MB limit
	});

	it('should handle different size limits', () => {
		const file = new File(['x'.repeat(1024 * 1024 * 5)], 'test.txt'); // 5MB
		expect(isValidFileSize(file, 4)).toBe(false); // 4MB limit
		expect(isValidFileSize(file, 5)).toBe(true); // 5MB limit
		expect(isValidFileSize(file, 6)).toBe(true); // 6MB limit
	});
});

describe('isValidProjectName', () => {
	it('should validate correct project names', () => {
		expect(isValidProjectName('My Project')).toBe(true);
		expect(isValidProjectName('project-123')).toBe(true);
		expect(isValidProjectName('Test_Project')).toBe(true);
		expect(isValidProjectName('ABC123')).toBe(true);
	});

	it('should reject names that are too short', () => {
		expect(isValidProjectName('ab')).toBe(false);
		expect(isValidProjectName('a')).toBe(false);
		expect(isValidProjectName('')).toBe(false);
	});

	it('should reject names that are too long', () => {
		const longName = 'a'.repeat(51);
		expect(isValidProjectName(longName)).toBe(false);
	});

	it('should reject names with invalid characters', () => {
		expect(isValidProjectName('project@123')).toBe(false);
		expect(isValidProjectName('project#test')).toBe(false);
		expect(isValidProjectName('project!!')).toBe(false);
		expect(isValidProjectName('project/test')).toBe(false);
	});

	it('should handle whitespace correctly', () => {
		expect(isValidProjectName('   Valid Name   ')).toBe(true);
		expect(isValidProjectName('   ')).toBe(false);
		expect(isValidProjectName('  ab  ')).toBe(false); // Too short after trim
	});

	it('should reject non-string values', () => {
		expect(isValidProjectName(null as unknown as string)).toBe(false);
		expect(isValidProjectName(undefined as unknown as string)).toBe(false);
		expect(isValidProjectName(123 as unknown as string)).toBe(false);
	});
});

describe('isValidAnnotationLabel', () => {
	it('should validate correct annotation labels', () => {
		expect(isValidAnnotationLabel('dog')).toBe(true);
		expect(isValidAnnotationLabel('person walking')).toBe(true);
		expect(isValidAnnotationLabel('red car')).toBe(true);
		expect(isValidAnnotationLabel('building-123')).toBe(true);
	});

	it('should reject empty labels', () => {
		expect(isValidAnnotationLabel('')).toBe(false);
		expect(isValidAnnotationLabel('   ')).toBe(false);
		expect(isValidAnnotationLabel('\t\n')).toBe(false);
	});

	it('should reject labels that are too long', () => {
		const longLabel = 'a'.repeat(101);
		expect(isValidAnnotationLabel(longLabel)).toBe(false);
	});

	it('should handle whitespace correctly', () => {
		expect(isValidAnnotationLabel('  dog  ')).toBe(true);
		expect(isValidAnnotationLabel('   ')).toBe(false);
	});

	it('should reject non-string values', () => {
		expect(isValidAnnotationLabel(null as unknown as string)).toBe(false);
		expect(isValidAnnotationLabel(undefined as unknown as string)).toBe(false);
		expect(isValidAnnotationLabel(123 as unknown as string)).toBe(false);
	});

	it('should accept labels at boundary lengths', () => {
		expect(isValidAnnotationLabel('a')).toBe(true); // Minimum length
		expect(isValidAnnotationLabel('a'.repeat(100))).toBe(true); // Maximum length
	});
});
