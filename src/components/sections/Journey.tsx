"use client";
import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { EVENT } from "@/data/event";
import { Reveal } from "@/components/motion/Reveal";

const VB = { w: 1000, h: 560 };
const { vancouver, beirut } = EVENT.cities;

// percentage positions -> viewBox coordinates
const pt = (c: { x: number; y: number }) => ({
  cx: (c.x / 100) * VB.w,
  cy: (c.y / 100) * VB.h,
});
const A = pt(vancouver);
const B = pt(beirut);

// great-circle-style arc lifted above the midpoint
const CTRL = { x: (A.cx + B.cx) / 2, y: Math.min(A.cy, B.cy) - 150 };
const ARC = `M ${A.cx} ${A.cy} Q ${CTRL.x} ${CTRL.y} ${B.cx} ${B.cy}`;

type Key = "vancouver" | "beirut";

function Pin({
  city,
  active,
  onClick,
}: {
  city: typeof vancouver | typeof beirut;
  active: boolean;
  onClick: () => void;
}) {
  const { cx, cy } = pt(city);
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${city.name}, ${city.country}`}
      aria-pressed={active}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer outline-none"
    >
      {/* halo */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={active ? 26 : 18}
        fill="var(--color-sage)"
        opacity={0.18}
        animate={{ r: active ? [22, 30, 22] : 18 }}
        transition={{ duration: 2.4, repeat: active ? Infinity : 0, ease: "easeInOut" }}
      />
      <circle cx={cx} cy={cy} r="8" fill="var(--color-deepsage)" />
      <circle cx={cx} cy={cy} r="3.5" fill="var(--color-cream)" />
      <text
        x={cx}
        y={cy - 26}
        textAnchor="middle"
        className="fill-ink font-display"
        style={{ fontSize: 30 }}
      >
        {city.name}
      </text>
    </g>
  );
}

export function Journey() {
  const [selected, setSelected] = useState<Key | null>(null);
  const reduce = useReducedMotion();
  const active = selected ? EVENT.cities[selected] : null;

  return (
    <section className="relative overflow-hidden px-6 py-32 sm:py-40">
      <Reveal className="mx-auto mb-12 max-w-xl text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.4em] text-sage">The Journey</p>
        <h2 className="font-display text-4xl text-ink sm:text-5xl">
          From two cities to one forever
        </h2>
        <p className="mt-5 text-deepsage">Tap a city to follow the path of our love.</p>
      </Reveal>

      <Reveal delay={0.1} className="mx-auto max-w-4xl">
        <svg
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          className="w-full"
          role="img"
          aria-label="Map showing the route from Vancouver, Canada to Beirut, Lebanon"
        >
          <defs>
            <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="var(--color-sage)" opacity="0.28" />
            </pattern>
          </defs>

          {/* the "world" — a soft dotted field */}
          <rect
            x="0"
            y="0"
            width={VB.w}
            height={VB.h}
            rx="28"
            fill="url(#dots)"
            opacity="0.9"
          />

          {/* faint base path */}
          <path d={ARC} fill="none" stroke="var(--color-sage)" strokeWidth="2" opacity="0.25" />

          {/* animated drawing path */}
          <motion.path
            d={ARC}
            fill="none"
            stroke="var(--color-deepsage)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="2 10"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={reduce ? undefined : { pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 3.2, ease: "easeInOut" }}
          />

          {/* the traveler — a dot gliding along the arc */}
          {!reduce && (
            <motion.circle
              r="6"
              fill="var(--color-ink)"
              style={{ offsetPath: `path("${ARC}")`, offsetRotate: "auto" }}
              initial={{ offsetDistance: "0%", opacity: 0 }}
              whileInView={{ offsetDistance: "100%", opacity: [0, 1, 1, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 3.2, ease: "easeInOut" }}
            />
          )}

          <Pin
            city={vancouver}
            active={selected === "vancouver"}
            onClick={() => setSelected("vancouver")}
          />
          <Pin
            city={beirut}
            active={selected === "beirut"}
            onClick={() => setSelected("beirut")}
          />
        </svg>
      </Reveal>

      {/* detail card */}
      <div className="mx-auto mt-10 min-h-[7rem] max-w-md text-center">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="rounded-2xl border border-sage/30 bg-cream px-8 py-7 shadow-sm"
            >
              <h3 className="font-display text-3xl text-ink">{active.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.35em] text-sage">
                {active.country}
              </p>
              <p className="mt-4 leading-relaxed text-ink/80">{active.blurb}</p>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-8 text-sm uppercase tracking-[0.3em] text-sage"
            >
              Two places. One love. One forever.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
