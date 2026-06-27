# The Invitation v2 — Design Spec

**Date:** 2026-06-11
**Project:** suzane-and-amine wedding site
**Goal:** Elevate the invitation experience from its current state (flat 2D SVG, timer-driven, framer-motion-only) to a high-end, mobile-first, 3D scroll-driven cinematic experience.

## Decisions (locked with user)

| Decision | Choice |
|---|---|
| Pacing | Hybrid: tap-seal cinematic intro (time-driven ~2.5s), everything after is scroll-driven |
| 3D | Real WebGL via React Three Fiber |
| Photos | 5 couple photos woven in (already at `public/images/*.JPG`, 5760×3840 raws) |
| Story scope | Keep the existing 5 beats; perfect each, no new chapters |
| Device floor | Modern phones (iPhone 11+ / mid-Android 2020+) get full 3D; older devices get a simple static fallback |

## Tech stack

**Additions:**
- `three`, `@react-three/fiber`, `@react-three/drei` — 3D scene, helpers (textures, environment)
- Dev-only `sharp` script — resize the 5 raw photos to ~1600px WebP plus tiny blur placeholders; raws never ship

**Kept (no GSAP, no Lenis):**
- `framer-motion` (already installed) for DOM animation and scroll progress. The raw scroll value is damped (lerped) inside the R3F render loop to produce smooth, Lenis-like motion without an extra library.
- Existing: invite slug system (`src/lib/invites.ts`, `src/data/invites.json`), RSVP API + offline retry, countdown, music toggle, metadata, fonts (Cormorant Garamond + Inter), olive/beige palette.

## Architecture

- One **fixed full-viewport WebGL canvas** + a tall scroll container (~600vh) whose scroll position maps to a master progress value 0→1.
- A **DOM overlay layer** (typography, venue card, RSVP form) synced to the same progress value.
- One **continuous camera** across the whole 3D narrative — no hard cuts between beats.
- The three.js bundle is **lazy-loaded** behind an instant-paint envelope poster frame. Tap is queued if the bundle is still loading.

### Component layout

```
src/components/three/   ← all R3F scene code ("use client")
  Experience.tsx        ← canvas, master timeline, scroll damping
  Envelope3D.tsx        ← paper envelope, flap, wax seal, shards
  Card3D.tsx            ← invitation card mesh + typography texture
  Polaroids.tsx         ← 5 photo planes, parallax drift
  PaperPlane3D.tsx      ← fold morph + flight
  FlightMap.tsx         ← stylized paper map (reuses Natural Earth data)
  Atmosphere.tsx        ← grain, dust particles, lighting rig
src/components/         ← DOM layer (existing components, polished)
src/lib/quality.ts      ← WebGL/perf/reduced-motion detection
scripts/prepare-photos.mjs ← sharp resize pipeline
```

## The five beats

### Beat 1 — Seal (tap, time-driven ~2.5s)
Paper-textured 3D envelope lying in soft directional light. Film grain overlay, slow dust particles. Wax seal pulses gently. On tap: seal cracks with 3D shards, flap rotates open with true perspective, card slides out with a subtle paper bend, brief light bloom. Music starts (existing tap-to-start + mute toggle). Ends with the card facing the camera and a "scroll" hint. This is the only auto-play moment.

### Beat 2 — Card + photos (scroll segment ~0→0.2)
Card tilts back into space. The 5 photos slip out as textured polaroid planes, floating with staggered parallax, drifting past the camera as the guest scrolls. Names and date render as DOM typography over the canvas.

### Beat 3 — The fold (scroll ~0.2→0.35)
The card geometry folds itself into a paper plane via real vertex/morph animation (procedural geometry, no GLTF assets). Camera orbits during the fold.

### Beat 4 — Flight (scroll ~0.35→0.8)
Plane banks and pitches responsive to scroll velocity, flying over a stylized 3D paper relief map built from the existing Natural Earth path data. A dashed arc draws Vancouver→Beirut behind the plane; cloud wisps and a soft plane shadow ground it. Arrival: camera dives into the Lebanon detail layer, a pin drops on L'Heritage Venue, Nahr El Kalb.

### Beat 5 — Venue + RSVP (DOM, scroll ~0.8→1)
Scroll-revealed DOM: polished venue card (schedule rows, dress code, valet, embedded map), RSVP form, thank-you state. All existing logic preserved (slug, max guests, offline retry via localStorage, `/api/rsvp`).

## Photos pipeline

`scripts/prepare-photos.mjs` (run manually, dev dependency on `sharp`):
- Input: `public/images/*.JPG` (5760×3840, ~11MB each)
- Output: `public/images/web/<name>.webp` at 1600px long edge (~150-250KB each) + 24px blur placeholder data
- WebGL polaroids load the WebP versions as textures; fallback grid uses `next/image`.
- Raw JPGs stay in the folder but are never referenced by the app.

## Mobile & fallback

- DPR clamped to 1.5 on the canvas; particle counts halved on touch devices.
- Fluid `clamp()` typography for all overlay text.
- `src/lib/quality.ts` decides tier at mount: WebGL2 support + basic perf heuristic + `prefers-reduced-motion`.
  - **Full tier:** experience above.
  - **Fallback tier:** static elegant version — current 2D envelope-open animation (polished), card, photo grid fade-in (`next/image`), venue card, RSVP. No flight scene, no canvas.
- iOS Safari: `dvh` units (already used), no scroll-jacking — native scroll only.
- `prefers-reduced-motion` always forces fallback tier.

## Performance budget

- Added JS (three + R3F + drei, tree-shaken): target ≤ 300KB gzipped, lazy-loaded after first paint.
- First paint: envelope poster (DOM/SVG) renders instantly; canvas crossfades in when ready.
- Textures: photos ≤ 250KB each, paper/grain textures procedural or ≤ 50KB.
- 60fps on iPhone 12-class devices; frame-time watchdog can drop particles/DOF live.

## Error handling

- Three bundle fails to load → fallback tier automatically.
- RSVP network failure → existing localStorage retry-on-focus flow (kept).
- Missing photo files → polaroid slot simply not rendered (no crash).

## Testing

- Manual matrix: iOS Safari (iPhone 11/12+), Android Chrome, desktop Chrome/Safari/Firefox.
- `prefers-reduced-motion` forced via devtools → fallback renders.
- WebGL disabled via devtools → fallback renders.
- Lighthouse mobile: performance ≥ 80, no CLS from canvas mount.
- RSVP flow end-to-end on both tiers.

## Out of scope

- New story chapters (love-story timeline, gallery page, travel info)
- GSAP/Lenis
- GLTF/Blender-authored assets — all geometry procedural
- CMS or photo upload tooling
