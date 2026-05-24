"use client";

import { motion, useReducedMotion } from "framer-motion";

type Props = {
  visible: boolean;
  onArrived: () => void;
};

// Simplified world map. Coordinates chosen so:
// Vancouver ~ (130, 165), Lebanon (Suzane) ~ (575, 215), Venue ~ (590, 230)
const ARC = "M 130 165 Q 350 60 575 215";
const ARC2 = "M 575 215 Q 585 220 590 230";

export function WorldMap({ visible, onArrived }: Props) {
  const reduced = useReducedMotion();
  const duration = reduced ? 0.001 : 6.5;

  return (
    <motion.div
      className="relative w-full max-w-[720px] mx-auto px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.6 }}
    >
      <svg
        viewBox="0 0 720 360"
        className="w-full h-auto"
        aria-hidden="true"
      >
        <rect
          x="0"
          y="0"
          width="720"
          height="360"
          fill="var(--bg-beige)"
          rx="10"
        />
        <g opacity="0.85">
          <Continents />
        </g>

        <g opacity="0.7">
          <circle cx="130" cy="165" r="4" fill="var(--accent-olive)" />
          <text
            x="138"
            y="160"
            fill="var(--ink-olive-deep)"
            fontSize="11"
            fontFamily="var(--font-sans)"
            letterSpacing="1"
          >
            Vancouver
          </text>

          <circle cx="575" cy="215" r="4" fill="var(--accent-olive)" />
          <text
            x="510"
            y="205"
            fill="var(--ink-olive-deep)"
            fontSize="11"
            fontFamily="var(--font-sans)"
            letterSpacing="1"
          >
            Lebanon
          </text>

          <circle cx="590" cy="230" r="3" fill="var(--accent-olive-soft)" />
        </g>

        <motion.path
          d={ARC}
          fill="none"
          stroke="var(--accent-olive)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={visible ? { pathLength: 1, opacity: 0.8 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: reduced ? 0 : 1.4, delay: 0.3, ease: "easeInOut" }}
        />
        <motion.path
          d={ARC2}
          fill="none"
          stroke="var(--accent-olive-soft)"
          strokeWidth="1.2"
          strokeDasharray="2 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={visible ? { pathLength: 1, opacity: 0.7 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.8, delay: duration + 0.2 }}
        />

        <FlightPath visible={visible} onArrived={onArrived} duration={duration} />
      </svg>
    </motion.div>
  );
}

function FlightPath({
  visible,
  onArrived,
  duration,
}: {
  visible: boolean;
  onArrived: () => void;
  duration: number;
}) {
  return (
    <g>
      <motion.g
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.6 }}
      >
        <motion.g
          initial={{ offsetDistance: "0%" }}
          animate={visible ? { offsetDistance: "100%" } : { offsetDistance: "0%" }}
          transition={{ duration: duration * 0.6, delay: 0.8, ease: "easeInOut" }}
          style={{
            offsetPath: `path('${ARC}')`,
            offsetRotate: "auto",
          }}
        >
          <PlaneIcon withSuzane={false} />
        </motion.g>

        <motion.g
          initial={{ offsetDistance: "0%", opacity: 0 }}
          animate={
            visible
              ? { offsetDistance: "100%", opacity: 1 }
              : { offsetDistance: "0%", opacity: 0 }
          }
          transition={{
            duration: duration * 0.35,
            delay: duration * 0.6 + 1.2,
            ease: "easeInOut",
          }}
          onAnimationComplete={() => visible && onArrived()}
          style={{
            offsetPath: `path('${ARC2}')`,
            offsetRotate: "auto",
          }}
        >
          <PlaneIcon withSuzane={true} />
        </motion.g>
      </motion.g>
    </g>
  );
}

function PlaneIcon({ withSuzane }: { withSuzane: boolean }) {
  return (
    <g transform="translate(-14 -10)">
      <polygon
        points="28,10 0,2 10,10 0,18"
        fill="var(--bg-beige-warm)"
        stroke="var(--ink-olive-deep)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <polygon points="10,10 0,18 14,12" fill="var(--accent-olive)" opacity="0.35" />
      <circle cx="17" cy="9" r="2" fill="var(--accent-olive-soft)" opacity={withSuzane ? 1 : 0.4} />
    </g>
  );
}

function Continents() {
  // Highly stylized blobs — not geographically accurate, just enough to anchor the journey.
  return (
    <g
      fill="var(--bg-beige-warm)"
      stroke="var(--accent-olive-soft)"
      strokeWidth="0.8"
      opacity="0.95"
    >
      {/* North America */}
      <path d="M40 80 Q60 60 100 70 Q150 70 180 100 Q200 130 180 170 Q160 200 130 210 Q100 215 80 200 Q50 180 40 140 Z" />
      {/* South America */}
      <path d="M160 220 Q175 230 178 260 Q170 300 150 310 Q135 295 145 260 Z" />
      {/* Europe */}
      <path d="M340 130 Q380 110 430 120 Q450 130 460 150 Q445 175 400 180 Q360 175 340 160 Z" />
      {/* Africa */}
      <path d="M380 190 Q420 185 450 210 Q455 260 430 295 Q400 310 380 285 Q365 240 380 190 Z" />
      {/* Asia */}
      <path d="M460 110 Q540 90 620 110 Q670 130 680 170 Q650 210 580 215 Q510 200 470 180 Q455 150 460 110 Z" />
      {/* Australia */}
      <path d="M600 260 Q650 250 680 270 Q680 295 640 300 Q605 295 600 280 Z" />
    </g>
  );
}
