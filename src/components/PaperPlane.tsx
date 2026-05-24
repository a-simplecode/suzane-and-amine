"use client";

import { motion } from "framer-motion";

type Props = {
  className?: string;
};

export function PaperPlane({ className }: Props) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      initial={false}
    >
      <defs>
        <linearGradient id="plane-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--bg-beige-warm)" />
          <stop offset="100%" stopColor="#D6CBB1" />
        </linearGradient>
      </defs>
      <polygon
        points="10,50 90,15 60,50 90,85"
        fill="url(#plane-grad)"
        stroke="var(--accent-olive)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <polygon
        points="60,50 90,85 55,65"
        fill="var(--accent-olive)"
        opacity="0.18"
      />
      <line
        x1="60"
        y1="50"
        x2="90"
        y2="15"
        stroke="var(--accent-olive)"
        strokeWidth="1.2"
        opacity="0.5"
      />
    </motion.svg>
  );
}
