---
name: ui-design-system
description: UI/UX standard methodologies and components rules for the politografisi-online project.
---

# UI Design System Standards

This skill defines the styling, layout, and component creation rules for a premium UI in `politografisi-online`.

1.  **Component Library (Tailwind & Shadcn/ui)**:
    *   Use **Tailwind CSS** for all styling. Do not use standard CSS files unless globally required.
    *   If using UI components, leverage a base library like `shadcn/ui` for consistent anatomy (buttons, inputs, dialogues, dropdowns). Do not write raw semantic HTML with bespoke Tailwind unless necessary.
    *   All customized UI components should reside in `src/components/ui/` and be imported from there.

2.  **Aesthetics & Polish (Premium Feel)**:
    *   **Colors**: Utilize cohesive gradient combinations, deep background hues for dark themes, and high-contrast readable text. Do not use raw, standard colors like `bg-blue-500` without consulting the primary palette.
    *   **Glassmorphism**: Implement subtle background opacity `bg-background/50`, `backdrop-blur-md` and light border overlays effectively for cards and sticky headers.
    *   **Typography**: Utilize modern Google web fonts. Maintain a strict hierarchy between `h1`, `h2`, `h3`, and body text sizes/weights using Tailwind typography configurations.

3.  **Animations & Transitions**:
    *   Apply micro-animations to interactive elements. All buttons and navigational links must have `transition-all duration-200 ease-in-out hover:opacity-80` or scaling `hover:scale-105`.
    *   Use *Framer Motion* (if installed in v2.0) for page transitions, modal pop-ins, and complex chart reveals.

4.  **Icons**:
    *   Strictly use `lucide-react` for iconography to guarantee consistent visual weight, styling, and sizing. Do not mix and match icon libraries (e.g., FontAwesome, HeroIcons).

5.  **Responsiveness**:
    *   All layouts must be heavily tested and built "Mobile-First". Never use fixed pixel width values `w-[400px]` that could break on mobile viewports. Utilize `%`, `vw`, or standard responsive breakpoints (`w-full md:w-1/2`).
