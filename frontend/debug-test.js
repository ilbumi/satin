import { chromium } from 'playwright';

(async () => {
	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	// Listen for console messages
	page.on('console', (msg) => {
		console.log('CONSOLE:', msg.type(), msg.text());
	});

	// Listen for page errors
	page.on('pageerror', (error) => {
		console.log('PAGE ERROR:', error.message);
	});

	try {
		await page.goto('http://localhost:5173/projects');
		await page.waitForTimeout(3000);

		// Try to click the new project button
		await page.click('button:has-text("New Project")');
		await page.waitForTimeout(2000);

		// Fill the form
		await page.fill('[placeholder="Enter project name"]', 'Debug Test Project');
		await page.fill('textarea[placeholder*="project"]', 'Debug test description');

		// Submit
		await page.click('button:has-text("Create Project")');
		await page.waitForTimeout(5000);

		console.log('Test completed successfully');
	} catch (error) {
		console.error('Test failed:', error);
	} finally {
		await browser.close();
	}
})();
