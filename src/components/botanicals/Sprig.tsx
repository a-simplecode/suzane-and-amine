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
