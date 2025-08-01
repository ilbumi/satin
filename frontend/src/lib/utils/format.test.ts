import { describe, expect, it } from 'vitest';
import { formatCoordinate, formatFileSize, formatDate, truncateText } from './format';

describe('formatCoordinate', () => {
	it('should format decimal values as percentages', () => {
		expect(formatCoordinate(0.123)).toBe('12.3%');
		expect(formatCoordinate(0.456)).toBe('45.6%');
		expect(formatCoordinate(0.789)).toBe('78.9%');
	});

	it('should handle edge cases', () => {
		expect(formatCoordinate(0)).toBe('0.0%');
		expect(formatCoordinate(1)).toBe('100.0%');
		expect(formatCoordinate(0.001)).toBe('0.1%');
		expect(formatCoordinate(0.999)).toBe('99.9%');
	});

	it('should round to one decimal place', () => {
		expect(formatCoordinate(0.1234)).toBe('12.3%');
		expect(formatCoordinate(0.1235)).toBe('12.3%'); // 12.35 rounds down to 12.3
		expect(formatCoordinate(0.1236)).toBe('12.4%');
	});
});

describe('formatFileSize', () => {
	it('should format bytes correctly', () => {
		expect(formatFileSize(0)).toBe('0 B');
		expect(formatFileSize(512)).toBe('512 B');
		expect(formatFileSize(1023)).toBe('1023 B');
	});

	it('should format kilobytes correctly', () => {
		expect(formatFileSize(1024)).toBe('1 KB');
		expect(formatFileSize(1536)).toBe('1.5 KB');
		expect(formatFileSize(2048)).toBe('2 KB');
	});

	it('should format megabytes correctly', () => {
		expect(formatFileSize(1024 * 1024)).toBe('1 MB');
		expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
		expect(formatFileSize(2.75 * 1024 * 1024)).toBe('2.8 MB');
	});

	it('should format gigabytes correctly', () => {
		expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
		expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB');
	});

	it('should handle large file sizes', () => {
		expect(formatFileSize(5.5 * 1024 * 1024 * 1024)).toBe('5.5 GB');
	});

	it('should round to one decimal place', () => {
		expect(formatFileSize(1234567)).toBe('1.2 MB');
		expect(formatFileSize(1987654321)).toBe('1.9 GB');
	});
});

describe('formatDate', () => {
	it('should format Date objects', () => {
		const date = new Date('2023-12-25T15:30:00.000Z');
		const formatted = formatDate(date);

		// Check that it contains expected components
		expect(formatted).toContain('2023');
		expect(formatted).toContain('Dec');
		expect(formatted).toContain('25');
	});

	it('should format ISO date strings', () => {
		const dateString = '2023-12-25T15:30:00.000Z';
		const formatted = formatDate(dateString);

		expect(formatted).toContain('2023');
		expect(formatted).toContain('Dec');
		expect(formatted).toContain('25');
	});

	it('should include time information', () => {
		const date = new Date('2023-12-25T15:30:00.000Z');
		const formatted = formatDate(date);

		// Should contain time components (exact format depends on timezone)
		expect(formatted).toMatch(/\d{1,2}:\d{2}/); // HH:MM pattern
	});

	it('should handle different months', () => {
		const janDate = new Date('2023-01-15T12:00:00.000Z');
		const julDate = new Date('2023-07-15T12:00:00.000Z');

		expect(formatDate(janDate)).toContain('Jan');
		expect(formatDate(julDate)).toContain('Jul');
	});
});

describe('truncateText', () => {
	it('should not truncate text shorter than max length', () => {
		expect(truncateText('Hello', 10)).toBe('Hello');
		expect(truncateText('Test', 5)).toBe('Test');
	});

	it('should not truncate text equal to max length', () => {
		expect(truncateText('Hello', 5)).toBe('Hello');
		expect(truncateText('Test text', 9)).toBe('Test text');
	});

	it('should truncate text longer than max length', () => {
		expect(truncateText('Hello world', 8)).toBe('Hello...');
		expect(truncateText('This is a long text', 10)).toBe('This is...');
	});

	it('should handle edge cases', () => {
		expect(truncateText('', 5)).toBe('');
		expect(truncateText('Hi', 3)).toBe('Hi');
		expect(truncateText('Hello', 3)).toBe('...');
	});

	it('should account for ellipsis in length calculation', () => {
		// Max length 6, so 3 chars + '...' = 6 total
		expect(truncateText('Hello world', 6)).toBe('Hel...');
		// Max length 5, so 2 chars + '...' = 5 total
		expect(truncateText('Hello world', 5)).toBe('He...');
	});

	it('should handle very short max lengths', () => {
		expect(truncateText('Hello', 3)).toBe('...');
		expect(truncateText('Hello', 2)).toBe('...');
		expect(truncateText('Hello', 1)).toBe('...');
	});
});
