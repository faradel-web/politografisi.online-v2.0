---
name: nextjs-architecture-v2
description: Rules for Next.js 15 App Router architecture in the politografisi-online v2.0 project.
---

# Next.js 15 Architecture Rules (v2.0)

When working on `politografisi-online` version 2.0, you MUST adhere to the following Next.js App Router rules:

1.  **Component Rendering Strategy**:
    *   Default to **Server Components** for faster initial load, SEO, and direct backend access.
    *   Use **Client Components** (`"use client"`) ONLY when necessary (e.g., interactivity like `useState`, `useEffect`, `onClick`, or using browser APIs like `window` or `geolocation`).
    *   *Push the `"use client"` directive down the component tree as far as possible.* Do not make an entire page a client component just because a button needs state.

2.  **Data Fetching and Mutations (Server Actions)**:
    *   Do NOT use API Routes (`/app/api/...`) for internal database operations.
    *   Use **Server Actions** placed in the `src/actions/` folder for all mutations (creating, updating, deleting data).
    *   Data fetching should be done directly within Server Components whenever possible.

3.  **Routing and Grouping**:
    *   Use Route Groups (folders in parentheses like `(dashboard)`) to organize routes that share layouts.
    *   Keep URLs clean by using route groups. Do not create unnecessary path segments unless they add value to the route structure.
    *   If a route group only contains one nested path (e.g., `(admin)/admin`), consider removing the group and placing the `layout.tsx` directly in `app/admin/`.

4.  **Folder Structure (Feature-Based Approach)**:
    *   As the application grows, prefer a feature-based structure within `src/features/` (if it exists) or group related components in specific subfolders under `src/components/` (e.g., `src/components/dashboard/`, `src/components/exam/`).
    *   Do not dump all components into a flat `src/components/` directory.

5.  **Contexts and Providers**:
    *   Place all React Context providers in `src/contexts/` or `src/providers/`.
    *   Keep `src/lib/` strictly for pure utility functions and configuration files (like `firebase.ts`, `gemini.ts`).
