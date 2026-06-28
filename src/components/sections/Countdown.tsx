"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EVENT } from "@/data/event";
import { computeCountdown, type Countdown as CD } from "@/lib/countdown";

const TARGET = new Date(EVENT.dateISO).getTime();

function Unit({ value, label }: { value: number; label: string }) {
  const padded = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-20 w-16 overflow-hidden sm:h-28 sm:w-24">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={padded}
            className="absolute inset-0 flex items-center justify-center font-display text-5xl text-deepsage sm:text-7xl"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
          >
            {padded}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-2 text-[0.65rem] uppercase tracking-[0.3em] text-sage">
        {label}
      </span>
    </div>
  );
}

export function Countdown() {
  // Start null to avoid SSR/CSR hydration mismatch on the ticking value.
  const [cd, setCd] = useState<CD | null>(null);

  useEffect(() => {
    const tick = () => setCd(computeCountdown(TARGET, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="v2-countdown" className="relative bg-cream px-6 py-28 text-center">
      <p className="mb-3 text-xs uppercase tracking-[0.4em] text-sage">Counting Down</p>
      <h2 className="font-display text-4xl text-deepsage sm:text-5xl">
        Until We Say I Do
      </h2>

      <div className="mt-14 flex items-start justify-center gap-4 sm:gap-8">
        {cd === null ? (
          <span className="font-display text-2xl text-sage">…</span>
        ) : cd.isPast ? (
          <p className="font-display text-3xl italic text-deepsage">
            The day is here — with all our love.
          </p>
        ) : (
          <>
            <Unit value={cd.days} label="Days" />
            <Unit value={cd.hours} label="Hours" />
            <Unit value={cd.minutes} label="Minutes" />
            <Unit value={cd.seconds} label="Seconds" />
          </>
        )}
      </div>
    </section>
  );
}
