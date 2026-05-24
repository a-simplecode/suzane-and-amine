# Suzane & Amine — Wedding Site Spec

**Date:** Saturday, August 29, 2026
**Venue:** L'Heritage Venue · XJ24+H8P, Nahr El Kalb, Lebanon
**Audience:** Family & friends, mobile-first, public URLs gated by slug
**Owner:** Amine

This is the design + engineering brief. Build it as written. If a decision isn't here, default to "simplest, fastest, fewest dependencies."

---

## 1. Concept

**"Envelope to Wedding"** — a single tap-driven cinematic scene that takes the guest from a sealed invitation envelope to an RSVP form. One uninterrupted animation, no scroll, no menu, no chapters.

The journey: envelope → invitation card → paper plane → world map → flight Vancouver→Lebanon → venue card → RSVP → thank-you.

---

## 2. User Flow

| # | Beat | User action | Visual |
|---|------|-------------|--------|
| 1 | Land on `/<slug>` | — | Envelope centered, addressed to invite label, olive-green wax-sealed stamp w/ S&A monogram. Countdown in top corner. |
| 2 | Tap stamp | Tap | Music begins (Ed Sheeran "Perfect", 50% vol). Wax seal cracks. Envelope flap opens. |
| 3 | Auto-continue | — | Invitation card slides out, flips to reveal "Suzane & Amine · Aug 29, 2026" + warm-casual copy. |
| 4 | Auto-continue | — | Card folds into a beige origami paper plane. Lifts off-screen. |
| 5 | Auto-continue | — | Camera zooms out. World map appears. Dotted great-circle arc Vancouver→Lebanon. |
| 6 | Auto-continue | — | Plane departs Vancouver (label only). Curves over Atlantic. Stops at Suzane's house in Lebanon (generic illustrated). Picks her up (tiny avatar joins). Resumes to venue. |
| 7 | Auto-continue | — | Plane lands at illustrated church + venue. Venue card appears with details + schedule. |
| 8 | Tap "RSVP" | Tap | Form slides up. Dropdown: number of attendees (0 → max for this slug). Selecting N reveals N name fields. Submit button. |
| 9 | Tap submit | Tap | Form posts. Thank-you screen. Bigger centered countdown. No confetti. |

**Replay rule:** on every visit, full animation plays from beat 1. Even if guest already submitted. No skip button.

**Invalid slug:** show generic envelope with "This invite link is invalid." No animation triggers.

---

## 3. Design System

### Palette
| Role | Color |
|------|-------|
| Background base | warm beige (~`#F1E9DA`) |
| Ink / text | deep olive (~`#3A4A2E`) |
| Accent / seal / monogram | olive green (~`#6B7A4B`) |
| Paper plane | beige (~`#E8DFC9`) |
| Map land | muted beige |
| Map water | soft olive wash |
| Dotted arc | olive |

Final hex picked by engineer — these are anchors, not gospel. Test on real phones in sunlight.

### Typography
Engineer picks. Suggested pair:
- Display: a refined serif (e.g. Cormorant Garamond, Playfair Display)
- Body: clean sans (e.g. Inter, DM Sans)
- Names "Suzane & Amine" set in display, larger, tracking +0.02em

### Voice
Warm-casual English. Examples:
- ✅ "We can't wait to celebrate with you."
- ✅ "Save the date — and your favorite shoes."
- ❌ "We request the honour of your presence at the matrimony of…"

### Monogram
Olive-green single-line illustrated **"S & A"**. Used on:
- Wax seal on envelope
- Tab favicon
- OG share image
- Loading state if needed
- Subtle watermark on thank-you screen

Engineer: generate via any free AI tool, export SVG, inline.

### Couple avatars
Tiny illustrated, used in **plane window** and **map dots**.
- **Suzane**: long straight brown hair, light skin, white dress
- **Amine**: tan skin, black short trim beard + mustache, suit

Avatars should be SVG, ~80px max, readable as silhouettes at small size.

---

## 4. Content

### Envelope
- Front: addressed to invite `label` (dynamic per slug). Example: "The Smith Family"
- Wax seal: S&A monogram, olive green
- No stamps, no postal markings — keep minimal

### Invitation card copy
```
Suzane & Amine
are getting married

Saturday · August 29, 2026
Nahr El Kalb, Lebanon

[continue]
```
"continue" is implicit — auto-progresses after ~2.5s pause.

### Venue card
```
L'Heritage Venue
Nahr El Kalb, Lebanon

7:00 PM   Mass (Arabic)
8:00 PM   Welcome drink
8:30 PM   Dinner & dancing

Dress code: formal
Valet parking available

[RSVP]
```
Below: a simple lazy-loaded embedded map (Google Maps iframe or static map image — engineer's call, prefer lighter option).

### RSVP form
- Heading: "Will you join us?"
- Dropdown: "Number of guests" → 0, 1, 2, … up to `max` for this slug
- If N > 0: N text inputs labeled "Name of guest 1," "Name of guest 2," etc.
- Submit button: "Send RSVP"
- On success: thank-you screen
- On network error: store payload in `localStorage`, retry on next page focus

### Thank-you screen
- Heading: "Thank you 💌"  *(remove emoji if user doesn't want it — currently the rest of the site uses none)*
  → Engineer note: Amine prefers no emojis. Use a small olive heart SVG instead.
- Sub: "We can't wait to see you on August 29."
- Big centered countdown (DD : HH : MM : SS)
- Subtle S&A monogram watermark

---

## 5. Invite URL System

### URL pattern
`/<slug>` — e.g. `/the-smiths`, `/family-tarek`, `/sara-and-george`

### Slug source
**JSON file at `src/data/invites.json`** committed to repo.

Record shape:
```json
[
  { "slug": "the-smiths", "label": "The Smith Family", "max": 4 },
  { "slug": "family-tarek", "label": "Family Tarek", "max": 2 }
]
```

Adding a guest = edit JSON, commit, push, Vercel auto-deploys (~30s).

### Validation
- Slug not in list → invalid screen (see §2)
- Slug matched → render with `label` on envelope, `max` cap on dropdown

### Edit / resubmit
**Disabled.** First submission wins. If a slug is already submitted, RSVP form still appears (we don't tell them they already submitted — keeps it simple), but the backend de-dupes by slug and ignores later submissions. Or: form just submits silently and shows thank-you regardless. Engineer picks whichever is simpler.

---

## 6. RSVP Submission

### Plumbing
- API route: `POST /api/rsvp`
- Body: `{ slug, count, names: string[] }`
- Server validates slug exists, count ≤ max
- Sends email via **Resend** to Amine's address with subject `RSVP — <label> — <count> guests`
- Body lists names

### Failure handling
- Network fail on client → save `{slug, count, names, ts}` in `localStorage` under key `pending-rsvp`
- On next page focus, if `pending-rsvp` exists, retry POST silently
- After success, clear `localStorage` key

### Anti-spam
None. Public URLs but cap is one submission per slug. Bots crawling random slugs hit invalid screen.

### Env vars
```
RESEND_API_KEY=...
RSVP_DEST_EMAIL=amine@<his-email>
```

---

## 7. Animation

### Library choices
- **Framer Motion** + inline **SVG** — envelope, invitation card, avatars, venue card, RSVP transitions
- **Lottie** — paper-plane-on-map sequence only (plane curving along arc is much easier to author in After Effects than to hand-code path tweens)

### Performance budget
- Sub-1s first paint on 4G: envelope visible
- No lag during animation — preload Lottie + SVG sprites + map background before beat 5
- Total page weight: not strict, but don't ship gratuitous assets

### Preload strategy
On mount of `/<slug>`:
1. Render envelope immediately (inline SVG, <30KB)
2. In background: prefetch Lottie JSON for plane sequence, prefetch map image, preload audio file
3. By the time user taps stamp (typically 2–4s after landing), assets are warm

### Music
- File: `/public/perfect.mp3` (existing in repo per memory)
- HTMLAudio element
- **Never** attempts autoplay
- Starts ONLY on stamp tap (counts as user gesture, iOS-safe)
- Volume 50%, no loop
- Mute toggle visible top-right always after music starts

---

## 8. Countdown

- Position: top-right corner, persistent across all beats
- Format: `XX days · XX hours` (drop seconds in corner — too jittery on small text)
- On thank-you screen: big centered, full `XX days · XX hrs · XX min · XX sec`
- Source of truth: `2026-08-29T19:00:00+03:00` (Beirut time)

---

## 9. SEO / Share

- `<title>`: `Suzane & Amine · Aug 29, 2026`
- `<meta description>`: warm one-liner inviting them
- OG image: see §13
- Favicon: monogram SVG (see §13)

---

## 10. Repo Hygiene

Old R3F scrollytell code already wiped (per memory). Build fresh:
- `src/app/page.tsx` → loads `/[slug]` redirect logic or default invalid screen
- `src/app/[slug]/page.tsx` → main scene
- `src/components/Envelope.tsx`, `InvitationCard.tsx`, `PaperPlane.tsx`, `WorldMap.tsx`, `VenueCard.tsx`, `RsvpForm.tsx`, `ThankYou.tsx`, `Countdown.tsx`, `MusicToggle.tsx`
- `src/data/invites.json`
- `src/app/api/rsvp/route.ts`
- `public/perfect.mp3`, `public/lottie/plane.json`, `public/og.png`

---

## 11. Out of scope (do NOT build)

- Multi-language
- Photo gallery
- Live-stream
- Registry / gift links
- Map turn-by-turn directions
- Calendar export (.ics)
- Email confirmation to guest
- Edit-RSVP flow
- After-date "we got married" page (deferred)
- Confetti
- Sun / daylight cycle on flight
- Real-venue illustration reference
- 3D / R3F / Three.js

---

## 12. Definition of done

- Open `/the-smiths` on iPhone 13, 4G simulated → envelope visible in under 1s
- Tap stamp → music starts, full animation runs without dropped frames
- Reach RSVP → submit with 2 names → email lands in Amine's inbox within 30s
- Open `/wrong-slug` → invalid screen, no animation
- Refresh `/the-smiths` after submit → animation replays from start
- Lighthouse mobile score ≥ 90 perf, ≥ 95 a11y

---

## 13. Monogram & OG Image Specs

### 13.1 Locked color tokens (use these exact hex)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-beige` | `#F1E9DA` | Page background, envelope paper, OG background |
| `--bg-beige-warm` | `#E8DFC9` | Card surface, plane body, depth layer |
| `--ink-olive-deep` | `#2F3A22` | Body text, dark stroke |
| `--accent-olive` | `#6B7A4B` | Monogram stroke, wax seal, accents |
| `--accent-olive-soft` | `#8B9968` | Map water wash, hover, secondary stroke |

All hex committed to `src/lib/tokens.ts` and Tailwind theme.

---

### 13.2 Monogram — "S & A"

**Asset:** `public/monogram.svg`

**Spec:**
- Format: SVG, single `<path>` element, no fills, stroked only
- Viewbox: `0 0 200 120`
- Glyph layout: `S`  ampersand  `A`, single continuous flowing line, like one calligraphic stroke
- Stroke: `#6B7A4B` (`--accent-olive`), `stroke-width: 2.5`, `stroke-linecap: round`, `stroke-linejoin: round`, `fill: none`
- Style reference: editorial wedding monogram, hand-drawn calligraphic loop, *not* geometric/industrial, *not* serif type
- Ampersand: lowercase `&` glyph integrated into the same line — entering from S's bottom curl, exiting into A's left leg
- Negative space matters: ~30% white space inside viewbox so it reads at favicon size (16x16)
- No text labels, no border, no underline, no laurel/wreath
- Optical balance: visual center of glyph ≈ (100, 60). "S" and "A" roughly equal weight; "&" smaller, sits at baseline midway

**Acceptance:**
- Renders crisp at 16px favicon AND at 400px hero size
- Reads as single ink stroke at distance
- Works white-on-olive (inverted for wax seal) AND olive-on-beige (default)

**Generation recipe (zero budget):**

Prompt to ChatGPT/Claude with image gen OR Midjourney OR free SVG tools:

> Single-line minimalist wedding monogram. Letters "S" and "A" with an ampersand "&" between them, drawn as one continuous flowing calligraphic line, no lift. Olive green ink (#6B7A4B) on beige paper (#F1E9DA). Style: editorial, elegant, hand-drawn, like a wedding invitation seal. No serifs, no decorative flourishes, no wreath. Clean negative space. Square format.

Engineer:
1. Generate raster
2. Trace to SVG (Adobe Illustrator Image Trace, or free: vectorizer.io, vectormagic.com free tier)
3. Hand-clean nodes — must end as ONE `<path>`, ≤ 40 points
4. Optimize via SVGO → target ≤ 4KB
5. Commit `public/monogram.svg`

**Usage map:**
| Place | Size | Color |
|-------|------|-------|
| Wax seal on envelope | 80×48 | inverted: `--bg-beige` stroke on `--accent-olive` filled circle |
| Tab favicon | 32×32 + 16×16 | `--accent-olive` on transparent |
| Apple touch icon | 180×180 | `--accent-olive` on `--bg-beige` square |
| OG image center seal | 240×144 | inverted on olive circle |
| Thank-you watermark | 120×72, opacity 0.15 | `--accent-olive` |

**Favicon export:** ImageMagick or realfavicongenerator.net — produce `favicon.ico` (16, 32, 48), `apple-touch-icon.png` (180), `icon.svg` (vector). Drop in `public/` and `src/app/`.

---

### 13.3 OG Image — `public/og.png`

**Purpose:** preview when invite URL is shared on WhatsApp, iMessage, Twitter, LinkedIn, etc.

**Spec:**
- File: `public/og.png`
- Dimensions: **1200 × 630** (OG/Twitter standard)
- Format: PNG, sRGB, ≤ 200KB (compress via tinypng.com or squoosh)
- Safe area: keep all critical content inside center 1000 × 500 — chat apps crop edges
- DPI: 72 (web)

**Composition (top to bottom, left to right):**

```
┌─────────────────────────────────────────────────────────────┐
│           [#F1E9DA beige background]                        │
│                                                             │
│                                                             │
│           ┌─────────────────────────────┐                   │
│           │   illustrated envelope      │                   │
│           │   #E8DFC9 paper, slight     │                   │
│           │   shadow                    │                   │
│           │                             │                   │
│           │       ●  ← olive wax seal   │                   │
│           │           w/ S&A monogram   │                   │
│           │                             │                   │
│           └─────────────────────────────┘                   │
│                                                             │
│                   Suzane & Amine                            │
│              Saturday · August 29, 2026                     │
│                   Nahr El Kalb, Lebanon                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Layout dimensions (anchor in 1200×630 canvas):**
- Envelope: 540 × 320 centered at (600, 250)
- Wax seal: 140px diameter, centered on envelope at (600, 250)
- Names "Suzane & Amine": display serif, 72px, `--ink-olive-deep`, centered at y=470
- Date line: sans, 36px, `--accent-olive`, centered at y=525
- Location line: sans, 28px, `--accent-olive-soft`, centered at y=570
- Padding around envelope from frame edges: ≥ 100px

**Typography in OG:**
- Display: same serif as site (e.g. Cormorant Garamond, weight 500)
- Sans: same sans as site (e.g. Inter, weight 400)
- Tracking on names: +0.04em
- Tracking on date/location: +0.02em

**Envelope drawing notes:**
- 3/4 view from slight top angle, OR flat front-facing (engineer pick — flat is faster, easier to render crisp)
- Paper color `#E8DFC9` with subtle inner shadow `rgba(47,58,34,0.08)` for depth
- Flap visible on top OR closed front-only — closed is sufficient
- No address text on envelope (keep visual clean — names go below)
- Soft drop shadow behind envelope: `0 8px 32px rgba(47,58,34,0.12)`

**Wax seal:**
- Circle, 140px, fill `--accent-olive`
- Inner shadow for wax depth: `inset 0 -4px 8px rgba(0,0,0,0.15)`
- Tiny edge irregularity (wax drips) — 4–6 rounded bumps around perimeter, ±8px from center radius
- Monogram inset in center: 80px wide, `--bg-beige` stroke

**Generation recipe (zero budget):**

Option A — Compose in Figma/Canva free, export PNG:
1. Set frame 1200×630, fill `#F1E9DA`
2. Drop rectangle for envelope, apply shadow + paper color
3. Drop circle for seal, apply olive + inset shadow
4. Paste monogram SVG into seal
5. Add text layers
6. Export PNG, optimize

Option B — AI gen + compositing:
1. Prompt: *"Flat illustrated wedding envelope, beige paper #E8DFC9 on warm beige #F1E9DA background, olive green wax seal in center, soft drop shadow, minimalist, editorial wedding style, no text"*
2. Generate at 2400×1260, downscale to 1200×630
3. Composite monogram SVG over seal in Figma/Photoshop
4. Add text layers
5. Export + optimize

**Acceptance:**
- Tested by sharing dev URL in WhatsApp → preview shows envelope + names + date legibly
- File ≤ 200KB
- No text gets cropped by chat-app preview ratios (test 1.91:1 and 1:1 crops)
- Monogram readable at 200×105 thumbnail size

**Meta tags wiring:**
```html
<meta property="og:title" content="Suzane & Amine · Aug 29, 2026" />
<meta property="og:description" content="We can't wait to celebrate with you in Nahr El Kalb, Lebanon." />
<meta property="og:image" content="https://<vercel-url>/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://<vercel-url>/og.png" />
```

Wire via Next.js `metadata` export in `src/app/layout.tsx`.

---

### 13.4 Asset checklist

Before launch, these files must exist:

| Path | Source | Size target |
|------|--------|-------------|
| `public/monogram.svg` | hand-cleaned single-path SVG | ≤ 4KB |
| `public/favicon.ico` | from monogram, 16+32+48 | ≤ 10KB |
| `public/icon.svg` | from monogram | ≤ 4KB |
| `public/apple-touch-icon.png` | from monogram, 180×180 | ≤ 15KB |
| `public/og.png` | composed | ≤ 200KB |

