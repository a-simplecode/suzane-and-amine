"use client";

import { motion, useReducedMotion } from "framer-motion";

type Props = {
  label: string;
  opened: boolean;
  onTapSeal: () => void;
};

export function Envelope({ label, opened, onTapSeal }: Props) {
  const reduced = useReducedMotion();
  return (
    <div className="relative w-[min(86vw,360px)] aspect-[5/3] mx-auto select-none">
      <motion.div
        className="absolute inset-0"
        animate={
          opened
            ? { y: -8, rotate: 0, opacity: 0 }
            : { y: 0, rotate: 0, opacity: 1 }
        }
        transition={{ duration: reduced ? 0 : 0.6, delay: opened ? 1.0 : 0 }}
      >
        <svg
          viewBox="0 0 500 300"
          className="w-full h-full drop-shadow-[0_8px_24px_rgba(47,58,34,0.18)]"
          aria-hidden="true"
        >
          <rect
            x="10"
            y="40"
            width="480"
            height="250"
            rx="10"
            fill="var(--bg-beige-warm)"
            stroke="var(--accent-olive)"
            strokeWidth="1.5"
          />
          <path
            d="M10 50 L250 200 L490 50"
            fill="none"
            stroke="var(--accent-olive)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            opacity="0.4"
          />
          <text
            x="250"
            y="240"
            textAnchor="middle"
            fontFamily="var(--font-display), Georgia, serif"
            fontSize="22"
            fill="var(--ink-olive-deep)"
            letterSpacing="1.5"
          >
            {label}
          </text>
        </svg>

        <motion.svg
          viewBox="0 0 500 300"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
          style={{ transformOrigin: "50% 14%" }}
          animate={
            opened
              ? { rotateX: -170 }
              : { rotateX: 0 }
          }
          transition={{ duration: reduced ? 0 : 0.9, delay: opened ? 0.25 : 0, ease: [0.6, 0, 0.4, 1] }}
        >
          <path
            d="M10 50 L250 200 L490 50 Z"
            fill="var(--bg-beige-warm)"
            stroke="var(--accent-olive)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>

      <button
        type="button"
        onClick={onTapSeal}
        aria-label="Open the invitation"
        disabled={opened}
        className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full grid place-items-center focus:outline-none"
      >
        <motion.div
          className="relative h-20 w-20"
          animate={
            opened
              ? { scale: [1, 1.15, 0], opacity: [1, 1, 0] }
              : reduced
              ? {}
              : { scale: [1, 1.04, 1] }
          }
          transition={
            opened
              ? { duration: 0.9, times: [0, 0.4, 1] }
              : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <svg
            viewBox="0 0 80 80"
            className="absolute inset-0 h-full w-full drop-shadow-[0_4px_8px_rgba(47,58,34,0.3)]"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="wax-grad" cx="40%" cy="35%" r="70%">
                <stop offset="0%" stopColor="var(--accent-olive-soft)" />
                <stop offset="100%" stopColor="var(--accent-olive)" />
              </radialGradient>
            </defs>
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="url(#wax-grad)"
              stroke="var(--ink-olive-deep)"
              strokeOpacity="0.2"
              strokeWidth="0.5"
            />
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="var(--bg-beige)"
              strokeOpacity="0.25"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <g transform="translate(15 24) scale(0.25)">
              <path
                d="M70 38 C 55 30, 38 38, 38 55 C 38 70, 60 72, 70 80 C 80 88, 78 100, 60 100 C 48 100, 38 92, 38 84
                   M 96 58 C 92 62, 92 70, 100 70 C 108 70, 108 60, 102 58 C 96 56, 92 50, 96 46 C 100 42, 106 44, 108 48
                   M 130 100 L 152 38 L 174 100
                   M 138 80 L 166 80"
                stroke="var(--bg-beige)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
          </svg>
        </motion.div>
      </button>

      {!opened && (
        <motion.p
          className="absolute -bottom-10 left-0 right-0 text-center text-xs uppercase tracking-[0.25em] opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.8 }}
        >
          tap the seal
        </motion.p>
      )}
    </div>
  );
}

