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
  photos: [0.03, 0.18],
  fold: [0.18, 0.3],
  flight: [0.3, 0.56],
  /** plane descends and lands at Suzane's home */
  land: [0.56, 0.66],
  /** wedding car drives the coastal road home → venue */
  drive: [0.66, 0.8],
  /** venue pin drop + ring at L'Heritage */
  arrive: [0.8, 0.88],
  outro: [0.88, 1.0],
} as const;

/** Normalized position of p inside [a,b], clamped to 0..1. */
export const seg = (p: number, a: number, b: number) =>
  Math.min(1, Math.max(0, (p - a) / (b - a)));

export const smooth = (t: number) => t * t * (3 - 2 * t); // smoothstep
export const easeOut3 = (t: number) => 1 - (1 - t) ** 3;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
