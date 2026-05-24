@AGENTS.md

# Project: suzane-and-amine

Single-page Next.js site. Personal project.

## Stack

- **Next.js 16.2.6** — App Router, Turbopack default. Read `node_modules/next/dist/docs/` before assuming behavior from older versions.
- **React 19.2.4** — Server Components by default. `"use client"` only when needed (state, effects, browser APIs, event handlers).
- **Tailwind CSS v4** — CSS-first config. **No `tailwind.config.js`**. Theme tokens live in `@theme inline { ... }` block inside `src/app/globals.css`. PostCSS plugin: `@tailwindcss/postcss`.
- **TypeScript 5** strict. Path alias `@/*` → `src/*`.
- **ESLint 9** flat config (`eslint.config.mjs`).

## Architecture: Dummy / Smart split

Two-layer separation. Do not mix.

### Dummy components — `src/components/ui/`

- Pure presentational. Props in, JSX out. No data fetching, no business logic, no app-specific copy.
- Tailwind classes only for styling. No inline styles unless dynamic.
- Reusable across screens. Named exports.
- Default to server components. Add `"use client"` only if the component itself needs interactivity (e.g. a controlled `Input`).
- File per component. Re-export via `src/components/ui/index.ts`.

Examples: `Button`, `Card`, `Container`, `Section`, `Heading`, `Text`, `Input`, `Field`.

### Smart screens — `src/screens/`

- Hold the data and details for one logical screen/section.
- Import data from `src/data/*` (or fetch).
- Compose dummies from `src/components/ui/*`.
- Server components by default.
- One screen = one file. Re-export via `src/screens/index.ts`.

### Data — `src/data/`

- Typed constants or fetchers. One file per domain (`home.ts`, `rsvp.ts`, etc.).
- Export types alongside data.

### Routes — `src/app/`

- Thin. Routes import and render screens. No layout or data logic here beyond what App Router requires.

## Conventions

- Use `cn` from `@/lib/cn` to merge conditional class strings.
- Prefer composition over prop explosion. If a dummy grows >5 styling props, split it.
- No `tailwind.config.js`. Add design tokens to `@theme inline` block in `globals.css`.
- No barrel re-export trees deeper than one level (only `index.ts` per folder).
- Server components cannot use hooks. If a dummy needs `useState`/`useEffect`, mark `"use client"` at the top of that file only — keep the boundary tight.
