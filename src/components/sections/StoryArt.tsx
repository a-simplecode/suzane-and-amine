"use client";
import { motion, useReducedMotion } from "framer-motion";

export type Scene = "west" | "distance" | "east";

// Maps each story beat to a scene by index (Vancouver -> distance -> Beirut).
export const SCENES: Scene[] = ["west", "distance", "east"];

const VB_W = 400;
const VB_H = 500;

// Builds a smooth repeating wave path wide enough to scroll seamlessly.
function wavePath(baseY: number, amp: number): string {
  const wl = 80; // wavelength
  let d = `M -80 ${baseY}`;
  for (let x = -80; x <= VB_W + 80; x += wl) {
    d += ` Q ${x + wl / 4} ${baseY - amp}, ${x + wl / 2} ${baseY} T ${x + wl} ${baseY}`;
  }
  d += ` L ${VB_W + 80} ${VB_H} L -80 ${VB_H} Z`;
  return d;
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm border border-sage/40 shadow-[0_20px_50px_-25px_rgba(46,51,43,0.5)]">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        {children}
      </svg>
      <div className="pointer-events-none absolute inset-3 border border-cream/40" />
    </div>
  );
}

// ─── Scene 1: West — mountains under a quiet sky (Vancouver) ──────────────
function West({ reduce }: { reduce: boolean }) {
  const stars = [
    { x: 70, y: 70, r: 1.6, d: 0 },
    { x: 140, y: 45, r: 1.1, d: 0.6 },
    { x: 230, y: 80, r: 1.8, d: 1.2 },
    { x: 310, y: 55, r: 1.2, d: 0.3 },
    { x: 350, y: 110, r: 1.5, d: 0.9 },
    { x: 50, y: 130, r: 1.1, d: 1.5 },
  ];
  return (
    <Frame>
      <defs>
        <linearGradient id="sky-w" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9ead8" />
          <stop offset="100%" stopColor="#f3f1e9" />
        </linearGradient>
      </defs>
      <rect width={VB_W} height={VB_H} fill="url(#sky-w)" />

      {stars.map((s, i) => (
        <motion.circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#8a9a7b"
          initial={{ opacity: 0.25 }}
          animate={reduce ? { opacity: 0.4 } : { opacity: [0.2, 0.9, 0.2] }}
          transition={reduce ? undefined : { duration: 3.5, delay: s.d, repeat: Infinity }}
        />
      ))}

      {/* Sun/moon disc. */}
      <motion.circle
        cx={300}
        cy={150}
        r={26}
        fill="#dfe1cb"
        initial={reduce ? false : { y: 8, opacity: 0 }}
        animate={reduce ? undefined : { y: 0, opacity: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />

      {/* Far ridge (parallax). */}
      <motion.path
        d="M0 300 L80 250 L160 290 L240 240 L320 285 L400 250 L400 500 L0 500 Z"
        fill="#b9c2a8"
        opacity={0.55}
        animate={reduce ? undefined : { x: [0, -10, 0] }}
        transition={reduce ? undefined : { duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Mid ridge. */}
      <motion.path
        d="M0 360 L70 300 L150 350 L230 290 L300 345 L400 300 L400 500 L0 500 Z"
        fill="#8a9a7b"
        opacity={0.85}
        animate={reduce ? undefined : { x: [0, 8, 0] }}
        transition={reduce ? undefined : { duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Near ridge. */}
      <path d="M0 430 L90 360 L180 420 L260 365 L340 420 L400 380 L400 500 L0 500 Z" fill="#4a5742" />

      {/* Pine. */}
      <g transform="translate(110 360)" fill="#3a4435">
        <rect x="-3" y="60" width="6" height="30" />
        <path d="M0 0 L22 40 L-22 40 Z" />
        <path d="M0 25 L26 70 L-26 70 Z" />
      </g>
    </Frame>
  );
}

// ─── Scene 2: Distance — a letter crossing the ocean ─────────────────────
function Distance({ reduce }: { reduce: boolean }) {
  const arc = "M 40 150 Q 200 60 360 150";
  return (
    <Frame>
      <defs>
        <linearGradient id="sky-d" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eceedb" />
          <stop offset="100%" stopColor="#dfe3cf" />
        </linearGradient>
      </defs>
      <rect width={VB_W} height={VB_H} fill="url(#sky-d)" />

      {/* Moon. */}
      <circle cx={70} cy={80} r={20} fill="#cfd5bb" />

      {/* Flight arc draws in. */}
      <motion.path
        d={arc}
        fill="none"
        stroke="#8a9a7b"
        strokeWidth={2}
        strokeDasharray="4 5"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={reduce ? undefined : { pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2.4, ease: "easeInOut" }}
      />
      <circle cx={40} cy={150} r={4} fill="#4a5742" />
      <circle cx={360} cy={150} r={4} fill="#4a5742" />

      {/* Envelope traveling the arc (keyframed to follow the curve). */}
      {!reduce && (
        <motion.g
          initial={{ opacity: 0 }}
          whileInView={{
            opacity: [0, 1, 1, 1, 0],
            x: [40, 120, 200, 280, 360],
            y: [150, 108, 95, 108, 150],
          }}
          viewport={{ once: true }}
          transition={{ duration: 2.4, ease: "easeInOut" }}
        >
          <g transform="translate(-12 -9)">
            <rect width="24" height="18" rx="2" fill="#f3f1e9" stroke="#4a5742" strokeWidth="1.4" />
            <path d="M0 2 L12 11 L24 2" fill="none" stroke="#4a5742" strokeWidth="1.4" />
          </g>
        </motion.g>
      )}

      {/* Two ocean wave layers scrolling opposite-ish, seamless loop. */}
      <motion.path
        d={wavePath(330, 14)}
        fill="#8a9a7b"
        opacity={0.55}
        animate={reduce ? undefined : { x: [0, -80] }}
        transition={reduce ? undefined : { duration: 9, repeat: Infinity, ease: "linear" }}
      />
      <motion.path
        d={wavePath(370, 18)}
        fill="#4a5742"
        animate={reduce ? undefined : { x: [0, -80] }}
        transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: "linear" }}
      />
    </Frame>
  );
}

// ─── Scene 3: East — cedar by the Mediterranean (Beirut) ─────────────────
function East({ reduce }: { reduce: boolean }) {
  return (
    <Frame>
      <defs>
        <linearGradient id="sky-e" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0ecd9" />
          <stop offset="100%" stopColor="#f3f1e9" />
        </linearGradient>
      </defs>
      <rect width={VB_W} height={VB_H} fill="url(#sky-e)" />

      {/* Sun with slowly rotating rays. */}
      <g transform="translate(300 130)">
        {!reduce && (
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "0px 0px" }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <rect
                key={i}
                x={-1}
                y={-46}
                width={2}
                height={14}
                fill="#cdb89a"
                opacity={0.7}
                transform={`rotate(${i * 30})`}
              />
            ))}
          </motion.g>
        )}
        <circle r={24} fill="#e5d4b5" />
      </g>

      {/* Sea shimmer. */}
      <motion.path
        d={wavePath(340, 12)}
        fill="#9fb089"
        opacity={0.5}
        animate={reduce ? undefined : { x: [0, -80] }}
        transition={reduce ? undefined : { duration: 10, repeat: Infinity, ease: "linear" }}
      />
      <motion.path
        d={wavePath(380, 16)}
        fill="#4a5742"
        animate={reduce ? undefined : { x: [0, -80] }}
        transition={reduce ? undefined : { duration: 7, repeat: Infinity, ease: "linear" }}
      />

      {/* Lebanese cedar, gently swaying. */}
      <motion.g
        transform="translate(150 360)"
        style={{ transformOrigin: "150px 360px" }}
        animate={reduce ? undefined : { rotate: [-1.2, 1.2, -1.2] }}
        transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="-5" y="20" width="10" height="40" fill="#3a4435" />
        <g fill="#3a4435">
          <ellipse cx="0" cy="0" rx="90" ry="12" />
          <ellipse cx="0" cy="-18" rx="70" ry="11" />
          <ellipse cx="0" cy="-34" rx="50" ry="10" />
          <ellipse cx="0" cy="-48" rx="30" ry="9" />
        </g>
      </motion.g>
    </Frame>
  );
}

export function StoryArt({ scene }: { scene: Scene }) {
  const reduce = useReducedMotion() ?? false;
  if (scene === "west") return <West reduce={reduce} />;
  if (scene === "distance") return <Distance reduce={reduce} />;
  return <East reduce={reduce} />;
}
