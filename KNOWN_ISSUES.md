# Known Issues Checklist

**Note:** As of 2025-08-17, this document has been converted to a checklist format for better progress tracking. Priorities focus on functionality over security, with the original security assessment preserved at the end.

## How to Use This Checklist
- `- [ ]` = Not started
- `- [~]` = Partially completed *(see notes)*
- `- [x]` = Completed
- 📍 = File location

## Priority Remediation Plan

### P1: Incomplete Core Features
- [ ] **Implement Core Annotation Actions**
  - Display the number of images in a project
  - Display the number of annotations in a project
  - Implement "Annotate" button functionality
  - 📍 `ProjectCard.svelte`, `ImageCanvas.svelte`

- [ ] **Missing Image Upload Functionality**
  - Upload buttons exist but have no implementation
  - Users cannot add images to projects
  - 📍 `frontend/src/routes/projects/[id]/+page.svelte:216-219`

- [ ] **Hardcoded Project Statistics**
  - All project stats (image counts, annotation counts) display as hardcoded 0 values
  - 📍 `frontend/src/routes/projects/[id]/+page.svelte:174-199`

### P2: Critical UX & Integration Issues
- [ ] **Non-SvelteKit Navigation**
  - Using `window.location.href` and `window.history.back()` instead of SvelteKit's navigation system
  - 📍 `frontend/src/routes/projects/[id]/+page.svelte:94, 143`

- [ ] **Browser-Native Confirm Dialogs**
  - Using `window.confirm()` instead of custom modal components, inconsistent with app design
  - 📍 `frontend/src/routes/projects/[id]/+page.svelte:82-86`

- [ ] **Browser Caching Issues**
  - The `/projects` page seems to be aggressively cached by the browser, causing stale data to be shown
  - 📍 Frontend routing/data fetching logic

- [ ] **Missing Keyboard Accessibility**
  - The `ImageCanvas.svelte` component is not usable with a keyboard
  - 📍 `frontend/src/lib/components/ImageCanvas.svelte`

- [ ] **Hardcoded Status Values**
  - Project status is hardcoded as 'active' throughout frontend since backend doesn't support status field
  - 📍 `frontend/src/routes/projects/[id]/+page.svelte:116, 146`

### P3: Code Quality & Technical Debt
- [~] **Frontend Error Handling** *(Partially Improved)*
  - Basic error handling implemented in project details page with try-catch blocks and error UI
  - Needs expansion across all components
  - 📍 `frontend/src/routes/projects/[id]/+page.svelte:33-54`

- [ ] **Backend Type Safety Issues**
  - Multiple `# type: ignore` comments suppress type checking throughout GraphQL schema files
  - 📍 `src/satin/schema/query.py`, `src/satin/schema/mutation.py`, `src/satin/schema/filters.py`

- [ ] **Update-Then-Fetch Mutation Pattern**
  - Mutations update data then re-fetch, causing potential race conditions and performance issues
  - 📍 `src/satin/schema/mutation.py:49-53, 77-81, 104-108`

- [ ] **Duplicated Pagination Logic**
  - Same pagination code repeated across projects, images, and tasks queries
  - 📍 `src/satin/schema/query.py`

- [ ] **Global Repository Instance**
  - Using global `repo_factory` instead of proper dependency injection pattern
  - 📍 `src/satin/schema/query.py:15`, `src/satin/schema/mutation.py:12`

- [ ] **Missing Error Boundaries**
  - No error handling at component boundaries, errors can crash entire page sections
  - 📍 Frontend components

- [ ] **No Caching Strategy**
  - Frontend re-fetches data on every navigation, no caching or state management
  - 📍 Frontend data fetching logic

- [ ] **Test Utility Confusion**
  - Mixing vitest-browser API with custom implementations, inconsistent testing patterns
  - 📍 `frontend/src/lib/test-utils/index.ts`

- [~] **Missing E2E Test Coverage** *(Partially Improved)*
  - Additional E2E test files added (projects.test.ts, demo.test.ts, graphql.test.ts)
  - Still insufficient coverage for full application
  - 📍 `frontend/e2e/` directory

---
## Deprioritized Security Issues

The following issues were identified during a security review on 2025-08-16. They are currently de-prioritized but are preserved here for future reference.

**⚠️ WARNING**: This application should NOT be deployed to a production environment without addressing these issues.

### 🔴 Critical Security Issues
- [ ] **No Authentication/Authorization**
  - All GraphQL endpoints are completely unprotected

- [ ] **MongoDB Injection Vulnerabilities**
  - Direct use of user input in database queries

- [ ] **Docker Security Misconfigurations**
  - Exposed database port and hardcoded credentials

### 🟡 High-Risk Security Issues
- [ ] **GraphQL Security Gaps**
  - No rate limiting, query depth/complexity limits

- [ ] **CORS Misconfiguration**
  - Overly permissive CORS policy

- [ ] **Input Validation Gaps**
  - Lack of validation on user-provided data (e.g., URLs, JSON)

### 🟠 Medium-Risk Issues
- [ ] **Error Handling**
  - Internal errors are exposed to the client

- [ ] **Data Exposure**
  - Full database documents are returned to the client

- [ ] **Frontend Security**
  - No CSRF protection or Content Security Policy

### 🟢 Low-Risk/Best Practice Issues
- [ ] **Dependency Management**
  - No automated vulnerability scanning for dependencies

- [ ] **Logging & Monitoring**
  - Lack of security event logging or audit trails
