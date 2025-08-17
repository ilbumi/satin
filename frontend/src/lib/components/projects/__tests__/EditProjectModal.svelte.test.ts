import { describe, it, expect, beforeEach } from 'vitest';
import { render, getByLabelText, triggerBlur, getTextContent } from '$lib/test-utils';
import TestEditProjectModal from './TestEditProjectModal.svelte';
import {
	mockFormData,
	mockProject,
	resetMockCounter
} from '$lib/features/projects/__tests__/mocks';

describe('EditProjectModal', () => {
	const testProject = mockProject({
		id: 'test-project-1',
		name: 'Test Project',
		description: 'This is a test project for editing'
	});

	beforeEach(() => {
		resetMockCounter();
	});

	it('does not render when closed', async () => {
		const screen = render(TestEditProjectModal, {
			open: false,
			project: testProject
		});

		// Modal should not be visible
		const dialog = screen.container.querySelector('[role="dialog"]');
		expect(dialog).toBeNull();

		const title = screen.container.querySelector('*[textContent*="Edit Project"]');
		expect(title).toBeNull();
	});

	it('renders when open with project', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		// Modal should be visible
		await expect.element(screen.getByRole('dialog')).toBeVisible();
		await expect.element(screen.getByText('Edit Project')).toBeVisible();
	});

	it('shows form fields with project data', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		// Check form fields are present and populated
		const nameInput = getByLabelText(/project name/i);
		const descriptionTextarea = getByLabelText(/description/i);

		await expect.element(nameInput).toBeVisible();
		await expect.element(descriptionTextarea).toBeVisible();

		// Check fields are pre-populated with project data
		await expect.element(nameInput).toHaveValue(testProject.name);
		await expect.element(descriptionTextarea).toHaveValue(testProject.description);

		// Check buttons
		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		const updateButton = screen.getByRole('button', { name: /update project/i });

		await expect.element(cancelButton).toBeVisible();
		await expect.element(updateButton).toBeVisible();
	});

	it('shows project ID in readonly section', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		// Should show project ID
		await expect.element(screen.getByText('Project ID:')).toBeVisible();
		await expect.element(screen.getByText(testProject.id)).toBeVisible();
	});

	it('shows required field indicators', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		// Check for required indicators (*) - look for red asterisks
		const requiredIndicators = screen.container.querySelectorAll('.text-red-500');
		expect(requiredIndicators.length).toBeGreaterThan(0);

		// Verify that asterisks are present
		const hasAsterisks = Array.from(requiredIndicators).some((el) => el.textContent?.includes('*'));
		expect(hasAsterisks).toBe(true);
	});

	it('disables update button when form has empty fields', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		const nameInput = getByLabelText(/project name/i);
		const updateButton = screen.getByRole('button', { name: /update project/i });

		// Clear the name field
		await nameInput.fill('');

		await expect.element(updateButton).toBeDisabled();
	});

	it('enables update button when form is valid', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		const updateButton = screen.getByRole('button', { name: /update project/i });

		// With pre-populated valid data, button should be enabled
		await expect.element(updateButton).not.toBeDisabled();
	});

	it('validates name field', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		const nameInput = getByLabelText(/project name/i);

		// Enter invalid name (too short)
		await nameInput.fill('A');
		await triggerBlur(nameInput);

		// Should show validation error
		await expect.element(screen.getByText(/name must be at least/i)).toBeVisible();
	});

	it('validates description field', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		const descriptionTextarea = getByLabelText(/description/i);

		// Enter invalid description (too short)
		await descriptionTextarea.fill('Short');
		await triggerBlur(descriptionTextarea);

		// Should show validation error
		await expect.element(screen.getByText(/description must be at least/i)).toBeVisible();
	});

	it('clears validation errors when field becomes valid', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		const nameInput = getByLabelText(/project name/i);

		// Enter invalid name first
		await nameInput.fill('A');
		await triggerBlur(nameInput);

		// Error should be present
		await expect.element(screen.getByText(/name must be at least/i)).toBeVisible();

		// Now enter valid name
		await nameInput.fill(mockFormData.update.valid.name);
		await triggerBlur(nameInput);

		// Error should be gone - check if the error text is no longer visible
		const errorElement = screen.container.querySelector('*[textContent*="name must be at least"]');
		expect(errorElement).toBeNull();
	});

	it('calls onClose when cancel button clicked', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await cancelButton.click();

		await expect.element(screen.getByTestId('close-called')).toHaveTextContent('true');
	});

	it('calls onClose when modal backdrop clicked', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		// Click on modal backdrop (outside the modal content)
		const modal = screen.getByRole('dialog');
		// Click at coordinates that target the backdrop area specifically
		await modal.click({ position: { x: 10, y: 10 } });

		await expect.element(screen.getByTestId('close-called')).toHaveTextContent('true');
	});

	it('submits valid form data with updated values', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		const nameInput = getByLabelText(/project name/i);
		const descriptionTextarea = getByLabelText(/description/i);
		const updateButton = screen.getByRole('button', { name: /update project/i });

		// Update the form with new data
		await nameInput.fill(mockFormData.update.valid.name);
		await descriptionTextarea.fill(mockFormData.update.valid.description);

		// Submit form
		await updateButton.click();

		// Check that submit was called with correct data
		await expect.element(screen.getByTestId('submit-called')).toHaveTextContent('true');

		const submitDataElement = screen.getByTestId('submit-data');
		const submitData = JSON.parse((await getTextContent(submitDataElement)) || '{}');

		expect(submitData.id).toBe(testProject.id);
		expect(submitData.name).toBe(mockFormData.update.valid.name);
		expect(submitData.description).toBe(mockFormData.update.valid.description);
	});

	it('closes modal after successful submission', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		const updateButton = screen.getByRole('button', { name: /update project/i });

		// Submit form with valid pre-populated data
		await updateButton.click();

		// Modal should close after successful submission
		await expect.element(screen.getByTestId('close-called')).toHaveTextContent('true');
	});

	it('shows loading state during submission', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject,
			loading: true
		});

		const nameInput = getByLabelText(/project name/i);
		const descriptionTextarea = getByLabelText(/description/i);
		const updateButton = screen.getByRole('button', { name: /update project/i });
		const cancelButton = screen.getByRole('button', { name: /cancel/i });

		// Form fields should be disabled during loading
		await expect.element(nameInput).toBeDisabled();
		await expect.element(descriptionTextarea).toBeDisabled();
		await expect.element(updateButton).toBeDisabled();
		await expect.element(cancelButton).toBeDisabled();
	});

	it('resets form when modal opens with different project', async () => {
		const otherProject = mockProject({
			id: 'other-project',
			name: 'Other Project',
			description: 'Different project description'
		});

		const { rerender } = render(TestEditProjectModal, {
			open: false,
			project: testProject
		});

		// Open modal with first project
		await rerender({ open: true, project: testProject });

		const nameInput = getByLabelText(/project name/i);
		const descriptionTextarea = getByLabelText(/description/i);

		// Should be populated with first project data
		await expect.element(nameInput).toHaveValue(testProject.name);

		// Close and reopen with different project
		await rerender({ open: false, project: testProject });
		await rerender({ open: true, project: otherProject });

		// Form should be reset with new project data
		await expect.element(nameInput).toHaveValue(otherProject.name);
		await expect.element(descriptionTextarea).toHaveValue(otherProject.description);
	});

	it('prevents submission with invalid data', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		const nameInput = getByLabelText(/project name/i);
		const updateButton = screen.getByRole('button', { name: /update project/i });

		// Enter invalid data
		await nameInput.fill('A'); // Too short

		// Try to submit
		await updateButton.click();

		// Should not have submitted
		await expect.element(screen.getByTestId('submit-called')).toHaveTextContent('false');

		// Should show validation errors
		await expect.element(screen.getByText(/name must be at least/i)).toBeVisible();
	});

	it('handles submission errors gracefully', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		const nameInput = getByLabelText(/project name/i);
		const updateButton = screen.getByRole('button', { name: /update project/i });

		// Fill form with data that will trigger error
		await nameInput.fill('FAIL'); // Special value that triggers error in test component

		// Submit form
		await updateButton.click();

		// Should show error message in the modal (not just in test data)
		await expect
			.element(screen.getByRole('dialog').getByText(/simulated submission error/i))
			.toBeVisible();

		// Modal should still be open (not closed on error)
		await expect.element(screen.getByRole('dialog')).toBeVisible();
	});

	it('handles partial form updates', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		const nameInput = getByLabelText(/project name/i);
		const updateButton = screen.getByRole('button', { name: /update project/i });

		// Only update the name, leave description as is
		await nameInput.fill('Updated Project Name');

		// Submit form
		await updateButton.click();

		// Check that submit was called with updated name but original description
		const submitDataElement = screen.getByTestId('submit-data');
		const submitData = JSON.parse((await getTextContent(submitDataElement)) || '{}');

		expect(submitData.id).toBe(testProject.id);
		expect(submitData.name).toBe('Updated Project Name');
		expect(submitData.description).toBe(testProject.description); // Original description
	});

	it('does not render form when no project provided', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: null
		});

		// Modal should be visible but form should not
		await expect.element(screen.getByRole('dialog')).toBeVisible();
		await expect.element(screen.getByText('Edit Project')).toBeVisible();

		// Form fields should not be present
		expect(screen.container.querySelector('input[id*="project-name"]')).toBeNull();
		expect(screen.container.querySelector('textarea[id*="project-description"]')).toBeNull();

		// Update button should not be present (only Cancel should be there)
		const updateButton = screen.container.querySelector('button[textContent*="Update Project"]');
		expect(updateButton).toBeNull();
	});

	it('has proper accessibility attributes', async () => {
		const screen = render(TestEditProjectModal, {
			open: true,
			project: testProject
		});

		// Modal should have proper ARIA attributes
		const modal = screen.getByRole('dialog');
		await expect.element(modal).toHaveAttribute('aria-modal', 'true');

		// Form should have proper labels
		const nameInput = getByLabelText(/project name/i);
		const descriptionTextarea = getByLabelText(/description/i);

		await expect.element(nameInput).toHaveAttribute('required');
		await expect.element(descriptionTextarea).toHaveAttribute('required');
	});
});
