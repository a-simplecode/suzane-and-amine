"use client";

import { useEffect, useState } from "react";
import { WEDDING_DATE_ISO } from "@/lib/tokens";

type Mode = "corner" | "big";

type Props = {
  mode?: Mode;
  className?: string;
};

type Parts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  past: boolean;
};

function diff(target: number, now: number): Parts {
  const ms = target - now;
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 1000 / 60) % 60;
  const hours = Math.floor(ms / 1000 / 60 / 60) % 24;
  const days = Math.floor(ms / 1000 / 60 / 60 / 24);
  return { days, hours, minutes, seconds, past: false };
}

const TARGET_DATE = new Date(WEDDING_DATE_ISO);
const TARGET = TARGET_DATE.getTime();

const WEDDING_LABEL = TARGET_DATE.toLocaleString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Beirut",
});

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function Countdown({ mode = "corner", className }: Props) {
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    const tick = () => setParts(diff(TARGET, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [mode]);

  if (!parts) {
    return null;
  }

  if (mode === "corner") {
    if (parts.past) {
      return (
        <div className={`${className ?? ""} text-center`}>
          <span className="font-display text-xl tracking-wide">Today is the day.</span>
        </div>
      );
    }
    return (
      <div className={`${className ?? ""} text-center leading-tight`}>
        <div className="font-display text-lg sm:text-xl text-ink-olive-deep">
          {WEDDING_LABEL}
        </div>
        <div className="mt-1 text-sm sm:text-base tabular-nums opacity-75">
          in {plural(parts.days, "day")}, {plural(parts.hours, "hour")},{" "}
          {plural(parts.minutes, "minute")}, {plural(parts.seconds, "second")}
        </div>
      </div>
    );
  }

  if (parts.past) {
    return (
      <div className={className}>
        <p className="font-display text-4xl">Today is the day.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-baseline justify-center gap-4 sm:gap-6 text-ink-olive-deep">
        <Cell value={parts.days} label="days" />
        <Sep />
        <Cell value={parts.hours} label="hrs" />
        <Sep />
        <Cell value={parts.minutes} label="min" />
        <Sep />
        <Cell value={parts.seconds} label="sec" />
      </div>
    </div>
  );
}

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-4xl sm:text-5xl tabular-nums leading-none">
        {pad(value)}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-[0.2em] opacity-60">
        {label}
      </span>
    </div>
  );
}

function Sep() {
  return <span className="font-display text-3xl opacity-30 leading-none">·</span>;
}
