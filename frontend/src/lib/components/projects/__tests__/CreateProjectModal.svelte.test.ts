import { describe, it, expect, beforeEach } from 'vitest';
import { render, triggerBlur, getTextContent, getInputValue } from '$lib/test-utils';
import TestCreateProjectModal from './TestCreateProjectModal.svelte';
import { mockFormData, resetMockCounter } from '$lib/features/projects/__tests__/mocks';

describe('CreateProjectModal', () => {
	beforeEach(() => {
		resetMockCounter();
	});

	it('does not render when closed', async () => {
		const screen = render(TestCreateProjectModal, { open: false });

		// Modal should not be visible - check if dialog element exists in DOM
		const dialog = screen.container.querySelector('[role="dialog"]');
		expect(dialog).toBeNull();

		const title = screen.container.querySelector('*[textContent*="Create New Project"]');
		expect(title).toBeNull();
	});

	it('renders when open', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		// Modal should be visible
		await expect.element(screen.getByRole('dialog')).toBeVisible();
		await expect.element(screen.getByText('Create New Project')).toBeVisible();
	});

	it('shows form fields', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		// Check form fields are present
		const nameInput = screen.getByLabelText(/project name/i);
		const descriptionTextarea = screen.getByLabelText(/description/i);

		await expect.element(nameInput).toBeVisible();
		await expect.element(descriptionTextarea).toBeVisible();

		// Check buttons
		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		const createButton = screen.getByRole('button', { name: /create project/i });

		await expect.element(cancelButton).toBeVisible();
		await expect.element(createButton).toBeVisible();
	});

	it('shows required field indicators', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		// Check for required indicators (*) - look for red asterisks
		const requiredIndicators = screen.container.querySelectorAll('.text-red-500');
		expect(requiredIndicators.length).toBeGreaterThan(0);

		// Verify that asterisks are present
		const hasAsterisks = Array.from(requiredIndicators).some((el) => el.textContent?.includes('*'));
		expect(hasAsterisks).toBe(true);
	});

	it('disables create button when form is empty', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		const createButton = screen.getByRole('button', { name: /create project/i });
		await expect.element(createButton).toBeDisabled();
	});

	it('enables create button when form is valid', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		const nameInput = screen.getByLabelText(/project name/i);
		const descriptionTextarea = screen.getByLabelText(/description/i);
		const createButton = screen.getByRole('button', { name: /create project/i });

		// Fill in valid data
		await nameInput.fill(mockFormData.create.valid.name);
		await descriptionTextarea.fill(mockFormData.create.valid.description);

		await expect.element(createButton).not.toBeDisabled();
	});

	it('validates name field', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		const nameInput = screen.getByLabelText(/project name/i);

		// Enter invalid name (too short)
		await nameInput.fill(mockFormData.create.invalidName.name);
		await triggerBlur(nameInput);

		// Should show validation error
		await expect.element(screen.getByText(/name must be at least/i)).toBeVisible();
	});

	it('validates description field', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		const descriptionTextarea = screen.getByLabelText(/description/i);

		// Enter invalid description (too short)
		await descriptionTextarea.fill(mockFormData.create.invalidDescription.description);
		await triggerBlur(descriptionTextarea);

		// Should show validation error
		await expect.element(screen.getByText(/description must be at least/i)).toBeVisible();
	});

	it('clears validation errors when field becomes valid', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		const nameInput = screen.getByLabelText(/project name/i);

		// Enter invalid name first
		await nameInput.fill('A');
		await triggerBlur(nameInput);

		// Error should be present
		await expect.element(screen.getByText(/name must be at least/i)).toBeVisible();

		// Now enter valid name
		await nameInput.fill(mockFormData.create.valid.name);
		await triggerBlur(nameInput);

		// Error should be gone - check if the error text is no longer visible
		const errorElement = screen.container.querySelector('*[textContent*="name must be at least"]');
		expect(errorElement).toBeNull();
	});

	it('calls onClose when cancel button clicked', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await cancelButton.click();

		await expect.element(screen.getByTestId('close-called')).toHaveTextContent('true');
	});

	it('calls onClose when modal backdrop clicked', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		// Click on modal backdrop (outside the modal content)
		const modal = screen.getByRole('dialog');
		// Click at coordinates that target the backdrop area specifically
		await modal.click({ position: { x: 10, y: 10 } });

		await expect.element(screen.getByTestId('close-called')).toHaveTextContent('true');
	});

	it('submits valid form data', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		const nameInput = screen.getByLabelText(/project name/i);
		const descriptionTextarea = screen.getByLabelText(/description/i);
		const createButton = screen.getByRole('button', { name: /create project/i });

		// Fill in valid data
		await nameInput.fill(mockFormData.create.valid.name);
		await descriptionTextarea.fill(mockFormData.create.valid.description);

		// Submit form
		await createButton.click();

		// Check that submit was called with correct data
		await expect.element(screen.getByTestId('submit-called')).toHaveTextContent('true');

		const submitDataElement = screen.getByTestId('submit-data');
		const textContent = await getTextContent(submitDataElement);
		const submitData = JSON.parse(textContent || '{}');

		expect(submitData.name).toBe(mockFormData.create.valid.name);
		expect(submitData.description).toBe(mockFormData.create.valid.description);
	});

	it('shows loading state during submission', async () => {
		const screen = render(TestCreateProjectModal, {
			open: true,
			loading: true
		});

		const nameInput = screen.getByLabelText(/project name/i);
		const descriptionTextarea = screen.getByLabelText(/description/i);
		const createButton = screen.getByRole('button', { name: /create project/i });
		const cancelButton = screen.getByRole('button', { name: /cancel/i });

		// Form fields should be disabled during loading
		await expect.element(nameInput).toBeDisabled();
		await expect.element(descriptionTextarea).toBeDisabled();
		await expect.element(createButton).toBeDisabled();
		await expect.element(cancelButton).toBeDisabled();
	});

	it('resets form when modal opens', async () => {
		const screen = render(TestCreateProjectModal, { open: false });

		// Open modal and fill form
		await screen.rerender({ open: true });

		const nameInput = screen.getByLabelText(/project name/i);
		const descriptionTextarea = screen.getByLabelText(/description/i);

		if (nameInput && descriptionTextarea) {
			await nameInput.fill('Test name');
			await descriptionTextarea.fill('Test description');
		}

		// Close and reopen modal
		await screen.rerender({ open: false });
		await screen.rerender({ open: true });

		// Form should be reset
		expect(await getInputValue(nameInput)).toBe('');
		expect(await getInputValue(descriptionTextarea)).toBe('');
	});

	it('prevents submission with invalid data', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		const nameInput = screen.getByLabelText(/project name/i);
		const createButton = screen.getByRole('button', { name: /create project/i });

		// Enter invalid data
		await nameInput.fill('A'); // Too short
		await triggerBlur(nameInput);

		// Button should be disabled with invalid data
		await expect.element(createButton).toBeDisabled();

		// Should show validation errors
		await expect.element(screen.getByText(/name must be at least/i)).toBeVisible();

		// Should not have submitted
		await expect.element(screen.getByTestId('submit-called')).toHaveTextContent('false');
	});

	it('handles submission errors gracefully', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		const nameInput = screen.getByLabelText(/project name/i);
		const descriptionTextarea = screen.getByLabelText(/description/i);
		const createButton = screen.getByRole('button', { name: /create project/i });

		// Fill form with data that will trigger error
		await nameInput.fill('FAIL'); // Special value that triggers error in test component
		await descriptionTextarea.fill(mockFormData.create.valid.description);

		// Submit form
		await createButton.click();

		// Should show error message in the modal (not just in test data)
		await expect
			.element(screen.getByRole('dialog').getByText(/simulated submission error/i))
			.toBeVisible();

		// Modal should still be open (not closed on error)
		await expect.element(screen.getByRole('dialog')).toBeVisible();
	});

	it('has proper accessibility attributes', async () => {
		const screen = render(TestCreateProjectModal, { open: true });

		// Modal should have proper ARIA attributes
		const modal = screen.getByRole('dialog');
		await expect.element(modal).toHaveAttribute('aria-modal', 'true');

		// Form should have proper labels
		const nameInput = screen.getByLabelText(/project name/i);
		const descriptionTextarea = screen.getByLabelText(/description/i);

		await expect.element(nameInput).toHaveAttribute('required');
		await expect.element(descriptionTextarea).toHaveAttribute('required');
	});
});
