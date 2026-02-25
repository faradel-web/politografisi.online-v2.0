---
name: firebase-data-layer
description: Standards for interacting with Firebase and Firestore in the politografisi-online project.
---

# Firebase Data Layer Standards

This skill defines how to interact with Firebase in the `politografisi-online` project.

1.  **Centralized Access**:
    *   All database interactions MUST go through specialized service files located in `src/actions/` (for Server Actions) or specific data-fetching utilities in `src/lib/` or `src/services/`.
    *   Never write raw `getDocs`, `addDoc`, or `updateDoc` logic directly inside UI components (`.tsx` files).

2.  **Type Safety (Firestore)**:
    *   Always define TypeScript interfaces/types for Firestore documents (e.g., in `src/types/`).
    *   Use Firebase Data Converters (`withConverter`) to ensure type safety when pulling from or pushing data to Firestore.
    *   *Example:* Ensure timestamps from Firestore are properly serialized before passing them from Server Components to Client Components.

3.  **Authentication Rules**:
    *   Use the established authentication context (`src/lib/auth-context.tsx` or similar) to verify user state on the client.
    *   In Server Actions, always verify the user's session/token before performing any sensitive database operations to ensure data security.

4.  **Environment Variables**:
    *   Always use the NEXT_PUBLIC_ prefix only for Firebase config variables that are safe to expose to the client. Admin operations must use private environment variables via Firebase Admin SDK (if implemented).
