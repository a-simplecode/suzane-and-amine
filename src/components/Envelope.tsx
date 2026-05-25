"use client";

import { motion, useReducedMotion } from "framer-motion";

type Props = {
  label: string;
  opened: boolean;
  onTapSeal: () => void;
};

// Animation timing constants (seconds, relative to the moment the seal is tapped).
// Scene.tsx swaps to the card beat at envelope-open + ENVELOPE_TOTAL_MS.
const T_FLAP_OPEN = 0.35; // flap starts unhinging after the seal cracks
const T_CARD_EMERGE = 0.95; // card starts climbing once the flap is mostly open
const T_ENVELOPE_FADE = 1.7; // envelope fades / tips after the card is mostly out

export const ENVELOPE_TOTAL_MS = 2400;

export function Envelope({ label, opened, onTapSeal }: Props) {
  const reduced = useReducedMotion();

  return (
    <div className="relative w-[min(86vw,360px)] aspect-[5/3] mx-auto select-none [perspective:1200px]">
      {/* Envelope body — fades and tips down once the card has cleared the top. */}
      <motion.div
        className="absolute inset-0"
        animate={
          opened
            ? reduced
              ? { opacity: 0 }
              : { y: 60, rotate: -2, opacity: 0 }
            : { y: 0, rotate: 0, opacity: 1 }
        }
        transition={{
          duration: reduced ? 0 : 0.7,
          delay: opened ? T_ENVELOPE_FADE : 0,
          ease: [0.4, 0, 0.7, 1],
        }}
      >
        {/* The envelope body recoils up + back when the card pops out, then
            settles before fading. Sells the "card pushed through the lip"
            feeling instead of just being a static envelope. */}
        <motion.div
          className="absolute inset-0"
          animate={
            opened && !reduced
              ? { y: [0, -6, -2, 0], scale: [1, 1.01, 1, 1] }
              : { y: 0, scale: 1 }
          }
          transition={{
            duration: 0.8,
            delay: T_CARD_EMERGE - 0.05,
            times: [0, 0.25, 0.6, 1],
            ease: "easeOut",
          }}
        >
          <svg
            viewBox="0 0 500 300"
            // overflow:visible lets the emerging card extend above the
            // envelope bounds without being clipped by the SVG viewport.
            overflow="visible"
            style={{ overflow: "visible" }}
            className="w-full h-full drop-shadow-[0_8px_24px_rgba(47,58,34,0.18)]"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="card-stub-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--bg-beige-warm)" />
                <stop offset="100%" stopColor="var(--bg-beige)" />
              </linearGradient>
            </defs>

            {/* Subtle "inside" of the envelope, only seen briefly when the
                flap is past 90° — gives the open mouth a touch of depth. */}
            <motion.path
              d="M10 50 L250 200 L490 50 L490 60 L250 210 L10 60 Z"
              fill="var(--accent-olive-soft)"
              opacity="0"
              animate={opened ? { opacity: 0.35 } : { opacity: 0 }}
              transition={{
                duration: reduced ? 0 : 0.4,
                delay: opened ? T_FLAP_OPEN + 0.4 : 0,
              }}
            />

            {/* CARD STUB lives BEFORE the front rect so the rect naturally
                masks it while it's inside. As the stub translates upward, the
                portion that crosses above the rect's top edge (y=40) becomes
                visible — the card visually emerges from the envelope mouth. */}
            <motion.g
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              initial={{ y: 0, scale: 1, rotate: 0, opacity: 1 }}
              animate={
                opened
                  ? reduced
                    ? { y: 0, scale: 1, rotate: 0, opacity: 0 }
                    : {
                        y: [0, -90, -200, -330],
                        scale: [1, 1.04, 1.16, 1.45],
                        rotate: [0, -1.5, 1.2, -0.5],
                        opacity: [1, 1, 1, 0],
                      }
                  : { y: 0, scale: 1, rotate: 0, opacity: 1 }
              }
              transition={{
                duration: reduced ? 0 : 1.35,
                delay: opened ? T_CARD_EMERGE : 0,
                times: opened ? [0, 0.3, 0.7, 1] : undefined,
                ease: [0.34, 0.05, 0.5, 1],
              }}
            >
              <CardStub />
            </motion.g>

            {/* Front face of the envelope — drawn AFTER the card stub so it
                covers everything from y=40 down, masking the stub while it
                is still inside. */}
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

            {/* Decorative V (suggests the back fold seam). */}
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
        </motion.div>

        {/* Flap — unhinges with a slight overshoot, then settles back. */}
        <motion.svg
          viewBox="0 0 500 300"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
          style={{ transformOrigin: "50% 14%", transformPerspective: 900 }}
          animate={opened ? { rotateX: -172 } : { rotateX: 0 }}
          transition={{
            duration: reduced ? 0 : 0.95,
            delay: opened ? T_FLAP_OPEN : 0,
            ease: [0.45, -0.1, 0.3, 1.05],
          }}
        >
          <path
            d="M10 50 L250 200 L490 50 Z"
            fill="var(--bg-beige-warm)"
            stroke="var(--accent-olive)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Faint inner crease so the flap looks folded rather than flat. */}
          <path
            d="M250 200 L250 50"
            stroke="var(--accent-olive)"
            strokeWidth="0.8"
            opacity="0.25"
          />
        </motion.svg>
      </motion.div>

      {/* Wax seal — pulses, then cracks open and tumbles off with a small
          spread of "shards" before disappearing. */}
      <button
        type="button"
        onClick={onTapSeal}
        aria-label="Open the invitation"
        disabled={opened}
        className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full grid place-items-center focus:outline-none disabled:cursor-default"
      >
        <motion.div
          className="relative h-20 w-20"
          animate={
            opened
              ? reduced
                ? { opacity: 0 }
                : {
                    scale: [1, 1.18, 0.95, 0.5],
                    rotate: [0, -6, 14, 38],
                    y: [0, -3, 6, 80],
                    opacity: [1, 1, 1, 0],
                  }
              : reduced
              ? {}
              : { scale: [1, 1.04, 1] }
          }
          transition={
            opened
              ? {
                  duration: 0.95,
                  times: [0, 0.18, 0.42, 1],
                  ease: [0.4, 0, 0.6, 1],
                }
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

        {/* Wax shards — three little chips that fly outward when the seal cracks. */}
        {!reduced &&
          opened &&
          WAX_SHARDS.map((s, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-2 w-2 rounded-[2px] bg-accent-olive"
              initial={{ x: 0, y: 0, scale: 0.8, opacity: 0, rotate: 0 }}
              animate={{
                x: s.x,
                y: s.y,
                scale: [0.8, 1, 0.6],
                rotate: s.rot,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 0.7,
                delay: 0.2,
                times: [0, 0.3, 1],
                ease: [0.2, 0.8, 0.4, 1],
              }}
            />
          ))}
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

// Direction + rotation for each shard the wax seal sheds when it cracks.
const WAX_SHARDS = [
  { x: -38, y: 32, rot: -75 },
  { x: 30, y: 44, rot: 60 },
  { x: 48, y: -10, rot: 110 },
] as const;

// Mini "card" rendered inside the envelope. Designed to read as the same
// invitation that takes over in the next beat — same palette, same "Suzane &
// Amine" / "are getting married" hierarchy — so the handoff feels continuous.
function CardStub() {
  return (
    <g>
      {/* Card paper. */}
      <rect
        x="80"
        y="55"
        width="340"
        height="220"
        rx="6"
        fill="url(#card-stub-fill)"
        stroke="var(--accent-olive)"
        strokeWidth="1"
      />
      {/* Soft shadow under the top edge so the card reads as a real piece of
          paper poking out of the envelope mouth. */}
      <rect
        x="80"
        y="55"
        width="340"
        height="6"
        rx="3"
        fill="var(--ink-olive-deep)"
        opacity="0.08"
      />
      <text
        x="250"
        y="115"
        textAnchor="middle"
        fontFamily="var(--font-display), Georgia, serif"
        fontSize="30"
        fill="var(--ink-olive-deep)"
        letterSpacing="1"
      >
        Suzane <tspan opacity="0.55">&amp;</tspan> Amine
      </text>
      <text
        x="250"
        y="142"
        textAnchor="middle"
        fontSize="9"
        fill="var(--accent-olive)"
        letterSpacing="3.5"
      >
        ARE GETTING MARRIED
      </text>
      <line
        x1="210"
        y1="160"
        x2="290"
        y2="160"
        stroke="var(--accent-olive)"
        strokeOpacity="0.4"
        strokeWidth="1"
      />
      <text
        x="250"
        y="195"
        textAnchor="middle"
        fontFamily="var(--font-display), Georgia, serif"
        fontSize="16"
        fill="var(--ink-olive-deep)"
      >
        August 29, 2026
      </text>
      <text
        x="250"
        y="222"
        textAnchor="middle"
        fontSize="8"
        fill="var(--accent-olive)"
        letterSpacing="3"
      >
        NAHR EL KALB · LEBANON
      </text>
    </g>
  );
}
