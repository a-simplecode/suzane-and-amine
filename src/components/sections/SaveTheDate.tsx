"use client";
import { useEffect, useState } from "react";
import { EVENT } from "@/data/event";
import { computeCountdown, type Countdown } from "@/lib/countdown";
import { Reveal } from "@/components/motion/Reveal";

const TARGET = new Date(EVENT.dateISO).getTime();

function useCountdown(): Countdown | null {
  const [c, setC] = useState<Countdown | null>(null);
  useEffect(() => {
    const tick = () => setC(computeCountdown(TARGET, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return c;
}

const UNITS: Array<["days" | "hours" | "minutes" | "seconds", string]> = [
  ["days", "Days"],
  ["hours", "Hours"],
  ["minutes", "Minutes"],
  ["seconds", "Seconds"],
];

export function SaveTheDate() {
  const c = useCountdown();
  const { month, day, year } = EVENT.dateDigits;
  return (
    <section className="flex flex-col items-center px-6 py-28 text-center">
      <Reveal>
        <p className="mb-4 text-sm uppercase tracking-[0.4em] text-sage">Save the Date</p>
        <div className="font-display text-5xl text-ink sm:text-7xl">
          {month} <span className="text-sage">·</span> {day} <span className="text-sage">·</span> {year}
        </div>
      </Reveal>

      <Reveal delay={0.15} className="mt-12">
        <div className="flex gap-4 sm:gap-8" suppressHydrationWarning>
          {UNITS.map(([key, label]) => (
            <div key={key} className="flex min-w-16 flex-col items-center">
              <span className="font-display text-4xl text-deepsage sm:text-5xl">
                {c ? String(c[key]).padStart(2, "0") : "--"}
              </span>
              <span className="mt-1 text-xs uppercase tracking-widest text-sage">{label}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
