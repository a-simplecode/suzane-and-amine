# The Invitation v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the wedding invitation as a high-end 3D scroll-driven cinematic experience (tap-seal intro → photo reveal → paper-plane fold → flight to Lebanon → venue/RSVP), with a static fallback for weak devices.

**Architecture:** One fixed full-viewport R3F canvas + a 600vh scroll container. A mutable `Timeline` object (`{p, intro, vel}`) is updated once per frame (damped scroll progress + time-driven intro) and read by every 3D component. DOM overlay (typography, venue, RSVP) syncs to the same scroll progress via framer-motion. Tier detection routes weak devices / reduced-motion to a 2D fallback that reuses the existing components.

**Tech Stack:** Next.js 16 (App Router), React 19, three + @react-three/fiber (NO drei — core loaders suffice, smaller bundle; deliberate deviation from spec's "drei" line), framer-motion (existing), sharp (dev-only photo pipeline), Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-06-11-invitation-v2-design.md`

**Conventions that apply to every task:**
- All R3F code lives in `src/components/three/`, every file `"use client"`.
- No test runner exists in this repo. Verification per task = `npx tsc --noEmit` + `npm run lint` + a manual check in `npm run dev` (steps say exactly what to look at). Do not add a test framework.
- Visit `http://localhost:3000/<slug>` where `<slug>` is the first slug in `src/data/invites.json` (check the file; e.g. run `node -e "console.log(require('./src/data/invites.json')[0].slug)"`).
- Commit steps: ONLY run them if the session has been explicitly authorized to commit (user rule: never `git commit` unless explicitly asked). Otherwise skip commit steps and report files changed.

---

## File map

| File | Responsibility |
|---|---|
| `scripts/prepare-photos.mjs` | Create: sharp resize 5 raws → WebP + blur manifest |
| `src/data/photos.ts` | Generated: photo manifest (src/width/height/blurDataURL) |
| `src/lib/quality.ts` | Create: tier detection (`full` / `lite`) |
| `src/components/three/timeline.ts` | Create: beat ranges, `Timeline` type, easing helpers |
| `src/components/three/textures.ts` | Create: canvas textures (paper grain, card face, envelope face, world map) |
| `src/components/three/flight-path.ts` | Create: map coords helper + flight curve |
| `src/components/three/Atmosphere.tsx` | Create: lights, fog, dust particles |
| `src/components/three/Envelope3D.tsx` | Create: envelope body/flap/seal/shards + intro animation |
| `src/components/three/Card3D.tsx` | Create: card mesh, emerge + move-to-fold-position |
| `src/components/three/Polaroids.tsx` | Create: 5 photo planes, scroll-driven drift |
| `src/components/three/PaperPlaneFold.tsx` | Create: hinged-panel fold + flight along curve |
| `src/components/three/FlightMap.tsx` | Create: paper map, dashed arc, clouds, venue pin |
| `src/components/three/CameraRig.tsx` | Create: per-beat camera targets, damped |
| `src/components/three/Experience.tsx` | Create: Canvas, frame Driver, scene assembly |
| `src/components/Scene.tsx` | Rewrite: tier routing, scroll container, DOM overlay, lazy canvas |
| `src/components/FallbackScene.tsx` | Create: 2D fallback (existing envelope → card → photo grid → venue → RSVP) |
| `src/app/globals.css` | Modify: grain overlay, scroll-hint styles |
| `package.json` | Modify: deps + `photos` script |

Unchanged: `src/app/[slug]/page.tsx`, RSVP API, `RsvpForm`, `VenueCard`, `ThankYou`, `Countdown`, `MusicToggle`, `Envelope.tsx` (2D — used by fallback), `InvitationCard.tsx` (used by fallback), `WorldMap.tsx` (kept for fallback reference but no longer rendered in full tier).

---

### Task 1: Dependencies + photo pipeline

**Files:**
- Modify: `package.json` (via npm install + script entry)
- Create: `scripts/prepare-photos.mjs`
- Generated: `src/data/photos.ts`, `public/images/web/*.webp`

- [ ] **Step 1: Install dependencies**

```bash
npm install three @react-three/fiber
npm install -D @types/three sharp
```

Expected: package.json gains `three`, `@react-three/fiber` deps and `@types/three`, `sharp` devDeps. If `@react-three/fiber` complains about React 19 peer deps, install the v9 line: `npm install @react-three/fiber@^9`.

- [ ] **Step 2: Write the photo pipeline script**

Create `scripts/prepare-photos.mjs`:

```js
// Resizes the raw photos in public/images/ to web-sized WebP and writes a
// typed manifest with blur placeholders. Run manually: npm run photos
import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = "public/images";
const OUT = "public/images/web";
const MANIFEST = "src/data/photos.ts";
const LONG_EDGE = 1600;

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
if (files.length === 0) {
  console.error(`No source photos found in ${SRC}`);
  process.exit(1);
}

const entries = [];
for (const file of files) {
  const name = path.parse(file).name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const img = sharp(path.join(SRC, file)).rotate(); // respect EXIF orientation
  const outName = `${name}.webp`;
  const info = await img
    .clone()
    .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(path.join(OUT, outName));
  const blur = await img.clone().resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  entries.push({
    src: `/images/web/${outName}`,
    width: info.width,
    height: info.height,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
  });
  console.log(`${file} -> ${outName} (${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB)`);
}

const ts = `// Generated by scripts/prepare-photos.mjs — do not edit by hand.
export type Photo = {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
};

export const PHOTOS: Photo[] = ${JSON.stringify(entries, null, 2)};
`;
await writeFile(MANIFEST, ts);
console.log(`Wrote ${entries.length} entries to ${MANIFEST}`);
```

- [ ] **Step 3: Add npm script**

In `package.json` `"scripts"`, add:

```json
"photos": "node scripts/prepare-photos.mjs"
```

- [ ] **Step 4: Run it and verify output**

```bash
npm run photos
ls -la public/images/web/
```

Expected: 5 `.webp` files, each roughly 100–300KB, and `src/data/photos.ts` exists with 5 entries. Each entry's `width` should be 1600 (landscape sources).

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit (only if authorized)**

```bash
git add package.json package-lock.json scripts/prepare-photos.mjs src/data/photos.ts public/images/web
git commit -m "feat: add three/r3f deps and photo resize pipeline"
```

---

### Task 2: Timeline helpers + quality tier detection

**Files:**
- Create: `src/components/three/timeline.ts`
- Create: `src/lib/quality.ts`

- [ ] **Step 1: Create `src/components/three/timeline.ts`**

```ts
// Master timeline shared by all 3D components. A single mutable object is
// updated once per frame by the Driver (in Experience.tsx) and read by
// everyone else — no React state on the hot path.

export type Timeline = {
  /** Damped scroll progress 0..1 across the whole experience. */
  p: number;
  /** Tap-seal intro animation progress 0..1 (time-driven, ~2.5s). */
  intro: number;
  /** Smoothed scroll velocity in progress-units/sec (for plane banking). */
  vel: number;
  /** Whether the seal has been tapped. */
  opened: boolean;
};

export const createTimeline = (): Timeline => ({ p: 0, intro: 0, vel: 0, opened: false });

// Scroll beats (fractions of total scroll). Beat 1 (seal/intro) is
// time-driven, not scroll-driven, so it has no range here.
export const BEATS = {
  photos: [0.04, 0.22],
  fold: [0.22, 0.36],
  flight: [0.36, 0.72],
  arrive: [0.72, 0.84],
  outro: [0.84, 1.0],
} as const;

/** Normalized position of p inside [a,b], clamped to 0..1. */
export const seg = (p: number, a: number, b: number) =>
  Math.min(1, Math.max(0, (p - a) / (b - a)));

export const smooth = (t: number) => t * t * (3 - 2 * t); // smoothstep
export const easeOut3 = (t: number) => 1 - (1 - t) ** 3;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
```

- [ ] **Step 2: Create `src/lib/quality.ts`**

```ts
export type Tier = "full" | "lite";

// Decides whether the device gets the WebGL experience or the static
// fallback. Must only run client-side (returns "lite" during SSR so the
// caller's initial render is cheap; callers re-check in useEffect).
export function detectTier(): Tier {
  if (typeof window === "undefined") return "lite";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "lite";
  try {
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2")) return "lite";
  } catch {
    return "lite";
  }
  // deviceMemory is Chrome-only; absent (iOS Safari) means no signal — allow.
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (mem !== undefined && mem < 3) return "lite";
  return "full";
}
```

- [ ] **Step 3: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean.

- [ ] **Step 4: Commit (only if authorized)**

```bash
git add src/components/three/timeline.ts src/lib/quality.ts
git commit -m "feat: add timeline helpers and device tier detection"
```

---

### Task 3: Canvas textures (paper, card face, envelope face, world map)

**Files:**
- Create: `src/components/three/textures.ts`

All typography in the 3D scene is drawn to offscreen canvases (full control over Cormorant Garamond, no troika/font-file dependency). next/font hashes the family name, so we resolve the real family from a probe element using the existing `.font-display` class.

- [ ] **Step 1: Create `src/components/three/textures.ts`**

```ts
"use client";

import * as THREE from "three";
import { WORLD_LAND_PATHS } from "@/data/world-paths";

const COL = {
  beige: "#f1e9da",
  beigeWarm: "#e8dfc9",
  ink: "#2f3a22",
  olive: "#6b7a4b",
  oliveSoft: "#8b9968",
};

/** Resolve the real (hashed) Cormorant family name from the .font-display class. */
function displayFontFamily(): string {
  const el = document.createElement("span");
  el.className = "font-display";
  el.style.cssText = "position:absolute;visibility:hidden";
  document.body.appendChild(el);
  const fam = getComputedStyle(el).fontFamily;
  el.remove();
  return fam || "Georgia, serif";
}

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

function asTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Subtle paper grain, tileable enough at this scale. Used as a roughness/bump-ish color overlay. */
export function makePaperTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = COL.beigeWarm;
  ctx.fillRect(0, 0, 512, 512);
  const img = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  const tex = asTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Card face, 3:4. Redraws once webfonts are ready (first paint uses the
 * serif fallback for a frame or two, then needsUpdate swaps it).
 */
export function makeCardTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 1365;
  const { canvas, ctx } = makeCanvas(W, H);
  const tex = asTexture(canvas);

  const draw = () => {
    const display = displayFontFamily();
    ctx.fillStyle = COL.beigeWarm;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = COL.ink;
    ctx.font = `600 110px ${display}`;
    ctx.fillText("Suzane & Amine", W / 2, 560);
    ctx.fillStyle = COL.olive;
    ctx.font = "500 34px Inter, system-ui, sans-serif";
    const spaced = (s: string) => s.split("").join("  ");
    ctx.fillText(spaced("ARE GETTING MARRIED"), W / 2, 640);
    ctx.fillStyle = COL.olive;
    ctx.fillRect(W / 2 - 80, 720, 160, 2);
    ctx.fillStyle = COL.ink;
    ctx.font = `500 72px ${display}`;
    ctx.fillText("Saturday", W / 2, 850);
    ctx.font = `500 88px ${display}`;
    ctx.fillText("August 29, 2026", W / 2, 960);
    ctx.fillStyle = COL.olive;
    ctx.font = "500 30px Inter, system-ui, sans-serif";
    ctx.fillText(spaced("NAHR EL KALB · LEBANON"), W / 2, 1040);
    tex.needsUpdate = true;
  };

  draw();
  document.fonts.ready.then(draw);
  return tex;
}

/** Envelope front face (5:3) with the guest label. */
export function makeEnvelopeTexture(label: string): THREE.CanvasTexture {
  const W = 1250;
  const H = 750;
  const { canvas, ctx } = makeCanvas(W, H);
  const tex = asTexture(canvas);

  const draw = () => {
    const display = displayFontFamily();
    ctx.fillStyle = COL.beigeWarm;
    ctx.fillRect(0, 0, W, H);
    // back-fold V seam
    ctx.strokeStyle = COL.olive;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 30);
    ctx.lineTo(W / 2, 400);
    ctx.lineTo(W - 20, 30);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = COL.ink;
    ctx.textAlign = "center";
    ctx.font = `500 64px ${display}`;
    ctx.fillText(label, W / 2, 600);
    tex.needsUpdate = true;
  };

  draw();
  document.fonts.ready.then(draw);
  return tex;
}

/**
 * Stylized paper world map, 2048x1024, drawn from the same Natural Earth
 * paths the old SVG map used (equirect 720x360 coordinate space).
 */
export function makeMapTexture(): THREE.CanvasTexture {
  const W = 2048;
  const H = 1024;
  const { canvas, ctx } = makeCanvas(W, H);
  ctx.fillStyle = "#ede4d0";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.scale(W / 720, H / 360);
  for (const d of WORLD_LAND_PATHS) {
    const path = new Path2D(d);
    ctx.fillStyle = COL.oliveSoft;
    ctx.globalAlpha = 0.45;
    ctx.fill(path);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = COL.olive;
    ctx.lineWidth = 0.4;
    ctx.stroke(path);
  }
  ctx.restore();
  // faint graticule
  ctx.strokeStyle = COL.olive;
  ctx.globalAlpha = 0.08;
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += W / 24) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += H / 12) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return asTexture(canvas);
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean. (Nothing renders yet — these are exercised visually in Tasks 5–8.)

- [ ] **Step 3: Commit (only if authorized)**

```bash
git add src/components/three/textures.ts
git commit -m "feat: add canvas texture factories for card, envelope, map"
```

---

### Task 4: Flight path + Atmosphere + grain overlay

**Files:**
- Create: `src/components/three/flight-path.ts`
- Create: `src/components/three/Atmosphere.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Create `src/components/three/flight-path.ts`**

```ts
import * as THREE from "three";

// The map plane maps the 720x360 equirect space onto a MAP_W x MAP_H plane
// lying in XZ at y = MAP_Y. +X = east, +Z = south (image v increases south).
export const MAP_W = 36;
export const MAP_H = 18;
export const MAP_Y = -1.6;

export function mapPoint(lon: number, lat: number, alt = 0): THREE.Vector3 {
  const u = (lon + 180) / 360;
  const v = (90 - lat) / 180;
  return new THREE.Vector3((u - 0.5) * MAP_W, MAP_Y + alt, (v - 0.5) * MAP_H);
}

export const VANCOUVER = mapPoint(-123.1, 49.2);
export const BEIRUT = mapPoint(35.5, 33.9);
export const VENUE = mapPoint(35.6033, 33.9515);

/** Where the card drifts to and folds, hovering above Vancouver. */
export const FOLD_POS = VANCOUVER.clone().add(new THREE.Vector3(0, 1.3, 0));

export const FLIGHT_CURVE = new THREE.CatmullRomCurve3(
  [
    FOLD_POS.clone(),
    mapPoint(-100, 62, 2.0),
    mapPoint(-50, 66, 2.6),
    mapPoint(-5, 58, 2.4),
    mapPoint(20, 44, 1.4),
    BEIRUT.clone().add(new THREE.Vector3(0, 0.5, 0)),
    VENUE.clone().add(new THREE.Vector3(0, 0.12, 0)),
  ],
  false,
  "catmullrom",
  0.5,
);
```

- [ ] **Step 2: Create `src/components/three/Atmosphere.tsx`**

```tsx
"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

const DUST_COUNT_DESKTOP = 140;
const DUST_COUNT_TOUCH = 70;

export function Atmosphere() {
  const { scene } = useThree();
  useMemo(() => {
    scene.fog = new THREE.Fog("#f1e9da", 16, 44);
  }, [scene]);

  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const count = isTouch ? DUST_COUNT_TOUCH : DUST_COUNT_DESKTOP;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, [count]);

  const points = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (points.current) {
      points.current.rotation.y = clock.elapsedTime * 0.012;
      points.current.position.y = Math.sin(clock.elapsedTime * 0.18) * 0.15;
    }
  });

  return (
    <>
      <ambientLight intensity={0.85} color="#fff6e8" />
      <directionalLight position={[3, 5, 4]} intensity={1.3} color="#fffdf5" />
      <hemisphereLight args={["#fdf6e3", "#b9b49a", 0.35]} />
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.025}
          sizeAttenuation
          color="#8b9968"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </points>
    </>
  );
}
```

- [ ] **Step 3: Add grain overlay + scroll hint styles to `src/app/globals.css`**

Append at the end of the file:

```css
/* Film grain over everything (canvas + DOM). Pure CSS, ~0 cost. */
.grain-overlay {
  position: fixed;
  inset: -100px;
  z-index: 40;
  pointer-events: none;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: grain-shift 0.9s steps(4) infinite;
}

@keyframes grain-shift {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-30px, 18px); }
  50% { transform: translate(22px, -26px); }
  75% { transform: translate(-14px, -8px); }
  100% { transform: translate(0, 0); }
}

.scroll-hint-line {
  width: 1px;
  height: 44px;
  background: linear-gradient(to bottom, transparent, var(--accent-olive));
  animation: hint-drop 1.8s ease-in-out infinite;
}

@keyframes hint-drop {
  0% { transform: scaleY(0); transform-origin: top; }
  45% { transform: scaleY(1); transform-origin: top; }
  55% { transform: scaleY(1); transform-origin: bottom; }
  100% { transform: scaleY(0); transform-origin: bottom; }
}
```

- [ ] **Step 4: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean.

- [ ] **Step 5: Commit (only if authorized)**

```bash
git add src/components/three/flight-path.ts src/components/three/Atmosphere.tsx src/app/globals.css
git commit -m "feat: add flight path, atmosphere rig, and grain overlay"
```

---

### Task 5: Envelope3D (body, flap, seal, shards, intro animation)

**Files:**
- Create: `src/components/three/Envelope3D.tsx`

The envelope is a flat-paper 3D assembly facing the camera (+Z). The whole intro is driven by `tl.intro` (0..1 over ~2.5s, advanced by the Driver in Task 9). Nothing here uses React state on the hot path.

- [ ] **Step 1: Create `src/components/three/Envelope3D.tsx`**

```tsx
"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { easeOut3, seg, smooth, type Timeline } from "./timeline";
import { makeEnvelopeTexture, makePaperTexture } from "./textures";

const W = 3.6;
const H = 2.16;

type Props = {
  tl: RefObject<Timeline>;
  label: string;
  onTapSeal: () => void;
};

export function Envelope3D({ tl, label, onTapSeal }: Props) {
  const root = useRef<THREE.Group>(null);
  const flap = useRef<THREE.Group>(null);
  const seal = useRef<THREE.Group>(null);
  const shards = useRef<THREE.Group>(null);
  const flash = useRef<THREE.Sprite>(null);
  const fadeMats = useRef<THREE.MeshStandardMaterial[]>([]);

  const envTex = useMemo(() => makeEnvelopeTexture(label), [label]);
  const paperTex = useMemo(() => makePaperTexture(), []);

  const flapShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-W / 2, 0);
    s.lineTo(W / 2, 0);
    s.lineTo(0, -H * 0.62);
    s.closePath();
    return s;
  }, []);

  const flashTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,250,235,0.9)");
    g.addColorStop(1, "rgba(255,250,235,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);

  const SHARDS = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        dir: new THREE.Vector3(
          Math.cos((i / 6) * Math.PI * 2),
          Math.sin((i / 6) * Math.PI * 2),
          0.6,
        ),
        rot: (i % 2 ? 1 : -1) * (2 + i),
      })),
    [],
  );

  useFrame(({ clock }) => {
    const t = tl.current;
    const g = root.current;
    if (!t || !g) return;

    g.visible = t.intro < 0.98;
    if (!g.visible) return;

    // wax seal: pulse before tap, crack + tumble after
    if (seal.current) {
      if (!t.opened) {
        seal.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.6) * 0.035);
      } else {
        const k = easeOut3(seg(t.intro, 0, 0.18));
        seal.current.scale.setScalar(Math.max(0.01, 1 + 0.18 * Math.sin(k * Math.PI) - 0.6 * k));
        seal.current.position.y = -0.1 - 1.4 * k * k;
        seal.current.rotation.z = 0.9 * k;
        seal.current.visible = k < 1;
      }
    }

    // shards spray out as the seal cracks
    if (shards.current) {
      const k = seg(t.intro, 0.04, 0.3);
      shards.current.visible = t.opened && k > 0 && k < 1;
      shards.current.children.forEach((child, i) => {
        const s = SHARDS[i];
        child.position.copy(s.dir).multiplyScalar(easeOut3(k) * 1.1);
        child.rotation.z = s.rot * k;
        child.scale.setScalar(Math.max(0.01, 1 - k * 0.7));
      });
    }

    // flap unhinges past 170°
    if (flap.current) {
      flap.current.rotation.x = -2.95 * easeOut3(seg(t.intro, 0.12, 0.45));
    }

    // soft light bloom while the card emerges
    if (flash.current) {
      const k = seg(t.intro, 0.3, 0.7);
      (flash.current.material as THREE.SpriteMaterial).opacity = Math.sin(k * Math.PI) * 0.55;
    }

    // envelope drops away and fades once the card is out
    const drop = smooth(seg(t.intro, 0.55, 0.95));
    g.position.y = -drop * 2.4;
    g.rotation.z = -0.06 * drop;
    for (const m of fadeMats.current) m.opacity = 1 - drop;
  });

  const collect = (m: THREE.MeshStandardMaterial | null) => {
    if (m && !fadeMats.current.includes(m)) fadeMats.current.push(m);
  };

  return (
    <group ref={root}>
      {/* back face */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial ref={collect} color="#e3d9c2" map={paperTex} transparent roughness={0.9} />
      </mesh>
      {/* front face with guest label */}
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial ref={collect} map={envTex} transparent roughness={0.85} />
      </mesh>
      {/* flap, hinged at the top edge */}
      <group ref={flap} position={[0, H / 2, 0.01]}>
        <mesh>
          <shapeGeometry args={[flapShape]} />
          <meshStandardMaterial
            ref={collect}
            color="#e8dfc9"
            map={paperTex}
            side={THREE.DoubleSide}
            transparent
            roughness={0.85}
          />
        </mesh>
      </group>
      {/* light bloom sprite */}
      <sprite ref={flash} position={[0, 0.4, 0.4]} scale={[5, 5, 1]}>
        <spriteMaterial map={flashTex} transparent opacity={0} depthWrite={false} />
      </sprite>
      {/* wax seal (tap target) */}
      <group ref={seal} position={[0, -0.1, 0.06]} onPointerDown={onTapSeal}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.45, 0.07, 48]} />
          <meshStandardMaterial color="#6b7a4b" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <torusGeometry args={[0.3, 0.012, 8, 48]} />
          <meshStandardMaterial color="#f1e9da" roughness={0.6} />
        </mesh>
      </group>
      {/* wax shards */}
      <group ref={shards} position={[0, -0.1, 0.1]} visible={false}>
        {SHARDS.map((_, i) => (
          <mesh key={i}>
            <boxGeometry args={[0.07, 0.05, 0.02]} />
            <meshStandardMaterial color="#6b7a4b" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
```

Note: `onPointerDown` on the seal group is R3F's pointer-event raycasting — it works for both mouse and touch. Increase the tap area if testing shows it's fiddly on phones (add an invisible larger circle mesh inside the seal group: `<mesh visible={false}><circleGeometry args={[0.7, 16]} /><meshBasicMaterial /></mesh>` — raycasting still hits invisible meshes unless you disable it, so instead use a transparent material with `opacity={0}` and `transparent`).

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean. (Visual verification happens in Task 9 when the Canvas exists.)

- [ ] **Step 3: Commit (only if authorized)**

```bash
git add src/components/three/Envelope3D.tsx
git commit -m "feat: add 3D envelope with seal-crack intro animation"
```

---

### Task 6: Card3D + Polaroids

**Files:**
- Create: `src/components/three/Card3D.tsx`
- Create: `src/components/three/Polaroids.tsx`

- [ ] **Step 1: Create `src/components/three/Card3D.tsx`**

The card emerges from the envelope during the intro (scaled 0.55 so it fits "inside", same trick as the old 2D version), settles center, leans back during the photos beat, then travels to `FOLD_POS` and lies flat during the first half of the fold beat, where `PaperPlaneFold` takes over (crossfade at `foldT = 0.5`).

```tsx
"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { BEATS, easeOut3, lerp, seg, smooth, type Timeline } from "./timeline";
import { makeCardTexture, makePaperTexture } from "./textures";
import { FOLD_POS } from "./flight-path";

export const CARD_W = 2.4;
export const CARD_H = 3.2;

export function Card3D({ tl }: { tl: RefObject<Timeline> }) {
  const root = useRef<THREE.Group>(null);
  const cardTex = useMemo(() => makeCardTexture(), []);
  const paperTex = useMemo(() => makePaperTexture(), []);

  useFrame(() => {
    const t = tl.current;
    const g = root.current;
    if (!t || !g) return;

    const foldT = seg(t.p, ...BEATS.fold);
    g.visible = t.opened && foldT < 0.5;
    if (!g.visible) return;

    if (t.intro < 1) {
      // emerge from the envelope, then settle to center at full size
      const rise = easeOut3(seg(t.intro, 0.3, 0.75));
      const settle = smooth(seg(t.intro, 0.72, 1));
      g.scale.setScalar(lerp(0.55, 1, settle));
      g.position.set(0, lerp(lerp(-0.15, 1.15, rise), 0, settle), -0.03 + settle * 0.06);
      g.rotation.set(0, 0, 0);
      return;
    }

    const photoT = smooth(seg(t.p, ...BEATS.photos));
    const f = smooth(Math.min(1, foldT * 2)); // first half of the fold beat

    g.scale.setScalar(1);
    g.position.set(
      lerp(0, FOLD_POS.x, f),
      lerp(-photoT * 0.1, FOLD_POS.y, f) + Math.sin(f * Math.PI) * 0.8,
      lerp(-photoT * 0.5, FOLD_POS.z, f),
    );
    g.rotation.x = lerp(-0.12 * photoT, -Math.PI / 2, f);
    g.rotation.z = Math.sin(f * Math.PI) * -0.3;
  });

  return (
    <group ref={root} visible={false}>
      <mesh>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshStandardMaterial map={cardTex} roughness={0.85} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]} position={[0, 0, -0.005]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshStandardMaterial color="#e8dfc9" map={paperTex} roughness={0.9} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Create `src/components/three/Polaroids.tsx`**

Five photo planes with white frames. Each gets a staggered slice of the photos beat; they spread sideways from behind the card, drift toward and past the camera, and fade out.

```tsx
"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import type { RefObject } from "react";
import { PHOTOS } from "@/data/photos";
import { BEATS, seg, smooth, type Timeline } from "./timeline";

// staggered sub-ranges of the photos beat, one per photo
const SLOTS = PHOTOS.map((_, i) => {
  const [a, b] = BEATS.photos;
  const span = b - a;
  const start = a + (i / PHOTOS.length) * span * 0.55;
  return { start, end: start + span * 0.5 };
});

export function Polaroids({ tl }: { tl: RefObject<Timeline> }) {
  const root = useRef<THREE.Group>(null);
  const textures = useLoader(THREE.TextureLoader, PHOTOS.map((p) => p.src));
  useMemo(() => {
    for (const tex of textures) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
    }
  }, [textures]);

  const rigs = useMemo(
    () =>
      PHOTOS.map((_, i) => ({
        side: i % 2 === 0 ? -1 : 1,
        drift: 0.6 + (i % 3) * 0.35,
        tilt: ((i * 37) % 13) / 13 - 0.5,
      })),
    [],
  );

  useFrame(({ clock }) => {
    const t = tl.current;
    const g = root.current;
    if (!t || !g) return;
    const beatT = seg(t.p, ...BEATS.photos);
    g.visible = t.opened && t.intro >= 1 && beatT > 0 && beatT < 1.05;
    if (!g.visible) return;

    g.children.forEach((child, i) => {
      const k = smooth(seg(t.p, SLOTS[i].start, SLOTS[i].end));
      const rig = rigs[i];
      child.position.set(
        rig.side * (0.4 + k * 1.9) * rig.drift,
        (k - 0.5) * 1.6 * rig.tilt + Math.sin(clock.elapsedTime * 0.8 + i) * 0.05,
        -0.5 + k * 6.5,
      );
      child.rotation.z = rig.tilt * 0.5 * (1 - k * 0.4);
      child.rotation.y = rig.side * 0.25 * (1 - k);
      const fadeOut = k < 0.85 ? 1 : 1 - (k - 0.85) / 0.15;
      const opacity = Math.min(1, k * 4) * fadeOut;
      child.traverse((n) => {
        const mesh = n as THREE.Mesh;
        if (mesh.isMesh) (mesh.material as THREE.MeshStandardMaterial).opacity = opacity;
      });
    });
  });

  return (
    <group ref={root} visible={false}>
      {PHOTOS.map((photo, i) => {
        const landscape = photo.width >= photo.height;
        const w = landscape ? 1.5 : 1.1;
        const h = (w * photo.height) / photo.width;
        return (
          <group key={photo.src}>
            {/* white polaroid frame */}
            <mesh position={[0, -0.06, -0.001]}>
              <planeGeometry args={[w + 0.12, h + 0.24]} />
              <meshStandardMaterial color="#faf6ec" roughness={0.9} transparent opacity={0} />
            </mesh>
            <mesh>
              <planeGeometry args={[w, h]} />
              <meshStandardMaterial map={textures[i]} roughness={0.7} transparent opacity={0} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean.

- [ ] **Step 4: Commit (only if authorized)**

```bash
git add src/components/three/Card3D.tsx src/components/three/Polaroids.tsx
git commit -m "feat: add 3D invitation card and polaroid photo drift"
```

---

### Task 7: PaperPlaneFold (hinged fold + flight)

**Files:**
- Create: `src/components/three/PaperPlaneFold.tsx`

A flat paper sheet built from four hinged panels (two inner body panels, two wings nested inside them). During the second half of the fold beat the hinges rotate the sheet into a dart silhouette; during the flight beat the group follows `FLIGHT_CURVE`, nose along the tangent, banking with scroll velocity.

The sheet lies in the XZ plane, length along Z, **nose toward local +Z** (because `setFromUnitVectors((0,0,1), tangent)` points local +Z along the flight direction).

- [ ] **Step 1: Create `src/components/three/PaperPlaneFold.tsx`**

```tsx
"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { BEATS, seg, smooth, type Timeline } from "./timeline";
import { makePaperTexture } from "./textures";
import { FLIGHT_CURVE, FOLD_POS } from "./flight-path";

const SHEET_L = 2.8;

export function PaperPlaneFold({ tl }: { tl: RefObject<Timeline> }) {
  const root = useRef<THREE.Group>(null);
  const leftHinge = useRef<THREE.Group>(null);
  const rightHinge = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Group>(null);
  const rightWing = useRef<THREE.Group>(null);
  const bank = useRef(0);
  const mats = useRef<THREE.MeshStandardMaterial[]>([]);
  const paperTex = useMemo(() => makePaperTexture(), []);
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      zAxis: new THREE.Vector3(0, 0, 1),
    }),
    [],
  );

  useFrame((_, dt) => {
    const t = tl.current;
    const g = root.current;
    if (!t || !g) return;
    const foldT = seg(t.p, ...BEATS.fold);
    const flightT = seg(t.p, ...BEATS.flight);
    const arriveT = seg(t.p, ...BEATS.arrive);
    g.visible = t.opened && foldT >= 0.5 && arriveT < 0.6;
    if (!g.visible) return;

    // fold runs over the second half of the fold beat (card hands off at 0.5)
    const fs = smooth(seg(foldT, 0.5, 1));
    const A = 1.15 * fs;
    if (leftHinge.current) leftHinge.current.rotation.z = -A;
    if (rightHinge.current) rightHinge.current.rotation.z = A;
    if (leftWing.current) leftWing.current.rotation.z = A * 1.75;
    if (rightWing.current) rightWing.current.rotation.z = -A * 1.75;
    // NOTE: if in the browser the panels fold downward instead of up,
    // flip the four signs above — the visual check is Step 2 of Task 9.

    if (flightT <= 0) {
      g.position.copy(FOLD_POS);
      g.quaternion.identity();
      g.rotation.y = fs * 0.4; // settle the nose toward the route
    } else {
      const ft = smooth(Math.min(1, flightT));
      FLIGHT_CURVE.getPointAt(ft, tmp.pos);
      FLIGHT_CURVE.getTangentAt(ft, tmp.tan).normalize();
      g.position.copy(tmp.pos);
      g.position.y += Math.sin(ft * Math.PI * 6) * 0.04 * (1 - ft); // gentle bob
      tmp.q.setFromUnitVectors(tmp.zAxis, tmp.tan);
      g.quaternion.copy(tmp.q);
      const targetBank = THREE.MathUtils.clamp(-t.vel * 5, -0.55, 0.55);
      bank.current += (targetBank - bank.current) * (1 - Math.exp(-5 * dt));
      g.rotateZ(bank.current);
    }

    // touch down + fade while the venue pin takes over
    const o = arriveT > 0.2 ? 1 - seg(arriveT, 0.2, 0.55) : 1;
    for (const m of mats.current) m.opacity = o;
  });

  const collect = (m: THREE.MeshStandardMaterial | null) => {
    if (m && !mats.current.includes(m)) mats.current.push(m);
  };

  const panel = (w: number, xCenter: number, key: string) => (
    <mesh key={key} position={[xCenter, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, SHEET_L]} />
      <meshStandardMaterial
        ref={collect}
        color="#e8dfc9"
        map={paperTex}
        side={THREE.DoubleSide}
        transparent
        roughness={0.85}
      />
    </mesh>
  );

  return (
    <group ref={root} visible={false}>
      <group ref={leftHinge}>
        {panel(0.33, -0.165, "il")}
        <group ref={leftWing} position={[-0.33, 0, 0]}>
          {panel(0.67, -0.335, "wl")}
        </group>
      </group>
      <group ref={rightHinge}>
        {panel(0.33, 0.165, "ir")}
        <group ref={rightWing} position={[0.33, 0, 0]}>
          {panel(0.67, 0.335, "wr")}
        </group>
      </group>
    </group>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean.

- [ ] **Step 3: Commit (only if authorized)**

```bash
git add src/components/three/PaperPlaneFold.tsx
git commit -m "feat: add hinged paper-plane fold and flight animation"
```

---

### Task 8: FlightMap (paper map, Lebanon decal, arc, clouds, pin)

**Files:**
- Modify: `src/components/three/flight-path.ts` (append Lebanon decal math)
- Modify: `src/components/three/textures.ts` (append Lebanon texture)
- Create: `src/components/three/FlightMap.tsx`

- [ ] **Step 1: Append Lebanon decal math to `src/components/three/flight-path.ts`**

At true map scale Lebanon is ~0.15 world units wide — mush when the camera dives in. The decal exaggerates the country `LEB_SCALE`× around its center (same trick as the old SVG `WorldMap` detail layer, which used 16×).

```ts
// ── Lebanon detail decal ────────────────────────────────────────────────
export const LEB_SCALE = 6;
export const LEB_CENTER = { lat: 33.8716, lon: 35.8547 };

/** Project lon/lat into decal space: exaggerated LEB_SCALE× around LEB_CENTER. */
export function lebPoint(lon: number, lat: number, alt = 0): THREE.Vector3 {
  const c = mapPoint(LEB_CENTER.lon, LEB_CENTER.lat);
  const p = mapPoint(lon, lat);
  const out = c.clone().add(p.sub(c).multiplyScalar(LEB_SCALE));
  out.y = MAP_Y + 0.012 + alt;
  return out;
}

export const VENUE_PIN = lebPoint(35.6033, 33.9515);
export const LEB_DECAL_CENTER = lebPoint(LEB_CENTER.lon, LEB_CENTER.lat);
// decal plane spans Lebanon's bbox (lon 35.0–36.65, lat 33.0–34.75) at LEB_SCALE
export const LEB_DECAL_W = (1.65 / 360) * MAP_W * LEB_SCALE; // ≈ 0.99
export const LEB_DECAL_H = (1.75 / 180) * MAP_H * LEB_SCALE; // ≈ 1.05
```

- [ ] **Step 2: Append `makeLebanonTexture` to `src/components/three/textures.ts`**

Add the import at the top of the file:

```ts
import { LEBANON_BOUNDARY_LL } from "@/data/lebanon-boundary";
```

Append the function (note: `LEBANON_BOUNDARY_LL` entries are `[lat, lon]` tuples):

```ts
/** High-res Lebanon decal: boundary fill + coast stroke, matches map palette. */
export function makeLebanonTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 1086; // decal aspect: 1.65° lon × 1.75° lat in equirect
  const { canvas, ctx } = makeCanvas(W, H);
  const LON0 = 35.0, LON1 = 36.65, LAT0 = 34.75, LAT1 = 33.0; // top → bottom
  const px = (lon: number) => ((lon - LON0) / (LON1 - LON0)) * W;
  const py = (lat: number) => ((lat - LAT0) / (LAT1 - LAT0)) * H;
  ctx.fillStyle = "#ede4d0";
  ctx.fillRect(0, 0, W, H);
  ctx.beginPath();
  LEBANON_BOUNDARY_LL.forEach(([lat, lon], i) => {
    if (i === 0) ctx.moveTo(px(lon), py(lat));
    else ctx.lineTo(px(lon), py(lat));
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(139,153,104,0.5)";
  ctx.fill();
  ctx.strokeStyle = COL.olive;
  ctx.lineWidth = 3;
  ctx.stroke();
  return asTexture(canvas);
}
```

- [ ] **Step 3: Create `src/components/three/FlightMap.tsx`**

```tsx
"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { BEATS, easeOut3, seg, smooth, type Timeline } from "./timeline";
import { makeLebanonTexture, makeMapTexture } from "./textures";
import {
  BEIRUT,
  FLIGHT_CURVE,
  LEB_DECAL_CENTER,
  LEB_DECAL_H,
  LEB_DECAL_W,
  MAP_H,
  MAP_W,
  MAP_Y,
  VANCOUVER,
  VENUE_PIN,
} from "./flight-path";

const CLOUD_COUNT = 10;

export function FlightMap({ tl }: { tl: RefObject<Timeline> }) {
  const root = useRef<THREE.Group>(null);
  const mapMat = useRef<THREE.MeshStandardMaterial>(null);
  const decalMat = useRef<THREE.MeshBasicMaterial>(null);
  const pin = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const clouds = useRef<THREE.Group>(null);

  const mapTex = useMemo(() => makeMapTexture(), []);
  const lebTex = useMemo(() => makeLebanonTexture(), []);

  // dashed flight trail drawn flat on the map, revealed by drawRange
  const trailLine = useMemo(() => {
    const pts = FLIGHT_CURVE.getPoints(200).map((p) => p.clone().setY(MAP_Y + 0.02));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(
      geo,
      new THREE.LineDashedMaterial({
        color: "#6b7a4b",
        dashSize: 0.3,
        gapSize: 0.18,
        transparent: true,
        opacity: 0.85,
      }),
    );
    line.computeLineDistances();
    line.geometry.setDrawRange(0, 0);
    return line;
  }, []);

  const cloudTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, "rgba(255,253,246,0.85)");
    g.addColorStop(1, "rgba(255,253,246,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);

  const cloudRigs = useMemo(
    () =>
      Array.from({ length: CLOUD_COUNT }, (_, i) => ({
        anchor: FLIGHT_CURVE.getPointAt(0.12 + 0.74 * (i / CLOUD_COUNT)).clone(),
        off: new THREE.Vector3(Math.sin(i * 7) * 1.6, 0.5 + (i % 3) * 0.45, Math.cos(i * 5) * 1.3),
        scale: 1.2 + (i % 3) * 0.7,
        speed: 0.04 + (i % 4) * 0.015,
      })),
    [],
  );

  useFrame(({ camera, clock }) => {
    const t = tl.current;
    const g = root.current;
    if (!t || !g) return;
    g.visible = t.opened && t.p > BEATS.fold[0] - 0.02;
    if (!g.visible) return;

    // map fades in as the camera pulls up for the fold
    if (mapMat.current) {
      mapMat.current.opacity = smooth(seg(t.p, BEATS.fold[0], BEATS.fold[0] + 0.1));
    }

    // trail follows the plane
    const ft = smooth(seg(t.p, ...BEATS.flight));
    trailLine.geometry.setDrawRange(0, Math.max(0, Math.floor(ft * 201)));

    // Lebanon decal + pin during arrival
    const at = seg(t.p, ...BEATS.arrive);
    if (decalMat.current) decalMat.current.opacity = smooth(seg(at, 0, 0.4));
    if (pin.current) {
      pin.current.visible = at > 0.15;
      const drop = easeOut3(seg(at, 0.15, 0.6));
      pin.current.position.set(VENUE_PIN.x, VENUE_PIN.y + (1 - drop) * 2.2, VENUE_PIN.z);
    }
    if (ring.current) {
      const drop = easeOut3(seg(at, 0.15, 0.6));
      ring.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.08);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = drop * 0.5;
    }

    // clouds: billboard toward the camera, slow drift
    if (clouds.current) {
      clouds.current.children.forEach((c, i) => {
        const rig = cloudRigs[i];
        c.quaternion.copy(camera.quaternion);
        c.position.copy(rig.anchor).add(rig.off);
        c.position.x += Math.sin(clock.elapsedTime * rig.speed + i * 2) * 0.4;
      });
    }
  });

  return (
    <group ref={root} visible={false}>
      {/* paper world map */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, MAP_Y, 0]}>
        <planeGeometry args={[MAP_W, MAP_H]} />
        <meshStandardMaterial ref={mapMat} map={mapTex} transparent opacity={0} roughness={1} />
      </mesh>
      {/* city dots */}
      {[VANCOUVER, BEIRUT].map((v, i) => (
        <mesh key={i} position={[v.x, MAP_Y + 0.015, v.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.09, 24]} />
          <meshBasicMaterial color="#2f3a22" transparent opacity={0.8} />
        </mesh>
      ))}
      {/* dashed trail */}
      <primitive object={trailLine} />
      {/* Lebanon detail decal */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[LEB_DECAL_CENTER.x, MAP_Y + 0.01, LEB_DECAL_CENTER.z]}
      >
        <planeGeometry args={[LEB_DECAL_W, LEB_DECAL_H]} />
        <meshBasicMaterial ref={decalMat} map={lebTex} transparent opacity={0} />
      </mesh>
      {/* venue pin: cone + head + pulse ring */}
      <group ref={pin} visible={false}>
        <mesh position={[0, 0.14, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.05, 0.18, 24]} />
          <meshStandardMaterial color="#6b7a4b" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.27, 0]}>
          <sphereGeometry args={[0.06, 24, 16]} />
          <meshStandardMaterial color="#2f3a22" roughness={0.45} />
        </mesh>
      </group>
      <mesh
        ref={ring}
        position={[VENUE_PIN.x, VENUE_PIN.y + 0.005, VENUE_PIN.z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.12, 0.15, 32]} />
        <meshBasicMaterial color="#6b7a4b" transparent opacity={0} />
      </mesh>
      {/* cloud wisps */}
      <group ref={clouds}>
        {cloudRigs.map((rig, i) => (
          <mesh key={i} scale={[rig.scale, rig.scale * 0.5, 1]}>
            <planeGeometry args={[1.6, 1]} />
            <meshBasicMaterial map={cloudTex} transparent depthWrite={false} opacity={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
```

- [ ] **Step 4: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean.

- [ ] **Step 5: Commit (only if authorized)**

```bash
git add src/components/three/flight-path.ts src/components/three/textures.ts src/components/three/FlightMap.tsx
git commit -m "feat: add 3D flight map with Lebanon decal, trail, clouds, pin"
```

---

### Task 9: CameraRig + Experience assembly (first visual checkpoint)

**Files:**
- Create: `src/components/three/CameraRig.tsx`
- Create: `src/components/three/Experience.tsx`

- [ ] **Step 1: Create `src/components/three/CameraRig.tsx`**

Per-beat camera targets, heavily damped — damping smooths the seams between beats so endpoint mismatches never read as cuts.

```tsx
"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { BEATS, lerp, seg, smooth, type Timeline } from "./timeline";
import { FLIGHT_CURVE, FOLD_POS, VENUE_PIN } from "./flight-path";

const FOLD_CAM_OFFSET = new THREE.Vector3(1.7, 1.5, 3.4);

export function CameraRig({ tl }: { tl: RefObject<Timeline> }) {
  const look = useRef(new THREE.Vector3(0, 0.1, 0));
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      lk: new THREE.Vector3(),
      pp: new THREE.Vector3(),
      tan: new THREE.Vector3(),
    }),
    [],
  );

  useFrame(({ camera }, dt) => {
    const t = tl.current;
    if (!t) return;
    const { pos, lk } = tmp;
    const introE = smooth(t.intro);
    const photoT = smooth(seg(t.p, ...BEATS.photos));
    const foldT = smooth(seg(t.p, ...BEATS.fold));
    const flightT = seg(t.p, ...BEATS.flight);
    const arriveT = smooth(seg(t.p, ...BEATS.arrive));

    if (flightT <= 0) {
      // intro dolly-in → photos pull → travel toward the fold viewpoint
      pos.set(0, 0.25 + 0.35 * photoT, 7 - 0.8 * introE - 0.9 * photoT);
      lk.set(0, 0.1, 0);
      if (foldT > 0) {
        tmp.pp.copy(FOLD_POS).add(FOLD_CAM_OFFSET);
        pos.lerp(tmp.pp, foldT);
        lk.lerp(FOLD_POS, foldT);
      }
    } else if (arriveT <= 0) {
      // chase cam behind and above the plane
      const ft = smooth(Math.min(1, flightT));
      FLIGHT_CURVE.getPointAt(ft, tmp.pp);
      FLIGHT_CURVE.getTangentAt(ft, tmp.tan).normalize();
      pos.copy(tmp.pp).addScaledVector(tmp.tan, -2.6);
      pos.y += 1.15;
      lk.copy(tmp.pp).addScaledVector(tmp.tan, 1.6);
    } else {
      // dive onto the venue pin
      pos.set(
        VENUE_PIN.x + 0.15,
        VENUE_PIN.y + lerp(2.6, 1.25, arriveT),
        VENUE_PIN.z + lerp(1.4, 0.85, arriveT),
      );
      lk.copy(VENUE_PIN);
    }

    const k = 1 - Math.exp(-4.5 * dt);
    camera.position.lerp(pos, k);
    look.current.lerp(lk, k);
    camera.lookAt(look.current);
  });

  return null;
}
```

- [ ] **Step 2: Create `src/components/three/Experience.tsx`**

```tsx
"use client";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import type { RefObject } from "react";
import type { MotionValue } from "framer-motion";
import { createTimeline, type Timeline } from "./timeline";
import { Atmosphere } from "./Atmosphere";
import { Envelope3D } from "./Envelope3D";
import { Card3D } from "./Card3D";
import { Polaroids } from "./Polaroids";
import { PaperPlaneFold } from "./PaperPlaneFold";
import { FlightMap } from "./FlightMap";
import { CameraRig } from "./CameraRig";

type Props = {
  label: string;
  opened: boolean;
  scrollProgress: MotionValue<number>;
  onTapSeal: () => void;
  onIntroDone: () => void;
};

const INTRO_SECONDS = 2.5;

function Driver({
  tl,
  opened,
  scrollProgress,
  onIntroDone,
}: {
  tl: RefObject<Timeline>;
  opened: boolean;
  scrollProgress: MotionValue<number>;
  onIntroDone: () => void;
}) {
  const fired = useRef(false);
  useFrame((_, dtRaw) => {
    const t = tl.current;
    if (!t) return;
    const dt = Math.min(dtRaw, 1 / 20); // clamp tab-switch jumps
    t.opened = opened;
    if (opened && t.intro < 1) {
      t.intro = Math.min(1, t.intro + dt / INTRO_SECONDS);
      if (t.intro >= 1 && !fired.current) {
        fired.current = true;
        onIntroDone();
      }
    }
    const target = t.intro >= 1 ? scrollProgress.get() : 0;
    const prev = t.p;
    t.p += (target - t.p) * (1 - Math.exp(-4 * dt));
    const v = (t.p - prev) / Math.max(dt, 1e-4);
    t.vel += (v - t.vel) * (1 - Math.exp(-6 * dt));
  });
  return null;
}

export function Experience({ label, opened, scrollProgress, onTapSeal, onIntroDone }: Props) {
  const tl = useRef<Timeline>(createTimeline());

  return (
    <Canvas
      flat
      dpr={[1, 1.5]}
      camera={{ fov: 42, position: [0, 0.25, 7] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(new THREE.Color("#f1e9da"), 0)}
    >
      <Driver tl={tl} opened={opened} scrollProgress={scrollProgress} onIntroDone={onIntroDone} />
      <Atmosphere />
      <Envelope3D tl={tl} label={label} onTapSeal={onTapSeal} />
      <Card3D tl={tl} />
      <Suspense fallback={null}>
        <Polaroids tl={tl} />
      </Suspense>
      <PaperPlaneFold tl={tl} />
      <FlightMap tl={tl} />
      <CameraRig tl={tl} />
    </Canvas>
  );
}

export default Experience;
```

- [ ] **Step 3: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean. The canvas can't be visually checked yet — Scene.tsx (Task 10) wires it up. Proceed.

- [ ] **Step 4: Commit (only if authorized)**

```bash
git add src/components/three/CameraRig.tsx src/components/three/Experience.tsx
git commit -m "feat: add camera rig and experience canvas assembly"
```

---

### Task 10: Scene.tsx rewrite (tier routing, scroll container, DOM overlay)

**Files:**
- Modify: `src/components/Scene.tsx` (full rewrite)

The scroll container is `100dvh` until the intro finishes, then expands to `600vh` — this is the scroll lock. The canvas layer is fixed. DOM captions are fixed, opacity-driven by scroll position. The venue/RSVP section occupies the last 100vh of the container.

- [ ] **Step 1: Rewrite `src/components/Scene.tsx`**

Replace the entire file with:

```tsx
"use client";

import dynamic from "next/dynamic";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Invite } from "@/lib/invites";
import { detectTier, type Tier } from "@/lib/quality";
import { Countdown } from "./Countdown";
import { FallbackScene } from "./FallbackScene";
import { MusicToggle } from "./MusicToggle";
import { RsvpForm } from "./RsvpForm";
import { ThankYou } from "./ThankYou";
import { VenueCard } from "./VenueCard";

const Experience = dynamic(() => import("./three/Experience"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-bg-beige" />,
});

type Beat = "story" | "rsvp" | "thanks";

const PENDING_KEY = "pending-rsvp";

export function Scene({ invite }: { invite: Invite }) {
  const [tier, setTier] = useState<Tier | null>(null);
  useEffect(() => setTier(detectTier()), []);

  // offline RSVP retry — applies to both tiers
  useEffect(() => {
    const retry = async () => {
      try {
        const raw = localStorage.getItem(PENDING_KEY);
        if (!raw) return;
        const payload = JSON.parse(raw);
        const res = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) localStorage.removeItem(PENDING_KEY);
      } catch {}
    };
    window.addEventListener("focus", retry);
    return () => window.removeEventListener("focus", retry);
  }, []);

  if (tier === null) return <main className="min-h-dvh bg-bg-beige" />;
  if (tier === "lite") return <FallbackScene invite={invite} />;
  return <FullScene invite={invite} />;
}

function FullScene({ invite }: { invite: Invite }) {
  const [opened, setOpened] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [beat, setBeat] = useState<Beat>("story");
  const [muted, setMuted] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [venueSeen, setVenueSeen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setHintVisible(introDone && v < 0.03);
    if (v > 0.85) setVenueSeen(true);
  });

  useEffect(() => {
    if (introDone) setHintVisible(true);
  }, [introDone]);

  const photosTextO = useTransform(scrollYProgress, [0.05, 0.1, 0.18, 0.22], [0, 1, 1, 0]);
  const flightTextO = useTransform(scrollYProgress, [0.4, 0.46, 0.62, 0.7], [0, 1, 1, 0]);
  const arriveTextO = useTransform(scrollYProgress, [0.74, 0.78, 0.86, 0.9], [0, 1, 1, 0]);

  const startMusic = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
    setMusicStarted(true);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    setMuted((m) => {
      const next = !m;
      if (audio) audio.muted = next;
      return next;
    });
  }, []);

  const openEnvelope = useCallback(() => {
    setOpened((o) => {
      if (!o) startMusic();
      return true;
    });
  }, [startMusic]);

  return (
    <main className="relative bg-bg-beige text-ink-olive-deep">
      <audio ref={audioRef} src="/perfect.mp3" preload="auto" playsInline />
      <div className="grain-overlay" />

      <header className="pointer-events-none fixed top-0 inset-x-0 z-20 pt-5">
        <div className="pointer-events-auto mx-auto max-w-[min(92vw,520px)] px-4">
          <Countdown mode="corner" />
        </div>
        <div className="pointer-events-auto absolute top-5 right-5">
          <MusicToggle visible={musicStarted} muted={muted} onToggle={toggleMute} />
        </div>
      </header>

      <div ref={containerRef} className="relative" style={{ height: introDone ? "600vh" : "100dvh" }}>
        {/* fixed 3D layer */}
        <div className="fixed inset-0">
          <Experience
            label={invite.label}
            opened={opened}
            scrollProgress={scrollYProgress}
            onTapSeal={openEnvelope}
            onIntroDone={() => setIntroDone(true)}
          />
        </div>

        {/* tap hint (pre-open) */}
        {!opened && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1 }}
            className="fixed bottom-[12vh] inset-x-0 text-center text-xs uppercase tracking-[0.25em] pointer-events-none z-10"
          >
            tap the seal
          </motion.p>
        )}

        {/* scroll hint (post-intro, top of scroll) */}
        {hintVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-[7vh] inset-x-0 flex flex-col items-center gap-2 pointer-events-none z-10"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-accent-olive">scroll</span>
            <span className="scroll-hint-line" />
          </motion.div>
        )}

        {/* scroll-synced captions */}
        <motion.div
          style={{ opacity: photosTextO }}
          className="fixed inset-x-0 top-[10vh] text-center pointer-events-none z-10 px-4"
        >
          <h1 className="font-display text-[clamp(2.2rem,9vw,4.5rem)] leading-tight">
            Suzane <span className="opacity-60">&amp;</span> Amine
          </h1>
          <p className="mt-1 text-[clamp(0.6rem,2.4vw,0.8rem)] uppercase tracking-[0.3em] text-accent-olive">
            are getting married
          </p>
        </motion.div>

        <motion.div
          style={{ opacity: flightTextO }}
          className="fixed inset-x-0 top-[12vh] text-center pointer-events-none z-10 px-4"
        >
          <p className="font-display text-[clamp(1.4rem,5vw,2.4rem)]">
            From Vancouver, with love
          </p>
        </motion.div>

        <motion.div
          style={{ opacity: arriveTextO }}
          className="fixed inset-x-0 top-[12vh] text-center pointer-events-none z-10 px-4"
        >
          <p className="font-display text-[clamp(1.4rem,5vw,2.4rem)]">
            Nahr El Kalb, Lebanon
          </p>
          <p className="mt-1 text-[clamp(0.6rem,2.4vw,0.8rem)] uppercase tracking-[0.25em] text-accent-olive">
            August 29, 2026
          </p>
        </motion.div>

        {/* final DOM section — last 100vh of the container */}
        <div className="absolute inset-x-0 bottom-0 h-screen z-10">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-bg-beige/80 to-bg-beige grid place-items-center px-4">
            <VenueCard visible={venueSeen} onRsvpClick={() => setBeat("rsvp")} />
          </div>
        </div>
      </div>

      <RsvpForm
        visible={beat === "rsvp"}
        slug={invite.slug}
        max={invite.max}
        onSubmitted={() => setBeat("thanks")}
      />
      <ThankYou visible={beat === "thanks"} />
    </main>
  );
}
```

Note: `WorldMap`, `PaperPlane`, `Envelope` (2D), `InvitationCard` are no longer imported here. `Envelope`/`InvitationCard` are used by `FallbackScene` (Task 11); `WorldMap`/`PaperPlane` become unused — leave the files in place (out of scope to delete).

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: ONE error — `FallbackScene` doesn't exist yet. That's Task 11. If there are other errors, fix them now.

- [ ] **Step 3: Commit (only if authorized)** — skip until Task 11 makes the tree compile; commit both together there.

---

### Task 11: FallbackScene (lite tier)

**Files:**
- Create: `src/components/FallbackScene.tsx`

- [ ] **Step 1: Create `src/components/FallbackScene.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Invite } from "@/lib/invites";
import { PHOTOS } from "@/data/photos";
import { Countdown } from "./Countdown";
import { Envelope } from "./Envelope";
import { InvitationCard } from "./InvitationCard";
import { MusicToggle } from "./MusicToggle";
import { RsvpForm } from "./RsvpForm";
import { ThankYou } from "./ThankYou";
import { VenueCard } from "./VenueCard";

type Beat = "story" | "rsvp" | "thanks";

export function FallbackScene({ invite }: { invite: Invite }) {
  const [opened, setOpened] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [beat, setBeat] = useState<Beat>("story");
  const [muted, setMuted] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!opened) return;
    const id = setTimeout(() => setRevealed(true), 2200);
    return () => clearTimeout(id);
  }, [opened]);

  const startMusic = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
    setMusicStarted(true);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    setMuted((m) => {
      const next = !m;
      if (audio) audio.muted = next;
      return next;
    });
  }, []);

  const openEnvelope = useCallback(() => {
    setOpened((o) => {
      if (!o) startMusic();
      return true;
    });
  }, [startMusic]);

  return (
    <main className="relative min-h-dvh bg-bg-beige text-ink-olive-deep">
      <audio ref={audioRef} src="/perfect.mp3" preload="auto" playsInline />

      <header className="pointer-events-none fixed top-0 inset-x-0 z-20 pt-5">
        <div className="pointer-events-auto mx-auto max-w-[min(92vw,520px)] px-4">
          <Countdown mode="corner" />
        </div>
        <div className="pointer-events-auto absolute top-5 right-5">
          <MusicToggle visible={musicStarted} muted={muted} onToggle={toggleMute} />
        </div>
      </header>

      <section className="min-h-dvh grid place-items-center px-4">
        {!revealed ? (
          <Envelope label={invite.label} opened={opened} onTapSeal={openEnvelope} />
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <InvitationCard />
          </motion.div>
        )}
      </section>

      {revealed && (
        <>
          <section className="mx-auto grid w-full max-w-[560px] grid-cols-2 gap-3 px-4 pb-16">
            {PHOTOS.map((p, i) => (
              <motion.div
                key={p.src}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: (i % 2) * 0.1 }}
                className={i === 0 ? "col-span-2" : ""}
              >
                <Image
                  src={p.src}
                  alt="Suzane & Amine"
                  width={p.width}
                  height={p.height}
                  placeholder="blur"
                  blurDataURL={p.blurDataURL}
                  sizes="(max-width: 600px) 50vw, 280px"
                  className="rounded-md shadow-[0_12px_30px_rgba(47,58,34,0.16)]"
                />
              </motion.div>
            ))}
          </section>

          <section className="px-4 pb-24">
            <VenueCard visible onRsvpClick={() => setBeat("rsvp")} />
          </section>
        </>
      )}

      <RsvpForm
        visible={beat === "rsvp"}
        slug={invite.slug}
        max={invite.max}
        onSubmitted={() => setBeat("thanks")}
      />
      <ThankYou visible={beat === "thanks"} />
    </main>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean (Task 10's missing-import error is now resolved).

- [ ] **Step 3: Full visual verification in the browser**

```bash
npm run dev
```

Open `http://localhost:3000/<slug>`. Verify in order:

1. Envelope renders in 3D with guest label, seal pulsing, "tap the seal" hint.
2. Tap seal → shards spray, flap opens, card emerges, envelope drops away, ~2.5s total. Music starts.
3. "Scroll" hint appears. Page is now scrollable (container expanded).
4. Scroll: names caption fades in, polaroids drift past camera with real photos.
5. Keep scrolling: card travels down-left and folds into a plane (if panels fold downward, flip the four rotation signs in `PaperPlaneFold.tsx` — noted there).
6. Flight: map fades in below, plane follows arc, dashed trail draws, clouds drift, camera chases. Scrolling faster banks the plane.
7. Arrival: camera dives, Lebanon decal fades in, pin drops with ring pulse, "Nahr El Kalb" caption shows.
8. Final scroll: venue card rises over a beige gradient; RSVP opens the form; submitting reaches the thanks state.
9. Scroll BACKWARD from the end to the start — every beat must play in reverse without popping.
10. DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, reload → FallbackScene renders (2D envelope, photo grid, venue, RSVP).

Fix what's broken before proceeding. Expected tuning points: fold rotation signs, polaroid drift distances, camera offsets.

- [ ] **Step 4: Commit (only if authorized)**

```bash
git add src/components/Scene.tsx src/components/FallbackScene.tsx
git commit -m "feat: rewrite scene as scroll-driven 3D experience with lite fallback"
```

---

### Task 12: Final verification + build

**Files:** none new — fixes only.

- [ ] **Step 1: Production build**

```bash
npm run build
```

Expected: build succeeds. Check the route output table — the `[slug]` page's First Load JS should stay modest because `Experience` is dynamically imported; the three.js chunk loads separately on demand.

- [ ] **Step 2: Production smoke test**

```bash
npm run start
```

Repeat the happy path from Task 11 Step 3 (tap → intro → scroll all beats → RSVP) on the production server. Also test in a narrow viewport (DevTools iPhone 12 emulation, touch enabled): tap works, type scales via clamp(), no horizontal scroll, dust count halves (pointer: coarse).

- [ ] **Step 3: Device matrix (manual, on real hardware where possible)**

| Check | Where |
|---|---|
| Full flow 60fps-ish | iPhone 12+, recent Android Chrome |
| WhatsApp in-app browser opens link, fonts + tap OK | iOS + Android |
| `prefers-reduced-motion` → fallback | any desktop devtools |
| WebGL blocked (about:config / extension) → fallback | desktop Firefox/Chrome |
| RSVP submit + offline retry (airplane mode → submit → reconnect → refocus) | any |

- [ ] **Step 4: Lighthouse (mobile)**

Chrome DevTools → Lighthouse → Mobile → Performance on `/<slug>`. Target ≥ 80. If the canvas mount causes CLS, ensure the fixed canvas container has a stable size from first paint (it does — `fixed inset-0`); if LCP is the issue, the poster div from the dynamic `loading` fallback is the LCP candidate and is instant.

- [ ] **Step 5: Lint + typecheck final pass**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean.

- [ ] **Step 6: Commit any fixes (only if authorized)**

```bash
git add -A
git commit -m "fix: tuning pass after device verification"
```

---

## Self-review notes (already applied)

- Spec coverage: photos pipeline (T1), tier detection + fallback (T2/T11), grain/dust/light (T4), seal-tap intro (T5), photo polaroids (T6), fold (T7), flight + Lebanon arrival (T8), continuous camera (T9), scroll container + DOM overlay + venue/RSVP (T10), perf budget + device matrix (T12). Spec's "drei" dependency intentionally dropped (core three loaders suffice) — noted in header.
- Type consistency: `Timeline` is always accessed via `RefObject<Timeline>` prop named `tl`; beat helpers imported from `./timeline`; map-space constants only from `./flight-path`.
- Known tuning points are marked inline (fold rotation signs, camera offsets, polaroid drift) with the visual check that validates them (Task 11 Step 3).
