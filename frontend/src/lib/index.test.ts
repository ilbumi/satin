import { describe, expect, it } from 'vitest';

describe('Library Index Exports', () => {
	it('should export from index.ts without errors', async () => {
		// This test ensures the index.ts file can be imported without issues
		try {
			await import('./index');
			// If we get here, the import was successful
			expect(true).toBe(true);
		} catch (error) {
			// If there's an import error, fail the test
			expect.fail(`Failed to import from index.ts: ${error}`);
		}
	});
});
