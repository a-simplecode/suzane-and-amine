"use client";
import { motion, useReducedMotion } from "framer-motion";

// A single olive leaf glyph.
function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 16" className={className} fill="none" aria-hidden="true">
      <path
        d="M2 8 C 12 1, 28 1, 38 8 C 28 15, 12 15, 2 8 Z"
        fill="currentColor"
      />
      <path d="M2 8 H 38" stroke="var(--color-cream)" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

type LeafSpec = {
  left: string;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  opacity: number;
};

// Deterministic pseudo-scatter (no Math.random — stable SSR/CSR).
const LEAVES: LeafSpec[] = [
  { left: "6%", size: 34, delay: 0, duration: 17, drift: 40, rotate: 220, opacity: 0.18 },
  { left: "18%", size: 22, delay: 3.5, duration: 21, drift: -30, rotate: -180, opacity: 0.14 },
  { left: "31%", size: 40, delay: 1.5, duration: 19, drift: 55, rotate: 300, opacity: 0.2 },
  { left: "44%", size: 26, delay: 6, duration: 23, drift: -45, rotate: -240, opacity: 0.13 },
  { left: "57%", size: 30, delay: 2.5, duration: 18, drift: 35, rotate: 200, opacity: 0.17 },
  { left: "69%", size: 20, delay: 5, duration: 22, drift: -25, rotate: -300, opacity: 0.12 },
  { left: "80%", size: 38, delay: 0.8, duration: 20, drift: 50, rotate: 260, opacity: 0.19 },
  { left: "92%", size: 24, delay: 4, duration: 24, drift: -38, rotate: -200, opacity: 0.15 },
];

// Slow, ambient olive leaves drifting down the page. Purely decorative.
// Honors prefers-reduced-motion by rendering a few static leaves.
export function OliveLeaves({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      {LEAVES.map((l, i) => (
        <motion.div
          key={i}
          className="absolute top-0 text-deepsage"
          style={{ left: l.left, width: l.size, opacity: reduce ? l.opacity : undefined }}
          initial={reduce ? false : { y: "-12vh", opacity: 0, rotate: 0 }}
          animate={
            reduce
              ? undefined
              : {
                  y: "112vh",
                  x: [0, l.drift, 0],
                  rotate: l.rotate,
                  opacity: [0, l.opacity, l.opacity, 0],
                }
          }
          transition={
            reduce
              ? undefined
              : {
                  duration: l.duration,
                  delay: l.delay,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0, 0.1, 0.9, 1],
                }
          }
        >
          <Leaf className="block h-auto w-full" />
        </motion.div>
      ))}
    </div>
  );
}
