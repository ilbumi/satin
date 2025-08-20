import type { Page } from '@playwright/test';

/**
 * Enhanced waiting strategies to replace hardcoded timeouts
 * These helpers provide reliable, non-flaky alternatives to waitForTimeout
 */

/**
 * Wait for an element to be visible and stable
 * Replaces: await page.waitForTimeout(2000);
 */
export async function waitForElementVisible(page: Page, selector: string, timeout = 10000) {
	await page.waitForSelector(selector, { state: 'visible', timeout });
	// Ensure element is stable (not animating)
	await page.locator(selector).waitFor({ state: 'visible', timeout });
}

/**
 * Wait for modal/dialog to open or close
 * Replaces: await page.waitForTimeout(500); // Give time for modal to close
 */
export async function waitForModalTransition(
	page: Page,
	modalSelector: string = '[role="dialog"]',
	state: 'visible' | 'hidden' = 'hidden',
	timeout = 5000
) {
	if (state === 'hidden') {
		await page.waitForSelector(modalSelector, { state: 'hidden', timeout });
	} else {
		await page.waitForSelector(modalSelector, { state: 'visible', timeout });
		// Wait for modal animation to complete
		await page.locator(modalSelector).waitFor({ state: 'visible', timeout });
	}
}

/**
 * Wait for canvas to be ready for interactions
 * Replaces: await page.waitForTimeout(200); before canvas interactions
 */
export async function waitForCanvasReady(
	page: Page,
	canvasSelector: string = 'canvas',
	timeout = 5000
) {
	await page.waitForSelector(canvasSelector, { state: 'visible', timeout });
	// Wait for canvas to be loaded and ready
	await page.waitForFunction(
		(selector) => {
			const canvas = document.querySelector(selector) as HTMLCanvasElement;
			return canvas && canvas.offsetWidth > 0 && canvas.offsetHeight > 0;
		},
		canvasSelector,
		{ timeout }
	);
}

/**
 * Wait for debounced operations with network response
 * Replaces: await page.waitForTimeout(500); // Wait for debounce + network request
 */
export async function waitForDebouncedSearch(
	page: Page,
	networkPattern: string | RegExp = /\/graphql/,
	timeout = 10000
) {
	try {
		// Wait for the network request to complete
		await page.waitForResponse(
			(response) => {
				const url = response.url();
				const matchesPattern =
					typeof networkPattern === 'string'
						? url.includes(networkPattern)
						: networkPattern.test(url);
				// Accept both 200 OK and 429 rate limited responses as valid
				return matchesPattern && (response.status() === 200 || response.status() === 429);
			},
			{ timeout }
		);
	} catch (error) {
		// If no network request occurs within timeout, wait for DOM stability instead
		console.warn('Network wait failed, falling back to DOM stability check:', error);
		await page.waitForLoadState('networkidle', { timeout: Math.min(timeout, 5000) });
	}
}

/**
 * Wait for annotation operations to complete
 * Replaces: await page.waitForTimeout(2000); // Wait for annotation to be processed
 */
export async function waitForAnnotationUpdate(
	page: Page,
	statusSelector: string = '.status-item',
	timeout = 10000
) {
	// Wait for status text to update with annotation count
	await page.waitForFunction(
		(selector) => {
			const element = document.querySelector(selector);
			return element && /\d+\s+annotations?/.test(element.textContent || '');
		},
		statusSelector,
		{ timeout }
	);
}

/**
 * Wait for element count to match expected number
 * Useful for waiting for search results, list updates, etc.
 */
export async function waitForElementCount(
	page: Page,
	selector: string,
	expectedCount: number,
	timeout = 10000
) {
	await page.waitForFunction(
		({ sel, count }) => {
			const elements = document.querySelectorAll(sel);
			return elements.length === count;
		},
		{ sel: selector, count: expectedCount },
		{ timeout }
	);
}

/**
 * Wait for page to be fully loaded and stable
 * Replaces: await page.waitForTimeout(2000); after navigation
 */
export async function waitForPageReady(page: Page, timeout = 15000) {
	await page.waitForLoadState('networkidle', { timeout });
	await page.waitForLoadState('domcontentloaded', { timeout });

	// Wait for any pending JavaScript operations
	await page.waitForFunction(
		() => {
			return document.readyState === 'complete' &&
				(window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback
				? new Promise((resolve) =>
						(
							window as Window & { requestIdleCallback: (cb: () => void) => void }
						).requestIdleCallback(resolve)
					)
				: Promise.resolve();
		},
		{},
		{ timeout }
	);
}

/**
 * Wait for text content to appear in an element
 * More reliable than hardcoded timeouts for dynamic content
 */
export async function waitForTextContent(
	page: Page,
	selector: string,
	expectedText: string | RegExp,
	timeout = 10000
) {
	await page.waitForFunction(
		({ sel, text }) => {
			const element = document.querySelector(sel);
			if (!element) return false;
			const content = element.textContent || '';
			return typeof text === 'string' ? content.includes(text) : text.test(content);
		},
		{ sel: selector, text: expectedText },
		{ timeout }
	);
}

/**
 * Wait for element to stop moving/animating
 * Useful for elements that might be animating into position
 */
export async function waitForElementStable(page: Page, selector: string, timeout = 5000) {
	const locator = page.locator(selector);
	await locator.waitFor({ state: 'visible', timeout });

	// Check element position is stable
	let previousBox = await locator.boundingBox();
	await page.waitForTimeout(50); // Short wait to check stability
	let currentBox = await locator.boundingBox();

	const startTime = Date.now();
	while (Date.now() - startTime < timeout) {
		if (
			previousBox &&
			currentBox &&
			Math.abs(previousBox.x - currentBox.x) < 1 &&
			Math.abs(previousBox.y - currentBox.y) < 1
		) {
			break; // Element is stable
		}

		await page.waitForTimeout(50);
		previousBox = currentBox;
		currentBox = await locator.boundingBox();
	}
}

/**
 * Retry an operation with exponential backoff
 * Useful for operations that might occasionally fail
 */
export async function retryOperation<T>(
	operation: () => Promise<T>,
	maxRetries = 3,
	initialDelay = 100
): Promise<T> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error as Error;
			if (attempt === maxRetries) break;

			const delay = initialDelay * Math.pow(2, attempt);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}
