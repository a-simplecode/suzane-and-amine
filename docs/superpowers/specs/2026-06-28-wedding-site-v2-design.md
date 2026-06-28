# Wedding Site v2 — "Two places. One love." Design

**Date:** 2026-06-28
**Status:** Approved pending user review
**Couple:** Suzane & Amine · Saturday, August 29, 2026

## Goal

A second, cinematic edition of the wedding invitation site living at the
`/v2` route, built fresh from a luxury "two places, one love" concept (bride in
Beirut, groom in Vancouver). v1 (`src/app/page.tsx` and `src/components/sections/*`)
stays fully intact and untouched for side-by-side comparison.

## Scope Decisions (confirmed)

- **Relation to v1:** New route `/v2`. v1 left as-is.
- **Couple data:** Real values — Suzane & Amine, Aug 29 2026 (from `EVENT`).
- **Map:** Stylized olive-toned SVG (no external tiles / API keys).
- **RSVP:** Reuse existing `/api/rsvp` (Resend). No backend changes.
- **Dietary field:** Shown in the v2 form, folded into the existing free-text
  `message` payload client-side. `parseRsvp` and the API route are NOT modified.

## Reuse (no changes)

- `src/data/event.ts` — all copy, schedule, cities, story beats, dates.
- `src/app/api/rsvp/route.ts` — RSVP email endpoint.
- `src/lib/rsvp.ts` — `parseRsvp`, `Rsvp` type, length constants.
- `src/lib/countdown.ts` — `computeCountdown`.
- `src/app/globals.css` `@theme` tokens — `cream`, `sage`, `deepsage`, `ink`,
  `font-display` (Cormorant), `font-body` (Inter).
- `src/app/layout.tsx` — root layout already wires fonts globally; `/v2` inherits.

## Architecture

```
src/app/v2/page.tsx          # composes the v2 sections; page-level metadata
src/components/v2/
  Hero.tsx                   # cinematic curtain reveal + drifting olive leaves
  Story.tsx                  # Vancouver -> Beirut timeline w/ photo placeholders
  InvitationCards.tsx        # ceremony/venue/dress/reception cards
  JourneyMap.tsx             # stylized SVG map, animated arc, clickable cities
  Countdown.tsx              # live timer (client) via computeCountdown
  Rsvp.tsx                   # form -> /api/rsvp, success animation
  Closing.tsx                # final message + olive branch + monogram
  motion/                    # shared v2 primitives
    Reveal.tsx               # scroll-into-view fade/slide wrapper
    OliveLeaves.tsx          # decorative animated leaf field (SVG)
    Sprig.tsx                # olive sprig / branch SVG
```

Each section is a focused unit consuming `EVENT`. Client components only where
interaction/animation requires it (`Hero`, `JourneyMap`, `Countdown`, `Rsvp`,
motion wrappers); `Story`, `InvitationCards`, `Closing` can be server components
wrapping client `Reveal`.

## Sections

1. **Hero** (client) — On load, a soft beige curtain parts (two panels easing
   apart) to reveal the page. Olive leaves drift in the background (CSS/framer
   loop, disabled under `prefers-reduced-motion`). Names "Suzane & Amine" reveal
   with a per-letter stagger; date label below; the line
   *"Two places. One love. One forever."*; CTA **"Join Our Celebration"**
   smooth-scrolls to RSVP.

2. **Our Story** — Vertical timeline ordered Vancouver → Beirut using
   `EVENT.story` (3 beats). Each beat: photo placeholder frame (renders an
   elegant framed placeholder until `/public/story/{1,2,3}.jpg` exist), place,
   year/label, title, text. Scroll-reveal per beat, alternating sides on desktop.

3. **Invitation Cards** — Interactive cards built from `EVENT`: ceremony date +
   time (first schedule item), venue name + area + maps link, dress code +
   parking from `EVENT.details`, reception flow from remaining `EVENT.schedule`.
   Hover: lift + soft sheen + border accent. Animate in on scroll.

4. **Interactive Map** (client) — Hand-drawn olive-toned SVG of the relevant
   region. Vancouver and Beirut placed at `EVENT.cities.*` `x`/`y` percentages.
   An arc/great-circle line draws on as the section scrolls into view
   (`pathLength` animation). Clicking a city marker reveals a panel with its
   `blurb`. Reduced-motion: arc renders drawn, no looping.

5. **Countdown** (client) — Live timer to `EVENT.dateISO` via `computeCountdown`,
   ticking each second, days/hours/minutes/seconds in elegant serif digits with
   a subtle flip/fade on change. Shows a "the day is here" state when `isPast`.

6. **RSVP** (client) — Fields: guest name(s), number of guests (1..`maxHeadcount`,
   drives dynamic name inputs), attendance (attending toggles headcount 0 vs >0
   per existing `attending = headcount > 0` rule), **dietary requirements**
   (optional textarea), message to the couple. On submit: POST `/api/rsvp` with
   `{ headcount, names, message }` where `message` = user message + an appended
   "Dietary: ..." line when provided. Success → confirmation animation (olive
   sprig bloom + thank-you). Inline error on failure.

7. **Closing** — *"From two cities to one forever."* with a soft animated olive
   branch and the monogram. Final invitation feeling.

## Data Flow

- Static: sections import `EVENT` directly.
- RSVP: client form → `fetch('/api/rsvp', POST json)` → existing handler →
  Resend (or dev no-op when key absent). Client maps `{ok}` to success/error UI.
- Countdown: client computes target ms from `EVENT.dateISO` once, ticks `nowMs`
  via `setInterval`, calls pure `computeCountdown`.

## Error Handling

- RSVP: client-side required-field + headcount guard before submit; server
  remains source of truth (`parseRsvp`). Non-200 → inline error message, form
  stays editable. Network throw → generic retry message.
- Map: clicking same city toggles panel closed; no city selected = arc only.
- Missing story photos: placeholder frame, never a broken image.

## Testing

- Existing `tests/countdown.test.ts` and `tests/rsvp.test.ts` continue to cover
  reused logic (unchanged).
- New pure helper (if any) for composing the dietary-appended message gets a unit
  test; e.g. `composeRsvpMessage(message, dietary)`.
- Manual: `next build` + lint clean; visual pass desktop + mobile; reduced-motion
  check.

## Out of Scope

- Real map tiles / geolocation.
- Backend schema changes, auth, rate limiting.
- Replacing or modifying v1.
- Photo assets (placeholders until provided).
```
