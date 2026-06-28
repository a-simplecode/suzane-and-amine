# Suzane & Amine — Animated Wedding Site (Design Spec)

**Date written:** 2026-06-28
**Event:** Suzane & Amine · Saturday, August 29, 2026
**Venue:** L'Heritage Venue · Nahr El Kalb, Lebanon
**Owner:** Amine (amine@quandri.io)
**Status:** Approved design, pre-implementation

---

## 1. Concept

A modern-sage **animated wedding site**, inspired by animated Etsy invitation cards but expanded into a full single-page experience: an elegant animated intro reveal, then a scroll through event details ending in an RSVP form.

Deliberate pivot away from the prior heavy WebGL/3D builds (rejected). The new build prioritizes **highest polish per unit of effort**: lightweight, fast, mobile-first, motion-driven with Framer Motion + inline SVG. No 3D, no WebGL.

Guiding default for any unspecified decision: **simplest, fastest, fewest dependencies.**

---

## 2. Scope

Full site: animated invite + RSVP + event details.

Single public route `/`. No per-guest slugs (dropped — was a source of complexity in prior builds). One shared invitation for everyone.

---

## 3. Tech Stack

- **Next.js** (App Router) + **TypeScript**, deployed on **Vercel** free tier (`*.vercel.app`, no custom domain yet).
- **Tailwind CSS v4** for layout and design tokens.
- **Framer Motion** for all animation (intro reveal, scroll-triggered entrances via `whileInView`, parallax, drifting florals).
- **Inline SVG** for all botanical art (eucalyptus / olive-branch sprigs) and the monogram — scalable, crisp, near-zero asset weight.
- **Resend** (free tier, 100/day) for RSVP email delivery.
- **Fonts:** Cormorant Garamond (display serif) + Inter (body), via `next/font`.

No database. No 3D libraries (no three / @react-three / drei).

---

## 4. Design System

### Palette (modern sage)
| Role | Hex |
|------|-----|
| Background base (cream) | `#F3F1E9` |
| Sage (accent / botanicals) | `#8A9A7B` |
| Deep sage (secondary ink / borders) | `#4A5742` |
| Ink (primary text) | `#2E332B` |

Anchors, not gospel — final values tuned on a real phone in daylight. Optional faint gold may be introduced only if a warm focal accent is needed; default is none.

### Typography
- Display: **Cormorant Garamond** — names "Suzane & Amine" set large with generous tracking.
- Body: **Inter** — clean, legible at small sizes.
- Airy whitespace throughout; mobile-first vertical rhythm.

### Motion (feel: lively)
- Intro: SVG botanical paths draw in (`pathLength` animation), names + date fade/spring up.
- Scroll: each section springs/staggers into view on enter (`whileInView`, once).
- Parallax: layered botanicals drift at different rates with scroll.
- Subtle continuous drift on decorative florals.
- Respect `prefers-reduced-motion`: collapse to simple fades, no parallax/continuous motion.

---

## 5. Page Structure (top to bottom, single `/` route)

| # | Section | Content | Motion |
|---|---------|---------|--------|
| 1 | Hero / intro | "Suzane & Amine", date, soft scroll cue | Botanical draw-in, names/date spring up, parallax leaves |
| 2 | Save the date | Date `08 · 29 · 2026`, live countdown to event | Springy entrance, ticking countdown |
| 3 | Our story *(optional — TBD)* | Short line + couple photo | Parallax, fade-up |
| 4 | The day / schedule | Timeline of the evening | Staggered item entrance |
| 5 | Venue | L'Heritage, Nahr El Kalb; illustrated card + "Open in Maps" link | Fade-up, leaf accents |
| 6 | Details | Dress code, parking, notes | Fade-up |
| 7 | RSVP | Headcount dropdown → N name fields → submit → thank-you | Field reveal animation, success state |
| 8 | Footer | S&A monogram, date, gentle outro | Soft fade |

A persistent small countdown or monogram in a corner is optional; default omit to keep the scroll clean.

---

## 6. RSVP Flow

- Client-side form, no auth.
- Fields:
  - Headcount: dropdown `0 → MAX_HEADCOUNT`.
  - Selecting N reveals N attendee name fields.
  - Optional short message field.
- Submit → `POST /api/rsvp` → Resend email to amine@quandri.io.
- Success → animated thank-you state inline (no confetti).
- Network failure → inline error + retry; preserve entered values.
- No DB, no edit-after-submit, no dedupe (low guest volume, email is the record).

---

## 7. Content To Confirm During Spec Review

Defaults below are assumptions carried from prior planning. Confirm or correct each:

1. **Schedule times** (default): 7:00pm Arabic mass · 8:00pm welcome drink · 8:30pm dinner & party — all at the same venue, different outdoor sections.
2. **Dress code** (default): Formal. Valet/parking available.
3. **RSVP max headcount** (default): 8.
4. **Our Story section + couple photos**: include or cut? If include, photos needed.
5. **Background music**: include a tap-to-play toggle (e.g. a chosen song, ~50% volume, mute always visible) or omit entirely? Default: omit.
6. **Venue map link**: confirm exact L'Heritage location / coordinates for the "Open in Maps" link.

---

## 8. Non-Goals (YAGNI)

- No 3D / WebGL.
- No per-guest slugs or personalized links.
- No database or admin dashboard.
- No multi-language (English only).
- No custom domain (initial).
- No confetti / heavy effects.

---

## 9. Success Criteria

- Loads fast on mobile over 4G; first paint of hero under ~1s.
- Smooth motion, no jank on mid-range phones; graceful `prefers-reduced-motion`.
- Visually on-par with the modern-sage Etsy animated invitations.
- RSVP reliably emails Amine; failures are recoverable by the guest.
- Clean `tsc` + lint + `next build`.

---

## 10. Component / Module Boundaries

- `src/app/page.tsx` — composes sections in order.
- `src/app/layout.tsx` — fonts, metadata, OG image, base styles.
- `src/app/api/rsvp/route.ts` — validates payload, sends via Resend.
- `src/data/event.ts` — single source of truth for names, date, venue, schedule, dress code, MAX_HEADCOUNT.
- `src/components/sections/*` — one file per section (Hero, SaveTheDate, Story, Schedule, Venue, Details, Rsvp, Footer). Each self-contained, owns its own motion.
- `src/components/botanicals/*` — reusable inline-SVG sprigs + monogram.
- `src/components/motion/*` — shared motion primitives (e.g. `Reveal`, `Parallax` wrappers) so sections stay declarative.
- `src/lib/cn.ts` — class helper. `src/lib/countdown.ts` — countdown math (unit-testable).

Each section is understandable and editable in isolation; event facts live only in `event.ts`.
