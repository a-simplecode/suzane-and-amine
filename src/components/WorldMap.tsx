"use client";

import { motion, useReducedMotion } from "framer-motion";

type Props = {
  visible: boolean;
  onArrived: () => void;
};

// Equirectangular projection (720x360 world). ViewBox crops to Northern
// Hemisphere from Alaska to the Caucasus so the flight reads big.
// Vancouver (-123,49) → (114,82). Beirut (35,34) → (430,110).
// Nahr El Kalb sits a hair north of Beirut → venue (435,105).
const VIEW_BOX = "30 22 470 215";
const ARC = "M 114 82 Q 270 30 430 110";
const ARC2 = "M 430 110 Q 432 108 435 105";

export function WorldMap({ visible, onArrived }: Props) {
  const reduced = useReducedMotion();
  const duration = reduced ? 0.001 : 6.5;

  return (
    <motion.div
      className="relative w-full max-w-[720px] mx-auto px-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.6 }}
    >
      <svg
        viewBox={VIEW_BOX}
        className="w-full h-auto"
        aria-hidden="true"
      >
        <rect
          x="0"
          y="0"
          width="720"
          height="360"
          fill="var(--bg-beige)"
        />
        <g opacity="0.9">
          <Continents />
        </g>

        <Latitudes />

        <motion.path
          d={ARC}
          fill="none"
          stroke="var(--accent-olive)"
          strokeWidth="1.6"
          strokeDasharray="3 5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={visible ? { pathLength: 1, opacity: 0.85 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: reduced ? 0 : 1.4, delay: 0.3, ease: "easeInOut" }}
        />
        <motion.path
          d={ARC2}
          fill="none"
          stroke="var(--accent-olive-soft)"
          strokeWidth="1.3"
          strokeDasharray="2 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={visible ? { pathLength: 1, opacity: 0.75 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.8, delay: duration + 0.2 }}
        />

        <g>
          <circle cx="114" cy="82" r="4" fill="var(--accent-olive)" />
          <text
            x="114"
            y="74"
            textAnchor="middle"
            fill="var(--ink-olive-deep)"
            fontSize="11"
            fontFamily="var(--font-sans)"
            letterSpacing="0.5"
          >
            Vancouver
          </text>

          <circle cx="430" cy="110" r="4" fill="var(--accent-olive)" />
          <text
            x="430"
            y="102"
            textAnchor="middle"
            fill="var(--ink-olive-deep)"
            fontSize="11"
            fontFamily="var(--font-sans)"
            letterSpacing="0.5"
          >
            Lebanon
          </text>

          <circle cx="435" cy="105" r="2.5" fill="var(--accent-olive-soft)" />
        </g>

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

function Latitudes() {
  return (
    <g
      stroke="var(--accent-olive-soft)"
      strokeWidth="0.4"
      strokeDasharray="2 4"
      opacity="0.3"
      fill="none"
    >
      <line x1="30" y1="60" x2="500" y2="60" />
      <line x1="30" y1="90" x2="500" y2="90" />
      <line x1="30" y1="120" x2="500" y2="120" />
      <line x1="30" y1="150" x2="500" y2="150" />
      <line x1="30" y1="180" x2="500" y2="180" />
      <line x1="30" y1="210" x2="500" y2="210" />
    </g>
  );
}

function Continents() {
  return (
    <g
      fill="var(--bg-beige-warm)"
      stroke="var(--accent-olive-soft)"
      strokeWidth="0.7"
      strokeLinejoin="round"
    >
      {/* North America — Alaska, Canada, US, Mexico */}
      <path d="M 58 52 Q 78 42 105 45 L 130 42 Q 158 38 188 42 Q 212 46 224 56 L 232 70 Q 240 82 238 94 L 232 105 Q 224 116 212 122 L 204 132 L 198 142 Q 190 148 180 144 L 168 138 L 154 134 Q 140 134 130 138 L 120 132 Q 112 122 114 108 L 118 95 L 112 82 L 102 70 Q 88 64 75 64 Z" />

      {/* Central America tail */}
      <path d="M 150 138 L 162 144 L 168 152 L 175 162 L 180 168 L 178 175 L 170 170 L 162 158 L 152 148 Z" />

      {/* Greenland */}
      <path d="M 262 48 Q 275 38 295 40 Q 308 45 312 60 Q 308 72 296 78 Q 280 76 268 70 Q 260 62 262 50 Z" />

      {/* Iceland */}
      <path d="M 330 65 Q 340 62 348 67 Q 350 73 343 76 Q 332 76 328 70 Z" />

      {/* UK & Ireland */}
      <path d="M 348 78 Q 358 73 363 80 L 362 92 L 354 94 L 350 86 Z" />

      {/* Continental Europe */}
      <path d="M 365 78 L 380 73 L 400 72 L 420 76 L 438 80 L 450 86 L 452 95 L 446 104 L 432 110 L 415 112 L 396 110 L 380 105 L 370 100 L 363 92 Z" />

      {/* Scandinavia */}
      <path d="M 388 50 Q 398 42 408 45 L 415 55 L 410 70 L 400 75 L 390 70 L 386 60 Z" />

      {/* North Africa */}
      <path d="M 350 115 L 380 113 L 410 116 L 432 122 L 448 132 L 458 145 L 462 162 L 460 180 L 452 200 L 440 218 L 422 228 L 408 224 Q 395 215 388 200 L 380 180 L 372 162 L 365 145 L 358 130 Z" />

      {/* Arabian Peninsula */}
      <path d="M 435 122 L 458 122 L 470 132 L 475 152 L 470 168 L 458 175 L 440 172 L 432 158 L 430 138 Z" />

      {/* Caucasus / Western Asia (continues right past viewBox) */}
      <path d="M 452 80 L 470 75 L 495 73 L 500 80 L 500 100 L 488 110 L 470 112 L 460 105 L 452 95 Z" />

      {/* Italy boot */}
      <path d="M 392 100 L 397 105 L 402 115 L 400 122 L 395 120 L 392 110 Z" />

      {/* Mediterranean islands (Sicily, Crete, Cyprus) */}
      <circle cx="395" cy="118" r="1.6" />
      <circle cx="410" cy="118" r="1.4" />
      <circle cx="425" cy="115" r="1.4" />
    </g>
  );
}
