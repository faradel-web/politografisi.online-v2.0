---
name: gemini-ai-engine
description: Standards for Google Gemini AI integration in the politografisi-online project.
---

# Gemini AI Engine Standards

This skill defines how to interact with the Google Gemini API within the `politografisi-online` project.

1.  **Centralized Configuration**:
    *   Initialize and configure the Gemini client in `src/lib/gemini.ts`.
    *   Do not instantiate the Gemini client repeatedly throughout the application components.

2.  **Structured Output (JSON)**:
    *   For tasks requiring structured data (like generating exam questions or summaries), explicitly prompt Gemini to return valid, parsed JSON.
    *   *System Prompt Rule:* Include instructions such as "Return purely valid JSON matching the following schema. Do not enclose it in markdown blocks or backticks unless specified by the parser".
    *   Implement robust type checking and try-catch blocks over `JSON.parse` to handle malformed LLM outputs.

3.  **Error Handling & Fallbacks**:
    *   Implement logic to catch API errors (e.g., `rate_limit_exceeded`, `quota_exceeded`, `network_error`).
    *   Provide clear error messages to the user if an exam or study material cannot be generated at the moment.

4.  **Prompt Engineering**:
    *   Keep highly specific system prompts separated from business logic. Consider creating a `src/lib/prompts/` collection or storing them in constants, rather than hardcoding long strings inside the `useExamGenerator` hook or Server Actions.

5.  **Streaming**:
    *   For long-running generations (e.g., drafting a whole essay or deep analysis), use streaming APIs to provide immediate feedback to the frontend user so they do not think the app has frozen.
