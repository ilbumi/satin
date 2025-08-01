# Known Issues

This document outlines known issues with the current version of the software. Please refer to this list before reporting new issues.

## General Issues

- **No Authentication/Authorization:** The API is public and has no user authentication or authorization, which is a major security vulnerability.

## Frontend

- **Missing Keyboard Accessibility:** The `ImageCanvas.svelte` component is not accessible via keyboard, making it unusable for users who cannot use a mouse.
- **Hardcoded Demo Data:** The demo image and annotations are hardcoded in `AnnotationWorkspace.svelte`, making them difficult to update.
- **Missing Loading/Empty States:** The `ImageCanvas.svelte` component lacks clear loading indicators and empty states.
- **Inefficient Drawing:** The `ImageCanvas.svelte` component redraws the entire canvas on every mouse move, which can be inefficient.
- **No Error Handling:** The frontend does not handle API errors, which can lead to a poor user experience.
- `/projects` seems to be cached in the browser, which can lead to outdated information being displayed. To resolve this,
    reload the page.
- Number of images, number of annotations, and button `Annotate` do nothing for now. They should be implemented in the future.

## Backend

- **"Update-Then-Fetch" Pattern:** The update mutations are inefficient and can cause race conditions. They should be replaced with atomic "find and update" operations.
- **Duplicated Pagination Logic:** The pagination logic in `query.py` is duplicated and should be refactored.
- **Suppressed Type Error:** A type error is suppressed with `# type: ignore` in `src/satin/schema/mutation.py`, which could hide a bug.
