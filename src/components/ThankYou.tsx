"use client";

import { motion } from "framer-motion";
import { Countdown } from "./Countdown";
import { Monogram } from "./Monogram";

type Props = {
  visible: boolean;
};

export function ThankYou({ visible }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={visible ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 z-40 bg-bg-beige text-ink-olive-deep flex flex-col items-center justify-center px-6 text-center"
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3 font-display text-3xl">
        <span>Thank you</span>
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path
            d="M12 21 C 5 16, 2 11, 5 7 C 7 5, 11 5, 12 8 C 13 5, 17 5, 19 7 C 22 11, 19 16, 12 21 Z"
            fill="var(--accent-olive)"
          />
        </svg>
      </div>
      <p className="mt-3 max-w-xs text-sm opacity-80">
        We can&apos;t wait to see you on August 29.
      </p>

      <div className="mt-10 w-full max-w-md">
        <Countdown mode="big" />
      </div>

      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <Monogram className="w-64 h-auto opacity-[0.08]" />
      </div>
    </motion.div>
  );
}
