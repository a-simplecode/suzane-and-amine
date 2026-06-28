"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EVENT } from "@/data/event";

// viewBox is 100 wide x 56 tall. City x/y in EVENT.cities are 0-100 percentages;
// y is scaled into the shorter vertical space.
const VB_W = 100;
const VB_H = 56;
const sy = (y: number) => (y / 100) * VB_H;

const V = EVENT.cities.vancouver;
const B = EVENT.cities.beirut;
const vx = V.x;
const vy = sy(V.y);
const bx = B.x;
const by = sy(B.y);
// Arc bows upward over the two cities.
const cx = (vx + bx) / 2;
const cy = Math.min(vy, by) - 16;
const ARC = `M ${vx} ${vy} Q ${cx} ${cy} ${bx} ${by}`;

type Key = "vancouver" | "beirut";

function CityMarker({
  ck,
  x,
  y,
  selected,
  onSelect,
  align,
}: {
  ck: Key;
  x: number;
  y: number;
  selected: boolean;
  onSelect: (k: Key) => void;
  align: "left" | "right";
}) {
  const city = EVENT.cities[ck];
  return (
    <g
      onClick={() => onSelect(ck)}
      style={{ cursor: "pointer" }}
      role="button"
      tabIndex={0}
      aria-label={`${city.name}, ${city.country}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(ck);
      }}
    >
      {/* Pulse ring. */}
      <motion.circle
        cx={x}
        cy={y}
        r={2.2}
        fill="none"
        stroke="var(--color-deepsage)"
        strokeWidth={0.4}
        initial={{ opacity: 0.6, scale: 1 }}
        animate={{ opacity: [0.6, 0], scale: [1, 3] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        style={{ transformOrigin: `${x}px ${y}px`, transformBox: "fill-box" }}
      />
      <circle
        cx={x}
        cy={y}
        r={selected ? 2.4 : 1.8}
        fill="var(--color-deepsage)"
        stroke="var(--color-cream)"
        strokeWidth={0.6}
        style={{ transition: "r 0.3s" }}
      />
      <text
        x={align === "left" ? x - 3.5 : x + 3.5}
        y={y + 0.8}
        textAnchor={align === "left" ? "end" : "start"}
        fontFamily="var(--font-display)"
        fontSize={3.6}
        fill="var(--color-deepsage)"
      >
        {city.name}
      </text>
    </g>
  );
}

export function JourneyMap() {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<Key | null>(null);
  const toggle = (k: Key) => setSelected((cur) => (cur === k ? null : k));
  const active = selected ? EVENT.cities[selected] : null;

  return (
    <section id="v2-map" className="relative overflow-hidden bg-cream px-6 py-28">
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.4em] text-sage">The Journey</p>
        <h2 className="font-display text-4xl text-deepsage sm:text-5xl">
          Eight Thousand Kilometres
        </h2>
        <p className="mx-auto mt-4 max-w-md text-ink/70">
          Two cities, one love. Tap a place to hear its half of the story.
        </p>

        <div className="relative mx-auto mt-12 max-w-3xl">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="w-full"
            role="img"
            aria-label="Travel map from Vancouver to Beirut"
          >
            {/* Soft graticule backdrop. */}
            <g stroke="var(--color-sage)" strokeWidth={0.15} opacity={0.25}>
              {[10, 20, 30, 40].map((y) => (
                <line key={`h${y}`} x1={0} y1={y} x2={VB_W} y2={y} />
              ))}
              {[20, 40, 60, 80].map((x) => (
                <line key={`v${x}`} x1={x} y1={0} x2={x} y2={VB_H} />
              ))}
            </g>

            {/* Abstract landmasses in olive tones. */}
            <g fill="var(--color-sage)" opacity={0.18}>
              <path d="M2 18 Q 10 10 22 14 Q 30 18 26 28 Q 20 36 10 34 Q 0 30 2 18 Z" />
              <path d="M44 20 Q 58 12 74 18 Q 86 24 80 34 Q 66 42 52 38 Q 42 30 44 20 Z" />
              <path d="M82 22 Q 94 20 98 30 Q 96 40 86 40 Q 78 34 82 22 Z" />
            </g>

            {/* Travel arc. */}
            <motion.path
              d={ARC}
              fill="none"
              stroke="var(--color-deepsage)"
              strokeWidth={0.6}
              strokeLinecap="round"
              strokeDasharray="2 1.6"
              initial={reduce ? false : { pathLength: 0 }}
              whileInView={reduce ? undefined : { pathLength: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
            />

            {/* A spark that travels the arc as it draws in (SMIL — broad support). */}
            {!reduce && (
              <circle r={0.9} fill="var(--color-deepsage)">
                <animateMotion dur="2.2s" begin="0s" fill="freeze" path={ARC} />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur="2.2s"
                  begin="0s"
                  fill="freeze"
                />
              </circle>
            )}

            <CityMarker
              ck="vancouver"
              x={vx}
              y={vy}
              align="left"
              selected={selected === "vancouver"}
              onSelect={toggle}
            />
            <CityMarker
              ck="beirut"
              x={bx}
              y={by}
              align="right"
              selected={selected === "beirut"}
              onSelect={toggle}
            />
          </svg>

          {/* City detail panel. */}
          <motion.div
            className="mx-auto mt-8 max-w-lg overflow-hidden"
            initial={false}
            animate={{ height: active ? "auto" : 0, opacity: active ? 1 : 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {active && (
              <div className="rounded-sm border border-sage/40 bg-sage/10 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-sage">
                  {active.country}
                </p>
                <h3 className="mt-1 font-display text-2xl text-deepsage">
                  {active.name}
                </h3>
                <p className="mt-3 leading-relaxed text-ink/75">{active.blurb}</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
