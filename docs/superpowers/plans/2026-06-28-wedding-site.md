# Suzane & Amine Wedding Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern-sage animated wedding site for Suzane & Amine (Aug 29, 2026) — animated intro reveal, scroll-through details, RSVP that emails Amine.

**Architecture:** Single Next.js App Router page composing self-contained section components. All motion via Framer Motion; all art via inline SVG. Event facts centralized in one data module. RSVP posts to one API route that sends email via Resend. Pure logic (countdown, RSVP parsing) is unit-tested with Vitest.

**Tech Stack:** Next.js (App Router) + TypeScript, Tailwind v4, Framer Motion, Resend, Vitest, `next/font` (Cormorant Garamond + Inter). Deploy: Vercel.

**Conventions:** Mobile-first. Respect `prefers-reduced-motion`. No 3D. No DB. No per-guest slugs. Commit after each task.

---

## File Structure

```
src/
  app/
    layout.tsx              # fonts, metadata, OG, html shell
    page.tsx                # composes sections in order
    globals.css             # Tailwind v4 import, tokens, base
    api/rsvp/route.ts        # POST handler → Resend
  data/
    event.ts                # names, date, venue, schedule, dress, MAX_HEADCOUNT
  lib/
    cn.ts                   # className join helper
    countdown.ts            # countdown math (unit-tested)
    rsvp.ts                 # parseRsvp validation (unit-tested)
  components/
    motion/
      Reveal.tsx            # scroll-into-view spring entrance
      Parallax.tsx          # scroll-linked translate
    botanicals/
      Sprig.tsx             # eucalyptus/olive SVG sprig (path-draw capable)
      Monogram.tsx          # "S & A" single-line monogram
    sections/
      Hero.tsx
      SaveTheDate.tsx
      Schedule.tsx
      Venue.tsx
      Details.tsx
      Rsvp.tsx
      Footer.tsx
tests/
  countdown.test.ts
  rsvp.test.ts
```

Event facts live ONLY in `src/data/event.ts`. Sections import from it. Our Story section intentionally omitted (no photos yet; add later as another `sections/*` file).

---

## Task 0: Scaffold project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `.gitignore`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "suzane-and-amine",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "framer-motion": "^12.40.0",
    "next": "^15.5.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "resend": "^4.5.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "^15.5.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create config files**

`next.config.ts`:
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

`postcss.config.mjs`:
```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

`eslint.config.mjs`:
```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [...compat.extends("next/core-web-vitals", "next/typescript")];
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
```

`.gitignore`:
```
node_modules
.next
out
.env*.local
*.tsbuildinfo
next-env.d.ts
.DS_Store
```

- [ ] **Step 4: Create minimal `globals.css`** (tokens filled in Task 2)

```css
@import "tailwindcss";

@theme {
  --color-cream: #f3f1e9;
  --color-sage: #8a9a7b;
  --color-deepsage: #4a5742;
  --color-ink: #2e332b;
}

html { scroll-behavior: smooth; }
body { background: var(--color-cream); color: var(--color-ink); }
```

- [ ] **Step 5: Create placeholder `layout.tsx` and `page.tsx`**

`src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Suzane & Amine" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`:
```tsx
export default function Page() {
  return <main>Wedding site</main>;
}
```

- [ ] **Step 6: Install and verify build**

Run: `npm install && npm run build`
Expected: build succeeds, no type errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Tailwind v4 + Vitest project"
```

---

## Task 1: Event data + countdown logic (TDD)

**Files:**
- Create: `src/data/event.ts`, `src/lib/countdown.ts`, `tests/countdown.test.ts`

- [ ] **Step 1: Create `src/data/event.ts`**

```ts
export const EVENT = {
  coupleNames: ["Suzane", "Amine"] as const,
  // Local Lebanon time (UTC+3) for the ceremony start.
  dateISO: "2026-08-29T19:00:00+03:00",
  dateLabel: "Saturday, August 29, 2026",
  dateDigits: { month: "08", day: "29", year: "2026" },
  venue: {
    name: "L'Heritage Venue",
    area: "Nahr El Kalb, Lebanon",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=L%27Heritage+Venue+Nahr+El+Kalb+Lebanon",
  },
  schedule: [
    { time: "7:00 PM", title: "Arabic Mass", note: "Outdoor section" },
    { time: "8:00 PM", title: "Welcome Drink", note: "" },
    { time: "8:30 PM", title: "Dinner & Party", note: "" },
  ],
  details: [
    { label: "Dress Code", value: "Formal attire" },
    { label: "Parking", value: "Valet parking available" },
  ],
  maxHeadcount: 8,
} as const;
```

- [ ] **Step 2: Write the failing test** — `tests/countdown.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { computeCountdown } from "@/lib/countdown";

describe("computeCountdown", () => {
  const target = new Date("2026-08-29T19:00:00+03:00").getTime();

  it("returns positive parts before the event", () => {
    const now = new Date("2026-08-28T19:00:00+03:00").getTime();
    const c = computeCountdown(target, now);
    expect(c.days).toBe(1);
    expect(c.hours).toBe(0);
    expect(c.minutes).toBe(0);
    expect(c.seconds).toBe(0);
    expect(c.isPast).toBe(false);
  });

  it("breaks down mixed durations", () => {
    const now = new Date("2026-08-28T16:30:45+03:00").getTime();
    const c = computeCountdown(target, now);
    expect(c.days).toBe(1);
    expect(c.hours).toBe(2);
    expect(c.minutes).toBe(29);
    expect(c.seconds).toBe(15);
  });

  it("clamps to zero and flags past once the event has passed", () => {
    const now = new Date("2026-08-30T19:00:00+03:00").getTime();
    const c = computeCountdown(target, now);
    expect(c).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
  });
});
```

- [ ] **Step 3: Run test, verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `@/lib/countdown`.

- [ ] **Step 4: Implement `src/lib/countdown.ts`**

```ts
export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
};

export function computeCountdown(targetMs: number, nowMs: number): Countdown {
  const diff = targetMs - nowMs;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const sec = Math.floor(diff / 1000);
  return {
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
    isPast: false,
  };
}
```

- [ ] **Step 5: Run test, verify pass**

Run: `npm test`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/data/event.ts src/lib/countdown.ts tests/countdown.test.ts
git commit -m "feat: event data module and countdown logic with tests"
```

---

## Task 2: Design tokens, fonts, layout, metadata

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/lib/cn.ts`

- [ ] **Step 1: Create `src/lib/cn.ts`**

```ts
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
```

- [ ] **Step 2: Replace `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-cream: #f3f1e9;
  --color-sage: #8a9a7b;
  --color-deepsage: #4a5742;
  --color-ink: #2e332b;
  --font-display: var(--font-cormorant), Georgia, serif;
  --font-body: var(--font-inter), system-ui, sans-serif;
}

html { scroll-behavior: smooth; }

body {
  background: var(--color-cream);
  color: var(--color-ink);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, .font-display { font-family: var(--font-display); }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Replace `src/app/layout.tsx`** with fonts + metadata

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { EVENT } from "@/data/event";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const title = `${EVENT.coupleNames[0]} & ${EVENT.coupleNames[1]} · ${EVENT.dateLabel}`;

export const metadata: Metadata = {
  title,
  description: `Join us to celebrate the wedding of ${EVENT.coupleNames[0]} & ${EVENT.coupleNames[1]} at ${EVENT.venue.name}, ${EVENT.venue.area}.`,
  openGraph: { title, type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds, fonts resolve.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/lib/cn.ts
git commit -m "feat: design tokens, fonts, metadata, reduced-motion base"
```

---

## Task 3: Motion primitives

**Files:**
- Create: `src/components/motion/Reveal.tsx`, `src/components/motion/Parallax.tsx`

- [ ] **Step 1: Create `Reveal.tsx`**

```tsx
"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 90, damping: 16, delay }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Create `Parallax.tsx`**

```tsx
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { ReactNode } from "react";

export function Parallax({
  children,
  speed = 0.3,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}%`, `${-speed * 100}%`]);
  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/motion
git commit -m "feat: Reveal and Parallax motion primitives"
```

---

## Task 4: Botanical SVG + monogram

**Files:**
- Create: `src/components/botanicals/Sprig.tsx`, `src/components/botanicals/Monogram.tsx`

- [ ] **Step 1: Create `Sprig.tsx`** — eucalyptus sprig, optional path-draw animation

```tsx
"use client";
import { motion } from "framer-motion";

// A simple olive/eucalyptus sprig: a curved stem with paired leaves.
// `draw` animates the stem stroke in; leaves fade after.
export function Sprig({
  className,
  draw = false,
  flip = false,
}: {
  className?: string;
  draw?: boolean;
  flip?: boolean;
}) {
  const leaves = [18, 34, 50, 66, 82];
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden="true"
    >
      <motion.path
        d="M60 112 C 52 86, 56 58, 66 34 C 72 20, 70 12, 64 8"
        stroke="var(--color-sage)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={draw ? { pathLength: 0 } : false}
        whileInView={draw ? { pathLength: 1 } : undefined}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
      {leaves.map((cy, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const x = 60 + side * (10 + (4 - i) * 1.5);
        return (
          <motion.ellipse
            key={i}
            cx={x}
            cy={cy + 14}
            rx="9"
            ry="4.5"
            fill="var(--color-sage)"
            opacity="0.85"
            transform={`rotate(${side * 35} ${x} ${cy + 14})`}
            initial={draw ? { opacity: 0, scale: 0.4 } : false}
            whileInView={draw ? { opacity: 0.85, scale: 1 } : undefined}
            viewport={{ once: true }}
            transition={{ delay: 0.6 + i * 0.12, type: "spring", stiffness: 120 }}
            style={{ transformOrigin: `${x}px ${cy + 14}px` }}
          />
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 2: Create `Monogram.tsx`**

```tsx
export function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} fill="none" aria-hidden="true">
      <text
        x="60"
        y="42"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="34"
        fill="var(--color-deepsage)"
        letterSpacing="2"
      >
        S &amp; A
      </text>
    </svg>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/botanicals
git commit -m "feat: eucalyptus sprig and S&A monogram SVG"
```

---

## Task 5: Hero section

**Files:**
- Create: `src/components/sections/Hero.tsx`

- [ ] **Step 1: Create `Hero.tsx`**

```tsx
"use client";
import { motion } from "framer-motion";
import { EVENT } from "@/data/event";
import { Sprig } from "@/components/botanicals/Sprig";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <Sprig draw className="absolute left-2 top-10 w-28 opacity-70 sm:w-40" />
      <Sprig draw flip className="absolute right-2 top-16 w-28 opacity-70 sm:w-40" />

      <motion.p
        className="mb-6 text-sm uppercase tracking-[0.4em] text-deepsage"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        Together with their families
      </motion.p>

      <motion.h1
        className="font-display text-6xl leading-none text-ink sm:text-8xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 70, damping: 14 }}
      >
        {EVENT.coupleNames[0]}
        <span className="mx-3 text-sage">&amp;</span>
        {EVENT.coupleNames[1]}
      </motion.h1>

      <motion.p
        className="mt-6 text-lg tracking-widest text-deepsage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 1 }}
      >
        {EVENT.dateLabel}
      </motion.p>

      <motion.div
        className="absolute bottom-8 flex flex-col items-center text-deepsage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.6 }, y: { repeat: Infinity, duration: 1.8 } }}
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <span aria-hidden>↓</span>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Wire into page temporarily and verify**

Replace `src/app/page.tsx` body with `<main><Hero /></main>` (import added). Run: `npm run dev`, load `/`.
Expected: names + date animate in, sprigs draw, scroll cue bounces.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Hero.tsx src/app/page.tsx
git commit -m "feat: animated hero section"
```

---

## Task 6: Save the Date + live countdown

**Files:**
- Create: `src/components/sections/SaveTheDate.tsx`

- [ ] **Step 1: Create `SaveTheDate.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { EVENT } from "@/data/event";
import { computeCountdown, type Countdown } from "@/lib/countdown";
import { Reveal } from "@/components/motion/Reveal";

const TARGET = new Date(EVENT.dateISO).getTime();

function useCountdown(): Countdown | null {
  const [c, setC] = useState<Countdown | null>(null);
  useEffect(() => {
    const tick = () => setC(computeCountdown(TARGET, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return c;
}

const UNITS: Array<[keyof Countdown, string]> = [
  ["days", "Days"],
  ["hours", "Hours"],
  ["minutes", "Minutes"],
  ["seconds", "Seconds"],
];

export function SaveTheDate() {
  const c = useCountdown();
  const { month, day, year } = EVENT.dateDigits;
  return (
    <section className="flex flex-col items-center px-6 py-28 text-center">
      <Reveal>
        <p className="mb-4 text-sm uppercase tracking-[0.4em] text-sage">Save the Date</p>
        <div className="font-display text-5xl text-ink sm:text-7xl">
          {month} <span className="text-sage">·</span> {day} <span className="text-sage">·</span> {year}
        </div>
      </Reveal>

      <Reveal delay={0.15} className="mt-12">
        <div className="flex gap-4 sm:gap-8" suppressHydrationWarning>
          {UNITS.map(([key, label]) => (
            <div key={key} className="flex min-w-16 flex-col items-center">
              <span className="font-display text-4xl text-deepsage sm:text-5xl">
                {c ? String(c[key]).padStart(2, "0") : "--"}
              </span>
              <span className="mt-1 text-xs uppercase tracking-widest text-sage">{label}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 2: Verify in dev**

Add `<SaveTheDate />` after `<Hero />` in `page.tsx`. Run `npm run dev`.
Expected: date digits reveal on scroll, countdown ticks each second, no hydration warning.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/SaveTheDate.tsx src/app/page.tsx
git commit -m "feat: save-the-date section with live countdown"
```

---

## Task 7: Schedule section

**Files:**
- Create: `src/components/sections/Schedule.tsx`

- [ ] **Step 1: Create `Schedule.tsx`**

```tsx
"use client";
import { motion } from "framer-motion";
import { EVENT } from "@/data/event";
import { Reveal } from "@/components/motion/Reveal";
import { Sprig } from "@/components/botanicals/Sprig";

export function Schedule() {
  return (
    <section className="relative bg-deepsage/5 px-6 py-28">
      <Sprig className="pointer-events-none absolute right-4 top-8 w-24 opacity-40" />
      <div className="mx-auto max-w-md">
        <Reveal>
          <h2 className="mb-14 text-center font-display text-4xl text-ink sm:text-5xl">
            The Day
          </h2>
        </Reveal>
        <ol className="relative border-l border-sage/40 pl-8">
          {EVENT.schedule.map((item, i) => (
            <motion.li
              key={item.title}
              className="relative mb-12 last:mb-0"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.12, type: "spring", stiffness: 90, damping: 16 }}
            >
              <span className="absolute -left-[37px] top-1 h-3 w-3 rounded-full bg-sage" />
              <p className="font-display text-2xl text-deepsage">{item.time}</p>
              <p className="text-lg text-ink">{item.title}</p>
              {item.note && <p className="text-sm text-sage">{item.note}</p>}
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify in dev** — add `<Schedule />` to page, confirm timeline staggers in. Run `npm run dev`.

- [ ] **Step 3: Verify build** — `npm run build` succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Schedule.tsx src/app/page.tsx
git commit -m "feat: schedule timeline section"
```

---

## Task 8: Venue section

**Files:**
- Create: `src/components/sections/Venue.tsx`

- [ ] **Step 1: Create `Venue.tsx`**

```tsx
import { EVENT } from "@/data/event";
import { Reveal } from "@/components/motion/Reveal";
import { Sprig } from "@/components/botanicals/Sprig";

export function Venue() {
  return (
    <section className="px-6 py-28 text-center">
      <Reveal>
        <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-sage/30 bg-cream px-8 py-12 shadow-sm">
          <Sprig className="mb-6 w-16" />
          <p className="mb-2 text-sm uppercase tracking-[0.4em] text-sage">The Venue</p>
          <h2 className="font-display text-4xl text-ink">{EVENT.venue.name}</h2>
          <p className="mt-2 text-deepsage">{EVENT.venue.area}</p>
          <a
            href={EVENT.venue.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 rounded-full border border-deepsage px-6 py-2 text-sm uppercase tracking-widest text-deepsage transition-colors hover:bg-deepsage hover:text-cream"
          >
            Open in Maps
          </a>
        </div>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 2: Verify in dev** — add `<Venue />` to page, confirm card + maps link. `npm run dev`.

- [ ] **Step 3: Verify build** — `npm run build` succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Venue.tsx src/app/page.tsx
git commit -m "feat: venue section with maps link"
```

---

## Task 9: Details section

**Files:**
- Create: `src/components/sections/Details.tsx`

- [ ] **Step 1: Create `Details.tsx`**

```tsx
import { EVENT } from "@/data/event";
import { Reveal } from "@/components/motion/Reveal";

export function Details() {
  return (
    <section className="bg-deepsage/5 px-6 py-28">
      <div className="mx-auto max-w-md">
        <Reveal>
          <h2 className="mb-14 text-center font-display text-4xl text-ink sm:text-5xl">
            Good to Know
          </h2>
        </Reveal>
        <div className="grid gap-8 sm:grid-cols-2">
          {EVENT.details.map((d, i) => (
            <Reveal key={d.label} delay={i * 0.1}>
              <div className="text-center">
                <p className="text-sm uppercase tracking-widest text-sage">{d.label}</p>
                <p className="mt-2 text-lg text-ink">{d.value}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify in dev** — add `<Details />` to page. `npm run dev`.

- [ ] **Step 3: Verify build** — `npm run build` succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Details.tsx src/app/page.tsx
git commit -m "feat: details section"
```

---

## Task 10: RSVP validation logic (TDD)

**Files:**
- Create: `src/lib/rsvp.ts`, `tests/rsvp.test.ts`

- [ ] **Step 1: Write failing test** — `tests/rsvp.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { parseRsvp } from "@/lib/rsvp";

describe("parseRsvp", () => {
  it("accepts a valid attending payload", () => {
    const r = parseRsvp({ headcount: 2, names: ["Suzane", "Amine"], message: "Can't wait!" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.headcount).toBe(2);
      expect(r.value.names).toEqual(["Suzane", "Amine"]);
      expect(r.value.attending).toBe(true);
    }
  });

  it("accepts a regrets (0 headcount) payload with no names", () => {
    const r = parseRsvp({ headcount: 0, names: [], message: "" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.attending).toBe(false);
  });

  it("rejects headcount above the max", () => {
    const r = parseRsvp({ headcount: 99, names: [], message: "" });
    expect(r.ok).toBe(false);
  });

  it("rejects when names count does not match headcount", () => {
    const r = parseRsvp({ headcount: 2, names: ["Only One"], message: "" });
    expect(r.ok).toBe(false);
  });

  it("rejects blank names", () => {
    const r = parseRsvp({ headcount: 1, names: ["   "], message: "" });
    expect(r.ok).toBe(false);
  });

  it("trims names and message", () => {
    const r = parseRsvp({ headcount: 1, names: ["  Amine  "], message: "  hi  " });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.names[0]).toBe("Amine");
      expect(r.value.message).toBe("hi");
    }
  });
});
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test`
Expected: FAIL — cannot find `@/lib/rsvp`.

- [ ] **Step 3: Implement `src/lib/rsvp.ts`**

```ts
import { EVENT } from "@/data/event";

export type RsvpInput = {
  headcount: number;
  names: string[];
  message: string;
};

export type Rsvp = {
  headcount: number;
  names: string[];
  message: string;
  attending: boolean;
};

export type ParseResult =
  | { ok: true; value: Rsvp }
  | { ok: false; error: string };

export function parseRsvp(input: unknown): ParseResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Invalid payload." };
  }
  const { headcount, names, message } = input as Record<string, unknown>;

  if (typeof headcount !== "number" || !Number.isInteger(headcount)) {
    return { ok: false, error: "Headcount must be a whole number." };
  }
  if (headcount < 0 || headcount > EVENT.maxHeadcount) {
    return { ok: false, error: `Headcount must be between 0 and ${EVENT.maxHeadcount}.` };
  }
  if (!Array.isArray(names)) {
    return { ok: false, error: "Names must be a list." };
  }
  if (names.length !== headcount) {
    return { ok: false, error: "Please provide a name for each guest." };
  }
  const trimmedNames: string[] = [];
  for (const n of names) {
    if (typeof n !== "string" || n.trim().length === 0) {
      return { ok: false, error: "Guest names cannot be blank." };
    }
    trimmedNames.push(n.trim());
  }
  const msg = typeof message === "string" ? message.trim() : "";

  return {
    ok: true,
    value: {
      headcount,
      names: trimmedNames,
      message: msg,
      attending: headcount > 0,
    },
  };
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `npm test`
Expected: PASS (countdown + rsvp suites).

- [ ] **Step 5: Commit**

```bash
git add src/lib/rsvp.ts tests/rsvp.test.ts
git commit -m "feat: RSVP validation logic with tests"
```

---

## Task 11: RSVP API route (Resend)

**Files:**
- Create: `src/app/api/rsvp/route.ts`
- Create: `.env.example`

- [ ] **Step 1: Create `.env.example`**

```
RESEND_API_KEY=
RSVP_TO_EMAIL=amine@quandri.io
RSVP_FROM_EMAIL=onboarding@resend.dev
```

- [ ] **Step 2: Create `src/app/api/rsvp/route.ts`**

```ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { parseRsvp } from "@/lib/rsvp";
import { EVENT } from "@/data/event";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = parseRsvp(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { headcount, names, message, attending } = parsed.value;
  const subject = attending
    ? `RSVP: ${names[0]} (+${headcount - 1}) is coming 🎉`
    : `RSVP: regrets`;
  const text = [
    `Attending: ${attending ? "Yes" : "No"}`,
    `Headcount: ${headcount}`,
    names.length ? `Guests:\n${names.map((n) => `  - ${n}`).join("\n")}` : "",
    message ? `Message: ${message}` : "",
    ``,
    `For: ${EVENT.coupleNames[0]} & ${EVENT.coupleNames[1]} · ${EVENT.dateLabel}`,
  ]
    .filter(Boolean)
    .join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  // If email isn't configured (e.g. local/dev), accept the RSVP without sending.
  if (!apiKey) {
    console.log("[rsvp] (email not configured) ", text);
    return NextResponse.json({ ok: true, queued: true });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.RSVP_FROM_EMAIL ?? "onboarding@resend.dev",
      to: process.env.RSVP_TO_EMAIL ?? "amine@quandri.io",
      subject,
      text,
    });
    if (error) {
      return NextResponse.json({ ok: false, error: "Email failed to send." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Email failed to send." }, { status: 502 });
  }
}
```

- [ ] **Step 3: Verify endpoint locally**

Run: `npm run dev`, then:
```bash
curl -s -X POST localhost:3000/api/rsvp -H 'content-type: application/json' \
  -d '{"headcount":2,"names":["Suzane","Amine"],"message":"yay"}'
```
Expected: `{"ok":true,"queued":true}` (no RESEND_API_KEY locally), and the RSVP text logged in the dev console.

Also verify validation rejects bad input:
```bash
curl -s -X POST localhost:3000/api/rsvp -H 'content-type: application/json' -d '{"headcount":99,"names":[]}'
```
Expected: HTTP 400, `{"ok":false,"error":"Headcount must be between 0 and 8."}`

- [ ] **Step 4: Verify build** — `npm run build` succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/rsvp/route.ts .env.example
git commit -m "feat: RSVP API route with Resend delivery"
```

---

## Task 12: RSVP form section

**Files:**
- Create: `src/components/sections/Rsvp.tsx`

- [ ] **Step 1: Create `Rsvp.tsx`**

```tsx
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { EVENT } from "@/data/event";
import { Reveal } from "@/components/motion/Reveal";

type Status = "idle" | "submitting" | "success" | "error";

export function Rsvp() {
  const [headcount, setHeadcount] = useState(0);
  const [names, setNames] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  function changeHeadcount(n: number) {
    setHeadcount(n);
    setNames((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push("");
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ headcount, names, message }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Something went wrong.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    }
  }

  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-md">
        <Reveal>
          <h2 className="mb-3 text-center font-display text-4xl text-ink sm:text-5xl">RSVP</h2>
          <p className="mb-12 text-center text-deepsage">Kindly reply below.</p>
        </Reveal>

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="thanks"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-sage/30 bg-deepsage/5 px-8 py-14 text-center"
            >
              <p className="font-display text-3xl text-ink">Thank you!</p>
              <p className="mt-3 text-deepsage">
                {headcount > 0
                  ? "We can't wait to celebrate with you."
                  : "We'll miss you, but thank you for letting us know."}
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={submit}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6"
            >
              <label className="flex flex-col gap-2">
                <span className="text-sm uppercase tracking-widest text-sage">Number of guests</span>
                <select
                  value={headcount}
                  onChange={(e) => changeHeadcount(Number(e.target.value))}
                  className="rounded-lg border border-sage/40 bg-cream px-4 py-3 text-ink"
                >
                  {Array.from({ length: EVENT.maxHeadcount + 1 }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? "Regretfully cannot attend" : i}
                    </option>
                  ))}
                </select>
              </label>

              <AnimatePresence>
                {names.map((name, i) => (
                  <motion.label
                    key={i}
                    className="flex flex-col gap-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  >
                    <span className="text-sm uppercase tracking-widest text-sage">
                      Guest {i + 1} name
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) =>
                        setNames((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
                      }
                      className="rounded-lg border border-sage/40 bg-cream px-4 py-3 text-ink"
                    />
                  </motion.label>
                ))}
              </AnimatePresence>

              <label className="flex flex-col gap-2">
                <span className="text-sm uppercase tracking-widest text-sage">Message (optional)</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="rounded-lg border border-sage/40 bg-cream px-4 py-3 text-ink"
                />
              </label>

              {status === "error" && <p className="text-sm text-red-700">{error}</p>}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="rounded-full bg-deepsage py-3 text-sm uppercase tracking-widest text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {status === "submitting" ? "Sending…" : "Send RSVP"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify in dev** — add `<Rsvp />` to page. Select headcount → name fields animate in. Submit → thank-you state. Run `npm run dev`.

- [ ] **Step 3: Verify build** — `npm run build` succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Rsvp.tsx src/app/page.tsx
git commit -m "feat: animated RSVP form section"
```

---

## Task 13: Footer + compose final page

**Files:**
- Create: `src/components/sections/Footer.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `Footer.tsx`**

```tsx
import { EVENT } from "@/data/event";
import { Monogram } from "@/components/botanicals/Monogram";
import { Reveal } from "@/components/motion/Reveal";

export function Footer() {
  return (
    <footer className="flex flex-col items-center gap-4 px-6 py-20 text-center">
      <Reveal>
        <Monogram className="w-24" />
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-sage">
          {EVENT.dateLabel}
        </p>
      </Reveal>
    </footer>
  );
}
```

- [ ] **Step 2: Replace `src/app/page.tsx`** with final composition

```tsx
import { Hero } from "@/components/sections/Hero";
import { SaveTheDate } from "@/components/sections/SaveTheDate";
import { Schedule } from "@/components/sections/Schedule";
import { Venue } from "@/components/sections/Venue";
import { Details } from "@/components/sections/Details";
import { Rsvp } from "@/components/sections/Rsvp";
import { Footer } from "@/components/sections/Footer";

export default function Page() {
  return (
    <main>
      <Hero />
      <SaveTheDate />
      <Schedule />
      <Venue />
      <Details />
      <Rsvp />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 3: Full verification**

Run: `npm test && npm run lint && npm run build`
Expected: all tests pass, lint clean, build succeeds.

Run: `npm run dev` and scroll the whole page on a mobile viewport (390×844). Confirm: hero reveal → countdown ticks → schedule staggers → venue card → details → RSVP flow → footer. Toggle OS reduced-motion and confirm motion collapses to fades.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Footer.tsx src/app/page.tsx
git commit -m "feat: footer and final page composition"
```

---

## Deployment (manual, after build is green)

1. Push to GitHub, import repo in Vercel.
2. Set env vars in Vercel: `RESEND_API_KEY`, `RSVP_TO_EMAIL=amine@quandri.io`, `RSVP_FROM_EMAIL` (a Resend-verified sender; `onboarding@resend.dev` works for testing).
3. Deploy. Test RSVP end-to-end on the live URL; confirm email arrives.

---

## Self-Review Notes

- **Spec coverage:** intro reveal (T5), save-the-date+countdown (T6), schedule (T7), venue+maps (T8), details (T9), RSVP+email (T10–12), footer (T13), tokens/fonts/reduced-motion (T2), parallax/spring motion (T3), botanicals/monogram (T4). Our Story intentionally cut (no photos) per plan note — re-add as a `sections/Story.tsx` later. Music omitted per default.
- **Types consistent:** `Countdown`, `Rsvp`/`RsvpInput`/`ParseResult`, `EVENT` shape used identically across tasks.
- **No placeholders:** every code step is complete and runnable.
