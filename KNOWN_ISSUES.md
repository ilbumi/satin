# Known Issues

This document outlines known issues with the current version of the software. Please refer to this list before reporting new issues.

## 🔴 Critical Security Issues

### 1. No Authentication/Authorization
- **Location**: `src/satin/schema/query.py:27-136`, `src/satin/schema/mutation.py:15-100`
- **Impact**: All GraphQL endpoints are completely unprotected
- **Risk**: Anyone can create, read, update, delete all data
- **Details**: No user context, session management, or access control mechanisms

### 2. MongoDB Injection Vulnerabilities
- **Location**: `src/satin/repositories/base.py:33`
- **Impact**: Potential for NoSQL injection attacks
- **Risk**: Data exfiltration, data manipulation, denial of service
- **Details**:
  - Direct ObjectId construction from user input without validation
  - Regex filter operator (`src/satin/schema/filters.py:40`) allows arbitrary patterns
  - No input sanitization in filter building functions

### 3. Docker Security Misconfigurations
- **Location**: `docker-compose.yml:7-8,11`
- **Impact**: Database exposed to external attacks
- **Risk**: Unauthorized database access, credential exposure
- **Details**:
  - MongoDB exposed on host port 27017
  - Hardcoded credentials in docker-compose file
  - No network segmentation between services

## 🟡 High-Risk Security Issues

### 4. GraphQL Security Gaps
- **Location**: `src/satin/schema/`, `src/satin/schema/filters.py:5`
- **Impact**: Resource exhaustion, denial of service
- **Risk**: API abuse, performance degradation
- **Details**:
  - No rate limiting or query depth limiting
  - No query complexity analysis
  - Max limit of 1000 items per query is too high
  - Vulnerable to nested query attacks

### 5. CORS Misconfiguration
- **Location**: `src/satin/main.py:21-23`
- **Impact**: Potential for cross-origin attacks
- **Risk**: CSRF attacks, credential theft
- **Details**:
  - Overly permissive with `allow_headers=["*"]`
  - `allow_credentials=True` without proper authentication

### 6. Input Validation Gaps
- **Location**: `src/satin/schema/filters.py:71,80,89`, `src/satin/schema/mutation.py:80`
- **Impact**: Malformed data, injection attacks
- **Risk**: Data corruption, code execution
- **Details**:
  - Using `strawberry.scalars.JSON` accepts any JSON without validation
  - No validation on image URLs (potential SSRF)
  - Missing field-level validation in Pydantic models

## 🟠 Medium-Risk Issues

### 7. Error Handling
- **Location**: Throughout `src/satin/repositories/`
- **Impact**: Information disclosure, unstable application
- **Risk**: Exposing internal structure, debugging information
- **Details**:
  - No structured error handling in repositories
  - Database errors exposed directly to clients
  - Missing try-catch blocks in async operations

### 8. Data Exposure
- **Location**: `src/satin/repositories/base.py`, GraphQL resolvers
- **Impact**: Information disclosure
- **Risk**: Leaking sensitive metadata
- **Details**:
  - Full MongoDB documents returned without filtering
  - No field-level permissions
  - All fields accessible via GraphQL introspection

### 9. Frontend Security
- **Location**: `frontend/src/lib/graphql/client.ts:4`
- **Impact**: Client-side vulnerabilities
- **Risk**: XSS, CSRF, request tampering
- **Details**:
  - No CSRF protection mechanisms
  - API URL configurable via environment variable without validation
  - No request signing or integrity checks
  - No content security policy

## 🟢 Low-Risk/Best Practice Issues

### 10. Dependency Management
- **Impact**: Potential vulnerabilities in dependencies
- **Risk**: Supply chain attacks
- **Details**:
  - No automated vulnerability scanning in CI/CD
  - No dependency pinning in Docker base images
  - Missing security-focused linting rules

### 11. Logging & Monitoring
- **Impact**: Inability to detect attacks
- **Risk**: Undetected breaches
- **Details**:
  - No security event logging
  - No audit trail for data modifications
  - Missing intrusion detection mechanisms
  - No rate limit monitoring

### 12. Code Quality & Architecture
- **Impact**: Maintainability and security issues
- **Risk**: Bugs leading to vulnerabilities
- **Details**:
  - Dead code detected (potential attack surface)
  - "Update-Then-Fetch" pattern in mutations (race conditions)
  - Duplicated pagination logic in `query.py`
  - Type error suppressed with `# type: ignore` in `src/satin/schema/mutation.py`

## Functional Issues

### Frontend
- **Missing Keyboard Accessibility:** The `ImageCanvas.svelte` component is not accessible via keyboard, making it unusable for users who cannot use a mouse.
- **No Error Handling:** The frontend does not handle API errors, which can lead to a poor user experience.
- **Caching Issues:** `/projects` seems to be cached in the browser, which can lead to outdated information being displayed. To resolve this, reload the page.
- **Incomplete Features:** Number of images, number of annotations, and button `Annotate` do nothing for now. They should be implemented in the future.

## Priority Remediation Plan

### Immediate Actions (P0)
1. **Implement Authentication & Authorization**
   - Add JWT-based authentication
   - Implement role-based access control (RBAC)
   - Secure all GraphQL endpoints

2. **Fix Injection Vulnerabilities**
   - Validate and sanitize all user inputs
   - Implement parameterized queries
   - Add input type validation

### High Priority (P1)
3. **Secure MongoDB Deployment**
   - Enable MongoDB authentication
   - Use environment variables for credentials
   - Implement network isolation

4. **GraphQL Security**
   - Implement query depth limiting
   - Add rate limiting (consider graphql-rate-limit)
   - Add query complexity analysis

### Medium Priority (P2)
5. **Comprehensive Error Handling**
   - Implement structured error responses
   - Add logging framework
   - Sanitize error messages

6. **Frontend Security**
   - Implement CSRF tokens
   - Add Content Security Policy headers
   - Validate API endpoints

### Low Priority (P3)
7. **CI/CD Security**
   - Add dependency vulnerability scanning
   - Implement security linting
   - Add automated security testing

## Notes
- **⚠️ WARNING**: This application should NOT be deployed to production without addressing at least P0 and P1 issues
- Consider using established authentication solutions (Auth0, AWS Cognito, etc.)
- Implement security headers (Helmet.js for Node.js applications)
- Regular security audits should be performed
- All security issues should be addressed before any public deployment
