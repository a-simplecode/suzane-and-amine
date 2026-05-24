"use client";

import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { useEffect } from "react";
import { LEBANON_BOUNDARY_LL } from "@/data/lebanon-boundary";
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

// ────────────────────────────────────────────────────────────────────────────
// Lebanon detail layer
// ────────────────────────────────────────────────────────────────────────────
// The world map's 110m projection makes Lebanon ~3 user units across — far
// too small to read as a country. So we paint a detail layer at ~13× the
// world projection scale, anchored over Beirut so the camera focal point
// stays the same. Inside the detail layer, lat/lon → render coords via
// `lebanonProject` so home / venue pins land exactly where they should.

const LEBANON_SCALE = 16; // user-units per world-projection-unit inside the detail layer
const LEBANON_ANCHOR = { x: 432, y: 110 }; // where the detail layer's center sits in world coords
// Bounding-box center of LEBANON_BOUNDARY_LL; the projection translates this
// point to LEBANON_ANCHOR so the country sits dead-center in the deep-zoom
// frame.
const LEBANON_CENTER_LL = { lat: 33.8716, lon: 35.8547 };

function lebanonProject(lat: number, lon: number) {
  const wx = (lon + 180) * 2;
  const wy = (90 - lat) * 2;
  const cx = (LEBANON_CENTER_LL.lon + 180) * 2;
  const cy = (90 - LEBANON_CENTER_LL.lat) * 2;
  return {
    x: LEBANON_ANCHOR.x + LEBANON_SCALE * (wx - cx),
    y: LEBANON_ANCHOR.y + LEBANON_SCALE * (wy - cy),
  };
}

// Pre-projected Lebanon outline path. Built once at module load from real
// Natural Earth 10m boundary data so the country reads accurately at the
// deep zoom.
const LEBANON_OUTLINE_PATH =
  LEBANON_BOUNDARY_LL.map(([lat, lon], i) => {
    const { x, y } = lebanonProject(lat, lon);
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ") + " Z";

// Real coordinates for the home and the venue. Both feed into `lebanonProject`
// so pin positions, the connector line, and label anchors all derive from them.
const HOME_LL = { lat: 33.8120051, lon: 35.5429266 }; // bride's home
const VENUE_LL = { lat: 33.9514617, lon: 35.6032562 }; // wedding venue

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
// Linger so the Lebanon detail layer plus the car ride from home → venue have
// the full 5 seconds the scene is sized around. landed ≈ 6.5s, so 5500ms
// brings onArrived in at t = 12.0s, exactly when the camera animation ends.
const POST_LANDING_LINGER_MS = 5500;

const CAMERA_DURATION = 12; // total scene length

const CAMERA_KEYFRAMES = [
  { cx: 114.5, cy: 82, zoom: 1.5 }, //  t=0     — Vancouver dead-center
  { cx: 114.5, cy: 82, zoom: 1.5 }, //  t=2.3   — hold while continents draw + plane takes off
  { cx: 220, cy: 65, zoom: 1.2 }, //    t=3.1   — pan east as plane climbs past apex
  { cx: 290, cy: 65, zoom: 1.0 }, //    t=4.1   — cruise wide following the plane
  { cx: 380, cy: 95, zoom: 1.2 }, //    t=5.1   — Mediterranean approach
  { cx: 432, cy: 110, zoom: 1.5 }, //   t=5.8   — Beirut dead-center exactly as ARC1 ends
  { cx: 432, cy: 110, zoom: 2.0 }, //   t=7.0   — push past world scale; Lebanon detail starts revealing
  { cx: 432, cy: 110, zoom: 3.5 }, //   t=9.5   — Lebanon fills the frame, country fully drawn
  { cx: 424, cy: 110, zoom: 5.2 }, //   t=12.0  — close-up on the route as the car rolls into the venue
];
// Keyframe times in *fractions* of CAMERA_DURATION. The Beirut keyframe must
// match (FLIGHT_START + ARC1_DURATION) / CAMERA_DURATION = 5.8 / 12 ≈ 0.483 so
// the camera and plane arrive together. Final 2.5 s push-in frames the home →
// venue line so the wedding car reads at scale.
const CAMERA_TIMES = [0, 0.192, 0.258, 0.342, 0.425, 0.483, 0.583, 0.792, 1];

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
          {/* Everything world-scale lives in this single fade-out group:
              graticule, continents, the flight arcs, distance label, the
              Vancouver and Lebanon city pins, the world-scale heart, the
              plane, and the stamp. They fade in together at the start of
              the scene and fade out together as the camera pushes into
              the Lebanon detail layer below. */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={
              visible
                ? { opacity: reduced ? 1 : [0, 1, 1, 0] }
                : { opacity: 0 }
            }
            transition={
              reduced
                ? { duration: 0 }
                : {
                    duration: CAMERA_DURATION,
                    // fade in by t≈0.5s, hold solid until t=landed+1.0s, fade out by t=landed+1.8s
                    times: [
                      0,
                      0.05,
                      (landed + 1.0) / CAMERA_DURATION,
                      (landed + 1.8) / CAMERA_DURATION,
                    ],
                    ease: "easeInOut",
                  }
            }
          >
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
              animate={
                visible ? { opacity: reduced ? 0.85 : [0, 0.85, 0.85, 0] } : { opacity: 0 }
              }
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

            {/* Arrival pin — Lebanon (world-scale label) + Nahr El Kalb venue heart. */}
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
          </motion.g>

          {/* Lebanon detail layer — recognizable country outline, home + venue
              pins, and a connector line. Fades in as the camera pushes past
              world-projection scale and dominates the deep-zoom frame. */}
          <LebanonDetail visible={visible} delay={landed + 0.5} reduced={!!reduced} />
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

// Lebanon at the camera's deepest push-in. The country outline, home, and
// venue pins are all rendered in render-coords (already scaled via
// `lebanonProject`), so sizes here are tuned for the zoom-4.5 viewBox.
function LebanonDetail({
  visible,
  delay,
  reduced,
}: {
  visible: boolean;
  delay: number;
  reduced: boolean;
}) {
  const home = lebanonProject(HOME_LL.lat, HOME_LL.lon);
  const venue = lebanonProject(VENUE_LL.lat, VENUE_LL.lon);
  // Same path used for the dashed connector and the car's offset-path so the
  // car visually drives along the line.
  const routePath = `M ${home.x.toFixed(2)} ${home.y.toFixed(2)} L ${venue.x.toFixed(2)} ${venue.y.toFixed(2)}`;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={visible ? { opacity: 1 } : { opacity: 0 }}
      transition={
        reduced ? { duration: 0 } : { duration: 0.7, delay, ease: "easeOut" }
      }
    >
      {/* Country outline — stroke draws clockwise, fill blooms in after. */}
      <motion.path
        d={LEBANON_OUTLINE_PATH}
        fill="var(--accent-olive-soft)"
        stroke="var(--accent-olive)"
        strokeWidth="0.55"
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 0 }}
        animate={
          visible
            ? { pathLength: 1, fillOpacity: 0.28, strokeOpacity: 0.9 }
            : { pathLength: 0, fillOpacity: 0, strokeOpacity: 0 }
        }
        transition={
          reduced
            ? { duration: 0 }
            : {
                pathLength: { duration: 1.6, delay, ease: "easeInOut" },
                strokeOpacity: { duration: 0.5, delay },
                fillOpacity: { duration: 0.9, delay: delay + 0.9, ease: "easeOut" },
              }
        }
      />

      {/* "LEBANON" set in display caps, parked over the eastern Bekaa so the
          letters never fight the home/venue pins on the western coast. */}
      <motion.text
        x={441}
        y={104}
        textAnchor="middle"
        fontSize="2.8"
        fontFamily="var(--font-display)"
        fill="var(--ink-olive-deep)"
        letterSpacing="3.4"
        opacity="0.45"
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 0.45 } : { opacity: 0 }}
        transition={
          reduced ? { duration: 0 } : { duration: 0.8, delay: delay + 0.6 }
        }
      >
        LEBANON
      </motion.text>

      {/* Sea label to the west of the country. */}
      <motion.text
        x={LEBANON_ANCHOR.x - 26}
        y={LEBANON_ANCHOR.y - 4}
        textAnchor="middle"
        fontSize="1.7"
        fontFamily="var(--font-sans)"
        fill="var(--accent-olive)"
        letterSpacing="3.2"
        opacity="0.55"
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 0.55 } : { opacity: 0 }}
        transition={
          reduced ? { duration: 0 } : { duration: 0.8, delay: delay + 0.9 }
        }
      >
        MEDITERRANEAN
      </motion.text>

      {/* Connector line — dashed, draws after both pins are placed. */}
      <motion.path
        d={routePath}
        fill="none"
        stroke="var(--accent-olive)"
        strokeWidth="0.32"
        strokeDasharray="0.9 0.9"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          visible ? { pathLength: 1, opacity: 0.75 } : { pathLength: 0, opacity: 0 }
        }
        transition={
          reduced
            ? { duration: 0 }
            : {
                pathLength: { duration: 0.9, delay: delay + 1.6, ease: "easeInOut" },
                opacity: { duration: 0.4, delay: delay + 1.6 },
              }
        }
      />

      <LebanonPin
        cx={home.x}
        cy={home.y}
        label="HER HOME"
        align="below"
        visible={visible}
        delay={delay + 1.3}
        reduced={reduced}
      />
      <LebanonHeart
        cx={venue.x}
        cy={venue.y}
        label="THE VENUE"
        align="above"
        visible={visible}
        delay={delay + 1.5}
        reduced={reduced}
      />

      {/* Wedding car drive — appears once the route is drawn and rolls from
          home into the venue, finishing as the camera arrives at its
          deepest push-in. */}
      <CarTrip
        routePath={routePath}
        visible={visible}
        delay={delay + 2.7}
        reduced={reduced}
      />
    </motion.g>
  );
}

function LebanonPin({
  cx,
  cy,
  label,
  align,
  visible,
  delay,
  reduced,
}: {
  cx: number;
  cy: number;
  label: string;
  align: "above" | "below";
  visible: boolean;
  delay: number;
  reduced: boolean;
}) {
  const labelY = align === "above" ? cy - 2.4 : cy + 3.8;
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={visible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={
        reduced
          ? { duration: 0 }
          : { delay, type: "spring", stiffness: 240, damping: 14 }
      }
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <motion.circle
        cx={cx}
        cy={cy}
        r="1.7"
        fill="none"
        stroke="var(--accent-olive)"
        strokeWidth="0.18"
        opacity="0.6"
        animate={reduced ? undefined : { r: [1.7, 2.2, 1.7], opacity: [0.6, 0.2, 0.6] }}
        transition={
          reduced
            ? undefined
            : { duration: 2.0, repeat: Infinity, ease: "easeInOut", delay: delay + 0.4 }
        }
      />
      <circle cx={cx} cy={cy} r="1.0" fill="var(--accent-olive)" />
      <circle cx={cx} cy={cy} r="0.42" fill="var(--bg-beige)" />
      <text
        x={cx}
        y={labelY}
        textAnchor="middle"
        fontSize="1.8"
        fontFamily="var(--font-sans)"
        fill="var(--ink-olive-deep)"
        letterSpacing="2.6"
      >
        {label}
      </text>
    </motion.g>
  );
}

function LebanonHeart({
  cx,
  cy,
  label,
  align,
  visible,
  delay,
  reduced,
}: {
  cx: number;
  cy: number;
  label: string;
  align: "above" | "below";
  visible: boolean;
  delay: number;
  reduced: boolean;
}) {
  // Heart sits with its visible mass slightly above the geographic point, so
  // place the label clear of the heart shape on either side.
  const labelY = align === "above" ? cy - 3.2 : cy + 4.6;
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={visible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={
        reduced
          ? { duration: 0 }
          : { delay, type: "spring", stiffness: 220, damping: 13 }
      }
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <motion.circle
        cx={cx}
        cy={cy}
        r="2.0"
        fill="none"
        stroke="var(--accent-olive)"
        strokeWidth="0.2"
        opacity="0.55"
        animate={reduced ? undefined : { r: [2.0, 2.7, 2.0], opacity: [0.55, 0.15, 0.55] }}
        transition={
          reduced
            ? undefined
            : { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 }
        }
      />
      <motion.path
        // Same heart geometry as the world HeartPin, scaled smaller for this layer.
        d="M 0 1.6 C -2.4 -1.8 -6 -1 -6 2 C -6 4.6 -3 6.6 0 8.6 C 3 6.6 6 4.6 6 2 C 6 -1 2.4 -1.8 0 1.6 Z"
        fill="var(--accent-olive)"
        stroke="var(--ink-olive-deep)"
        strokeWidth="0.5"
        transform={`translate(${cx} ${cy - 1.2}) scale(0.26)`}
        animate={reduced ? undefined : { scale: [0.26, 0.3, 0.26] }}
        transition={
          reduced
            ? undefined
            : { duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: delay + 0.4 }
        }
      />
      <text
        x={cx}
        y={labelY}
        textAnchor="middle"
        fontSize="2.0"
        fontFamily="var(--font-display)"
        fill="var(--ink-olive-deep)"
        letterSpacing="1.6"
      >
        {label}
      </text>
    </motion.g>
  );
}

// Wedding car driving the home → venue connector. Uses CSS offset-path with
// offsetRotate: auto so the car always faces the venue. Three small dust
// dots trail behind for a sense of motion at zoom 3.5.
function CarTrip({
  routePath,
  visible,
  delay,
  reduced,
}: {
  routePath: string;
  visible: boolean;
  delay: number;
  reduced: boolean;
}) {
  // In reduced-motion mode the rest of the Lebanon detail snaps into a static
  // map; an idle car at the venue would just be visual noise without the
  // ride animation, so skip it entirely.
  if (reduced) return null;

  const driveDuration = 2.3;
  const dustDots = [0, 1, 2];

  return (
    <>
      {dustDots.map((i) => (
        <motion.g
          key={`dust-${i}`}
          initial={{ offsetDistance: "0%", opacity: 0 }}
          animate={
            visible
              ? { offsetDistance: "100%", opacity: [0, 0.45, 0] }
              : { offsetDistance: "0%", opacity: 0 }
          }
          transition={{
            offsetDistance: {
              duration: driveDuration,
              delay: delay + i * 0.18,
              ease: "easeInOut",
            },
            opacity: {
              duration: driveDuration,
              delay: delay + i * 0.18,
              times: [0, 0.35, 1],
              ease: "easeOut",
            },
          }}
          style={{ offsetPath: `path('${routePath}')` }}
        >
          <circle r="0.22" fill="var(--accent-olive-soft)" />
        </motion.g>
      ))}

      <motion.g
        initial={{ offsetDistance: "0%", opacity: 0 }}
        animate={
          visible
            ? { offsetDistance: "100%", opacity: [0, 1, 1, 0] }
            : { offsetDistance: "0%", opacity: 0 }
        }
        transition={{
          offsetDistance: { duration: driveDuration, delay, ease: "easeInOut" },
          opacity: {
            duration: driveDuration,
            delay,
            times: [0, 0.1, 0.9, 1],
          },
        }}
        style={{
          offsetPath: `path('${routePath}')`,
          offsetRotate: "auto",
        }}
      >
        <WeddingCar />
      </motion.g>
    </>
  );
}

function WeddingCar() {
  // Drawn around the local origin so offset-path/offsetRotate place its center
  // on the route and rotate the whole car to face the venue. Dimensions are
  // tuned for the deep-zoom Lebanon viewport (zoom 3.5–5.2).
  return (
    <g>
      <rect
        x="-0.95"
        y="-0.46"
        width="1.9"
        height="0.92"
        rx="0.32"
        fill="var(--accent-olive)"
        stroke="var(--ink-olive-deep)"
        strokeWidth="0.08"
      />
      {/* Front windshield (right side = direction of travel). */}
      <rect
        x="0.12"
        y="-0.30"
        width="0.42"
        height="0.6"
        rx="0.09"
        fill="var(--bg-beige)"
        opacity="0.92"
      />
      <rect
        x="-0.54"
        y="-0.30"
        width="0.42"
        height="0.6"
        rx="0.09"
        fill="var(--bg-beige)"
        opacity="0.5"
      />
      <line
        x1="-0.06"
        y1="-0.30"
        x2="-0.06"
        y2="0.30"
        stroke="var(--ink-olive-deep)"
        strokeWidth="0.05"
        opacity="0.4"
      />
      {/* Wheels — top-down view. */}
      <rect x="-0.72" y="-0.58" width="0.28" height="0.14" rx="0.04" fill="var(--ink-olive-deep)" />
      <rect x="0.44" y="-0.58" width="0.28" height="0.14" rx="0.04" fill="var(--ink-olive-deep)" />
      <rect x="-0.72" y="0.44" width="0.28" height="0.14" rx="0.04" fill="var(--ink-olive-deep)" />
      <rect x="0.44" y="0.44" width="0.28" height="0.14" rx="0.04" fill="var(--ink-olive-deep)" />
      {/* Heart on the roof — wedding car charm. */}
      <path
        d="M 0 -0.08 C -0.12 -0.24 -0.32 -0.13 -0.32 0.05 C -0.32 0.20 -0.13 0.30 0 0.38 C 0.13 0.30 0.32 0.20 0.32 0.05 C 0.32 -0.13 0.12 -0.24 0 -0.08 Z"
        fill="var(--bg-beige)"
        opacity="0.85"
        stroke="var(--ink-olive-deep)"
        strokeWidth="0.04"
      />
    </g>
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
