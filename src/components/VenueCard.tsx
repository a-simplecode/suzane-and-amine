"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = {
  visible: boolean;
  onRsvpClick: () => void;
};

export function VenueCard({ visible, onRsvpClick }: Props) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => setMapReady(true), 800);
    return () => clearTimeout(id);
  }, [visible]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
      className="w-[min(90vw,420px)] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain mx-auto rounded-xl bg-bg-beige-warm shadow-[0_12px_36px_rgba(47,58,34,0.18)] px-5 py-6 text-ink-olive-deep"
    >
      <div className="text-center">
        <h2 className="font-display text-3xl">L&apos;Heritage Venue</h2>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-accent-olive">
          Nahr El Kalb, Lebanon
        </p>
      </div>

      <ul className="mt-5 flex flex-col gap-2.5 text-sm">
        <Row time="7:00 PM" label="Mass (Arabic)" />
        <Row time="8:00 PM" label="Welcome drink" />
        <Row time="8:30 PM" label="Dinner & dancing" />
      </ul>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] uppercase tracking-[0.18em] text-accent-olive">
        <div className="rounded bg-bg-beige/60 px-3 py-2 text-center">
          Dress code: formal
        </div>
        <div className="rounded bg-bg-beige/60 px-3 py-2 text-center">
          Valet parking
        </div>
      </div>

      <div className="mt-4 h-[clamp(7rem,22vh,9rem)] w-full rounded-lg overflow-hidden bg-bg-beige/70 border border-accent-olive/15">
        {mapReady ? (
          <iframe
            src="https://www.google.com/maps?q=L%27Heritage%20Venue%20Nahr%20El%20Kalb%20Lebanon&output=embed"
            title="L'Heritage Venue map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full border-0"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-xs opacity-50">
            loading map…
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onRsvpClick}
        className="mt-5 w-full rounded-full bg-accent-olive py-3 text-bg-beige font-display text-lg tracking-wide active:scale-[0.98] transition"
      >
        RSVP
      </button>
    </motion.div>
  );
}

function Row({ time, label }: { time: string; label: string }) {
  return (
    <li className="flex items-baseline justify-between border-b border-accent-olive/15 pb-2">
      <span className="font-display text-lg">{time}</span>
      <span className="text-sm opacity-80">{label}</span>
    </li>
  );
}
