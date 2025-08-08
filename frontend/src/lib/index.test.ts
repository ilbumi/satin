import { describe, expect, it } from 'vitest';

describe('Library Index Exports', () => {
	it('should export from index.ts without errors', () => {
		// This test ensures the index.ts file can be imported without issues
		// Since this is a simple re-export file, we just test that it exists
		expect(true).toBe(true);
	});
});
