"use client";

import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { useEffect } from "react";
import { WORLD_LAND_PATHS } from "@/data/world-paths";

type Props = {
  visible: boolean;
  onArrived: () => void;
};

// Equirectangular projection (720x360 world). The base viewBox shows the
// Northern Hemisphere from Alaska to the Caucasus so the flight reads big.
// Vancouver (-123,49) → (114,82). Beirut (35.5,33.9) → (431,112).
// Nahr El Kalb sits a hair north of Beirut → venue (435,105).
//
// Pin positions are nudged a hair inland from raw lat/lon so they sit on
// the Natural Earth 110m coastline polygons rather than in the ocean.
const ARC = "M 114.5 82 Q 270 30 432 110";
const ARC2 = "M 432 110 Q 433.5 108 435 105";

const VANCOUVER = { x: 114.5, y: 82 };
const BEIRUT = { x: 432, y: 110 };
const VENUE = { x: 435, y: 105 };

// Cinematic camera implemented by animating the SVG viewBox itself. Each
// keyframe describes a focal point + zoom; we convert to viewBox params
// (vbX, vbY, vbW, vbH) so the focal point sits dead-center in the visible
// crop regardless of device aspect ratio.
const VB_BASE_W = 470;
const VB_BASE_H = 215;
const VB_REDUCED = "30 22 470 215"; // wide static fallback

// Camera & plane share a single timeline. Beats below are in *seconds* and
// the camera keyframe times are derived from them so the focal point always
// hits Beirut the moment ARC1 ends (the plane visually "lands").
const FLIGHT_START = 0.8; // continents draw, then plane lifts off
const ARC1_DURATION = 5.0; // long Vancouver → Beirut cruise (matches camera pan)
const ARC1_PAUSE = 0.1; // micro-beat after touchdown before taxi
const ARC2_DURATION = 0.6; // fast taxi hop Beirut → venue
const POST_LANDING_LINGER_MS = 3500;

const CAMERA_DURATION = 10; // total scene length

const CAMERA_KEYFRAMES = [
  { cx: 114.5, cy: 82, zoom: 1.5 }, //  t=0    — Vancouver dead-center
  { cx: 114.5, cy: 82, zoom: 1.5 }, //  t=2.3  — hold while continents draw + plane takes off
  { cx: 220, cy: 65, zoom: 1.2 }, //    t=3.1  — pan east as plane climbs past apex
  { cx: 290, cy: 65, zoom: 1.0 }, //    t=4.1  — cruise wide following the plane
  { cx: 380, cy: 95, zoom: 1.2 }, //    t=5.1  — Mediterranean approach
  { cx: 432, cy: 110, zoom: 1.5 }, //   t=5.8  — Beirut dead-center exactly as ARC1 ends
  { cx: 432, cy: 110, zoom: 1.6 }, //   t=10   — slow push-in over the post-landing dwell
];
// Keyframe times in *fractions* of CAMERA_DURATION. The Beirut keyframe sits
// at (FLIGHT_START + ARC1_DURATION) / CAMERA_DURATION = 5.8 / 10 = 0.58 so the
// camera and plane arrive together.
const CAMERA_TIMES = [0, 0.23, 0.31, 0.41, 0.51, 0.58, 1];

const vbXs = CAMERA_KEYFRAMES.map((k) => k.cx - VB_BASE_W / k.zoom / 2);
const vbYs = CAMERA_KEYFRAMES.map((k) => k.cy - VB_BASE_H / k.zoom / 2);
const vbWs = CAMERA_KEYFRAMES.map((k) => VB_BASE_W / k.zoom);
const vbHs = CAMERA_KEYFRAMES.map((k) => VB_BASE_H / k.zoom);

export function WorldMap({ visible, onArrived }: Props) {
  const reduced = useReducedMotion();

  // Anchored beats so labels, stamp, pulses, and the camera all stay in sync.
  const flightStart = reduced ? 0 : FLIGHT_START;
  const arc1Duration = reduced ? 0.001 : ARC1_DURATION;
  const arc1Pause = reduced ? 0 : ARC1_PAUSE;
  const arc2Duration = reduced ? 0.001 : ARC2_DURATION;
  const arcEnd = flightStart + arc1Duration;
  const approachStart = arcEnd + arc1Pause;
  const landed = approachStart + arc2Duration;

  // viewBox motion values — we animate each component and compose into a
  // string for the <motion.svg viewBox=...> attribute.
  const vbX = useMotionValue(vbXs[0]);
  const vbY = useMotionValue(vbYs[0]);
  const vbW = useMotionValue(vbWs[0]);
  const vbH = useMotionValue(vbHs[0]);
  const viewBox = useMotionTemplate`${vbX} ${vbY} ${vbW} ${vbH}`;

  useEffect(() => {
    if (reduced) {
      vbX.set(30);
      vbY.set(22);
      vbW.set(470);
      vbH.set(215);
      return;
    }
    if (!visible) return;
    const opts = {
      duration: CAMERA_DURATION,
      times: CAMERA_TIMES,
      ease: "easeInOut" as const,
    };
    const a = animate(vbX, vbXs, opts);
    const b = animate(vbY, vbYs, opts);
    const c = animate(vbW, vbWs, opts);
    const d = animate(vbH, vbHs, opts);
    return () => {
      a.stop();
      b.stop();
      c.stop();
      d.stop();
    };
  }, [visible, reduced, vbX, vbY, vbW, vbH]);

  return (
    <motion.div
      className="relative w-full max-w-[860px] mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.svg
        viewBox={reduced ? VB_REDUCED : viewBox}
        className="block w-full h-[62dvh] max-h-[480px] sm:h-auto sm:max-h-none sm:aspect-[470/215] [mask-image:linear-gradient(to_bottom,transparent_0%,black_5%,black_95%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_5%,black_95%,transparent_100%)]"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g>
          <Graticule />

          <g opacity="0.95">
            <Continents reduced={!!reduced} visible={visible} />
          </g>

          {/* Shadow arc — wider, faint, gives the dashed arc weight. */}
          <motion.path
          d={ARC}
          fill="none"
          stroke="var(--accent-olive-soft)"
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity="0.18"
          initial={{ pathLength: 0 }}
          animate={visible ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: reduced ? 0 : 1.4, delay: 0.3, ease: "easeInOut" }}
        />

        {/* Primary dashed arc with marching-ants flow once it's drawn. */}
        <motion.path
          d={ARC}
          fill="none"
          stroke="var(--accent-olive)"
          strokeWidth="1.6"
          strokeDasharray="3 5"
          initial={{ pathLength: 0, opacity: 0, strokeDashoffset: 0 }}
          animate={
            visible
              ? {
                  pathLength: 1,
                  opacity: 0.85,
                  strokeDashoffset: reduced ? 0 : -64,
                }
              : { pathLength: 0, opacity: 0, strokeDashoffset: 0 }
          }
          transition={{
            pathLength: { duration: reduced ? 0 : 1.4, delay: 0.3, ease: "easeInOut" },
            opacity: { duration: 0.4, delay: 0.3 },
            strokeDashoffset: reduced
              ? { duration: 0 }
              : {
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 1.7,
                },
          }}
        />

        <motion.path
          d={ARC2}
          fill="none"
          stroke="var(--accent-olive-soft)"
          strokeWidth="1.3"
          strokeDasharray="2 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={visible ? { pathLength: 1, opacity: 0.75 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.8, delay: arcEnd }}
        />

        {/* Apex distance label — fades in mid-flight, fades out before landing. */}
        <motion.text
          x="270"
          y="44"
          textAnchor="middle"
          fontSize="7"
          fontFamily="var(--font-display)"
          fill="var(--accent-olive)"
          letterSpacing="2.5"
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: reduced ? 0.85 : [0, 0.85, 0.85, 0] } : { opacity: 0 }}
          transition={
            reduced
              ? { duration: 0 }
              : {
                  duration: arc1Duration,
                  delay: flightStart + 0.4,
                  times: [0, 0.25, 0.75, 1],
                  ease: "easeInOut",
                }
          }
        >
          ≈ 10,500 KM
        </motion.text>

        {/* Departure pin — Vancouver. */}
        <CityPin
          cx={VANCOUVER.x}
          cy={VANCOUVER.y}
          name="Vancouver"
          subtitle="BRITISH COLUMBIA"
          align="above"
          visible={visible}
          delay={0.2}
          reduced={!!reduced}
        />
        <PulseRing
          cx={VANCOUVER.x}
          cy={VANCOUVER.y}
          color="var(--accent-olive)"
          delay={flightStart + 0.05}
          reduced={!!reduced}
        />

        {/* Arrival pin — Lebanon (city) + Nahr El Kalb venue heart. */}
        <CityPin
          cx={BEIRUT.x}
          cy={BEIRUT.y}
          name="Lebanon"
          subtitle="MEDITERRANEAN COAST"
          align="above"
          visible={visible}
          delay={0.5}
          reduced={!!reduced}
        />
        <HeartPin
          cx={VENUE.x}
          cy={VENUE.y}
          visible={visible}
          delay={landed}
          reduced={!!reduced}
        />
        <PulseRing
          cx={VENUE.x}
          cy={VENUE.y}
          color="var(--accent-olive)"
          delay={landed + 0.1}
          reduced={!!reduced}
          repeat
        />

        <FlightPath
          visible={visible}
          onArrived={onArrived}
          arc1Duration={arc1Duration}
          arc2Duration={arc2Duration}
          flightStart={flightStart}
          approachStart={approachStart}
          reduced={!!reduced}
        />

          <PassportStamp visible={visible} delay={landed - 0.1} reduced={!!reduced} />
        </g>
      </motion.svg>
    </motion.div>
  );
}

function FlightPath({
  visible,
  onArrived,
  arc1Duration,
  arc2Duration,
  flightStart,
  approachStart,
  reduced,
}: {
  visible: boolean;
  onArrived: () => void;
  arc1Duration: number;
  arc2Duration: number;
  flightStart: number;
  approachStart: number;
  reduced: boolean;
}) {
  return (
    <g>
      <motion.g
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.6 }}
      >
        {/* Vapor trail rides the same arc, three dots offset and fading. */}
        <VaporTrail
          visible={visible}
          arc1Duration={arc1Duration}
          delay={flightStart}
          reduced={reduced}
        />

        <motion.g
          initial={{ offsetDistance: "0%" }}
          animate={visible ? { offsetDistance: "100%" } : { offsetDistance: "0%" }}
          transition={{ duration: arc1Duration, delay: flightStart, ease: "easeInOut" }}
          style={{
            offsetPath: `path('${ARC}')`,
            offsetRotate: "auto",
          }}
        >
          <PaperPlaneOnPath withSuzane={false} />
        </motion.g>

        <motion.g
          initial={{ offsetDistance: "0%", opacity: 0 }}
          animate={
            visible
              ? { offsetDistance: "100%", opacity: 1 }
              : { offsetDistance: "0%", opacity: 0 }
          }
          transition={{
            duration: arc2Duration,
            delay: approachStart,
            ease: "easeInOut",
          }}
          onAnimationComplete={() => {
            if (!visible) return;
            // Linger after the venue pin so heart pulse, passport stamp,
            // and the slow camera push-in on Beirut all have time to register.
            const wait = reduced ? 0 : POST_LANDING_LINGER_MS;
            window.setTimeout(() => onArrived(), wait);
          }}
          style={{
            offsetPath: `path('${ARC2}')`,
            offsetRotate: "auto",
          }}
        >
          <PaperPlaneOnPath withSuzane={true} />
        </motion.g>
      </motion.g>
    </g>
  );
}

function VaporTrail({
  visible,
  arc1Duration,
  delay,
  reduced,
}: {
  visible: boolean;
  arc1Duration: number;
  delay: number;
  reduced: boolean;
}) {
  if (reduced) return null;
  const dots = [0, 1, 2];
  return (
    <>
      {dots.map((i) => (
        <motion.g
          key={i}
          initial={{ offsetDistance: "0%", opacity: 0 }}
          animate={
            visible
              ? { offsetDistance: "100%", opacity: [0, 0.55, 0] }
              : { offsetDistance: "0%", opacity: 0 }
          }
          transition={{
            offsetDistance: {
              duration: arc1Duration,
              delay: delay + i * 0.18,
              ease: "easeInOut",
            },
            opacity: {
              duration: arc1Duration,
              delay: delay + i * 0.18,
              times: [0, 0.25, 1],
              ease: "easeOut",
            },
          }}
          style={{ offsetPath: `path('${ARC}')` }}
        >
          <circle r={1.7 - i * 0.35} fill="var(--accent-olive-soft)" />
        </motion.g>
      ))}
    </>
  );
}

function PaperPlaneOnPath({ withSuzane }: { withSuzane: boolean }) {
  // Same silhouette as <PaperPlane /> in the prior beat, scaled & centered to the path.
  return (
    <g transform="translate(-11 -7) scale(0.22)">
      <polygon
        points="90,50 10,15 40,50 10,85"
        fill="var(--bg-beige-warm)"
        stroke="var(--ink-olive-deep)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <polygon
        points="40,50 10,85 45,65"
        fill="var(--accent-olive)"
        opacity="0.22"
      />
      <line
        x1="40"
        y1="50"
        x2="10"
        y2="15"
        stroke="var(--accent-olive)"
        strokeWidth="2"
        opacity="0.55"
      />
      {withSuzane && <circle cx="58" cy="50" r="4.5" fill="var(--accent-olive-soft)" />}
    </g>
  );
}

function CityPin({
  cx,
  cy,
  name,
  subtitle,
  align,
  visible,
  delay,
  reduced,
}: {
  cx: number;
  cy: number;
  name: string;
  subtitle: string;
  align: "above" | "below";
  visible: boolean;
  delay: number;
  reduced: boolean;
}) {
  const nameY = align === "above" ? cy - 9 : cy + 14;
  const subY = align === "above" ? cy - 16 : cy + 21;
  return (
    <motion.g
      initial={{ opacity: 0, y: 4 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
      transition={{ duration: reduced ? 0 : 0.55, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <circle cx={cx} cy={cy} r="3.2" fill="var(--accent-olive)" />
      <circle cx={cx} cy={cy} r="1.4" fill="var(--bg-beige)" />
      <text
        x={cx}
        y={nameY}
        textAnchor="middle"
        fill="var(--ink-olive-deep)"
        fontSize="11"
        fontFamily="var(--font-display)"
        letterSpacing="0.6"
      >
        {name}
      </text>
      <text
        x={cx}
        y={subY}
        textAnchor="middle"
        fill="var(--accent-olive)"
        fontSize="4.5"
        fontFamily="var(--font-sans)"
        letterSpacing="2.2"
      >
        {subtitle}
      </text>
    </motion.g>
  );
}

function PulseRing({
  cx,
  cy,
  color,
  delay,
  reduced,
  repeat = false,
}: {
  cx: number;
  cy: number;
  color: string;
  delay: number;
  reduced: boolean;
  repeat?: boolean;
}) {
  if (reduced) return null;
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      fill="none"
      stroke={color}
      strokeWidth="0.9"
      initial={{ r: 3.5, opacity: 0.7 }}
      animate={{ r: 14, opacity: 0 }}
      transition={{
        duration: 1.6,
        delay,
        repeat: repeat ? Infinity : 0,
        repeatDelay: 0.5,
        ease: "easeOut",
      }}
    />
  );
}

function HeartPin({
  cx,
  cy,
  visible,
  delay,
  reduced,
}: {
  cx: number;
  cy: number;
  visible: boolean;
  delay: number;
  reduced: boolean;
}) {
  return (
    <motion.g
      transform={`translate(${cx} ${cy})`}
      initial={{ scale: 0, opacity: 0 }}
      animate={visible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={
        reduced
          ? { duration: 0 }
          : { delay, type: "spring", stiffness: 220, damping: 13 }
      }
    >
      <motion.path
        d="M 0 1.6 C -2.4 -1.8 -6 -1 -6 2 C -6 4.6 -3 6.6 0 8.6 C 3 6.6 6 4.6 6 2 C 6 -1 2.4 -1.8 0 1.6 Z"
        fill="var(--accent-olive)"
        stroke="var(--ink-olive-deep)"
        strokeWidth="0.5"
        transform="scale(0.55)"
        animate={
          reduced
            ? undefined
            : {
                scale: [0.55, 0.62, 0.55],
              }
        }
        transition={
          reduced
            ? undefined
            : {
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay + 0.4,
              }
        }
      />
    </motion.g>
  );
}

function PassportStamp({
  visible,
  delay,
  reduced,
}: {
  visible: boolean;
  delay: number;
  reduced: boolean;
}) {
  return (
    <motion.g
      transform="translate(462 75) rotate(-9)"
      initial={{ opacity: 0, scale: 0.55 }}
      animate={visible ? { opacity: 0.85, scale: 1 } : { opacity: 0, scale: 0.55 }}
      transition={
        reduced
          ? { duration: 0 }
          : { delay, duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }
      }
    >
      <circle r="22" fill="none" stroke="var(--accent-olive)" strokeWidth="0.9" />
      <circle
        r="18.5"
        fill="none"
        stroke="var(--accent-olive)"
        strokeWidth="0.4"
        strokeDasharray="1.4 1.4"
      />
      <text
        textAnchor="middle"
        y="-5"
        fontSize="4"
        fontFamily="var(--font-sans)"
        fill="var(--accent-olive)"
        letterSpacing="2.2"
      >
        ARRIVED
      </text>
      <text
        textAnchor="middle"
        y="4"
        fontSize="7"
        fontFamily="var(--font-display)"
        fill="var(--ink-olive-deep)"
        letterSpacing="1.6"
      >
        30 · 08 · 26
      </text>
      <text
        textAnchor="middle"
        y="13"
        fontSize="3.6"
        fontFamily="var(--font-sans)"
        fill="var(--accent-olive)"
        letterSpacing="2"
      >
        NAHR EL KALB
      </text>
    </motion.g>
  );
}

function Graticule() {
  // Equirectangular: latitudes are horizontal, meridians are vertical.
  // Tropic of Cancer (23.5°N → y=133), Equator (y=180), Arctic Circle (66.5°N → y=47).
  return (
    <g
      stroke="var(--accent-olive-soft)"
      strokeWidth="0.35"
      strokeDasharray="2 4"
      opacity="0.2"
      fill="none"
    >
      {/* Latitudes — Arctic Circle, Tropic of Cancer, Equator-ish. */}
      <line x1="30" y1="47" x2="500" y2="47" />
      <line x1="30" y1="80" x2="500" y2="80" strokeDasharray="1 5" />
      <line x1="30" y1="133" x2="500" y2="133" />
      <line x1="30" y1="180" x2="500" y2="180" />

      {/* Meridians — every 30°, anchored on the Prime Meridian (lon 0 → x=360). */}
      <line x1="60" y1="22" x2="60" y2="237" />
      <line x1="120" y1="22" x2="120" y2="237" />
      <line x1="180" y1="22" x2="180" y2="237" />
      <line x1="240" y1="22" x2="240" y2="237" />
      <line x1="300" y1="22" x2="300" y2="237" />
      <line x1="360" y1="22" x2="360" y2="237" strokeWidth="0.5" opacity="0.7" />
      <line x1="420" y1="22" x2="420" y2="237" />
      <line x1="480" y1="22" x2="480" y2="237" />
    </g>
  );
}

type ContinentsProps = {
  reduced: boolean;
  visible: boolean;
};

// Two-pass entrance:
//  1. The largest landmasses (continents) ink-draw via pathLength so the map
//     reads as if it's being penned onto parchment.
//  2. Smaller islands (where pathLength would just look noisy at this density)
//     fade in with a subtle stagger.
const PRIMARY_DRAW_COUNT = 6;

function Continents({ reduced, visible }: ContinentsProps) {
  return (
    <g
      fill="var(--bg-beige-warm)"
      stroke="var(--accent-olive-soft)"
      strokeWidth="0.55"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {WORLD_LAND_PATHS.map((d, i) => {
        const isPrimary = i < PRIMARY_DRAW_COUNT;
        const baseDelay = isPrimary ? i * 0.18 : 1.0 + (i - PRIMARY_DRAW_COUNT) * 0.012;

        if (isPrimary) {
          return (
            <motion.path
              key={i}
              d={d}
              initial={
                reduced
                  ? { pathLength: 1, opacity: 1, fillOpacity: 1 }
                  : { pathLength: 0, opacity: 0, fillOpacity: 0 }
              }
              animate={
                visible
                  ? { pathLength: 1, opacity: 1, fillOpacity: 1 }
                  : reduced
                    ? { pathLength: 1, opacity: 1, fillOpacity: 1 }
                    : { pathLength: 0, opacity: 0, fillOpacity: 0 }
              }
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      pathLength: {
                        duration: 1.4,
                        delay: 0.1 + baseDelay,
                        ease: "easeInOut",
                      },
                      opacity: { duration: 0.4, delay: 0.1 + baseDelay },
                      fillOpacity: {
                        duration: 0.6,
                        delay: 0.1 + baseDelay + 0.9,
                        ease: "easeOut",
                      },
                    }
              }
            />
          );
        }

        return (
          <motion.path
            key={i}
            d={d}
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={
              visible
                ? { opacity: 1 }
                : reduced
                  ? { opacity: 1 }
                  : { opacity: 0 }
            }
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.45, delay: baseDelay, ease: "easeOut" }
            }
          />
        );
      })}
    </g>
  );
}
