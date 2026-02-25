---
name: testing-and-qa
description: Rules for Testing and Quality Assurance in the politografisi-online project.
---

# Testing and QA Standards

This skill defines how to approach testing and quality assurance on `politografisi-online`.

1.  **Unit Testing (Vitest/Jest)**:
    *   Write tests for any complex utility functions, pure business logic, or data-transformation helpers in `src/lib/`.
    *   Specifically, *Exam scoring algorithms*, *Progress calculation logic*, and *Gemini JSON parsers* MUST have robust unit tests covering edge cases.
    *   Component testing (React Testing Library) is recommended for highly interactive UI elements (like the `AudioRecorder` and `Quiz` progression logic).

2.  **Linting and Formatting**:
    *   Ensure the codebase strictly passes `eslint` via `npm run lint`. Do not leave console logs (`console.log`) or unused variables in production-ready commits.
    *   Follow strict TypeScript type definitions (`tsc --noEmit`). Do not use `any` types for API responses or database models. Always type them comprehensively.

3.  **Manual Verification**:
    *   Before concluding a feature, perform a manual walkthrough in the browser (using automated tools or requesting user verification) to ensure features work as expected across page navigations, avoiding isolated testing of single components only.

4.  **Accessibility (a11y)**:
    *   All forms must have correct labeling (`htmlFor`, `aria-label`).
    *   Interactive items must be accessible via keyboard (tab indexing).
    *   Color contrast for text over backgrounds must meet WCAG AA standards.
